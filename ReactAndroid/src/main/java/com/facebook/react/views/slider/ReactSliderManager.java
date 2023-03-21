/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.slider;

import android.content.Context;
import android.graphics.PorterDuff;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.widget.SeekBar;
import androidx.annotation.Nullable;
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat.AccessibilityActionCompat;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactAccessibilityDelegate;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.viewmanagers.SliderManagerDelegate;
import com.facebook.react.viewmanagers.SliderManagerInterface;
import com.facebook.yoga.YogaMeasureFunction;
import com.facebook.yoga.YogaMeasureMode;
import com.facebook.yoga.YogaMeasureOutput;
import com.facebook.yoga.YogaNode;
import java.util.HashMap;
import java.util.Map;

/**
 * Manages instances of {@code ReactSlider}.
 *
 * <p>Note that the slider is _not_ a controlled component.
 */
public class ReactSliderManager extends SimpleViewManager<ReactSlider>
    implements SliderManagerInterface<ReactSlider> {

  private static final int STYLE = android.R.attr.seekBarStyle;

  public static final String REACT_CLASS = "RCTSlider";

  static class ReactSliderShadowNode extends LayoutShadowNode implements YogaMeasureFunction {

    private int mWidth;
    private int mHeight;
    private boolean mMeasured;

    private ReactSliderShadowNode() {
      initMeasureFunction();
    }

    private void initMeasureFunction() {
      setMeasureFunction(this);
    }

    @Override
    public long measure(
        YogaNode node,
        float width,
        YogaMeasureMode widthMode,
        float height,
        YogaMeasureMode heightMode) {
      if (!mMeasured) {
        ReactSlider reactSlider = new ReactSlider(getThemedContext(), null, STYLE);
        // reactSlider is used for measurements purposes, it is not necessary to set a
        // StateListAnimator.
        // It is not safe to access StateListAnimator from a background thread.
        reactSlider.disableStateListAnimatorIfNeeded();
        final int spec =
            View.MeasureSpec.makeMeasureSpec(
                ViewGroup.LayoutParams.WRAP_CONTENT, View.MeasureSpec.UNSPECIFIED);
        reactSlider.measure(spec, spec);
        mWidth = reactSlider.getMeasuredWidth();
        mHeight = reactSlider.getMeasuredHeight();
        mMeasured = true;
      }

      return YogaMeasureOutput.make(mWidth, mHeight);
    }
  }

  private static final SeekBar.OnSeekBarChangeListener ON_CHANGE_LISTENER =
      new SeekBar.OnSeekBarChangeListener() {
        @Override
        public void onProgressChanged(SeekBar seekbar, int progress, boolean fromUser) {
          ReactContext reactContext = (ReactContext) seekbar.getContext();
          EventDispatcher eventDispatcher =
              UIManagerHelper.getEventDispatcherForReactTag(reactContext, seekbar.getId());

          if (eventDispatcher != null) {
            eventDispatcher.dispatchEvent(
                new ReactSliderEvent(
                    seekbar.getId(), ((ReactSlider) seekbar).toRealProgress(progress), fromUser));
          }
        }

        @Override
        public void onStartTrackingTouch(SeekBar seekbar) {}

        @Override
        public void onStopTrackingTouch(SeekBar seekbar) {
          ReactContext reactContext = (ReactContext) seekbar.getContext();
          EventDispatcher eventDispatcher =
              UIManagerHelper.getEventDispatcherForReactTag(reactContext, seekbar.getId());

          if (eventDispatcher != null) {
            eventDispatcher.dispatchEvent(
                new ReactSlidingCompleteEvent(
                    UIManagerHelper.getSurfaceId(seekbar),
                    seekbar.getId(),
                    ((ReactSlider) seekbar).toRealProgress(seekbar.getProgress())));
          }
        }
      };

  private final ViewManagerDelegate<ReactSlider> mDelegate;

  public ReactSliderManager() {
    mDelegate = new SliderManagerDelegate<>(this);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public LayoutShadowNode createShadowNodeInstance() {
    return new ReactSliderShadowNode();
  }

  @Override
  public Class getShadowNodeClass() {
    return ReactSliderShadowNode.class;
  }

  @Override
  protected ReactSlider createViewInstance(ThemedReactContext context) {
    final ReactSlider slider = new ReactSlider(context, null, STYLE);
    ReactSliderAccessibilityDelegate.setDelegate(
        slider, slider.isFocusable(), slider.getImportantForAccessibility());
    return slider;
  }

  @Override
  @ReactProp(name = ViewProps.ENABLED, defaultBoolean = true)
  public void setEnabled(ReactSlider view, boolean enabled) {
    view.setEnabled(enabled);
  }

  @Override
  @ReactProp(name = "value", defaultDouble = 0d)
  public void setValue(ReactSlider view, double value) {
    view.setOnSeekBarChangeListener(null);
    view.setValue(value);
    view.setOnSeekBarChangeListener(ON_CHANGE_LISTENER);
  }

  @Override
  @ReactProp(name = "minimumValue", defaultDouble = 0d)
  public void setMinimumValue(ReactSlider view, double value) {
    view.setMinValue(value);
  }

  @Override
  @ReactProp(name = "maximumValue", defaultDouble = 1d)
  public void setMaximumValue(ReactSlider view, double value) {
    view.setMaxValue(value);
  }

  @Override
  @ReactProp(name = "step", defaultDouble = 0d)
  public void setStep(ReactSlider view, double value) {
    view.setStep(value);
  }

  @Override
  @ReactProp(name = "thumbTintColor", customType = "Color")
  public void setThumbTintColor(ReactSlider view, Integer color) {
    if (color == null) {
      view.getThumb().clearColorFilter();
    } else {
      view.getThumb().setColorFilter(color, PorterDuff.Mode.SRC_IN);
    }
  }

  @Override
  @ReactProp(name = "minimumTrackTintColor", customType = "Color")
  public void setMinimumTrackTintColor(ReactSlider view, Integer color) {
    LayerDrawable drawable = (LayerDrawable) view.getProgressDrawable().getCurrent();
    Drawable progress = drawable.findDrawableByLayerId(android.R.id.progress);
    if (color == null) {
      progress.clearColorFilter();
    } else {
      progress.setColorFilter(color, PorterDuff.Mode.SRC_IN);
    }
  }

  @Override
  @ReactProp(name = "maximumTrackTintColor", customType = "Color")
  public void setMaximumTrackTintColor(ReactSlider view, Integer color) {
    LayerDrawable drawable = (LayerDrawable) view.getProgressDrawable().getCurrent();
    Drawable background = drawable.findDrawableByLayerId(android.R.id.background);
    if (color == null) {
      background.clearColorFilter();
    } else {
      background.setColorFilter(color, PorterDuff.Mode.SRC_IN);
    }
  }

  @Override
  @ReactProp(name = "disabled")
  public void setDisabled(ReactSlider view, boolean value) {}

  @Override
  @ReactProp(name = "maximumTrackImage", customType = "ImageSource")
  public void setMaximumTrackImage(ReactSlider view, @Nullable ReadableMap value) {}

  @Override
  @ReactProp(name = "minimumTrackImage", customType = "ImageSource")
  public void setMinimumTrackImage(ReactSlider view, @Nullable ReadableMap value) {}

  @Override
  public void setTestID(ReactSlider view, @Nullable String value) {
    super.setTestId(view, value);
  }

  @Override
  @ReactProp(name = "thumbImage", customType = "ImageSource")
  public void setThumbImage(ReactSlider view, @Nullable ReadableMap value) {}

  @Override
  @ReactProp(name = "trackImage", customType = "ImageSource")
  public void setTrackImage(ReactSlider view, @Nullable ReadableMap value) {}

  @Override
  protected void addEventEmitters(final ThemedReactContext reactContext, final ReactSlider view) {
    view.setOnSeekBarChangeListener(ON_CHANGE_LISTENER);
  }

  @Override
  public Map getExportedCustomDirectEventTypeConstants() {
    @Nullable
    Map<String, Object> baseEventTypeConstants = super.getExportedCustomDirectEventTypeConstants();
    Map<String, Object> eventTypeConstants =
        baseEventTypeConstants == null ? new HashMap<String, Object>() : baseEventTypeConstants;
    eventTypeConstants.putAll(
        MapBuilder.of(
            ReactSlidingCompleteEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onSlidingComplete")));
    return eventTypeConstants;
  }

  @Nullable
  @Override
  public Map<String, Object> getExportedCustomBubblingEventTypeConstants() {
    @Nullable
    Map<String, Object> baseEventTypeConstants =
        super.getExportedCustomBubblingEventTypeConstants();
    Map<String, Object> eventTypeConstants =
        baseEventTypeConstants == null ? new HashMap<String, Object>() : baseEventTypeConstants;
    eventTypeConstants.putAll(
        MapBuilder.<String, Object>builder()
            .put(
                "topValueChange",
                MapBuilder.of(
                    "phasedRegistrationNames",
                    MapBuilder.of("bubbled", "onValueChange", "captured", "onValueChangeCapture")))
            .build());
    return eventTypeConstants;
  }

  @Override
  public long measure(
      Context context,
      ReadableMap localData,
      ReadableMap props,
      ReadableMap state,
      float width,
      YogaMeasureMode widthMode,
      float height,
      YogaMeasureMode heightMode,
      @Nullable float[] attachmentsPositions) {
    SeekBar reactSlider = new ReactSlider(context, null, STYLE);
    final int spec =
        View.MeasureSpec.makeMeasureSpec(
            ViewGroup.LayoutParams.WRAP_CONTENT, View.MeasureSpec.UNSPECIFIED);
    reactSlider.measure(spec, spec);

    return YogaMeasureOutput.make(
        PixelUtil.toDIPFromPixel(reactSlider.getMeasuredWidth()),
        PixelUtil.toDIPFromPixel(reactSlider.getMeasuredHeight()));
  }

  @Override
  protected ViewManagerDelegate<ReactSlider> getDelegate() {
    return mDelegate;
  }

  protected class ReactSliderAccessibilityDelegate extends ReactAccessibilityDelegate {
    public ReactSliderAccessibilityDelegate(
        final View view, boolean originalFocus, int originalImportantForAccessibility) {
      super(view, originalFocus, originalImportantForAccessibility);
    }

    private boolean isSliderAction(int action) {
      return (action == AccessibilityActionCompat.ACTION_SCROLL_FORWARD.getId())
          || (action == AccessibilityActionCompat.ACTION_SCROLL_BACKWARD.getId())
          || (action == AccessibilityActionCompat.ACTION_SET_PROGRESS.getId());
    }

    @Override
    public boolean performAccessibilityAction(View host, int action, Bundle args) {
      if (isSliderAction(action)) {
        ON_CHANGE_LISTENER.onStartTrackingTouch((SeekBar) host);
      }
      final boolean rv = super.performAccessibilityAction(host, action, args);
      if (isSliderAction(action)) {
        ON_CHANGE_LISTENER.onStopTrackingTouch((SeekBar) host);
      }
      return rv;
    }
  };
}
