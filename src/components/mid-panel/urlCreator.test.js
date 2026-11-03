/* eslint-env jest */

import { createUrl } from './urlCreator';

const base = 'http://localhost/animation/?alg=trie&mode=operations';

describe('createUrl', () => {
  it('adds the trie base to Insert/Search urls', () => {
    const url = createUrl(base, 'Insert/Search', { nodes: ['125', '12', '?12'], searchValue: [], small: [], radix: 10 });
    expect(new URL(url).searchParams.get('radix')).toBe('10');
    expect(new URL(url).searchParams.get('list')).toBe('125,12,?12');
  });

  it('leaves the base out when no trie is shown', () => {
    const url = createUrl(base, 'Insert/Search', { nodes: ['1'], searchValue: [], small: true, radix: [] });
    expect(url).not.toContain('radix');
  });
});
