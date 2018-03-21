/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.testing.fabric;

import com.facebook.react.common.MapBuilder;
import java.util.Map;
import javax.annotation.Nullable;

import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

/**
 * Module to indicate if a test is using Fabric
 */
public final class FabricTestModule extends BaseJavaModule {

  private final boolean mIsFabricEnabled;

  public FabricTestModule(boolean isFabricEnabled) {
    mIsFabricEnabled = isFabricEnabled;
  }

  @Override
  public String getName() {
    return "FabricTestModule";
  }

  @Override
  public Map<String, Object> getConstants() {
    return MapBuilder.<String, Object>of("IS_FABRIC_ENABLED", mIsFabricEnabled);
  }
}
