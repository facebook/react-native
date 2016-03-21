/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.toast;

import android.widget.Toast;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.common.ReactConstants;

import java.util.HashMap;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

/**
 * {@link NativeModule} that allows JS to show an Android Toast.
 */
public class ToastModule extends ReactContextBaseJavaModule {

  private Map<Integer, Toast> mToasts = new HashMap<>();

  private static final String DURATION_SHORT_KEY = "SHORT";
  private static final String DURATION_LONG_KEY = "LONG";

  // https://android.googlesource.com/platform/frameworks/base/+/master/services/core/java/com/android/server/notification/NotificationManagerService.java#160
  private static final int SHORT_DELAY = 2000;
  private static final int LONG_DELAY = 3500;

  public ToastModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ToastAndroid";
  }

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = MapBuilder.newHashMap();
    constants.put(DURATION_SHORT_KEY, Toast.LENGTH_SHORT);
    constants.put(DURATION_LONG_KEY, Toast.LENGTH_LONG);
    return constants;
  }

  @ReactMethod
  public void show(String message, int duration, final int id) {
    Toast toast = Toast.makeText(getReactApplicationContext(), message, duration);
    toast.show();
    mToasts.put(id, toast);
    new Timer().schedule(new TimerTask() {
      @Override
      public void run() {
        if (mToasts.containsKey(id)) {
          mToasts.remove(id);
        }
      }
    }, duration == Toast.LENGTH_SHORT ? SHORT_DELAY : LONG_DELAY);
  }

  @ReactMethod
  public void dismiss(int id) {
    Toast toast = mToasts.get(id);
    if (toast == null) {
      FLog.w(
        ReactConstants.TAG,
        "Cannot dismiss Toast. Unknown Toast id " + id);
      return;
    }
    toast.cancel();
    mToasts.remove(id);
  }
}
