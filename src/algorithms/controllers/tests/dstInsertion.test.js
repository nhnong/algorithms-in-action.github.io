/* eslint-disable no-undef */

import dstInsertion from '../dstInsertion';

const chunker = { add: () => {} };

test('builds a digital search tree', () => {
  expect(
    dstInsertion.run(chunker, { nodes: [1, 19, 5, 3] })
  ).toEqual({
    1: { left: 5, right: 19 },
    5: { left: 3 },
    19: {},
    3: {},
  });
});