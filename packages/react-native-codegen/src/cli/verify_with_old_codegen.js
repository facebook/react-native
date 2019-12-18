/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const fs = require('fs');
const [first, second] = process.argv.slice(2);

const contents1 = fs.readFileSync(first, 'utf8');
const contents2 = fs.readFileSync(second, 'utf8');

function traverse(t) {
  return t
    .replace(/\).invoke/g, ')\n.invoke') // in old codegen it was in one line
    .split('\n')
    .map(l => l.trim()) // no whitespaces
    .filter(Boolean) // no empty lines
    .filter(
      l =>
        !l.startsWith('namespace') && // no namespaces
        !l.startsWith('}') && // after removing openign namespaces we need to remove all closings
        !l.startsWith('/**') && // all comments
        !l.startsWith('#') && // imports
        !l.startsWith('//') && // comments
        !l.startsWith('importing it, you must change') && // comment in old codegen
        !l.startsWith('*'), //comments
    )
    .map(l => l.replace(/ /g, '')) // remove rest whitespaces
    .sort(); // sort alphabetically lines
}

const t1 = traverse(contents1);
const t2 = traverse(contents2);

if (t1.length !== t2.length) {
  throw new Error('Old and new codegen produces output of different size');
} else {
  for (let i = 0; i < t1.length; i++) {
    if (t1[i] !== t2[i]) {
      throw new Error(
        `Old and new codegen does not produce similar output! ${i}  ${
          t1[i]
        } | ${t2[i]}`,
      );
    }
  }
}
