/* eslint-disable no-undef */

import { binaryKeyListValidCheck, binaryKeyValidCheck, MAX_BINARY_KEY } from './InputValidators';
import { ERRORS } from './ErrorExampleStrings';

test('binary trie and DST share the same 31-bit key limit', () => {
  expect(binaryKeyListValidCheck(`0,5,${MAX_BINARY_KEY}`).valid).toBe(true);
  expect(binaryKeyListValidCheck(`5,${MAX_BINARY_KEY + 1}`).error).toBe(ERRORS.GEN_BINARY_KEY_RANGE);
  expect(binaryKeyListValidCheck('5,-1').error).toBe(ERRORS.GEN_ONLY_POSITIVE_NUMBERS_LIST);
  expect(binaryKeyValidCheck(String(MAX_BINARY_KEY)).valid).toBe(true);
  expect(binaryKeyValidCheck(String(MAX_BINARY_KEY + 1)).error).toBe(ERRORS.GEN_BINARY_KEY_RANGE);
});
