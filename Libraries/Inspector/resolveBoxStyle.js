/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule resolveBoxStyle
 * @flow
 */
'use strict';

/**
 * Resolve a style property into it's component parts, e.g.
 *
 * resolveProperties('margin', {margin: 5, marginBottom: 10})
 * ->
 * {top: 5, left: 5, right: 5, bottom: 10}
 *
 * If none are set, returns false.
 */
function resolveBoxStyle(prefix: string, style: Object): ?Object {
  var res = {};
  var subs = ['top', 'left', 'bottom', 'right'];
  var set = false;
  subs.forEach(sub => {
    res[sub] = style[prefix] || 0;
  });
  if (style[prefix]) {
    set = true;
  }
  if (style[prefix + 'Vertical']) {
    res.top = res.bottom = style[prefix + 'Vertical'];
    set = true;
  }
  if (style[prefix + 'Horizontal']) {
    res.left = res.right = style[prefix + 'Horizontal'];
    set = true;
  }
  subs.forEach(sub => {
    var val = style[prefix + capFirst(sub)];
    if (val) {
      res[sub] = val;
      set = true;
    }
  });
  if (!set) {
    return;
  }
  return res;
}

function capFirst(text) {
  return text[0].toUpperCase() + text.slice(1);
}

module.exports = resolveBoxStyle;

