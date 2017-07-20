/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react;

import java.util.List;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;

/**
 * A simple wrapper for ReactPackage to make it aware of its {@link ReactInstanceManager}
 * when creating native modules. This is useful when the package needs to ask
 * the instance manager for more information, like {@link DevSupportManager}.
 *
 * TODO(t11394819): Consolidate this with LazyReactPackage
 */
public abstract class ReactInstancePackage implements ReactPackage {

  public abstract List<NativeModule> createNativeModules(
      ReactApplicationContext reactContext,
      ReactInstanceManager reactInstanceManager);

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    throw new RuntimeException("ReactInstancePackage must be passed in the ReactInstanceManager.");
  }
}
