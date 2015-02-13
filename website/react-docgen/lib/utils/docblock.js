/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/**
 * Helper functions to work with docblock comments.
 * @flow
 */
"use strict";

var types = require('recast').types.namedTypes;
var docletPattern = /^@(\w+)(?:$|\s((?:[^](?!^@\w))*))/gmi;

function parseDocblock(str) {
  var lines = str.split('\n');
  for (var i = 0, l = lines.length; i < l; i++) {
    lines[i] = lines[i].replace(/^\s*\*\s?/, '');
  }
  return lines.join('\n').trim();
}

/**
 * Given a path, this function returns the closest preceding docblock if it
 * exists.
 */
function getDocblock(path: NodePath): ?string {
  if (path.node.comments) {
    var comments = path.node.comments.leading.filter(function(comment) {
      return comment.type === 'Block' && comment.value.indexOf('*\n') === 0;
    });
    if (comments.length > 0) {
      return parseDocblock(comments[comments.length - 1].value);
    }
  }
  return null;
}

/**
 * Given a string, this functions returns an object with doclet names as keys
 * and their "content" as values.
 */
function getDoclets(str: string): Object {
  var doclets = Object.create(null);
  var match = docletPattern.exec(str);

  for (; match; match = docletPattern.exec(str)) {
    doclets[match[1]] = match[2] || true;
  }

  return doclets;
}

exports.getDocblock = getDocblock;
exports.getDoclets = getDoclets;
