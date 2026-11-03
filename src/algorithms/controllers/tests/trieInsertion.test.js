/* eslint-disable no-undef */

import trieInsertion, { keyDigits } from '../trieInsertion';

const statusesFor = (operations, radix) => {
  const vis = Object.fromEntries(Object.entries(trieInsertion.initVisualisers({ radix }))
    .map(([name, visualiser]) => [name, visualiser.instance]));
  const statuses = [];
  trieInsertion.run({
    add: (bookmark, callback, args = []) => {
      if (callback) callback(vis, ...args);
      if (statuses[statuses.length - 1] !== vis.mask.pointerStatus) statuses.push(vis.mask.pointerStatus);
    },
  }, { operations, radix });
  return statuses;
};

const ends = statuses => statuses.filter(status => /^(Found|Not found|Inserted|Already)/.test(status));
const insertAll = values => values.map(value => ({ type: 'insert', value }));

test('searches the trie as built so far', () => {
  const statuses = statusesFor([
    { type: 'search', value: 5 },
    { type: 'insert', value: 5 },
    { type: 'insert', value: 7 },
    { type: 'search', value: 5 },
    { type: 'search', value: 4 },
    { type: 'search', value: 1 },
  ]);
  const ends = statuses.filter(status => /^(Found|Not found|Inserted)/.test(status));
  // 4 (100) shares the path to 5 (101) but was never inserted;
  // 1 (001) has no 0 child under the root.
  expect(ends).toEqual(['Not found: 5', 'Inserted: 5', 'Inserted: 7', 'Found: 5', 'Not found: 4', 'Not found: 1']);
});

test('still accepts a plain insert list', () => {
  expect(statusesFor(undefined)).toEqual(expect.any(Array));
  const root = trieInsertion.run({ add: () => {} }, { nodes: [5, 7] });
  expect(Object.keys(root.children)).toEqual(['1']);
});

test('handles duplicate inserts and repeated searches', () => {
  const statuses = statusesFor([
    { type: 'insert', value: 5 },
    { type: 'insert', value: 5 },
    { type: 'search', value: 5 },
    { type: 'search', value: 5 },
  ]);
  const ends = statuses.filter(status => /^(Found|Not found|Inserted|Already)/.test(status));
  expect(ends).toEqual(['Inserted: 5', 'Already inserted: 5', 'Found: 5', 'Found: 5']);
});

describe('base 10', () => {
  const build = values => trieInsertion.run({ add: () => {} }, { nodes: values, radix: 10 });

  test('uses raw decimal digits without padding', () => {
    expect(keyDigits(7, 10, 3)).toBe('7');
    expect(keyDigits(125, 10, 3)).toBe('125');
    expect(keyDigits(5, 2, 4)).toBe('0101');
    const root = build([7, 125]);
    expect(Object.keys(root.children).sort()).toEqual(['1', '7']);
    expect(root.children[7].key).toBe(7);
    expect(root.children[1].children[2].children[5].key).toBe(125);
  });

  test('stores a prefix key on the existing internal node', () => {
    const root = build([125, 12, 1259]);
    const twelve = root.children[1].children[2];
    expect(twelve.key).toBe(12);
    expect(twelve.children[5].key).toBe(125);
    expect(twelve.children[5].children[9].key).toBe(1259);
    const statuses = statusesFor(insertAll([125, 12]), 10);
    expect(statuses.filter(status => status.startsWith('Created'))).toHaveLength(3);
    expect(ends(statuses)).toEqual(['Inserted: 125', 'Inserted: 12 (prefix of a longer key, no new node)']);
  });

  test('creates nodes only for new digits and reports where keys end', () => {
    const statuses = statusesFor(insertAll([12, 125]), 10);
    expect(statuses.filter(status => status.startsWith('Created'))).toEqual([
      'Created child for 1', 'Created child for 2', 'Created child for 5',
    ]);
    expect(ends(statuses)).toEqual(['Inserted: 12', 'Inserted: 125']);
  });

  test('searches distinguish a stored prefix from a path prefix', () => {
    const statuses = statusesFor([
      { type: 'insert', value: 125 },
      { type: 'search', value: 12 },
      { type: 'insert', value: 12 },
      { type: 'search', value: 12 },
      { type: 'search', value: 125 },
      { type: 'search', value: 1253 },
      { type: 'search', value: 3 },
    ], 10);
    expect(ends(statuses)).toEqual([
      'Inserted: 125', 'Not found: 12', 'Inserted: 12 (prefix of a longer key, no new node)',
      'Found: 12', 'Found: 125', 'Not found: 1253', 'Not found: 3',
    ]);
  });

  test('handles duplicate inserts, including a duplicate prefix key', () => {
    const statuses = statusesFor(insertAll([125, 12, 12, 125]), 10);
    expect(ends(statuses)).toEqual([
      'Inserted: 125', 'Inserted: 12 (prefix of a longer key, no new node)',
      'Already inserted: 12', 'Already inserted: 125',
    ]);
  });

  test('highlights each digit with its place value', () => {
    const vis = Object.fromEntries(Object.entries(trieInsertion.initVisualisers({ radix: 10 }))
      .map(([name, visualiser]) => [name, visualiser.instance]));
    const masks = [];
    trieInsertion.run({
      add: (bookmark, callback, args = []) => {
        if (callback) callback(vis, ...args);
        if (bookmark === 2) masks.push([vis.mask.maskData, vis.mask.highlight[0]]);
      },
    }, { nodes: [125, 7], radix: 10 });
    expect(vis.mask.radix).toBe(10);
    expect(masks).toEqual([[100, 2], [10, 1], [1, 0], [1, 0]]);
  });

  test('lays out siblings without overlap', () => {
    const vis = Object.fromEntries(Object.entries(trieInsertion.initVisualisers({ radix: 10 }))
      .map(([name, visualiser]) => [name, visualiser.instance]));
    trieInsertion.run({
      add: (bookmark, callback, args = []) => { if (callback) callback(vis, ...args); },
    }, { nodes: [10, 11, 19, 20, 29, 3, 125], radix: 10 });
    const byLevel = {};
    vis.graph.nodes.forEach(({ x, y }) => { (byLevel[y] = byLevel[y] || []).push(x); });
    Object.values(byLevel).forEach(xs => {
      xs.sort((a, b) => a - b);
      xs.slice(1).forEach((x, i) => expect(x - xs[i]).toBeGreaterThanOrEqual(75));
    });
  });
});
