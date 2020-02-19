# shuffles databases when importing
set -ex
# import into ewing's sarcoma, renal cell carcinoma (female), melanoma (male)
node import-variants.js --phenotype 2 --gender all
node import-variants.js --phenotype 2 --gender female
node import-variants.js --phenotype 2 --gender male

# import into melanoma, renal cell carcinoma (female), ewing's sarcoma (male)
node import-variants.js --phenotype 3 --gender all
node import-variants.js --phenotype 3 --gender female
node import-variants.js --phenotype 3 --gender male

# import into renal cell carcinoma, ewing's sarcoma (female), melanoma (male)
node import-variants.js --phenotype 4 --gender all
node import-variants.js --phenotype 4 --gender female
node import-variants.js --phenotype 4 --gender male