/* eslint-env jest */
import { createUrl } from './urlCreator';

const context = { nodes: ['5', '7', '?5'], searchValue: [], small: [], radix: '' };

test('adds radix to Insert/Search URLs only when set', () => {
  expect(createUrl('/?alg=trie', 'Insert/Search', context))
    .toBe('/?alg=trie&list=5,7,?5&value=&smallTable=');
  expect(createUrl('/?alg=trie', 'Insert/Search', { ...context, radix: '4' }))
    .toBe('/?alg=trie&list=5,7,?5&value=&smallTable=&radix=4');
});
