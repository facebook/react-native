/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.slider;

import android.content.Context;
import android.graphics.PorterDuff;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.view.View;
import android.view.ViewGroup;
import android.widget.SeekBar;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.ReactShadowNodeImpl;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.yoga.YogaMeasureFunction;
import com.facebook.yoga.YogaMeasureMode;
import com.facebook.yoga.YogaMeasureOutput;
import com.facebook.yoga.YogaNode;
import java.util.Map;

/**
 * Manages instances of {@code ReactSlider}.
 *
 * Note that the slider is _not_ a controlled component.
 */
public class ReactSliderManager extends SimpleViewManager<ReactSlider> {

  private static final int STYLE = android.R.attr.seekBarStyle;

  public static final String REACT_CLASS = "RCTSlider";

  static class ReactSliderShadowNode extends LayoutShadowNode implements
      YogaMeasureFunction {

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
        SeekBar reactSlider = new ReactSlider(getThemedContext(), null, STYLE);
        final int spec = View.MeasureSpec.makeMeasureSpec(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            View.MeasureSpec.UNSPECIFIED);
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
          reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher().dispatchEvent(
              new ReactSliderEvent(
                  seekbar.getId(),
                  ((ReactSlider) seekbar).toRealProgress(progress),
                  fromUser));
        }

        @Override
        public void onStartTrackingTouch(SeekBar seekbar) {
        }

        @Override
        public void onStopTrackingTouch(SeekBar seekbar) {
          ReactContext reactContext = (ReactContext) seekbar.getContext();
          reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher().dispatchEvent(
              new ReactSlidingCompleteEvent(
                  seekbar.getId(),
                  ((ReactSlider) seekbar).toRealProgress(seekbar.getProgress())));
        }
      };

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
    return new ReactSlider(context, null, STYLE);
  }

  @ReactProp(name = ViewProps.ENABLED, defaultBoolean = true)
  public void setEnabled(ReactSlider view, boolean enabled) {
    view.setEnabled(enabled);
  }

  @ReactProp(name = "value", defaultDouble = 0d)
  public void setValue(ReactSlider view, double value) {
    view.setOnSeekBarChangeListener(null);
    view.setValue(value);
    view.setOnSeekBarChangeListener(ON_CHANGE_LISTENER);
  }

  @ReactProp(name = "minimumValue", defaultDouble = 0d)
  public void setMinimumValue(ReactSlider view, double value) {
    view.setMinValue(value);
  }

  @ReactProp(name = "maximumValue", defaultDouble = 1d)
  public void setMaximumValue(ReactSlider view, double value) {
    view.setMaxValue(value);
  }

  @ReactProp(name = "step", defaultDouble = 0d)
  public void setStep(ReactSlider view, double value) {
    view.setStep(value);
  }

  @ReactProp(name = "thumbTintColor", customType = "Color")
  public void setThumbTintColor(ReactSlider view, Integer color) {
    if (color == null) {
      view.getThumb().clearColorFilter();
    } else {
      view.getThumb().setColorFilter(color, PorterDuff.Mode.SRC_IN);
    }
  }

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
  protected void addEventEmitters(final ThemedReactContext reactContext, final ReactSlider view) {
    view.setOnSeekBarChangeListener(ON_CHANGE_LISTENER);
  }

  @Override
  public Map getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.of(
        ReactSlidingCompleteEvent.EVENT_NAME,
        MapBuilder.of("registrationName", "onSlidingComplete"));
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
    YogaMeasureMode heightMode) {
      SeekBar reactSlider = new ReactSlider(context, null, STYLE);
      final int spec = View.MeasureSpec.makeMeasureSpec(
        ViewGroup.LayoutParams.WRAP_CONTENT,
        View.MeasureSpec.UNSPECIFIED);
      reactSlider.measure(spec, spec);

      return YogaMeasureOutput.make(reactSlider.getMeasuredWidth(), reactSlider.getMeasuredHeight());
    }
  }
