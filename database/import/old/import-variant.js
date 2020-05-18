const fs = require('fs');
const mysql = require('mysql2');
const args = require('minimist')(process.argv.slice(2));
const ranges = require('../../json/chromosome_ranges.json');
const { database } = require('../../../server/config.json');
const { timestamp } = require('../utils/logging');
const { readFile } = require('../utils/file');
const { getRecords, pluck } = require('../utils/query');
const { getIntervals, getLambdaGC } = require('../utils/math');

/**
lambdagc_ewing|1.036
lambdagc_rcc|1.029
lambdagc_mel|0.83
 */

// display help if needed
if (!(args.file && args.phenotype && args.sex)) {
    console.log(`USAGE: node import-variants.js
            --file "filename"
            --phenotype "phenotype name or id"
            --sex "all" | "female" | "male"
            --reset (if specified, drop the variant/summary partitions before importing)
            --create (if specified, create a new partition)`);
    process.exit(0);
}

// parse arguments and set defaults
const { file: inputFilePath, phenotype, sex, reset: shouldReset, create: shouldCreatePartition } = args;
//const errorLog = getLogStream(`./failed-variants-${new Date().toISOString()}.txt`);
const errorLog = {write: e => console.log(e)};
const duration = timestamp();
const connection = mysql.createConnection({
    host: database.host,
    database: database.name,
    user: database.user,
    password: database.password,
    namedPlaceholders: true,
    multipleStatements: true,
    // debug: true,
  }).promise();

// input file should exist
if (!fs.existsSync(inputFilePath)) {
    console.error(`ERROR: ${inputFilePath} does not exist.`);
    process.exit(1);
}

// sex should be male, female, or all
if (!/^(all|female|male)$/.test(sex)) {
    console.error(`ERROR: Sex must be all, female, or male`);
    process.exit(1);
}

importVariants().then(e => {
    console.log(`[${duration()} s] Imported variants`);
    process.exit(0);
});

async function importVariants() {
    // find phenotypes either by name or id (if a numeric value was provided)
    const phenotypeKey = /^\d+$/.test(phenotype) ? 'id' : 'name';
    const phenotypes = await getRecords(connection, 'phenotype', {
        [phenotypeKey]: phenotype
    });

    if (phenotypes.length === 0) {
        console.error(`ERROR: Phenotype does not exist`)
        process.exit(1);
    }

    if (phenotypes.length > 1) {
        console.error(`ERROR: More than one phenotype was found with the same name. Please specify the phenotype id instead of the name.`)
        process.exit(1);
    }

    const phenotypeName = phenotypes[0].name;
    const phenotypeId = phenotypes[0].id;
    const partition = `\`${phenotypeId}\``; // quote partition identifier
    const subpartition = `\`${phenotypeId}_${sex}\``; // quote subpartition identifier
    const variantTable = `phenotype_variant`;
    const aggregateTable = `phenotype_aggregate`;
    const stageTable = `phenotype_stage_${phenotypeId}_${sex}`;

    // clear variants if needed
    if (shouldReset) {

        // drop existing tables and recreate partitions
        // both variant and aggregate tables have the same partitioning schema
        for (let table of [variantTable, aggregateTable]) {
            console.log(`[${duration()} s] Dropping and recreating partition(${partition}) on ${table}...`);
            await connection.query(`
                ALTER TABLE ${table} DROP PARTITION ${partition};
                ALTER TABLE ${table} ADD PARTITION (PARTITION ${partition} VALUES IN (${phenotypeId}) (
                    subpartition \`${phenotypeId}_all\`,
                    subpartition \`${phenotypeId}_female\`,
                    subpartition \`${phenotypeId}_male\`
                ));
            `);
        }
    }

    if (shouldCreatePartition) {
        for (let table of [variantTable, aggregateTable]) {
            console.log(`[${duration()} s] Creating partition(${partition}) on ${table}...`);
            await connection.query(`
                ALTER TABLE ${table} ADD PARTITION (PARTITION ${partition} VALUES IN (${phenotypeId}) (
                    subpartition \`${phenotypeId}_all\`,
                    subpartition \`${phenotypeId}_female\`,
                    subpartition \`${phenotypeId}_male\`
                ));
            `);
        }
    }

    console.log(`[${duration()} s] Setting up temporary table...`);
    await connection.query(`
        START TRANSACTION;
        SET autocommit = 0;
        SET unique_checks = 0;

        -- create staging table (do not use a temporary table for this)
        -- use MyISAM for performance, and for in-place sorting
        DROP TABLE IF EXISTS ${stageTable};
        CREATE TABLE ${stageTable} (
            id                      BIGINT,
            chromosome              VARCHAR(2),
            position                BIGINT,
            position_abs_aggregate  BIGINT,
            snp                     VARCHAR(200),
            allele_reference        VARCHAR(200),
            allele_alternate        VARCHAR(200),
            p_value                 DOUBLE,
            p_value_nlog            DOUBLE, -- negative log10(P)
            p_value_nlog_aggregate  DOUBLE, -- -log10(p) grouped by 1e-2
            p_value_nlog_expected   DOUBLE, -- expected negative log10(P)
            p_value_r               DOUBLE,
            odds_ratio              DOUBLE,
            odds_ratio_r            DOUBLE,
            n                       BIGINT,
            q                       DOUBLE,
            i                       DOUBLE,
            show_qq_plot            BOOLEAN
        ) ENGINE=MYISAM;
    `);

    console.log(`[${duration()} s] Loading variants into staging table...`);
    await connection.query({
        infileStreamFactory: path => fs.createReadStream(inputFilePath),
        sql: `LOAD DATA LOCAL INFILE "${inputFilePath}"
            INTO TABLE ${stageTable}
            FIELDS TERMINATED BY ','
            IGNORE 1 LINES
            (chromosome, position, snp, allele_reference, allele_alternate, p_value, p_value_r, odds_ratio, odds_ratio_r, n, q, i)`
    });

    // index this table to assist in sorting and filtering
    console.log(`[${duration()} s] Finished loading, indexing ${stageTable}...`);
    await connection.query(`
        ALTER TABLE ${stageTable}
            ADD INDEX (p_value),
            ADD INDEX (chromosome);
    `);

    // we need to sort the staging table by p-values in ascending order
    // and associate each row with an index after filtering
    console.log(`[${duration()} s] Finished indexing, filtering and ordering ${stageTable}...`);
    await connection.query(`
        DELETE FROM ${stageTable} WHERE p_value NOT BETWEEN 0 AND 1 OR chromosome NOT IN (SELECT chromosome FROM chromosome_range);
        ALTER TABLE ${stageTable} ORDER BY p_value;

        SET @id = 0;
        UPDATE ${stageTable} SET id = (SELECT @id := @id + 1);
        ALTER TABLE ${stageTable} ADD INDEX (id);
    `);

    // here, we add additional data to the staging table and calculate the median p-value
    console.log(`[${duration()} s] Calculating expected p-values, median p-value, and show_qq_plot flags...`);
    const [medianRows] = await connection.query(`
        SET @count = (SELECT COUNT(*) FROM ${stageTable});
        set @midpoint = (SELECT CEIL(@count / 2));
        set @midpoint_offset = (SELECT @count % 2);

        -- update p_value_nlog and aggregate columns
        UPDATE ${stageTable} s SET
            p_value_nlog = -LOG10(s.p_value),
            p_value_nlog_expected = -LOG10((s.id - 0.5) / @count),
            p_value_nlog_aggregate = 1e-2 * FLOOR(1e2 * -LOG10(s.p_value)),
            position_abs_aggregate = 1e6 * FLOOR(1e-6 * (SELECT s.position + cr.position_abs_min FROM chromosome_range cr WHERE cr.chromosome = s.chromosome LIMIT 1));

        -- calculate the show_qq_plot flag using -x^2, using id as the index parameter
        WITH ids as (
            SELECT @count - ROUND(@count * (1 - POW(id / 7500 - 1, 2)))
            FROM ${stageTable} WHERE id <= 7500
        ) UPDATE ${stageTable} SET
            show_qq_plot = 1
            WHERE id IN (SELECT * FROM ids);

        -- calculate median p-value
        SELECT AVG(p_value) FROM ${stageTable}
            WHERE id IN (@midpoint, 1 + @midpoint - @midpoint_offset);
    `);

    // retrieve median value and lambdaGC
    const pMedian = pluck(medianRows.pop()); // get last result set
    const lambdaGC = getLambdaGC(pMedian);
    console.log({pMedian, lambdaGC});

    // retrieve variant count
    const [countRows] = await connection.query(`SELECT COUNT(*) AS count FROM ${stageTable}`)
    const count = pluck(countRows);

    console.log(`[${duration()} s] Inserting ${count} values into variant table...`);

    // batch inserts in groups of 1000000 to minimize swapping
    let batchSize = 5000000;
    for (let i = 0; i <= count; i += batchSize) {
        await connection.execute(`
            INSERT INTO ${variantTable} partition (${subpartition}) (
                id,
                phenotype_id,
                sex,
                chromosome,
                position,
                snp,
                allele_reference,
                allele_alternate,
                p_value,
                p_value_nlog,
                p_value_nlog_expected,
                p_value_r,
                odds_ratio,
                odds_ratio_r,
                n,
                q,
                i,
                show_qq_plot
            ) SELECT
                uuid_short(),
                ${phenotypeId},
                "${sex}",
                chromosome,
                position,
                snp,
                allele_reference,
                allele_alternate,
                p_value,
                p_value_nlog,
                p_value_nlog_expected,
                p_value_r,
                odds_ratio,
                odds_ratio_r,
                n,
                q,
                i,
                show_qq_plot
            FROM ${stageTable}
            ORDER BY chromosome, p_value
            LIMIT ${i}, ${batchSize};
        `);

        console.log(`[${duration()} s] Inserted ${Math.min(i + batchSize, count)}/${count} values into variant table...`);
    }


    console.log(`[${duration()} s] Inserting aggregated variants...`);
    await connection.execute(`
        INSERT INTO ${aggregateTable} partition (${subpartition})
            (id, phenotype_id, sex, chromosome, position_abs, p_value_nlog)
        SELECT DISTINCT
            uuid_short(),
            ${phenotypeId},
            "${sex}",
            chromosome,
            position_abs_aggregate as position_abs,
            p_value_nlog_aggregate as p_value_nlog
        FROM ${stageTable}
        ORDER BY chromosome, position_abs, p_value_nlog;
    `);

    console.log(`[${duration()} s] Storing lambdaGC and counts...`);
    await connection.execute(`
        INSERT INTO phenotype_metadata (phenotype_id, sex, chromosome, lambda_gc, count)
        VALUES (:phenotypeId, :sex, :chromosome, :lambdaGC, (SELECT COUNT(*) AS count FROM ${stageTable}))
        ON DUPLICATE KEY UPDATE
            lambda_gc = VALUES(lambda_gc),
            count = VALUES(count);
    `, {phenotypeId, sex, chromosome: 'all', lambdaGC});

    await connection.query(`
        INSERT INTO phenotype_metadata (phenotype_id, sex, chromosome, count)
        SELECT
            ${phenotypeId} as phenotype_id,
            "${sex}" as sex,
            chromosome,
            count(*) as count
        FROM ${stageTable}
        GROUP BY chromosome
        ON DUPLICATE KEY UPDATE
            count = VALUES(count);
    `);

    // log imported variants
    console.log(`[${duration()} s] Storing import log...`);
    connection.execute(`
        UPDATE phenotype SET
            import_count = (
                SELECT count from phenotype_metadata
                WHERE
                    phenotype_id = :phenotypeId AND
                    sex = :sex AND
                    chromosome = :chromosome
            ),
            import_date = NOW()
        WHERE
            id = :phenotypeId`,
        {phenotypeId, sex, chromosome: 'all'}
    );

    await connection.query(`COMMIT`);
    await connection.end();
    return 0;
}