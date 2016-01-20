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

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.common.ReactConstants;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * A module that allows JS to get/set clipboard contents.
 */
public class ClipboardModule extends ReactContextBaseJavaModule {

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

  private String getStringInternal(){
    ClipboardManager clipboard = getClipboardService();
    ClipData clipData = clipboard.getPrimaryClip();
    if (clipData == null) {
      return "";
    }
    if (clipData.getItemCount() >= 1) {
      ClipData.Item firstItem = clipboard.getPrimaryClip().getItemAt(0);
      return "" + firstItem.getText();
    } else {
      return "";
    }
  }

  @ReactMethod
  public void getString(Promise promise){
    try {
      String ret = this.getStringInternal();
      promise.resolve(ret);
    } catch(Exception e) {
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
