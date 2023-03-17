/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ColorPropConverter;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.DynamicFromObject;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.yoga.YogaConstants;

/**
 * This is a base implementation of {@link ViewManagerDelegate} which supports setting properties
 * that every view should support, such as rotation, background color, etc.
 */
public abstract class BaseViewManagerDelegate<T extends View, U extends BaseViewManagerInterface<T>>
    implements ViewManagerDelegate<T> {
  protected final U mViewManager;

  public BaseViewManagerDelegate(U viewManager) {
    mViewManager = viewManager;
  }

  @Override
  public void setProperty(T view, String propName, @Nullable Object value) {
    switch (propName) {
      case ViewProps.ACCESSIBILITY_ACTIONS:
        mViewManager.setAccessibilityActions(view, (ReadableArray) value);
        break;
      case ViewProps.ACCESSIBILITY_HINT:
        mViewManager.setAccessibilityHint(view, (String) value);
        break;
      case ViewProps.ACCESSIBILITY_LABEL:
        mViewManager.setAccessibilityLabel(view, (String) value);
        break;
      case ViewProps.ACCESSIBILITY_LIVE_REGION:
        mViewManager.setAccessibilityLiveRegion(view, (String) value);
        break;
      case ViewProps.ACCESSIBILITY_ROLE:
        mViewManager.setAccessibilityRole(view, (String) value);
        break;
      case ViewProps.ACCESSIBILITY_STATE:
        mViewManager.setViewState(view, (ReadableMap) value);
        break;
      case ViewProps.ACCESSIBILITY_COLLECTION:
        mViewManager.setAccessibilityCollection(view, (ReadableMap) value);
        break;
      case ViewProps.ACCESSIBILITY_COLLECTION_ITEM:
        mViewManager.setAccessibilityCollectionItem(view, (ReadableMap) value);
        break;
      case ViewProps.BACKGROUND_COLOR:
        mViewManager.setBackgroundColor(
            view, value == null ? 0 : ColorPropConverter.getColor(value, view.getContext()));
        break;
      case ViewProps.BORDER_RADIUS:
        mViewManager.setBorderRadius(
            view, value == null ? YogaConstants.UNDEFINED : ((Double) value).floatValue());
        break;
      case ViewProps.BORDER_BOTTOM_LEFT_RADIUS:
        mViewManager.setBorderBottomLeftRadius(
            view, value == null ? YogaConstants.UNDEFINED : ((Double) value).floatValue());
        break;
      case ViewProps.BORDER_BOTTOM_RIGHT_RADIUS:
        mViewManager.setBorderBottomRightRadius(
            view, value == null ? YogaConstants.UNDEFINED : ((Double) value).floatValue());
        break;
      case ViewProps.BORDER_TOP_LEFT_RADIUS:
        mViewManager.setBorderTopLeftRadius(
            view, value == null ? YogaConstants.UNDEFINED : ((Double) value).floatValue());
        break;
      case ViewProps.BORDER_TOP_RIGHT_RADIUS:
        mViewManager.setBorderTopRightRadius(
            view, value == null ? YogaConstants.UNDEFINED : ((Double) value).floatValue());
        break;
      case ViewProps.ELEVATION:
        mViewManager.setElevation(view, value == null ? 0.0f : ((Double) value).floatValue());
        break;
      case ViewProps.SHADOW_COLOR:
        mViewManager.setShadowColor(
            view, value == null ? 0 : ColorPropConverter.getColor(value, view.getContext()));
        break;
      case ViewProps.IMPORTANT_FOR_ACCESSIBILITY:
        mViewManager.setImportantForAccessibility(view, (String) value);
        break;
      case ViewProps.NATIVE_ID:
        mViewManager.setNativeId(view, (String) value);
        break;
      case ViewProps.ACCESSIBILITY_LABELLED_BY:
        Dynamic dynamicFromObject = new DynamicFromObject(value);
        mViewManager.setAccessibilityLabelledBy(view, dynamicFromObject);
        break;
      case ViewProps.OPACITY:
        mViewManager.setOpacity(view, value == null ? 1.0f : ((Double) value).floatValue());
        break;
      case ViewProps.RENDER_TO_HARDWARE_TEXTURE:
        //noinspection SimplifiableConditionalExpression
        mViewManager.setRenderToHardwareTexture(view, value == null ? false : (boolean) value);
        break;
      case ViewProps.ROTATION:
        mViewManager.setRotation(view, value == null ? 0.0f : ((Double) value).floatValue());
        break;
      case ViewProps.SCALE_X:
        mViewManager.setScaleX(view, value == null ? 1.0f : ((Double) value).floatValue());
        break;
      case ViewProps.SCALE_Y:
        mViewManager.setScaleY(view, value == null ? 1.0f : ((Double) value).floatValue());
        break;
      case ViewProps.TEST_ID:
        mViewManager.setTestId(view, (String) value);
        break;
      case ViewProps.TRANSFORM:
        mViewManager.setTransform(view, (ReadableArray) value);
        break;
      case ViewProps.TRANSLATE_X:
        mViewManager.setTranslateX(view, value == null ? 0.0f : ((Double) value).floatValue());
        break;
      case ViewProps.TRANSLATE_Y:
        mViewManager.setTranslateY(view, value == null ? 0.0f : ((Double) value).floatValue());
        break;
      case ViewProps.Z_INDEX:
        mViewManager.setZIndex(view, value == null ? 0.0f : ((Double) value).floatValue());
        break;
    }
  }

  @Override
  public void receiveCommand(T view, String commandName, ReadableArray args) {}
}
