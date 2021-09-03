/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.testing;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.uimanager.ViewManagerRegistry;

/** Factory used to create FabricUIManager in Testing infrastructure. */
public interface FabricUIManagerFactory {

  UIManager getFabricUIManager(
      ReactApplicationContext reactApplicationContext, ViewManagerRegistry viewManagerRegistry);
}
