import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import { GlobalContext } from '../../context/GlobalState';
import { URLContext } from '../../context/urlState';
import { GlobalActions } from '../../context/actions';
import SymbolListParam from './helpers/SymbolListParam';
import { withAlgorithmParams } from './helpers/urlHelpers';
import { binaryOperationListValidCheck } from './helpers/InputValidators';
import { errorParamMsg } from './helpers/ParamMsg';

// A key is inserted, ?key searches for it.
const DEFAULT_KEYS = ['5', '7', '2', '?7', '?3'];
const EXAMPLE = '5,7,?5,2';
const RADIXES = [2, 4];
const BRANCH_TEXT = {
  2: '0 goes left; 1 goes right.',
  4: 'Keys are written in base 4; digits 0 to 3 pick a branch from left to right.',
};

function TrieParam({ list, radix: urlRadix }) {
  const { dispatch } = useContext(GlobalContext);
  const { setNodes, setRadix: setUrlRadix } = useContext(URLContext);
  const [keys, setKeys] = useState(list || DEFAULT_KEYS);
  const [radix, setRadix] = useState(RADIXES.includes(Number(urlRadix)) ? Number(urlRadix) : 2);
  const [message, setMessage] = useState(null);
  useEffect(() => { setNodes(keys); }, [keys, setNodes]);
  useEffect(() => { setUrlRadix(String(radix)); }, [radix, setUrlRadix]);

  const runInput = (input, base) => {
    const { valid, error, operations } = binaryOperationListValidCheck(input.replace(/\s+/g, ''));
    if (!valid) {
      setMessage(errorParamMsg(error, EXAMPLE));
      return;
    }
    setMessage(null);
    dispatch(GlobalActions.RUN_ALGORITHM, {
      name: 'trie', mode: 'operations', operations, radix: base,
    });
  };

  const run = event => {
    event.preventDefault();
    runInput(event.target[0].value, radix);
  };

  const changeRadix = event => {
    const base = Number(event.target.value);
    setRadix(base);
    runInput([].concat(keys).join(','), base);
  };

  return (
    <>
      <div className="form">
        <SymbolListParam name="trie" buttonName="Insert & Search" mode="operations"
          formClassName="formLeft" DEFAULT_VAL={keys} SET_VAL={setKeys}
          REFRESH_FUNCTION={() => DEFAULT_KEYS} ALGORITHM_NAME="operations"
          setMessage={setMessage} handleSubmit={run} />
      </div>
      <span className="generalText">Base: &nbsp;&nbsp;</span>
      {RADIXES.map(base => (
        <FormControlLabel
          key={base}
          control={<Radio checked={radix === base} onChange={changeRadix} value={base} name="radix" />}
          label={`Base ${base}`}
          className="checkbox"
        />
      ))}
      <p className="generalText">{BRANCH_TEXT[radix]} Green outlines mark stored keys. Put ? before a key to search for it.</p>
      {message}
    </>
  );
}

TrieParam.propTypes = {
  list: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  radix: PropTypes.string,
};
TrieParam.defaultProps = { list: '', radix: '' };
export default withAlgorithmParams(TrieParam);
