package com.facebook.react.uimanager;

import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

/**
 * This is a base implementation of {@link ViewManagerDelegate} which supports setting properties
 * that every view should support, such as rotation, background color, etc.
 */
public abstract class BaseViewManagerDelegate<
        T extends View, U extends BaseViewManager<T, ? extends LayoutShadowNode>>
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
      case ViewProps.ACCESSIBILITY_STATES:
        mViewManager.setViewStates(view, (ReadableArray) value);
        break;
      case ViewProps.BACKGROUND_COLOR:
        mViewManager.setBackgroundColor(view, value == null ? 0 : ((Double) value).intValue());
        break;
      case ViewProps.ELEVATION:
        mViewManager.setElevation(view, value == null ? 0.0f : ((Double) value).floatValue());
        break;
      case ViewProps.IMPORTANT_FOR_ACCESSIBILITY:
        mViewManager.setImportantForAccessibility(view, (String) value);
        break;
      case ViewProps.NATIVE_ID:
        mViewManager.setNativeId(view, (String) value);
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
}
