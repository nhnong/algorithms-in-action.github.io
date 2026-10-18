import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { GlobalContext } from '../../context/GlobalState';
import { URLContext } from '../../context/urlState';
import { GlobalActions } from '../../context/actions';
import ListParam from './helpers/ListParam';
import { withAlgorithmParams } from './helpers/urlHelpers';
import { binaryKeyListValidCheck } from './helpers/InputValidators';
import { errorParamMsg } from './helpers/ParamMsg';

function TrieParam({ list }) {
  const { dispatch } = useContext(GlobalContext);
  const { setNodes } = useContext(URLContext);
  const [keys, setKeys] = useState(list || [5, 7, 2]);
  const [message, setMessage] = useState(null);
  useEffect(() => { setNodes(keys); }, [keys, setNodes]);

  const insert = event => {
    event.preventDefault();
    const input = event.target[0].value.replace(/\s+/g, '');
    const { valid, error } = binaryKeyListValidCheck(input);
    if (!valid) {
      setMessage(errorParamMsg(error, '5,7,2'));
      return;
    }
    setMessage(null);
    dispatch(GlobalActions.RUN_ALGORITHM, { name: 'trie', mode: 'insertion', nodes: input.split(',').map(Number) });
  };

  return (
    <>
      <div className="form">
        <ListParam name="trie" buttonName="Insert" mode="insertion"
          formClassName="formLeft" DEFAULT_VAL={keys} SET_VAL={setKeys}
          REFRESH_FUNCTION={() => [5, 7, 2]} ALGORITHM_NAME="insertion"
          EXAMPLE="5,7,2" setMessage={setMessage} handleSubmit={insert} />
      </div>
      <p className="generalText">0 goes left; 1 goes right. Green outlines mark stored keys.</p>
      {message}
    </>
  );
}

TrieParam.propTypes = { list: PropTypes.string };
TrieParam.defaultProps = { list: '' };
export default withAlgorithmParams(TrieParam);
