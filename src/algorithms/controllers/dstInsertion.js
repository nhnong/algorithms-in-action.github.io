// Digital search tree, initially a copy of simple iterative BST with a
// hack to produce just one chunk
// XXX Best to *share* code if possible to make sure animations look very
// similar and make it easier to maintain (like AVL tree and recursive
// BST)

// simple iterative BST
// Various modifications made to improve it and make it more similar
// to other BST variants
// Code structure was rubbish. Still is, as are variable names - doesn't
// bear much resemblance to pseudocode plus tree data structure is a bit
// rubbish.
// XXX new color stuff doesn't color arrow heads? Also hard to see black
// numbers on some node colors so we choose lighter colors here for now
// XXX Best make search look more similar + check pseudocode etc
// XXX added c, labels; p highlighted - OK?
// XXX best highlight whole path, add p label

/* eslint-disable no-plusplus */
import GraphTracer from '../../components/DataStructures/Graph/GraphTracer';
import Array1DTracer from '../../components/DataStructures/Array/Array1DTracer';
import MaskTracer from '../../components/DataStructures/Mask/MaskTracer';
import {ALGO_COLOR_PALLETE} from '../../components/DataStructures/colors';
const color_c = ALGO_COLOR_PALLETE.sky;
const color_p = ALGO_COLOR_PALLETE.peach;
const color_new = ALGO_COLOR_PALLETE.leaf;
const color_p_c = ALGO_COLOR_PALLETE.peach; // p->c edge
const color_p_new = ALGO_COLOR_PALLETE.leaf; // p->new edge

const TREE_ROOT_Y = -260;
const TREE_LEVEL_GAP = 120;
const TREE_NODE_GAP = 90;
const TREE_SINGLE_CHILD_OFFSET = 70;

const buildFinalTree = (nodes, initialMask) => {
  const finalTree = { [nodes[0]]: {} };

  for (let i = 1; i < nodes.length; i++) {
    const key = nodes[i];
    let current = nodes[0];
    let mask = initialMask;

    while (current !== undefined) {
      if (key === current) break;

      const direction = (key & mask) === 0 ? 'left' : 'right';
      const child = finalTree[current][direction];
      if (child === undefined) {
        finalTree[current][direction] = key;
        finalTree[key] = {};
        break;
      }

      current = child;
      mask >>= 1;
    }
  }

  return finalTree;
};

const getContours = (positions) => {
  const left = [];
  const right = [];

  Object.values(positions).forEach(({ x, depth }) => {
    left[depth] = left[depth] === undefined ? x : Math.min(left[depth], x);
    right[depth] = right[depth] === undefined ? x : Math.max(right[depth], x);
  });

  return { left, right };
};

const shiftLayout = (layout, xOffset) => Object.fromEntries(
  Object.entries(layout.positions).map(([key, position]) => [
    key,
    { x: position.x + xOffset, depth: position.depth + 1 },
  ]),
);

const createTidyPositions = (tree, root) => {
  const layoutSubtree = (key) => {
    const leftKey = tree[key].left;
    const rightKey = tree[key].right;
    const leftLayout = leftKey === undefined ? null : layoutSubtree(leftKey);
    const rightLayout = rightKey === undefined ? null : layoutSubtree(rightKey);
    const positions = { [key]: { x: 0, depth: 0 } };

    if (leftLayout && rightLayout) {
      let childOffset = TREE_SINGLE_CHILD_OFFSET;
      const sharedDepth = Math.min(
        leftLayout.contours.right.length,
        rightLayout.contours.left.length,
      );

      for (let depth = 0; depth < sharedDepth; depth++) {
        const requiredOffset = (
          leftLayout.contours.right[depth]
          - rightLayout.contours.left[depth]
          + TREE_NODE_GAP
        ) / 2;
        childOffset = Math.max(childOffset, requiredOffset);
      }

      Object.assign(positions, shiftLayout(leftLayout, -childOffset));
      Object.assign(positions, shiftLayout(rightLayout, childOffset));
    } else if (leftLayout) {
      Object.assign(positions, shiftLayout(leftLayout, -TREE_SINGLE_CHILD_OFFSET));
    } else if (rightLayout) {
      Object.assign(positions, shiftLayout(rightLayout, TREE_SINGLE_CHILD_OFFSET));
    }

    return { positions, contours: getContours(positions) };
  };

  const layout = layoutSubtree(root);
  return Object.fromEntries(
    Object.entries(layout.positions).map(([key, position]) => [
      key,
      {
        x: position.x,
        y: TREE_ROOT_Y + position.depth * TREE_LEVEL_GAP,
      },
    ]),
  );
};

export default {
  initVisualisers() {
    return {
      mask: {
        instance: new MaskTracer('mask', null, 'Key + Mask', { overlay: true }),
        order: 0,
      },
      // array: {
        // instance: new Array1DTracer('array', null, 'Keys to insert', { arrayItemMagnitudes: true }),
        // order: 0,
      // },
      graph: {
        instance: new GraphTracer('bst', null, 'Binary tree'),
        order: 1,
      },
    };
  },

  /**
   *
   * @param {object} chunker
   * @param {array} nodes array of numbers needs to be inserted
   */
  run(chunker, { nodes }) {
    if (nodes.length === 0) return;
    let parent;
    let prev = null;
    let visitedList = [null];
    const tree = {};
    const root = nodes[0];
    tree[root] = {};
    const maximumKey = Math.max(...nodes);
    const maxBits = Math.floor(Math.log2(Math.max(maximumKey, 1))) + 1;
    const initialMaskIndex = maxBits - 1;
    const initialMask = 2 ** initialMaskIndex;
    const positions = createTidyPositions(
      buildFinalTree(nodes, initialMask),
      root,
    );

    chunker.add(
      'init_b',
      (vis, bits, key, mask, maskIndex) => {
        vis.mask.setMaxBits(bits);
        vis.mask.setBinary(key);
        vis.mask.setMask(mask, maskIndex);
      },
      [maxBits, root, initialMask, initialMaskIndex],
    );

    // populate the ArrayTracer using nodes
    // chunker.add(
      // '1',
      // (vis, elements) => {
        // vis.array.set(elements);
        // // vis.array.select(0); // the index of root element is 0
        // // make a bit more room for tree
        // vis.graph.setSize(2.5);
        // vis.graph.setZoom(0.8);
        // vis.array.setZoom(0.9);
      // },
      // [nodes],
    // );
    // chunker.add('1', (vis) => {
      // vis.array.select(0); // the index of root element is 0
    // });
    chunker.add(1,
      (vis) => {
        vis.graph.setFunctionName("Tree is Empty");
        vis.graph.setZoom(0.65);
      },
      [],
    );

    chunker.add(1,
      (vis, r) => {
        vis.graph.setFunctionName("Insert:");
        vis.graph.setFunctionInsertText(` ${r} `);
      },
      [root],
    );
    chunker.add(7,
      (vis, r) => {
        // vis.graph.setFunctionName("Insert:");
        // vis.graph.setFunctionInsertText(` ${r} `);
      },
      [root],
    );
    chunker.add(8,
      (vis, r, position) => {
        vis.graph.setPauseLayout(true);
        vis.graph.addNode(r);
        vis.graph.setNodePosition(r, position.x, position.y);
        vis.graph.setFunctionName("Inserted:");
        // vis.graph.setNodeColor(r, color_new);
      },
      [root, positions[root]],
    );
/*
    chunker.add('end',
      (vis, r) => {
        vis.graph.setNodeColor(r, undefined);
      },
      [root]
    );
*/
    for (let i = 1; i < nodes.length; i++) {

      // BST_Insert() call
      prev = null;
      const element = nodes[i];
      let mask = initialMask;
      chunker.add(
        1,
        (vis, index, visited, rr, k, mask, maskIndex) => {
/*
          for (let j = 1; j < visited.length; j++) {
            vis.graph.leave(visited[j], visited[j - 1]);
          }
          if (nodes[index - 1] !== visited[visited.length - 1]) {
            vis.graph.deselect(nodes[index - 1], visited[visited.length - 1]);
          }
*/
          vis.graph.setFunctionName("Insert:");
          vis.graph.setFunctionInsertText(` ${k} `);
          vis.mask.setBinary(k);
          vis.mask.setMask(mask, maskIndex);
        },
        [i, visitedList, root, element, initialMask, initialMaskIndex],
      );
      visitedList = [null];
      chunker.add(7);
      let ptr = tree;
      parent = root;
      chunker.add(13,
        (vis, c) => {
          vis.graph.setNodeColor(c, color_p);
          vis.graph.setNodePointerText(c, 'c');
        },
        [root]
      );
      while (ptr) {
        visitedList.push(parent);
        chunker.add(14,
          (vis, c, p) => {
            vis.graph.setNodeColor(c, color_p);
            if (p !== null)
              vis.graph.setNodePointerText(p, '');
            vis.graph.setNodePointerText(c, 'p,c');
            // if (p !== null)
              // vis.graph.setNodeColor(p, undefined); // XXX
          },
          [parent, prev]
        );

        if (element === parent) {
          chunker.add('eq_key',
            (vis, p) => {
              vis.graph.setNodePointerText(p, 'p');
            },
            [parent]
          );
          break;
        }

        chunker.add(15);
        if ((element & mask) === 0) {
          // chunker.add(16);
          // chunker.add(18);
          if (tree[parent].left !== undefined) {
            // if current node has left child
            prev = parent;
            parent = tree[parent].left;
            ptr = tree[parent];
            mask >>= 1;
            chunker.add(16,
              (vis, c, p) => {
                // vis.graph.setNodeColor(c, color_c);
                vis.graph.setNodePointerText(p, 'p');
                vis.graph.setNodePointerText(c, 'c');
                vis.graph.setEdgeColor(p, c, color_p_c);
              },
              [parent, prev]
            );
            chunker.add(
              'update_b',
              (vis, nextMask) => {
                vis.mask.setMask(nextMask, Math.log2(nextMask));
              },
              [mask],
            );
            chunker.add(18);
          } else {
            chunker.add(16,
              (vis, p) => {
                vis.graph.setNodePointerText(p, 'p');
                vis.graph.setSelect_Circle_Count(p);
              },
              [parent]
            );
            chunker.add(18);
            chunker.add(9);
            tree[parent].left = element;
            tree[element] = {};
            chunker.add(
              10,
              (vis, e, p, position) => {
                vis.graph.addNode(e);
                vis.graph.setNodePosition(e, position.x, position.y);
                vis.graph.addEdge(p, e, { direction: 'left' });
                vis.graph.setNodePointerText(p, 'p');
                vis.graph.setNodeColor(e, color_new);
                vis.graph.setEdgeColor(p, e, color_p_new);
              },
              [element, parent, positions[element]],
            );
            visitedList.push(element);
            break;
          }
        } else {
          // chunker.add(17);
          // chunker.add(18);
          if (tree[parent].right !== undefined) {
            // if current node has right child
            prev = parent;
            parent = tree[parent].right;
            ptr = tree[parent];
            mask >>= 1;
            chunker.add(17,
              (vis, c, p) => {
                vis.graph.setNodePointerText(p, 'p');
                vis.graph.setNodePointerText(c, 'c');
                vis.graph.setEdgeColor(p, c, color_p_c);
              },
              [parent, prev]
            );
            chunker.add(
              'update_b',
              (vis, nextMask) => {
                vis.mask.setMask(nextMask, Math.log2(nextMask));
              },
              [mask],
            );
            chunker.add(18);
          } else {
            chunker.add(17,
              (vis, p) => {
                vis.graph.setNodePointerText(p, 'p');
                vis.graph.setSelect_Circle_Count(p);
              },
              [parent]
            );
            chunker.add(18);
            chunker.add(9);
            tree[parent].right = element;
            tree[element] = {};
            chunker.add(
              11,
              (vis, e, p, position) => {
                vis.graph.addNode(e);
                vis.graph.setNodePosition(e, position.x, position.y);
                vis.graph.addEdge(p, e, { direction: 'right' });
                vis.graph.setNodePointerText(p, 'p');
                vis.graph.setNodeColor(e, color_new);
                vis.graph.setEdgeColor(p, e, color_p_new);
              },
              [element, parent, positions[element]],
            );
            visitedList.push(element);
            break;
          }
        }
      }
      // deselect everything
      chunker.add('end',
        (vis, el, visited) => {
          vis.graph.setFunctionName("Inserted:");
          for (let j = 1; j < visited.length; j++) {
            vis.graph.setEdgeColor(visited[j-1], visited[j], undefined);
            vis.graph.setNodeColor(visited[j], undefined);
            vis.graph.setNodePointerText(visited[j], '');
          }
          vis.graph.clearSelect_Circle_Count();
        },
        [element, visitedList],
      );
    }
    // for test
    // eslint-disable-next-line consistent-return
    return tree;
  },
};
