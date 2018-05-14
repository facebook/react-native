package com.facebook.react.uimanager;

import static com.facebook.react.uimanager.common.ViewType.FABRIC;
import static com.facebook.react.uimanager.common.ViewUtil.getViewType;

import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UIManager;

/**
 * Helper class for {@link UIManager}.
 */
public class UIManagerHelper {

  /**
   * @return a {@link UIManager} that can handle the react tag received by parameter.
   */
  public static UIManager getUIManager(ReactContext context, int reactTag) {
    return getUIManager(context, getViewType(reactTag) == FABRIC);
  }

  /**
   * @return a {@link UIManager} that can handle the react tag received by parameter.
   */
  public static UIManager getUIManager(ReactContext context, boolean isFabric) {
    CatalystInstance catalystInstance = context.getCatalystInstance();
    return isFabric ?
      catalystInstance.getJSIModule(UIManager.class) :
      catalystInstance.getNativeModule(UIManagerModule.class);
  }

}
