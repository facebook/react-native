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
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import java.util.List;

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

  void emitOnArrayChangedEvent(List<Integer> ints) {
    WritableMap payload = Arguments.createMap();

    WritableArray newIntArray = Arguments.createArray();
    WritableArray newBoolArray = Arguments.createArray();
    WritableArray newFloatArray = Arguments.createArray();
    WritableArray newDoubleArray = Arguments.createArray();
    WritableArray newYesNoArray = Arguments.createArray();
    WritableArray newStringArray = Arguments.createArray();
    WritableArray newObjectArray = Arguments.createArray();
    WritableArray newArrayArray = Arguments.createArray();

    for (Integer i : ints) {
      newIntArray.pushInt(i * 2);
      newBoolArray.pushBoolean(i % 2 == 1);
      newFloatArray.pushDouble(i * 3.14);
      newDoubleArray.pushDouble(i / 3.14);
      newYesNoArray.pushString(i % 2 == 1 ? "yep" : "nope");
      newStringArray.pushString(i.toString());

      WritableMap latLon = Arguments.createMap();
      latLon.putDouble("lat", -1.0 * i);
      latLon.putDouble("lon", 2.0 * i);
      newObjectArray.pushMap(latLon);

      WritableArray innerArray = Arguments.createArray();
      innerArray.pushInt(i);
      innerArray.pushInt(i);
      innerArray.pushInt(i);
      newArrayArray.pushArray(innerArray);
    }

    payload.putArray("values", newIntArray);
    payload.putArray("boolValues", newBoolArray);
    payload.putArray("floats", newFloatArray);
    payload.putArray("doubles", newDoubleArray);
    payload.putArray("yesNos", newYesNoArray);
    payload.putArray("strings", newStringArray);
    payload.putArray("latLons", newObjectArray);
    payload.putArray("multiArrays", newArrayArray);

    ReactContext reactContext = (ReactContext) getContext();
    int surfaceId = UIManagerHelper.getSurfaceId(reactContext);
    EventDispatcher eventDispatcher =
        UIManagerHelper.getEventDispatcherForReactTag(reactContext, getId());
    Event event = new OnIntArrayChangedEvent(surfaceId, getId(), payload);

    if (eventDispatcher != null) {
      eventDispatcher.dispatchEvent(event);
    }
  }

  class OnIntArrayChangedEvent extends Event {
    private WritableMap mPayload;

    public OnIntArrayChangedEvent(int surfaceId, int viewId, WritableMap payload) {
      super(surfaceId, viewId);
      this.mPayload = payload;
    }

    @Override
    public String getEventName() {
      return "onIntArrayChanged";
    }

    @Override
    protected WritableMap getEventData() {
      return mPayload;
    }
  }
}
