import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, FormControl, InputGroup, Row, Col, Button } from 'react-bootstrap';
import { updateVariantLookup } from '../../services/actions';
import Select, { components } from 'react-select';


export function SearchFormTraitsVariant({ onSubmit }) {
  const dispatch = useDispatch();
  const phenotypes = useSelector(state => state.phenotypes);
  const phenotypesTree = useSelector(state => state.phenotypesTree);
  const variantLookup = useSelector(state => state.variantLookup);
  const {
    selectedListType,
    selectedPhenotypes,
    selectedVariant,
    selectedGender
  } = variantLookup;

  const handleChange = params => {
    setSelectedPhenotypes(params);
    // onChange(params);
  };

  const setSelectedListType = selectedListType => {
    dispatch(updateVariantLookup({ selectedListType }));
  };

  const setSelectedPhenotypes = selectedPhenotypes => {
    dispatch(updateVariantLookup({ selectedPhenotypes }));
  };

  const setSelectedVariant = selectedVariant => {
    dispatch(updateVariantLookup({ selectedVariant }));
  };

  const setSelectedGender = selectedGender => {
    dispatch(updateVariantLookup({ selectedGender }));
  };

  const alphabetizedPhenotypes = [...phenotypes].sort((a, b) =>
    a.label.localeCompare(b.label)
  );

  const categorizedPhenotypes = phenotypes.map(e => {
    const spaces = String.fromCharCode(160).repeat(e.level * 2);
    let label = spaces + e.label;
    return { ...e, label };
  });

  const canSubmit =
    selectedPhenotypes &&
    selectedPhenotypes.length > 0 &&
    (selectedVariant && selectedVariant.length > 0);

  const validateVariantInput = e => {
    e.preventDefault();
    // console.log(selectedVariant);
    // (/^rs\d+/i).test(selectedVariant)

    if (
      selectedVariant.match(/^[r|R][s|S][0-9]+$/) != null ||
      selectedVariant.match(
        /^([c|C][h|H][r|R])?(([1-9]|[1][0-9]|[2][0-2])|[x|X|y|Y]):[0-9]+$/
      ) != null
    ) {
      // console.log("valid");
      onSubmit({
        selectedPhenotypes,
        selectedVariant
      });
    } else {
      // console.log("invalid");
      onSubmit({
        selectedPhenotypes,
        selectedVariant,
        error: 'Invalid variant input.'
      });
    }
  };

  const MultiValue = props => (
    <components.MultiValue {...props}>
      {props.data.label.trim()}
    </components.MultiValue>
  );

  return (
    <Form>
      <Row controlId="phenotype-list">
        <Form.Label column sm={3}>
          Choose gender
        </Form.Label>
        <Col sm={2}>
          <select
            className="form-control"
            value={selectedGender}
            onChange={e => setSelectedGender(e.target.value)}>
            <option value="combined">Combined</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </Col>
      </Row>

      <Row className="mt-3" controlId="phenotype-list">
        <Form.Label column sm={3}>
          Sort phenotypes by
        </Form.Label>
        <Col sm={2}>
          <select
            className="form-control"
            value={selectedListType}
            onChange={e => setSelectedListType(e.target.value)}>
            <option value="alphabetic">Alphabetic</option>
            <option value="categorical">Categorical</option>
          </select>
        </Col>
      </Row>

      <Row className="mt-3" controlId="phenotype-list">
        <Form.Label column sm={3}>
          Choose phenotype(s)
        </Form.Label>
        <Col sm={9}>
          <Select
            placeholder="Select one or more phenotypes"
            value={selectedPhenotypes}
            onChange={handleChange}
            isOptionDisabled={option => option.value === null}
            options={
              selectedListType === 'categorical'
                ? categorizedPhenotypes
                : alphabetizedPhenotypes
            }
            isMulti
            components={{ MultiValue }}
          />
        </Col>
      </Row>

      <Row className="mt-3" controlId="phenotype-list">
        <Form.Label column sm={3}>
          Input variant
        </Form.Label>
        <Col sm={3}>
          <FormControl
            className="form-control"
            placeholder="(Variant rsid or coordinate) *"
            aria-label="Variant (required)"
            value={selectedVariant}
            onChange={e => setSelectedVariant(e.target.value)}
            type="text"
            required
          />
        </Col>
      </Row>

      <Row className="mt-3" controlId="phenotype-list">
        <Col sm={{ span: 9, offset: 3 }}>
          <Button
            variant="primary"
            disabled={!(selectedPhenotypes && selectedPhenotypes.length >= 2)}
            onClick={e => {
              e.preventDefault();
              onSubmit(selectedPhenotypes);
            }}>
            Submit
          </Button>
        </Col>
      </Row>





      {/* <Form.Group controlId="trait-list">
        <Form.Label>
          <b>Select Phenotype(s) and Input Variant</b>
        </Form.Label>
        <div className="row">
          <div className="col-md-12">
            <InputGroup>

              <InputGroup.Prepend>
                <select
                  className="form-control"
                  value={selectedGender}
                  onChange={e => setSelectedGender(e.target.value)}>
                  <option value="combined">Combined</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </InputGroup.Prepend>

              <InputGroup.Prepend>
                <select
                  className="form-control"
                  value={selectedListType}
                  onChange={e => setSelectedListType(e.target.value)}>
                  <option value="alphabetic">Alphabetic</option>
                  <option value="categorical">Categorical</option>
                </select>
              </InputGroup.Prepend>

              <FormControl
                className="form-control"
                placeholder="(Variant rsid or coordinate) *"
                aria-label="Variant (required)"
                value={selectedVariant}
                onChange={e => setSelectedVariant(e.target.value)}
                type="text"
                required
              />
            
              <InputGroup.Append>
                <button
                  className="btn btn-primary"
                  onClick={validateVariantInput}
                  disabled={!canSubmit}>
                  Submit
                </button>
              </InputGroup.Append>
            </InputGroup>
          </div>
          <div className="col-md-12 mt-3">
            <Select
              placeholder="(Select one or more phenotypes) *"
              value={selectedPhenotypes}
              onChange={handleChange}
              isOptionDisabled={option => option.value === null}
              options={
                selectedListType === 'categorical'
                  ? categorizedPhenotypes
                  : alphabetizedPhenotypes
              }
              isMulti
              components={{ MultiValue }}
            />
          </div>
          <div className="col-md-12 mt-3">
            <DropdownTreeSelect 
              className="dropdown-tree"
              data={phenotypesTree} 
              />
          </div>
        </div>
      </Form.Group> */}






    </Form>
  );
}
