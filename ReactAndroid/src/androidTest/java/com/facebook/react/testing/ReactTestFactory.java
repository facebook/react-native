/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.testing;

import android.content.Context;

import com.facebook.react.ReactInstanceManagerBuilder;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.NativeModule;

public interface ReactTestFactory {
  interface ReactInstanceEasyBuilder {
    ReactInstanceEasyBuilder setContext(Context context);
    ReactInstanceEasyBuilder addNativeModule(NativeModule module);
    CatalystInstance build();
  }

  ReactInstanceEasyBuilder getCatalystInstanceBuilder();
  ReactInstanceManagerBuilder getReactInstanceManagerBuilder();
}
