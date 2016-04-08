/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.share;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

/**
 * Intent module. Launch other activities or open URLs.
 */
public class ShareModule extends ReactContextBaseJavaModule {

  public ShareModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ShareModule";
  }

  /**
   * Open a chooser dialog to send text content to other apps.
   *
   * Refer http://developer.android.com/intl/ko/training/sharing/send.html
   * 
   * @param content the data to send
   * @param title the title of the chooser dialog
   */
  @ReactMethod
  public void shareText(ReadableMap content, String title, Promise promise) {
    if (content == null) {
      promise.reject("Invalid content");
      return;
    }

    try {
      Intent intent = new Intent(Intent.ACTION_SEND);
      intent.setTypeAndNormalize("text/plain");
      
      if (content.hasKey("subject")) {
        intent.putExtra(Intent.EXTRA_SUBJECT, content.getString("subject"));
      }

      if (content.hasKey("message")) {
        intent.putExtra(Intent.EXTRA_TEXT, content.getString("message"));
      } 

      if (content.hasKey("url")) {
        intent.putExtra(Intent.EXTRA_TEXT, content.getString("url")); // this will overwrite message
      }

      //TODO: use createChooser (Intent target, CharSequence title, IntentSender sender) after API level 22 
      Intent chooser = Intent.createChooser(intent, title); 

      Activity currentActivity = getCurrentActivity();
      if (currentActivity != null) {
        currentActivity.startActivity(chooser);
      } else {
        getReactApplicationContext().startActivity(chooser);
      }
      promise.resolve(true);

    } catch (Exception e) {
      promise.reject("Failed to open share dialog");
    }

  }

}