import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateVariantLookup } from '../../../../services/actions';
import { Button } from 'react-bootstrap';
import { ShareLink } from '../../../controls/share-link/share-link';

export const VariantLookupSearchCriteria = () => {
  const dispatch = useDispatch();
  const variantLookup = useSelector(state => state.variantLookup);
  const {
    searchCriteriaVariantLookup,
    collapseCriteria,
    shareID,
    disableSubmit
  } = variantLookup;
  const { numResults } = useSelector(state => state.variantLookupTable);

  const setCollapseCriteria = collapseCriteria => {
    dispatch(updateVariantLookup({ collapseCriteria }));
  };

  const toggleCollapseCriteria = () => {
    if (collapseCriteria) {
      setCollapseCriteria(false);
    } else {
      setCollapseCriteria(true);
    }
  };

  const CollapseCaret = () => {
    if (
      searchCriteriaVariantLookup &&
      !collapseCriteria &&
      searchCriteriaVariantLookup.phenotypes
    ) {
      return <i className="fa fa-caret-down fa-lg"></i>;
    } else {
      return <i className="fa fa-caret-right fa-lg"></i>;
    }
  };

  const displaySex = sex =>
    ({
      all: 'All',
      combined: 'All',
      stacked: 'Female/Male (Stacked)',
      female: 'Female',
      male: 'Male'
    }[sex]);

  const displayAncestry = ancestry =>
    ({
      european: 'European',
      east_asian: 'East Asian'
    }[ancestry]);

  return (
    <div className="mb-2">
      <div className="px-3 py-2 bg-white tab-pane-bordered rounded-0">
        <div className="d-flex justify-content-between">
          <div className="py-1 d-flex justify-content-start">
            <span className="mr-1">
              <Button
                className="p-0"
                title="Expand/collapse search criteria panel"
                style={{
                  color: searchCriteriaVariantLookup ? 'rgb(0, 126, 167)' : ''
                }}
                variant="link"
                onClick={e => toggleCollapseCriteria()}
                aria-controls="search-criteria-collapse-panel"
                aria-expanded={!collapseCriteria}
                disabled={!searchCriteriaVariantLookup}>
                <CollapseCaret />
              </Button>
            </span>
            <span>
              <b>Phenotypes:</b>{' '}
              {collapseCriteria && (
                <>
                  <span>
                    {searchCriteriaVariantLookup &&
                    searchCriteriaVariantLookup.phenotypes &&
                    searchCriteriaVariantLookup.phenotypes.length >= 1
                      ? searchCriteriaVariantLookup.phenotypes[0]
                      : 'None'}
                  </span>
                  <span className="">
                    {searchCriteriaVariantLookup &&
                    searchCriteriaVariantLookup.phenotypes &&
                    searchCriteriaVariantLookup.phenotypes.length > 1 ? (
                      <span> and</span>
                    ) : (
                      <></>
                    )}
                    <button
                      className="ml-1 p-0 text-primary"
                      style={{
                        all: 'unset',
                        textDecoration: 'underline',
                        cursor: 'pointer'
                      }}
                      title="Expand/collapse search criteria panel"
                      onClick={e => toggleCollapseCriteria()}
                      aria-controls="search-criteria-collapse-panel"
                      aria-expanded={!collapseCriteria}>
                      <span style={{ color: 'rgb(0, 126, 167)' }}>
                        {searchCriteriaVariantLookup &&
                        searchCriteriaVariantLookup.phenotypes &&
                        searchCriteriaVariantLookup.phenotypes.length > 1
                          ? searchCriteriaVariantLookup.phenotypes.length -
                            1 +
                            ` other${
                              searchCriteriaVariantLookup.phenotypes.length -
                                1 ===
                              1
                                ? ''
                                : 's'
                            }`
                          : ''}
                      </span>
                    </button>
                  </span>
                </>
              )}
            </span>
            <span className="ml-1">
              {!collapseCriteria &&
                searchCriteriaVariantLookup &&
                searchCriteriaVariantLookup.phenotypes &&
                searchCriteriaVariantLookup.phenotypes.map(phenotype => (
                  <div title={phenotype}>
                    {phenotype.length < 50
                      ? phenotype
                      : phenotype.substring(0, 47) + '...'}
                  </div>
                ))}
            </span>

            <span
              className="border-left border-secondary mx-3"
              style={{ maxHeight: '1.6em' }}></span>

            <span>
              <b>Variant</b>:{' '}
              {searchCriteriaVariantLookup &&
              searchCriteriaVariantLookup.variant ? (
                searchCriteriaVariantLookup &&
                searchCriteriaVariantLookup.variant.substring(0, 2) === 'rs' ? (
                  <a
                    href={
                      'https://www.ncbi.nlm.nih.gov/snp/' +
                      searchCriteriaVariantLookup.variant
                    }
                    target="_blank"
                    style={{
                      textDecoration: 'underline'
                    }}>
                    {searchCriteriaVariantLookup.variant}
                  </a>
                ) : searchCriteriaVariantLookup.variant.substring(0, 3) ===
                  'chr' ? (
                  <span>
                    {searchCriteriaVariantLookup.variant.split(':')[0] +
                      ':' +
                      searchCriteriaVariantLookup.variant.split(':')[1]}
                  </span>
                ) : (
                  <span>{searchCriteriaVariantLookup.variant}</span>
                )
              ) : (
                'None'
              )}
            </span>

            <span
              className="border-left border-secondary mx-3"
              style={{ maxHeight: '1.6em' }}></span>

            <span>
              <b>Sex</b>:{' '}
              {searchCriteriaVariantLookup && searchCriteriaVariantLookup.sex
                ? displaySex(searchCriteriaVariantLookup.sex)
                : 'None'}
            </span>

            <span
              className="border-left border-secondary mx-3"
              style={{ maxHeight: '1.6em' }}></span>

            <span>
              <b>Ancestry</b>:{' '}
              {searchCriteriaVariantLookup &&
              searchCriteriaVariantLookup.ancestry
                ? displayAncestry(searchCriteriaVariantLookup.ancestry)
                : 'None'}
            </span>
          </div>

          <div className="d-flex">
            <span className="py-1">
              <b>Total Results:</b>{' '}
              {searchCriteriaVariantLookup && numResults
                ? numResults.toString() +
                  (searchCriteriaVariantLookup &&
                  searchCriteriaVariantLookup.phenotypes
                    ? ' of ' +
                      searchCriteriaVariantLookup.phenotypes.length +
                      ' phenotypes'
                    : '')
                : 'None' +
                  (searchCriteriaVariantLookup &&
                  searchCriteriaVariantLookup.phenotypes
                    ? ' of ' +
                      searchCriteriaVariantLookup.phenotypes.length +
                      ' phenotypes'
                    : '')}
            </span>

            <span className="ml-3" style={{ maxHeight: '1.6em' }}></span>

            <div className="d-inline">
              <ShareLink
                disabled={!searchCriteriaVariantLookup || !disableSubmit}
                shareID={shareID}
                params={variantLookup}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
