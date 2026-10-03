import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { GlobalContext } from '../../context/GlobalState';
import { URLContext } from '../../context/urlState';
import { GlobalActions } from '../../context/actions';
import ListParam from './helpers/ListParam';
import { withAlgorithmParams } from './helpers/urlHelpers';

function TrieParam({ list }) {
  const { dispatch } = useContext(GlobalContext);
  const { setNodes } = useContext(URLContext);
  const [keys, setKeys] = useState(list || [5, 7, 2]);
  const [message, setMessage] = useState(null);
  useEffect(() => { setNodes(keys); }, [keys, setNodes]);

  const insert = event => {
    event.preventDefault();
    const input = event.target[0].value.trim();
    const values = input.split(',').map(value => Number(value.trim()));
    if (!/^\d+(\s*,\s*\d+)*$/.test(input)
        || values.some(value => !Number.isInteger(value) || value > 2147483647)) {
      setMessage('Enter comma-separated whole numbers from 0 to 2147483647.');
      return;
    }
    setMessage(null);
    dispatch(GlobalActions.RUN_ALGORITHM, { name: 'trie', mode: 'insertion', nodes: values });
  };

  return (
    <>
      <div className="form">
        <ListParam name="trie" buttonName="Insert" mode="insertion"
          formClassName="formLeft" DEFAULT_VAL={keys} SET_VAL={setKeys}
          REFRESH_FUNCTION={() => [5, 7, 2]} ALGORITHM_NAME="insertion"
          EXAMPLE="5,7,2" setMessage={setMessage} handleSubmit={insert} />
      </div>
      <p className="generalText">Binary (R = 2). Keys share a width based on the largest key. End nodes display stored keys.</p>
      {message && <p role="alert" className="generalText">{message}</p>}
    </>
  );
}

TrieParam.propTypes = { list: PropTypes.string };
TrieParam.defaultProps = { list: '' };
export default withAlgorithmParams(TrieParam);
