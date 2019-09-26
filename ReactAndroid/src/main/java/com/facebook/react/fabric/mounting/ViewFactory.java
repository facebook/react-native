/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.fabric.mounting;

import android.view.View;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.ThemedReactContext;

public interface ViewFactory {

  View getOrCreateView(String componentName, ReactStylesDiffMap props, ThemedReactContext context);

  void recycle(ThemedReactContext context, String componentName, View view);

}
