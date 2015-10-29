/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

/**
 * Interface that represents a JavaScript Promise which can be passed to the native module as a
 * method parameter.
 *
 * Methods annotated with {@link ReactMethod} that use {@link Promise} as type of the last parameter
 * will be marked as "remoteAsync" and will return a promise when invoked from JavaScript.
 */
public interface Promise {
  void resolve(Object value);
  void reject(String reason);
}
