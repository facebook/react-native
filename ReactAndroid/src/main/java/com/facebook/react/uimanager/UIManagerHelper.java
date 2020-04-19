/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import static com.facebook.react.uimanager.common.UIManagerType.FABRIC;
import static com.facebook.react.uimanager.common.ViewUtil.getUIManagerType;

import android.content.Context;
import android.content.ContextWrapper;
import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JSIModuleType;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftException;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.uimanager.common.UIManagerType;
import com.facebook.react.uimanager.events.EventDispatcher;

/** Helper class for {@link UIManager}. */
public class UIManagerHelper {

  /** @return a {@link UIManager} that can handle the react tag received by parameter. */
  @Nullable
  public static UIManager getUIManagerForReactTag(ReactContext context, int reactTag) {
    return getUIManager(context, getUIManagerType(reactTag));
  }

  /** @return a {@link UIManager} that can handle the react tag received by parameter. */
  @Nullable
  public static UIManager getUIManager(ReactContext context, @UIManagerType int uiManagerType) {
    return getUIManager(context, uiManagerType, true);
  }

  @Nullable
  private static UIManager getUIManager(
      ReactContext context,
      @UIManagerType int uiManagerType,
      boolean returnNullIfCatalystIsInactive) {
    if (context.isBridgeless()) {
      return (UIManager) context.getJSIModule(JSIModuleType.UIManager);
    } else {
      if (!context.hasCatalystInstance()) {
        ReactSoftException.logSoftException(
            "UIManagerHelper",
            new ReactNoCrashSoftException(
                "Cannot get UIManager because the context doesn't contain a CatalystInstance."));
        return null;
      }
      // TODO T60461551: add tests to verify emission of events when the ReactContext is being turn
      // down.
      if (!context.hasActiveCatalystInstance()) {
        ReactSoftException.logSoftException(
            "UIManagerHelper",
            new ReactNoCrashSoftException(
                "Cannot get UIManager because the context doesn't contain an active CatalystInstance."));
        if (returnNullIfCatalystIsInactive) {
          return null;
        }
      }
      CatalystInstance catalystInstance = context.getCatalystInstance();
      return uiManagerType == FABRIC
          ? (UIManager) catalystInstance.getJSIModule(JSIModuleType.UIManager)
          : catalystInstance.getNativeModule(UIManagerModule.class);
    }
  }

  /**
   * @return the {@link EventDispatcher} that handles events for the reactTag received as a
   *     parameter.
   */
  @Nullable
  public static EventDispatcher getEventDispatcherForReactTag(ReactContext context, int reactTag) {
    return getEventDispatcher(context, getUIManagerType(reactTag));
  }

  /**
   * @return the {@link EventDispatcher} that handles events for the {@link UIManagerType} received
   *     as a parameter.
   */
  @Nullable
  public static EventDispatcher getEventDispatcher(
      ReactContext context, @UIManagerType int uiManagerType) {
    UIManager uiManager = getUIManager(context, uiManagerType, false);
    return uiManager == null ? null : (EventDispatcher) uiManager.getEventDispatcher();
  }

  /**
   * @return The {@link ReactContext} associated to the {@link View} received as a parameter.
   *     <p>We can't rely that the method View.getContext() will return the same context that was
   *     passed as a parameter during the construction of the View.
   *     <p>For example the AppCompatEditText class wraps the context received as a parameter in the
   *     constructor of the View into a TintContextWrapper object. See:
   *     https://android.googlesource.com/platform/frameworks/support/+/dd55716/v7/appcompat/src/android/support/v7/widget/AppCompatEditText.java#55
   */
  public static ReactContext getReactContext(View view) {
    Context context = view.getContext();
    if (!(context instanceof ReactContext) && context instanceof ContextWrapper) {
      context = ((ContextWrapper) context).getBaseContext();
    }
    return (ReactContext) context;
  }
}
