/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.intent;

import android.content.Intent;
import android.net.Uri;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;

/**
 * Intent module. Launch other activities or open URLs.
 */
public class IntentModule extends ReactContextBaseJavaModule {

  public IntentModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "IntentAndroid";
  }

  /**
   * Starts a corresponding external activity for the given URL.
   *
   * For example, if the URL is "https://www.facebook.com", the system browser will be opened,
   * or the "choose application" dialog will be shown.
   *
   * @param URL the URL to open
   */
  @ReactMethod
  public void openURL(String url) {
    if (url == null || url.isEmpty()) {
      throw new JSApplicationIllegalArgumentException("Invalid URL: " + url);
    }
    try {
      Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
      // We need Intent.FLAG_ACTIVITY_NEW_TASK since getReactApplicationContext() returns
      // the ApplicationContext instead of the Activity context.
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      getReactApplicationContext().startActivity(intent);
    } catch (Exception e) {
      throw new JSApplicationIllegalArgumentException(
          "Could not open URL '" + url + "': " + e.getMessage());
    }
  }

  /**
   * Determine whether or not an installed app can handle a given URL.
   *
   * @param URL the URL to open
   * @param promise a promise that is always resolved with a boolean argument
   */
  @ReactMethod
  public void canOpenURL(String url, Callback callback) {
    if (url == null || url.isEmpty()) {
      throw new JSApplicationIllegalArgumentException("Invalid URL: " + url);
    }
    try {
      Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
      // We need Intent.FLAG_ACTIVITY_NEW_TASK since getReactApplicationContext() returns
      // the ApplicationContext instead of the Activity context.
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      boolean canOpen =
          intent.resolveActivity(this.getReactApplicationContext().getPackageManager()) != null;
      callback.invoke(canOpen);
    } catch (Exception e) {
      throw new JSApplicationIllegalArgumentException(
          "Could not check if URL '" + url + "' can be opened: " + e.getMessage());
    }
  }
}
