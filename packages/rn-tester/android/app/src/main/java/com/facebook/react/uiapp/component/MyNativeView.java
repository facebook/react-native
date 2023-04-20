/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp.component;

import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.view.View;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;

class MyNativeView extends View {

  private int currentColor = 0;
  private GradientDrawable background;

  public MyNativeView(Context context) {
    super(context);
    background = new GradientDrawable();
  }

  @Override
  public void setBackgroundColor(int color) {
    if (color != currentColor) {
      background.setColor(color);
      currentColor = color;
      emitNativeEvent(color);
      setBackground(background);
    }
  }

  public void setCornerRadius(float cornerRadius) {
    background.setCornerRadius(cornerRadius);
    setBackground(background);
  }

  private void emitNativeEvent(int color) {
    WritableMap event = Arguments.createMap();
    WritableMap backgroundColor = Arguments.createMap();
    float[] hsv = new float[3];
    Color.colorToHSV(color, hsv);
    backgroundColor.putDouble("hue", hsv[0]);
    backgroundColor.putDouble("saturation", hsv[1]);
    backgroundColor.putDouble("brightness", hsv[2]);
    backgroundColor.putDouble("alpha", Color.alpha(color));
    event.putMap("backgroundColor", backgroundColor);
    ReactContext reactContext = (ReactContext) getContext();
    reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), "onColorChanged", event);
  }
}
