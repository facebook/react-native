/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.clipboard;

import android.annotation.SuppressLint;
import android.content.ClipboardManager;
import android.content.ClipData;
import android.os.Build;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.RCTNativeAppEventEmitter;


/**
 * A module that allows JS to get/set clipboard contents.
 */
@ReactModule(name = "Clipboard")
public class ClipboardModule extends ReactContextBaseJavaModule implements ClipboardManager.OnPrimaryClipChangedListener {

  RCTNativeAppEventEmitter eventEmitter;

  public ClipboardModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "Clipboard";
  }

  private ClipboardManager getClipboardService() {
    return (ClipboardManager) getReactApplicationContext().getSystemService(getReactApplicationContext().CLIPBOARD_SERVICE);
  }

  @Override
  public void initialize() {
    getClipboardService().addPrimaryClipChangedListener(this);
  }

  @Override
  public void onPrimaryClipChanged() {
    getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("clipboardChanged", null);
  }

  @ReactMethod
  public void getString(Promise promise) {
    try {
      ClipboardManager clipboard = getClipboardService();
      ClipData clipData = clipboard.getPrimaryClip();
      if (clipData == null) {
        promise.resolve("");
      } else if (clipData.getItemCount() >= 1) {
        ClipData.Item firstItem = clipboard.getPrimaryClip().getItemAt(0);
        promise.resolve("" + firstItem.getText());
      } else {
        promise.resolve("");
      }
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @SuppressLint("DeprecatedMethod")
  @ReactMethod
  public void setString(String text) {
    ReactApplicationContext reactContext = getReactApplicationContext();
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB) {
      ClipData clipdata = ClipData.newPlainText(null, text);
      ClipboardManager clipboard = getClipboardService();
      clipboard.setPrimaryClip(clipdata);
    } else {
      ClipboardManager clipboard = getClipboardService();
      clipboard.setText(text);
    }
  }

}
