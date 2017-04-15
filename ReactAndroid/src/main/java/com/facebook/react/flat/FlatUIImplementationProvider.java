/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import java.util.List;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.UIImplementationProvider;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.events.EventDispatcher;

/**
 * UIImplementationProvider that creates instances of {@link FlatUIImplementation}.
 */
public final class FlatUIImplementationProvider extends UIImplementationProvider {

  private final boolean mMemoryImprovementEnabled;

  public FlatUIImplementationProvider() {
    mMemoryImprovementEnabled = true;
  }

  public FlatUIImplementationProvider(boolean memoryImprovementEnabled) {
    mMemoryImprovementEnabled = memoryImprovementEnabled;
  }

  @Override
  public FlatUIImplementation createUIImplementation(
      ReactApplicationContext reactContext,
      List<ViewManager> viewManagers,
      EventDispatcher eventDispatcher) {
    return FlatUIImplementation.createInstance(
      reactContext,
      viewManagers,
      eventDispatcher,
      mMemoryImprovementEnabled);
  }
}
