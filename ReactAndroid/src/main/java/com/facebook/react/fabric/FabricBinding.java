/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric;

import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.NativeMap;

public interface FabricBinding {

  // TODO: T31905686 change types of UIManager and EventBeatManager when moving to OSS
  void installFabric(
      JavaScriptContextHolder jsContext, FabricBinder fabricBinder, Object eventBeatManager);

  void releaseEventTarget(long jsContextNativePointer, long eventTargetPointer);

  void releaseEventHandler(long jsContextNativePointer, long eventHandlerPointer);

  void dispatchEventToEmptyTarget(
      long jsContextNativePointer, long eventHandlerPointer, String type, NativeMap payload);

  void dispatchEventToTarget(
      long jsContextNativePointer,
      long eventHandlerPointer,
      long eventTargetPointer,
      String type,
      NativeMap payload);
}
