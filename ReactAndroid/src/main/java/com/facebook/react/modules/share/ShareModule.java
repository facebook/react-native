/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.share;

import android.app.Activity;
import android.content.Intent;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;

/**
 * Intent module. Launch other activities or open URLs.
 */
@ReactModule(name = "ShareModule")
public class ShareModule extends ReactContextBaseJavaModule {

  /* package */ static final String ACTION_SHARED = "sharedAction";
  /* package */ static final String ERROR_INVALID_CONTENT = "E_INVALID_CONTENT";
  /* package */ static final String ERROR_UNABLE_TO_OPEN_DIALOG = "E_UNABLE_TO_OPEN_DIALOG";

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
   * @param dialogTitle the title of the chooser dialog
   */
  @ReactMethod
  public void share(ReadableMap content, String dialogTitle, Promise promise) {
    if (content == null) {
      promise.reject(ERROR_INVALID_CONTENT, "Content cannot be null");
      return;
    }

    try {
      Intent intent = new Intent(Intent.ACTION_SEND);
      intent.setTypeAndNormalize("text/plain");

      if (content.hasKey("title")) {
        intent.putExtra(Intent.EXTRA_SUBJECT, content.getString("title"));
      }

      if (content.hasKey("message")) {
        intent.putExtra(Intent.EXTRA_TEXT, content.getString("message"));
      }

      Intent chooser = Intent.createChooser(intent, dialogTitle);
      chooser.addCategory(Intent.CATEGORY_DEFAULT);

      Activity currentActivity = getCurrentActivity();
      if (currentActivity != null) {
        currentActivity.startActivity(chooser);
      } else {
        getReactApplicationContext().startActivity(chooser);
      }
      WritableMap result = Arguments.createMap();
      result.putString("action", ACTION_SHARED);
      promise.resolve(result);
    } catch (Exception e) {
      promise.reject(ERROR_UNABLE_TO_OPEN_DIALOG, "Failed to open share dialog");
    }
  }
}
