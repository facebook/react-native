/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.share;

import java.util.List;
import java.util.ArrayList;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.DialogFragment;
import android.app.FragmentManager;
import android.content.ComponentName;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.content.DialogInterface.OnDismissListener;
import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.widget.ArrayAdapter;
import android.os.Bundle;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.annotations.VisibleForTesting;

/**
 * Intent module. Launch other activities or open URLs.
 */
public class ShareModule extends ReactContextBaseJavaModule {

  @VisibleForTesting
  public static final String FRAGMENT_TAG = "ShareAndroid";

  /* package */ static final String ACTION_SHARED = "sharedAction";
  /* package */ static final String ACTION_DISMISSED = "dismissedAction";

  static final String ERROR_NO_ACTIVITY = "E_NO_ACTIVITY";
  static final String ERROR_INVALID_CONTENT = "E_INVALID_CONTENT";
  static final String ERROR_UNABLE_TO_OPEN_DIALOG = "E_UNABLE_TO_OPEN_DIALOG";
  static final String ERROR_NO_PACKAGE_TO_SHARE = "E_NO_PACKAGE_TO_SHARE";

  private ReactApplicationContext mContext;

  public ShareModule(ReactApplicationContext reactContext) {
    super(reactContext);
    mContext = reactContext;
  }

  @Override
  public String getName() {
    return "ShareModule";
  }

  interface OnClickItemListener {
    void onClick(DialogInterface dialog, String packageName);
  }

  /* package */ class ShareDialogListener implements OnClickItemListener, OnDismissListener {

    private final Promise mPromise;
    private boolean mPromiseResolved = false;

    public ShareDialogListener(Promise promise) {
      mPromise = promise;
    }

    @Override
    public void onClick(DialogInterface dialog, String packageName) {
      if (!mPromiseResolved && getReactApplicationContext().hasActiveCatalystInstance()) {
        WritableMap result = new WritableNativeMap();
        result.putString("action", ACTION_SHARED);
        result.putString("packageName", packageName);
        mPromise.resolve(result);
        mPromiseResolved = true;
      }
    }

    @Override
    public void onDismiss(DialogInterface dialog) {
      if (!mPromiseResolved && getReactApplicationContext().hasActiveCatalystInstance()) {
        WritableMap result = new WritableNativeMap();
        result.putString("action", ACTION_DISMISSED);
        mPromise.resolve(result);
        mPromiseResolved = true;
      }
    }
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
      intent.addCategory(Intent.CATEGORY_DEFAULT);
      
      if (content.hasKey("title")) {
        intent.putExtra(Intent.EXTRA_SUBJECT, content.getString("title"));
      }

      if (content.hasKey("message")) {
        intent.putExtra(Intent.EXTRA_TEXT, content.getString("message"));
      } 

      if (content.hasKey("url")) {
        intent.putExtra(Intent.EXTRA_TEXT, content.getString("url")); // this will overwrite message
      }

      Activity activity = getCurrentActivity();
      if (activity == null) {
        promise.reject(
            ERROR_NO_ACTIVITY,
            "Tried to open a Share dialog while not attached to an Activity");
        return;
      }
      
      // We want to support both android.app.Activity and the pre-Honeycomb FragmentActivity
      // (for apps that use it for legacy reasons). This unfortunately leads to some code duplication.
      if (activity instanceof android.support.v4.app.FragmentActivity) {
        android.support.v4.app.FragmentManager fragmentManager =
            ((android.support.v4.app.FragmentActivity) activity).getSupportFragmentManager();
        android.support.v4.app.DialogFragment oldFragment =
            (android.support.v4.app.DialogFragment)fragmentManager.findFragmentByTag(FRAGMENT_TAG);
        if (oldFragment != null) {
          oldFragment.dismiss();
        }

        SupportShareDialogFragment fragment = new SupportShareDialogFragment(intent);

        final Bundle args = new Bundle();
        args.putString(ShareDialogFragment.ARG_TITLE, dialogTitle);
        fragment.setArguments(args);

        ShareDialogListener listener = new ShareDialogListener(promise);
        fragment.setListener(listener);
        fragment.show(fragmentManager, FRAGMENT_TAG);
      } else {
        FragmentManager fragmentManager = activity.getFragmentManager();
        DialogFragment oldFragment = (DialogFragment) fragmentManager.findFragmentByTag(FRAGMENT_TAG);
        if (oldFragment != null) {
          oldFragment.dismiss();
        }

        ShareDialogFragment fragment = new ShareDialogFragment(intent);

        final Bundle args = new Bundle();
        args.putString(ShareDialogFragment.ARG_TITLE, dialogTitle);
        fragment.setArguments(args);
        
        ShareDialogListener listener = new ShareDialogListener(promise);
        fragment.setListener(listener);
        fragment.show(fragmentManager, FRAGMENT_TAG);
      }

    } catch (Exception e) {
      FLog.e(ReactConstants.TAG, "Failed to open share dialog", e);
      promise.reject(ERROR_UNABLE_TO_OPEN_DIALOG, "Failed to open share dialog");
    }

  }

}