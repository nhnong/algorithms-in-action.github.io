/* eslint-disable no-undef */

import dstInsertion from '../dstInsertion';

const chunker = { add: () => {} };

test('shows an empty pointer before the insertion point for either child, then reports the insert', () => {
  const vis = Object.fromEntries(Object.entries(dstInsertion.initVisualisers())
    .map(([name, visualiser]) => [name, visualiser.instance]));
  const frames = [];
  dstInsertion.run({
    add: (bookmark, callback, args = []) => {
      if (callback) callback(vis, ...args);
      frames.push({ bookmark, status: vis.mask.pointerStatus, count: vis.graph.nodes.length });
    },
  }, { nodes: [13, 4, 20, 4] });

  for (const [bookmark, count] of [[16, 1], [17, 2]]) {
    const empty = frames.findIndex(frame => frame.bookmark === bookmark && frame.count === count);
    expect(frames[empty].status).toBe('c = Empty');
    expect(frames[empty + 1]).toEqual({ bookmark: 18, status: 'Insertion point found', count });
    expect(frames[empty + 3].status).toBe(`Inserted: ${[4, 20][count - 1]}`);
    expect(frames[empty + 3].count).toBe(count + 1);
  }
  expect(frames[frames.length - 1].status).toBe('Already inserted: 4');
});

test('shows tree status text in the mask table instead of the graph title', () => {
  const vis = Object.fromEntries(Object.entries(dstInsertion.initVisualisers())
    .map(([name, visualiser]) => [name, visualiser.instance]));
  const statuses = [];
  dstInsertion.run({
    add: (bookmark, callback, args = []) => {
      if (callback) callback(vis, ...args);
      if (statuses[statuses.length - 1] !== vis.mask.pointerStatus) statuses.push(vis.mask.pointerStatus);
    },
  }, { nodes: [13, 4] });

  expect(statuses.slice(0, 4)).toEqual(['', 'Tree is empty', 'Insert: 13', 'Inserted: 13']);
  expect(statuses).toContain('Insert: 4');
  expect(statuses[statuses.length - 1]).toBe('Inserted: 4');
});

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

test('shows the current key and mask bit while traversing', () => {
  const visualisers = dstInsertion.initVisualisers();
  const vis = Object.fromEntries(
    Object.entries(visualisers).map(([name, visualiser]) => [
      name,
      visualiser.instance,
    ])
  );
  const animationChunker = {
    add: (bookmark, callback, args = []) => callback && callback(vis, ...args),
  };

  dstInsertion.run(animationChunker, { nodes: [1, 19, 5, 3] });
  const { mask } = vis;

  expect({
    maxBits: mask && mask.maxBits,
    key: mask && mask.binaryData,
    mask: mask && mask.maskData,
    highlightedBit: mask && mask.highlight,
  }).toEqual({
    maxBits: 5,
    key: 3,
    mask: 8,
    highlightedBit: [3],
  });
});
