/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

// RUNS UNTRANSFORMED IN A WORKER PROCESS. ONLY USE NODE 4 COMPATIBLE FEATURES!

const {traverse, types} = require('babel-core');

class Replacement {
  constructor() {
    this.nameToIndex = new Map();
    this.nextIndex = 0;
  }

  isRequireCall(callee, firstArg) {
    return (
      callee.type === 'Identifier' && callee.name === 'require' &&
      firstArg && firstArg.type === 'StringLiteral'
    );
  }

  getIndex(name) {
    let index = this.nameToIndex.get(name);
    if (index !== undefined) {
      return index;
    }
    index = this.nextIndex++;
    this.nameToIndex.set(name, index);
    return index;
  }

  getNames() {
    return Array.from(this.nameToIndex.keys());
  }

  makeArgs(newId, oldId) {
    return [newId, oldId];
  }
}

class ProdReplacement {
  constructor(names) {
    this.replacement = new Replacement();
    this.names = names;
  }

  isRequireCall(callee, firstArg) {
    return (
      callee.type === 'Identifier' && callee.name === 'require' &&
      firstArg && firstArg.type === 'NumericLiteral'
    );
  }

  getIndex(id) {
    if (id in this.names) {
      return this.replacement.getIndex(this.names[id]);
    }

    throw new Error(
      `${id} is not a known module ID. Existing mappings: ${
       this.names.map((n, i) => `${i} => ${n}`).join(', ')}`
    );
  }

  getNames() {
    return this.replacement.getNames();
  }

  makeArgs(newId) {
    return [newId];
  }
}

function collectDependencies(ast, replacement) {
  traverse(ast, {
    CallExpression(path) {
      const node = path.node;
      const arg = node.arguments[0];
      if (replacement.isRequireCall(node.callee, arg)) {
        const index = replacement.getIndex(arg.value);
        node.arguments = replacement.makeArgs(types.numericLiteral(index), arg);
      }
    }
  });

  return replacement.getNames();
}

exports = module.exports =
  ast => collectDependencies(ast, new Replacement());
exports.forOptimization =
  (ast, names) => collectDependencies(ast, new ProdReplacement(names));
