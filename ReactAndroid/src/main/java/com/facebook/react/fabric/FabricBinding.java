/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import com.facebook.react.bridge.JavaScriptContextHolder;

public interface FabricBinding {

  void installFabric(JavaScriptContextHolder jsContext, FabricUIManager fabricModule);

}
