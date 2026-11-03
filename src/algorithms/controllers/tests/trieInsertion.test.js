/* eslint-disable no-undef */

import trieInsertion from '../trieInsertion';
import { createTidyTreeLayout } from '../helpers/tidyTreeLayout';

const statusesFor = (operations) => {
  const vis = Object.fromEntries(Object.entries(trieInsertion.initVisualisers())
    .map(([name, visualiser]) => [name, visualiser.instance]));
  const statuses = [];
  trieInsertion.run({
    add: (bookmark, callback, args = []) => {
      if (callback) callback(vis, ...args);
      if (statuses[statuses.length - 1] !== vis.mask.pointerStatus) statuses.push(vis.mask.pointerStatus);
    },
  }, { operations });
  return statuses;
};

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

const visualisersFor = (params) => {
  const vis = Object.fromEntries(Object.entries(trieInsertion.initVisualisers(params))
    .map(([name, visualiser]) => [name, visualiser.instance]));
  const masks = [];
  const root = trieInsertion.run({
    add: (bookmark, callback, args = []) => {
      if (callback) callback(vis, ...args);
      masks.push([vis.mask.maskData, [...vis.mask.highlight]]);
    },
  }, params);
  return { vis, masks, root };
};

describe('base 4', () => {
  test('converts keys to zero-padded base 4 digits', () => {
    // 5 = 11, 7 = 13, 18 = 102 in base 4; all padded to three digits.
    const { root, vis } = visualisersFor({ radix: 4, nodes: [5, 7, 18] });
    expect(Object.keys(root.children).sort()).toEqual(['0', '1']);
    expect(Object.keys(root.children[0].children[1].children).sort()).toEqual(['1', '3']);
    expect(root.children[1].children[0].children[2].key).toBe(18);
    expect(vis.mask.maxBits).toBe(6);
    expect(vis.mask.radix).toBe(4);
  });

  test('labels branches 0 to 3 and orders them left to right', () => {
    const { vis } = visualisersFor({ radix: 4, nodes: [0, 1, 2, 3] });
    const fromRoot = vis.graph.edges.filter(edge => edge.source === 'root');
    expect(fromRoot.map(edge => edge.weight)).toEqual(['0', '1', '2', '3']);
    const xs = fromRoot.map(edge => vis.graph.findNode(edge.target).x);
    expect([...xs].sort((a, b) => a - b)).toEqual(xs);
    expect(vis.graph.findNode('root3').x).toBeCloseTo(-vis.graph.findNode('root0').x);
  });

  test('masks two bits per digit', () => {
    // 18 = 102 (base 4): digits from the left are bits 5-4, 3-2, 1-0.
    const { masks } = visualisersFor({ radix: 4, nodes: [18] });
    const distinct = masks.filter((m, i) => i === 0 || m[0] !== masks[i - 1][0]);
    expect(distinct.map(([mask]) => mask)).toEqual([48, 12, 3]);
    expect(distinct.map(([, bits]) => bits)).toEqual([[5, 4], [3, 2], [1, 0]]);
  });

  test('inserts and searches with base 4 paths', () => {
    const vis = Object.fromEntries(Object.entries(trieInsertion.initVisualisers({ radix: 4 }))
      .map(([name, visualiser]) => [name, visualiser.instance]));
    const statuses = [];
    trieInsertion.run({
      add: (bookmark, callback, args = []) => {
        if (callback) callback(vis, ...args);
        if (statuses[statuses.length - 1] !== vis.mask.pointerStatus) statuses.push(vis.mask.pointerStatus);
      },
    }, {
      radix: 4,
      operations: [
        { type: 'insert', value: 5 },
        { type: 'insert', value: 7 },
        { type: 'insert', value: 5 },
        { type: 'search', value: 7 },
        { type: 'search', value: 6 },
        { type: 'search', value: 9 },
      ],
    });
    const ends = statuses.filter(status => /^(Found|Not found|Inserted|Already)/.test(status));
    // 6 = 12 shares 5 = 11's root-1 path; 9 = 21 has no 2 child under the root.
    expect(ends).toEqual(['Inserted: 5', 'Inserted: 7', 'Already inserted: 5', 'Found: 7', 'Not found: 6', 'Not found: 9']);
    expect(statuses).toContain('Examining digit 3');
  });

  test('handles the largest 31-bit key', () => {
    const key = 2 ** 31 - 1;
    const { root, masks } = visualisersFor({ radix: 4, nodes: [key, 0] });
    let node = root;
    [...key.toString(4)].forEach((digit) => { node = node.children[digit]; });
    expect(node.key).toBe(key);
    expect(masks.some(([mask]) => mask === 3 * 4 ** 15)).toBe(true);
  });
});

test('base 2 keeps the binary tidy layout', () => {
  const { vis, root } = visualisersFor({ nodes: [5, 7, 2, 0, 12, 9, 3] });
  const expected = createTidyTreeLayout({
    root, getLeft: node => node.children[0], getRight: node => node.children[1],
    nodeGap: 100, singleChildOffset: 55, levelGap: 100, rootY: -4 * 100 / 2,
  });
  expect(vis.graph.nodes).toHaveLength(expected.size);
  vis.graph.nodes.forEach((node) => {
    expect(node.x).toBeCloseTo(expected.get(node.id).x);
    expect(node.y).toBeCloseTo(expected.get(node.id).y);
  });
  expect(vis.mask.radix).toBe(2);
  expect(vis.graph.edges.map(edge => edge.direction))
    .toEqual(vis.graph.edges.map(edge => (edge.weight === '0' ? 'left' : 'right')));
});
