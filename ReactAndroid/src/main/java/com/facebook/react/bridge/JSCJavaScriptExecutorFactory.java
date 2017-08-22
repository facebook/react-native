/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

public class JSCJavaScriptExecutorFactory implements JavaScriptExecutorFactory {
  @Override
  public JavaScriptExecutor create() throws Exception {
    WritableNativeMap jscConfig = new WritableNativeMap();
    jscConfig.putString("OwnerIdentity", "ReactNative");
    return new JSCJavaScriptExecutor(jscConfig);
  }
}
