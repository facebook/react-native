/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import static com.facebook.react.uimanager.common.UIManagerType.FABRIC;
import static com.facebook.react.uimanager.common.UIManagerType.DEFAULT;
import static com.facebook.react.uimanager.common.ViewUtil.getUIManagerType;

import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.uimanager.common.UIManagerType;

/**
 * Helper class for {@link UIManager}.
 */
public class UIManagerHelper {

  /**
   * @return a {@link UIManager} that can handle the react tag received by parameter.
   */
  public static UIManager getUIManagerForReactTag(ReactContext context, int reactTag) {
    return getUIManager(context, getUIManagerType(reactTag));
  }

  /**
   * @return a {@link UIManager} that can handle the react tag received by parameter.
   */
  public static UIManager getUIManager(ReactContext context, @UIManagerType int uiManagerType) {
    CatalystInstance catalystInstance = context.getCatalystInstance();
    return uiManagerType == FABRIC ?
      catalystInstance.getJSIModule(UIManager.class) :
      catalystInstance.getNativeModule(UIManagerModule.class);
  }

}
