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
const RADIXES = [2, 10];
const HINTS = {
  2: '0 goes left; 1 goes right.',
  10: 'Each decimal digit picks one of 10 children. Keys keep their own length, so 12 ends on the node above 125.',
};

function TrieParam({ list }) {
  const { dispatch } = useContext(GlobalContext);
  const { setNodes } = useContext(URLContext);
  const [keys, setKeys] = useState(list || DEFAULT_KEYS);
  const [radix, setRadix] = useState(2);
  const [message, setMessage] = useState(null);
  useEffect(() => { setNodes(keys); }, [keys, setNodes]);

  const runInput = (text, base) => {
    const input = text.replace(/\s+/g, '');
    const { valid, error, operations } = binaryOperationListValidCheck(input);
    if (!valid) {
      setMessage(errorParamMsg(error, EXAMPLE));
      return;
    }
    setMessage(null);
    dispatch(GlobalActions.RUN_ALGORITHM, { name: 'trie', mode: 'operations', operations, radix: base });
  };

  const run = event => {
    event.preventDefault();
    runInput(event.target[0].value, radix);
  };

  const changeRadix = base => {
    setRadix(base);
    runInput(Array.isArray(keys) ? keys.join(',') : keys, base);
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
        <FormControlLabel key={base} label={String(base)} className="checkbox"
          control={<Radio sx={{ color: '#2289ff' }} checked={radix === base} onChange={() => changeRadix(base)} name={`radix${base}`} />} />
      ))}
      <p className="generalText">{HINTS[radix]} Green outlines mark stored keys. Put ? before a key to search for it.</p>
      {message}
    </>
  );
}

TrieParam.propTypes = { list: PropTypes.oneOfType([PropTypes.string, PropTypes.array]) };
TrieParam.defaultProps = { list: '' };
export default withAlgorithmParams(TrieParam);
