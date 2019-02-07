/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @author Ben Newman (@benjamn) <ben@benjamn.com>
 * @flow
 * @format
 */

'use strict';

let testMap; // Initialized lazily.
function getTestMap() {
  return testMap || (testMap = new (require('./Map'))());
}

// Wrap Object.{freeze,seal,preventExtensions} so each function adds its
// argument to a Map first, which gives our ./Map.js polyfill a chance to
// tag the object before it becomes non-extensible.
['freeze', 'seal', 'preventExtensions'].forEach(name => {
  const method = Object[name];
  if (typeof method === 'function') {
    (Object: any)[name] = function(obj) {
      try {
        // If .set succeeds, also call .delete to avoid leaking memory.
        getTestMap()
          .set(obj, obj)
          .delete(obj);
      } finally {
        // If .set fails, the exception will be silently swallowed
        // by this return-from-finally statement, and the method will
        // behave exactly as it did before it was wrapped.
        return method.call(Object, obj);
      }
    };
  }
});
