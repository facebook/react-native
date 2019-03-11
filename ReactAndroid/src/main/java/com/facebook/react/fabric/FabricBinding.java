/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric;

import com.facebook.react.bridge.JavaScriptContextHolder;

public interface FabricBinding {

  // TODO: T31905686 change types of UIManager and EventBeatManager when moving to OSS
  void register(
      JavaScriptContextHolder jsContext, FabricBinder fabricBinder, Object eventBeatManager);

  void unregister();
}
