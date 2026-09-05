import {ALGO_COLOR_PALLETE} from '../../components/DataStructures/colors';
const color_p = ALGO_COLOR_PALLETE.peach;

// remove any highlighting etc from tree
let uncolor = (graph, tree) => {
  Object.keys(tree).forEach(p => {
    let l = tree[p].left;
    let r = tree[p].right;
    let n = Number(p);
    graph.setNodeColor(n, undefined);
    if (l)
      graph.setEdgeColor(n, l, undefined);
    if (r)
      graph.setEdgeColor(n, r, undefined);
  })
}

export default {
    /**
         * For the search algorithm, we use the tree that is created in
         * the insertion algorithm to initialise the visualiser
         * @param {object} visualiser
         */
    initVisualisers({ visualiser }) {
        // clear existing trace, if any
        visualiser.graph.instance.clear();
        return {
            mask: {
                instance: visualiser.mask.instance,
                order: 0,
            },
            graph: {
                instance: visualiser.graph.instance,
                order: 1,
            },
        };
    },

    /**
     * We use the tree that is created in the insertion algorithm to search
     * @param {object} chunker
     * @param {object} visualiser
     * @param {number} target
     */
    run(chunker, { visualiser, target }) {
        // get whole tree
        const tree = visualiser.graph.instance.getTree();
        const root = visualiser.graph.instance.getRoot();
        if (root === undefined) return 'fail';

        let t = root;
        let t_new = null;

        const keys = Object.keys(tree).map(Number);
        const maximumKey = Math.max(...keys);
        const maxBits = Math.floor(Math.log2(Math.max(maximumKey, 1))) + 1;
        const initialMaskIndex = maxBits - 1;
        let mask = 2 ** initialMaskIndex;
        let maskIndex = initialMaskIndex;
        console.log('mask value: ' + initialMaskIndex);

        chunker.add('DST_Search(t, k)', (vis, tree, mask, target, t) => {
            uncolor(vis.graph, tree);
            vis.graph.setZoom(0.65);
            vis.graph.setNodeColor(t, color_p);
            vis.graph.setNodePointerText(t, 't');
            vis.graph.setFunctionInsertText("(t, " + target + ")");
            vis.graph.setFunctionName("DST_Search");
            vis.mask.setBinary(target);
        }, [tree, mask, target, t]);

        chunker.add('set M', (vis, mask, maskIndex, maxBits) => {
            vis.mask.setMaxBits(maxBits);
            vis.mask.setMask(mask, maskIndex);
        }, [mask, maskIndex, maxBits]);
 
        /* eslint-disable no-constant-condition */
        let iter = 0;
        while (true) {
            if (iter > 10){
                break;
            }
            chunker.add('while t not Empty');
            if (t === undefined){
                chunker.add('return NotFound', (vis) => vis.graph.setText('Key not found'));
                return 'fail';
            }

            chunker.add('if t.key = k.key');
            if (t === target){
                chunker.add('return t', (vis) => {
                    vis.graph.setText('FOUND!');
                }, []);
                return 'success';
            }
            else{
                chunker.add('key not equal');
                chunker.add('if mask bit of k.key=0');
                const goLeft = (target & mask) === 0;
                const old_t = t;
                t = goLeft ? tree[old_t].left : tree[old_t].right;

                const bookmark = goLeft ? 't <- t.left' : 't <- t.right';
                chunker.add(bookmark, (vis, tree, target, t) => {
                    vis.graph.setNodeColor(old_t, undefined);
                    vis.graph.setNodePointerText(old_t, '');
                    vis.graph.setNodeColor(t, color_p);
                    vis.graph.setNodePointerText(t, 't');
                }, [tree, target, t]);
            }
            mask >>= 1;
            maskIndex--;
            chunker.add('m <- m >> 1', (vis, mask, maskIndex) => {
                vis.mask.setMask(mask, maskIndex);
            }, [mask, maskIndex]);
            iter++;
        }
    },
};