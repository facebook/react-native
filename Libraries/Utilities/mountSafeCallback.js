/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule mountSafeCallback
 * @flow
 */
'use strict';

var mountSafeCallback = function(context: ReactComponent, callback: ?Function): any {
  return function() {
    if (!callback || !context.isMounted()) {
      return;
    }
    return callback.apply(context, arguments);
  };
};

module.exports = mountSafeCallback;
