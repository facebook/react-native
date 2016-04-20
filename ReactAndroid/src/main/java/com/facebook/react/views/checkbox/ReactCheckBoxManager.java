/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.checkbox;

import android.support.annotation.Nullable;
import android.view.View;
import android.view.ViewGroup;
import android.widget.CompoundButton;

import com.facebook.csslayout.CSSMeasureMode;
import com.facebook.csslayout.CSSNode;
import com.facebook.csslayout.MeasureOutput;
import com.facebook.react.common.SystemClock;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;

/**
 * View manager for {@link ReactCheckBox} components.
 */
public class ReactCheckBoxManager extends SimpleViewManager<ReactCheckBox> {

  private static final String REACT_CLASS = "AndroidCheckBox";
  private static final String PROP_TEXT = "text";

  static class ShadowNode extends LayoutShadowNode implements CSSNode.MeasureFunction {
    private String mText;
    private boolean mNeedsMeasure = true;
    private int mWidth;
    private int mHeight;

    public ShadowNode() {
      setMeasureFunction(this);
    }

    private boolean isSameString(@Nullable String text) {
      return mText == null ? text == null : mText.equals(text);
    }

    private int buildMeasureSpec(float dimension, CSSMeasureMode mode) {
      switch (mode) {
        case EXACTLY:
          return View.MeasureSpec.makeMeasureSpec(Math.round(dimension),
            View.MeasureSpec.EXACTLY);

        case AT_MOST:
          return View.MeasureSpec.makeMeasureSpec(Math.round(dimension),
            View.MeasureSpec.AT_MOST);

        case UNDEFINED:
        default:
          return View.MeasureSpec.makeMeasureSpec(ViewGroup.LayoutParams.WRAP_CONTENT,
            View.MeasureSpec.UNSPECIFIED);
      }
    }

    @Override
    public void measure(CSSNode node, float width, CSSMeasureMode widthMode, float height,
                        CSSMeasureMode heightMode, MeasureOutput measureOutput) {
      if (mNeedsMeasure) {
        ReactCheckBox checkBox = new ReactCheckBox(getThemedContext());
        checkBox.setText(mText);

        final int widthSpec = buildMeasureSpec(width, widthMode);
        final int heightSpec = buildMeasureSpec(height, heightMode);

        checkBox.measure(widthSpec, heightSpec);
        mWidth = checkBox.getMeasuredWidth();
        mHeight = checkBox.getMeasuredHeight();
      }

      measureOutput.width = mWidth;
      measureOutput.height = mHeight;
    }

    @ReactProp(name = PROP_TEXT)
    public void setText(String text) {
      if (!isSameString(text)) {
        mText = text;
        mNeedsMeasure = true;
        dirty();
      }
    }
  }


  private static final CompoundButton.OnCheckedChangeListener ON_CHECKED_CHANGE_LISTENER =
    new CompoundButton.OnCheckedChangeListener() {
      @Override
      public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
        ReactCheckBox checkBox = (ReactCheckBox) buttonView;
        checkBox.getReactContext().getNativeModule(UIManagerModule.class).getEventDispatcher().dispatchEvent(
          new ReactCheckBoxEvent(
            buttonView.getId(),
            SystemClock.nanoTime(),
            isChecked));
      }
    };

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected ReactCheckBox createViewInstance(ThemedReactContext reactContext) {
    return new ReactCheckBox(reactContext);
  }

  @Override
  public LayoutShadowNode createShadowNodeInstance() {
    return new ShadowNode();
  }

  @Override
  public Class getShadowNodeClass() {
    return ShadowNode.class;
  }

  @ReactProp(name = ViewProps.ENABLED, defaultBoolean = true)
  public void setEnabled(ReactCheckBox view, boolean enabled) {
    view.setEnabled(enabled);
  }

  @ReactProp(name = ViewProps.ON)
  public void setOn(ReactCheckBox view, boolean on) {
    // we set the checked change listener to null and then restore it so that we don't fire an
    // onChange event to JS when JS itself is updating the value of the switch
    view.setOnCheckedChangeListener(null);
    view.setOn(on);
    view.setOnCheckedChangeListener(ON_CHECKED_CHANGE_LISTENER);
  }

  @ReactProp(name = PROP_TEXT)
  public void setText(ReactCheckBox view, @Nullable String text) {
    view.setText(text);
  }

  @Override
  protected void addEventEmitters(final ThemedReactContext reactContext, final ReactCheckBox view) {
    view.setOnCheckedChangeListener(ON_CHECKED_CHANGE_LISTENER);
  }

}

