// Note: this code is used for simple binary search trees and also
// AVL trees.
import parse from '../../pseudocode/parse';

export default parse(`
\\Code{
Main
DST_Search(t, k)  // Return subtree whose root has key k; or NotFound  \\B AVL_Search(t, k)
\\Expl{ Return subtree whose root has key K; or NotFound
\\Expl}
\\In{
    m ⟵ mask for most-significant bit 
    \\Expl{  m=1000...
    \\Expl}
    while t not Empty   \\B while t not Empty
    \\In{
        if t.key = k.key    \\B if n.key = k
        \\Expl{  Need to compare entire key, bits only used for branching
        \\Expl}
        }
        \\In{
            return t   \\B return t
            \\Expl{  We have found a node with the desired key k.
            \\Expl}
        \\In}
        else    \\B if n.key > k
        \\Expl{  Mask bit of k.key = 1
        \\Expl}
        \\In{
            if mask bit of k.key = 0   \\B t <- n.left
            \\In{
            t <- t.left
            \\In}
            else
            \\In{
                t <- t.right
            \\In}
            m <- m >> 1
            \\Expl{  Advance the mask to the next bit (m=0100...)
            \\Expl}
        \\In}
    \\In}
    return NotFound   \\B return NotFound
\\In}
\\Code}
`);
