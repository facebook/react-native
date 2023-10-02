/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

class JSIModuleHolder {

  private JSIModule mModule;
  private final JSIModuleSpec mSpec;

  public JSIModuleHolder(JSIModuleSpec spec) {
    mSpec = spec;
  }

  public JSIModule getJSIModule() {
    if (mModule == null) {
      synchronized (this) {
        if (mModule != null) {
          return mModule;
        }
        mModule = mSpec.getJSIModuleProvider().get();
        mModule.initialize();
      }
    }
    return mModule;
  }

  public void notifyJSInstanceDestroy() {
    if (mModule != null) {
      mModule.invalidate();
    }
  }
}
