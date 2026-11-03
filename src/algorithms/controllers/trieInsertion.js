import GraphTracer from '../../components/DataStructures/Graph/GraphTracer';
import MaskTracer from '../../components/DataStructures/Mask/MaskTracer';
import { ALGO_COLOR_PALLETE } from '../../components/DataStructures/colors';
import { createTidyTreeLayout } from './helpers/tidyTreeLayout';
import { createMultiwayTreeLayout } from './helpers/multiwayTreeLayout';

const RADIX_NAMES = { 2: 'Binary', 10: 'Decimal' };

// Digits of a key, most significant first. Base 10 uses the raw decimal
// digits, so keys can differ in length and a key that is a prefix of
// another ends on an internal node; other radixes pad to a common width.
export const keyDigits = (key, radix, width) => (radix === 10
  ? String(key)
  : key.toString(radix).padStart(width, '0'));

export default {
  initVisualisers({ radix = 2 } = {}) {
    return {
      mask: { instance: new MaskTracer('mask', null, 'Current digit', { overlay: true }), order: 0 },
      graph: { instance: new GraphTracer('trie', null, `${RADIX_NAMES[radix]} trie (R = ${radix})`), order: 1 },
    };
  },

  // operations: insert/search steps, e.g. from "5,7,?5"
  run(chunker, { nodes = [], operations, radix = 2 }) {
    const operationList = operations
      || nodes.map(value => ({ type: 'insert', value }));
    const keys = operationList.map(({ value }) => value);
    const bits = Math.max(1, ...keys.map(key => key.toString(radix).length));
    const toWord = key => keyDigits(key, radix, bits);
    // Highlight digit `depth` of a key; the mask holds its place value.
    const digitIndex = (key, depth) => toWord(key).length - depth - 1;
    const levelGap = 100;
    const root = { id: 'root', children: {} };
    // Reserve the final layout only. Animation still creates nodes one at a time.
    operationList.filter(({ type }) => type === 'insert').forEach(({ value }) => {
      const word = toWord(value);
      let node = root;
      [...word].forEach(digit => {
        if (!node.children[digit]) {
          node.children[digit] = { id: `${node.id}${digit}`, children: {} };
        }
        node = node.children[digit];
      });
    });
    const positions = radix === 2
      ? createTidyTreeLayout({
        root, getLeft: node => node.children[0], getRight: node => node.children[1],
        nodeGap: 100, singleChildOffset: 55, levelGap, rootY: -bits * levelGap / 2,
      })
      : createMultiwayTreeLayout({
        root, getChildren: node => Object.keys(node.children).sort().map(d => node.children[d]),
        nodeGap: 75, levelGap, rootY: -bits * levelGap / 2,
      });
    const maxX = Math.max(...Array.from(positions.values(), p => Math.abs(p.x)));
    chunker.add(1, vis => {
      vis.graph.setPauseLayout(true);
      vis.graph.setZoom(1);
      vis.graph.presentation = 'trie';
      vis.graph.weighted(true);
      vis.graph.dimensions.nodeRadius = 26;
      vis.graph.dimensions.baseWidth = Math.max(650, maxX * 2 + 150);
      vis.graph.dimensions.baseHeight = Math.max(350, bits * levelGap + 150);
      vis.graph.addNode('root', '');
      vis.graph.updateUpperLabel('root', 'root');
      const position = positions.get('root');
      vis.graph.setNodePosition('root', position.x, position.y);
      vis.graph.setNodePointerText('root', 't');
      vis.graph.setNodeColor('root', ALGO_COLOR_PALLETE.sky);
      vis.mask.setRadix(radix);
      vis.mask.setMaxBits(bits);
      vis.mask.setBinary(keys[0] || 0);
      const index = digitIndex(keys[0] || 0, 0);
      vis.mask.setMask(radix ** index, index);
      vis.mask.setPointerStatus('Ready to insert');
    });

    const created = new Set(['root']);
    const terminals = new Set();
    // Reset colours and put t back at the root for the next operation.
    const start = (bookmark, status, key) => {
      chunker.add(bookmark, (vis, k, index, text) => {
        vis.graph.nodes.forEach(node => {
          vis.graph.setNodePointerText(node.id, '');
          vis.graph.setNodeColor(node.id, undefined);
        });
        vis.graph.edges.forEach(edge => vis.graph.setEdgeColor(edge.source, edge.target, undefined));
        vis.graph.clearSelect_Circle_Count();
        vis.graph.setNodePointerText('root', 't');
        vis.graph.setNodeColor('root', ALGO_COLOR_PALLETE.sky);
        vis.mask.setBinary(k);
        vis.mask.setMask(radix ** index, index);
        vis.mask.setPointerStatus(text);
      }, [key, digitIndex(key, 0), `${status}: ${key}`]);
    };

    const search = (key) => {
      start('search', 'Search', key);
      let node = root;
      const digits = [...toWord(key)];
      for (let depth = 0; depth < digits.length; depth += 1) {
        const digit = digits[depth];
        chunker.add('search-digit', (vis, index, d) => {
          vis.mask.setMask(radix ** index, index);
          vis.mask.setPointerStatus(`Examining digit ${d}`);
        }, [digitIndex(key, depth), digit]);
        const next = node.children[digit];
        const missing = !next || !created.has(next.id);
        chunker.add('search-test-child', (vis, absent, d) => {
          vis.mask.setPointerStatus(absent ? `No child for ${d}` : `Follow existing ${d} child`);
        }, [missing, digit]);
        if (missing) {
          chunker.add('search-no-child', (vis, id, k) => {
            vis.graph.setNodeColor(id, ALGO_COLOR_PALLETE.apple);
            vis.mask.setPointerStatus(`Not found: ${k}`);
          }, [node.id, key]);
          return;
        }
        chunker.add('search-move', (vis, p, id, d) => {
          vis.graph.setNodePointerText(p, '');
          vis.graph.setNodePointerText(id, 't');
          vis.graph.setNodeColor(p, undefined);
          vis.graph.setNodeColor(id, ALGO_COLOR_PALLETE.sky);
          vis.graph.setEdgeColor(p, id, ALGO_COLOR_PALLETE.peach);
          vis.mask.setPointerStatus(`Moved t to ${d} child`);
        }, [node.id, next.id, digit]);
        node = next;
      }
      const found = terminals.has(node.id);
      chunker.add('search-test-end');
      chunker.add(found ? 'search-found' : 'search-not-end', (vis, id, k, isFound) => {
        vis.graph.setNodeColor(id, isFound ? ALGO_COLOR_PALLETE.leaf : ALGO_COLOR_PALLETE.apple);
        vis.mask.setPointerStatus(isFound ? `Found: ${k}` : `Not found: ${k}`);
      }, [node.id, key, found]);
    };

    const insert = (key) => {
      start(1, 'Insert', key);
      let node = root;
      [...toWord(key)].forEach((digit, depth) => {
        const parent = node.id;
        node = node.children[digit];
        const child = node.id;
        chunker.add(2, (vis, index, d) => {
          vis.mask.setMask(radix ** index, index);
          vis.mask.setPointerStatus(`Examining digit ${d}`);
        }, [digitIndex(key, depth), digit]);
        const missing = !created.has(child);
        chunker.add(3, (vis, absent, d) => {
          vis.mask.setPointerStatus(absent ? `No child for ${d}` : `Follow existing ${d} child`);
        }, [missing, digit]);
        if (missing) {
          created.add(child);
          chunker.add(4, (vis, id, p, d, position) => {
            vis.graph.addNode(id, '');
            vis.graph.setNodePosition(id, position.x, position.y);
            vis.graph.addEdge(p, id, { weight: d, direction: Number(d) < radix / 2 ? 'left' : 'right' });
            vis.graph.setNodeColor(id, ALGO_COLOR_PALLETE.leaf);
            vis.mask.setPointerStatus(`Created child for ${d}`);
          }, [child, parent, digit, positions.get(child)]);
        }
        chunker.add(5, (vis, p, id, d) => {
          vis.graph.setNodePointerText(p, '');
          vis.graph.setNodePointerText(id, 't');
          vis.graph.setNodeColor(p, undefined);
          vis.graph.setNodeColor(id, ALGO_COLOR_PALLETE.sky);
          vis.graph.setEdgeColor(p, id, ALGO_COLOR_PALLETE.peach);
          vis.mask.setPointerStatus(`Moved t to ${d} child`);
        }, [parent, child, digit]);
      });
      const duplicate = terminals.has(node.id);
      // Base 10 only: a prefix of a longer key ends on an existing internal
      // node, which keeps its children and also becomes an end node.
      const internal = Object.values(node.children).some(child => created.has(child.id));
      terminals.add(node.id);
      node.key = key;
      let message = `Inserted: ${key}`;
      if (duplicate) message = `Already inserted: ${key}`;
      else if (internal) message = `Inserted: ${key} (prefix of a longer key, no new node)`;
      chunker.add(6, (vis, id, k, text) => {
        vis.graph.updateNode(id, String(k));
        vis.graph.findNode(id).isTerminal = true;
        vis.graph.setNodeColor(id, undefined);
        vis.graph.setSelect_Circle_Count(id);
        vis.mask.setPointerStatus(text);
      }, [node.id, key, message]);
    };

    operationList.forEach(({ type, value }) => {
      if (type === 'search') search(value);
      else insert(value);
    });
    return root;
  },
};
