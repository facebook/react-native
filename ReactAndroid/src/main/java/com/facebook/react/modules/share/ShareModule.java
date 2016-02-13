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

  private Promise mPromise;

  public ShareModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ShareModule";
  }

  /**
   * Open a chooser dialog to send text contents to other apps.
   *
   * Refer http://developer.android.com/intl/ko/training/sharing/send.html
   * 
   * @param contents the data to send
   * @param title the title of the chooser dialog
   */
  @ReactMethod
  public void shareTextContent(ReadableMap contents, String title, final Promise promise) {
    Activity currentActivity = getCurrentActivity();

    if (currentActivity == null) {
      promise.reject("Activity doesn't exist");
      return;
    }

    if (contents == null) {
      throw new JSApplicationIllegalArgumentException("Invalid contents");
    }

    mPromise = promise;

    try {
      Intent intent = new Intent(Intent.ACTION_SEND);
      intent.setTypeAndNormalize("text/plain");
      
      if(contents.hasKey("subject")) {
        intent.putExtra(Intent.EXTRA_SUBJECT, contents.getString("subject"));
      }

      if(contents.hasKey("message")) {
        intent.putExtra(Intent.EXTRA_TEXT, contents.getString("message"));
      } 

      if(contents.hasKey("url")) {
        intent.putExtra(Intent.EXTRA_TEXT, contents.getString("url")); // this will overwrite message
      }

      currentActivity.startActivity(Intent.createChooser(intent, title));
      //TODO: use createChooser (Intent target, CharSequence title, IntentSender sender) after API level 22 
      mPromise.resolve(true);
      mPromise = null;
    } catch (Exception e) {
      mPromise.reject("Failed to open share dialog");
      mPromise = null;
    }
    
  }


}