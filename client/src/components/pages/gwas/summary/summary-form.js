import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from 'react-bootstrap';
import { TreeSelect } from '../../../controls/tree-select/tree-select';
import { asTitleCase } from './utils';
import { updateSummaryResults } from '../../../../services/actions';

export function SummaryResultsForm({
  selectedPhenotypes = [],
  selectedStratifications = [],
  isPairwise = false,
  onSubmit = any => { },
  onReset = any => { },
  className = '',
}) {
  // in order to prevent updating the redux store until after the form has
  // been submitted, we should store the state in the component, and then emit
  // this state on submit or reset, allowing the handler to update the store

  const treeRef = useRef();

  // select store members
  const dispatch = useDispatch();
  const phenotypes = useSelector(state => state.phenotypes);
  const { messages } = useSelector(state => state.summaryResults);
  const setMessages = messages => dispatch(updateSummaryResults({ messages }));

  // private members prefixed with _
  const [_selectedPhenotypes, _setSelectedPhenotypes] = useState(
    selectedPhenotypes
  );
  const [_selectedStratifications, _setSelectedStratifications] = useState(
    selectedStratifications.map(s => `${s.ancestry}__${s.sex}`)
  );
  const [_isPairwise, _setIsPairwise] = useState(isPairwise);
  const [_isModified, _setIsModified] = useState(false);

  // stratification options can always be recalculated
  const [stratificationOptions, setStratificationOptions] = useState(
    getStratificationOptions(_selectedPhenotypes, _isPairwise)
  );

  useEffect(() => {
    _setSelectedPhenotypes(selectedPhenotypes);
    _setSelectedStratifications(
      selectedStratifications.map(s => `${s.ancestry}__${s.sex}`)
    );
    _setIsPairwise(isPairwise);
    setStratificationOptions(
      getStratificationOptions(selectedPhenotypes, isPairwise)
    );
  }, [selectedPhenotypes, selectedStratifications, isPairwise]);

  /**
   * Retrieves stratification option groups for each phenotype supplied
   * If isPairwise is passed in, and the second phenotype is not defined the first
   * phenotype will be used for both sets of options
   * @param {*} phenotypes
   */
  function getStratificationOptions(selectedPhenotypes, isPairwise) {
    if (!phenotypes || !phenotypes.metadata) return [];
    const stratificationGroups = [];

    for (const phenotype of selectedPhenotypes) {
      const stratifications = [];
      phenotypes.metadata
        .filter(
          item =>
            item.phenotype_id === phenotype.id &&
            item.chromosome === 'all' &&
            item.count > 0 &&
            item.sex !== 'stacked'
        )
        .forEach(({ sex, ancestry }) => {
          let stratification = stratifications.find(
            s => s.ancestry === ancestry
          ) || {
            label: asTitleCase(ancestry),
            options: [],
            ancestry
          };

          stratification.options.push({
            label: asTitleCase(`${ancestry} - ${sex}`),
            value: `${ancestry}__${sex}`
          });

          if (!stratifications.includes(stratification)) {
            stratifications.push(stratification);
          }
        });
      stratificationGroups.push(stratifications);
    }

    // if only one phenotype is selected, both option groups will have the same options
    if (isPairwise && !stratificationGroups[1]) {
      stratificationGroups[1] = stratificationGroups[0];
    }

    return stratificationGroups;
  }

  function mergeSelectedStratification(index, value) {
    const selectedStratifications = [..._selectedStratifications];
    selectedStratifications[index] = value;
    _setSelectedStratifications(selectedStratifications);
    _setIsModified(true);
  }

  function setSelectedPhenotypesAndOptions(selectedPhenotypes, pairwise) {
    if (pairwise === undefined) pairwise = _isPairwise;
    // selectedPhenotypes = selectedPhenotypes.slice(0, pairwise ? 2 : 1);
    setStratificationOptions(
      getStratificationOptions(selectedPhenotypes, pairwise)
    );
    _setSelectedPhenotypes(selectedPhenotypes);
    _setSelectedStratifications(
      pairwise ? [_selectedStratifications[0], ''] : ['', '']
    );
    _setIsPairwise(pairwise);
    _setIsModified(true);
  }

  function handleReset(ev) {
    ev.preventDefault();
    treeRef.current.resetSearchFilter();
    _setSelectedPhenotypes([]);
    _setSelectedStratifications([]);
    _setIsPairwise(false);
    onReset();
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    _setIsModified(false);
    onSubmit({
      isPairwise: _isPairwise,
      phenotypes: _selectedPhenotypes,
      stratifications: _selectedStratifications
        .filter(s => s.length)
        .map(s => {
          const [ancestry, sex] = s.split('__');
          return { ancestry, sex };
        })
    });
  }

  return (
    <form className={className} onSubmit={handleSubmit} onReset={handleReset}>
      <div className="form-group">
        <div className="d-flex justify-content-between">
          <label className="required">Phenotypes</label>
          <div className="custom-control custom-checkbox">
            <input
              type="checkbox"
              className="custom-control-input"
              id="is-pairwise"
              checked={_isPairwise}
              onChange={e =>
                setSelectedPhenotypesAndOptions(
                  _selectedPhenotypes,
                  e.target.checked
                )
              }
            />
            <label className="custom-control-label" htmlFor="is-pairwise">
              Pairwise Plots
            </label>
          </div>
        </div>

        <TreeSelect
          data={phenotypes.tree}
          value={_selectedPhenotypes}
          onChange={setSelectedPhenotypesAndOptions}
          ref={treeRef}
          enabled={item => item.import_date}
          limit={_isPairwise ? 2 : 1}
        />
      </div>

      {(_isPairwise ? [0, 1] : [0])
        .map(i => stratificationOptions[i])
        .map((optionGroup, i) => (
          <div className="form-group" key={`stratification-option-group-${i}`}>
            <label
              htmlFor={`summary-results-stratification-${i}`}
              className="required">
              Ancestry/Sex {_isPairwise && ['(Top)', '(Bottom)'][i]}
            </label>
            {_isPairwise &&
              (_selectedPhenotypes[i] || _selectedPhenotypes[0]) && (
                <div className="small text-muted">
                  {
                    (_selectedPhenotypes[i] || _selectedPhenotypes[0])
                      .display_name
                  }
                </div>
              )}
            <select
              id={`summary-results-stratification-${i}`}
              className="form-control"
              style={{ color: _selectedStratifications[i] ? '#000' : '#ccc' }}
              value={_selectedStratifications[i]}
              onChange={e => mergeSelectedStratification(i, e.target.value)}
              disabled={!optionGroup || optionGroup.length === 0}>
              <option value="" hidden>
                Select Ancestry/Sex
              </option>
              {optionGroup &&
                optionGroup.map(e => (
                  <optgroup key={`${i}-${e.label}`} label={e.label}>
                    {e.options.map(o => (
                      <option
                        key={`${i}-${e.label}-${o.value}`}
                        value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
            </select>
          </div>
        ))}

      {messages.map(({ type, content }) => (
        <div className={`small my-3 text-${type}`}>
          {content}
        </div>
      ))}

      <div>
        <Button type="submit" variant="silver">
          Submit
        </Button>

        <Button type="reset" className="ml-2" variant="silver">
          Reset
        </Button>
      </div>
    </form>
  );
}
