CREATE TABLE variant_stage
(
    "CHR"           INTEGER,
    "BP"            INTEGER,
    "BP_1000KB"     INTEGER, -- BP floored to the nearest multiple of 10^6 (1000 kilobases)
    "BP_ABS"        INTEGER, -- The absolute position from the beginning of the genome (used for plotting)
    "BP_ABS_1000KB" INTEGER, -- Absolute BP floored to the nearest multiple of 10^6 (1000 kilobases)
    "SNP"           TEXT,
    "A1"            TEXT,
    "A2"            TEXT,
    "N"             INTEGER,
    "P"             REAL,
    "NLOG_P"        REAL, -- negative log10(P)
    "NLOG_P2"       REAL, -- negative log10(P) floored to the nearest multiple of 10^-2
    "P_R"           REAL,
    "OR"            REAL,
    "OR_R"          REAL,
    "Q"             REAL,
    "I"             REAL
);

CREATE TABLE variant
(
    "VARIANT_ID"    INTEGER PRIMARY KEY,
    "CHR"           INTEGER,
    "BP"            INTEGER,
    "SNP"           TEXT,
    "A1"            TEXT,
    "A2"            TEXT,
    "N"             INTEGER,
    "P"             REAL,
    "NLOG_P"        REAL, -- negative log10(P)
    "P_R"           REAL,
    "OR"            REAL,
    "OR_R"          REAL,
    "Q"             REAL,
    "I"             REAL
);

CREATE TABLE variant_summary
(
    "CHR"           INTEGER,
    "BP_ABS_1000KB" INTEGER, -- Absolute BP floored to the nearest multiple of 10^6 (1000 kilobases)
    "NLOG_P2"       REAL -- negative log10(P) floored to the nearest multiple of 10^-2
);