 /**
  * Copyright (c) 2015-present, Facebook, Inc.
  * All rights reserved.
  *
  * This source code is licensed under the BSD-style license found in the
  * LICENSE file in the root directory of this source tree. An additional grant
  * of patent rights can be found in the PATENTS file in the same directory.
  *
  */
/*jslint node: true */
'use strict';

var t = require('babel-core').types;

/**
 * Transforms asynchronous module importing into a function call
 * that includes which bundle needs to be loaded
 *
 * Transforms:
 *
 *  System.import('moduleA')
 *
 * to:
 *
 *  loadBundles('bundleA')
 */
module.exports = function systemImportTransform(babel) {
  return new babel.Transformer('system-import', {
    CallExpression: function(node, parent, scope, state) {
      if (!isAppropriateSystemImportCall(node, parent)) {
        return node;
      }

      var bundlesLayout = state.opts.extra.bundlesLayout;
      var bundleID = bundlesLayout.getBundleIDForModule(
        node.arguments[0].value
      );

      var bundles = bundleID.split('.');
      bundles.splice(0, 1);
      bundles = bundles.map(function(id) {
        return t.literal('bundle.' + id);
      });

      return t.callExpression(
        t.identifier('loadBundles'),
        [t.arrayExpression(bundles)]
      );
    },

    metadata: {
      group: 'fb'
    }
  });
};

function isAppropriateSystemImportCall(node) {
  return (
    node.callee.type === 'MemberExpression' &&
    node.callee.object.name === 'System' &&
    node.callee.property.name === 'import' &&
    node.arguments.length === 1 &&
    node.arguments[0].type === 'Literal'
  );
}
