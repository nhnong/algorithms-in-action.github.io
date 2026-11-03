# Radix search trie insertion

A radix search trie follows the digits of a key from left to right. In base 2 (binary), an edge labelled 0 goes left and an edge labelled 1 goes right. In base 4 (quaternary), each node has up to four children, labelled 0 to 3 from left to right. Keys with a common prefix share the same initial path.

If the next child is missing, insertion creates it. The pointer `t` then moves to that child. After all digits have been consumed, the node is marked as an end node and displays the original key. Inserting the same key again reuses its path.

Keys are entered in decimal. This animation converts them to the chosen base and pads all keys to the width of the largest input. The current digit is highlighted in the key panel; in base 4 each digit covers two bits of the binary key. Layout coordinates are reserved in advance so existing nodes do not move as children appear.

Put `?` before a key to search for it in the trie built so far.
