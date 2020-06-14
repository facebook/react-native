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
import android.widget.EditText;
import androidx.annotation.Nullable;
import androidx.core.view.ViewCompat;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JSIModuleType;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftException;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.uimanager.common.UIManagerType;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.EventDispatcherProvider;

/** Helper class for {@link UIManager}. */
public class UIManagerHelper {

  public static final int PADDING_START_INDEX = 0;
  public static final int PADDING_END_INDEX = 1;
  public static final int PADDING_TOP_INDEX = 2;
  public static final int PADDING_BOTTOM_INDEX = 3;

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
    // TODO T67518514 Clean this up once we migrate everything over to bridgeless mode
    if (context.isBridgeless()) {
      if (context instanceof ThemedReactContext) {
        context = ((ThemedReactContext) context).getReactApplicationContext();
      }
      return ((EventDispatcherProvider) context).getEventDispatcher();
    }
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

  /**
   * @return the default padding used by Android EditText's. This method returns the padding in an
   *     array to avoid extra classloading during hot-path of RN Android.
   */
  public static float[] getDefaultTextInputPadding(ThemedReactContext context) {
    EditText editText = new EditText(context);
    float[] padding = new float[4];
    padding[PADDING_START_INDEX] = PixelUtil.toDIPFromPixel(ViewCompat.getPaddingStart(editText));
    padding[PADDING_END_INDEX] = PixelUtil.toDIPFromPixel(ViewCompat.getPaddingEnd(editText));
    padding[PADDING_TOP_INDEX] = PixelUtil.toDIPFromPixel(editText.getPaddingTop());
    padding[PADDING_BOTTOM_INDEX] = PixelUtil.toDIPFromPixel(editText.getPaddingBottom());
    return padding;
  }
}
