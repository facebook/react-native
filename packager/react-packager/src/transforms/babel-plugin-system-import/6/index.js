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

const t = require('babel-types');

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
module.exports = function() {
  return {
    visitor: {
      CallExpression: function (path, state) {
        if (!isAppropriateSystemImportCall(path.node)) {
          return;
        }

        var bundlesLayout = state.opts.bundlesLayout;
        var bundleID = bundlesLayout.getBundleIDForModule(
          path.node.arguments[0].value
        );

        var bundles = bundleID.split('.');
        bundles.splice(0, 1);
        bundles = bundles.map(function(id) {
          return t.stringLiteral('bundle.' + id);
        });

        path.replaceWith(t.callExpression(
          t.identifier('loadBundles'),
          [t.arrayExpression(bundles)]
        ));
      },
    },
  };
};

function isAppropriateSystemImportCall(node) {
  return (
    node.callee.type === 'MemberExpression' &&
    node.callee.object.name === 'System' &&
    node.callee.property.name === 'import' &&
    node.arguments.length === 1 &&
    node.arguments[0].type === 'StringLiteral'
  );
}
