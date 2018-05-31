/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.fabric;

import com.facebook.react.bridge.WritableMap;

public interface JSHandler {

  void invoke(long instanceHandle, String name, WritableMap params);

}
