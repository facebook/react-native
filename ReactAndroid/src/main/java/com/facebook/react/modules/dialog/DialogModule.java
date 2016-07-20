/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.dialog;

import javax.annotation.Nullable;

import java.util.Map;

import android.app.Activity;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.content.DialogInterface.OnDismissListener;
import android.os.Bundle;
import android.support.v4.app.FragmentActivity;

import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;

public class DialogModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

  /* package */ static final String FRAGMENT_TAG =
      "com.facebook.catalyst.react.dialog.DialogModule";

  /* package */ static final String NAME = "DialogManagerAndroid";

  /* package */ static final String ACTION_BUTTON_CLICKED = "buttonClicked";
  /* package */ static final String ACTION_DISMISSED = "dismissed";
  /* package */ static final String KEY_TITLE = "title";
  /* package */ static final String KEY_MESSAGE = "message";
  /* package */ static final String KEY_BUTTON_POSITIVE = "buttonPositive";
  /* package */ static final String KEY_BUTTON_NEGATIVE = "buttonNegative";
  /* package */ static final String KEY_BUTTON_NEUTRAL = "buttonNeutral";
  /* package */ static final String KEY_ITEMS = "items";

  /* package */ static final Map<String, Object> CONSTANTS = MapBuilder.<String, Object>of(
      ACTION_BUTTON_CLICKED, ACTION_BUTTON_CLICKED,
      ACTION_DISMISSED, ACTION_DISMISSED,
      KEY_BUTTON_POSITIVE, DialogInterface.BUTTON_POSITIVE,
      KEY_BUTTON_NEGATIVE, DialogInterface.BUTTON_NEGATIVE,
      KEY_BUTTON_NEUTRAL, DialogInterface.BUTTON_NEUTRAL);

  private boolean mIsInForeground;

  public DialogModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return NAME;
  }

  /**
   * Helper to allow this module to work with both the standard FragmentManager
   * and the Support FragmentManager (for apps that need to use it for legacy reasons).
   * Since the two APIs don't share a common interface there's unfortunately some
   * code duplication.
   */
  private class FragmentManagerHelper {

    // Exactly one of the two is null
    private final @Nullable android.app.FragmentManager mFragmentManager;
    private final @Nullable android.support.v4.app.FragmentManager mSupportFragmentManager;

    private @Nullable Object mFragmentToShow;

    private boolean isUsingSupportLibrary() {
      return mSupportFragmentManager != null;
    }

    public FragmentManagerHelper(android.support.v4.app.FragmentManager supportFragmentManager) {
      mFragmentManager = null;
      mSupportFragmentManager = supportFragmentManager;
    }
    public FragmentManagerHelper(android.app.FragmentManager fragmentManager) {
      mFragmentManager = fragmentManager;
      mSupportFragmentManager = null;
    }

    public void showPendingAlert() {
      if (mFragmentToShow == null) {
        return;
      }
      if (isUsingSupportLibrary()) {
        ((SupportAlertFragment) mFragmentToShow).show(mSupportFragmentManager, FRAGMENT_TAG);
      } else {
        ((AlertFragment) mFragmentToShow).show(mFragmentManager, FRAGMENT_TAG);
      }
      mFragmentToShow = null;
    }

    private void dismissExisting() {
      if (isUsingSupportLibrary()) {
        SupportAlertFragment oldFragment =
            (SupportAlertFragment) mSupportFragmentManager.findFragmentByTag(FRAGMENT_TAG);
        if (oldFragment != null) {
          oldFragment.dismiss();
        }
      } else {
        AlertFragment oldFragment =
            (AlertFragment) mFragmentManager.findFragmentByTag(FRAGMENT_TAG);
        if (oldFragment != null) {
          oldFragment.dismiss();
        }
      }
    }

    public void showNewAlert(boolean isInForeground, Bundle arguments, Callback actionCallback) {
      dismissExisting();

      AlertFragmentListener actionListener =
          actionCallback != null ? new AlertFragmentListener(actionCallback) : null;

      if (isUsingSupportLibrary()) {
        SupportAlertFragment alertFragment = new SupportAlertFragment(actionListener, arguments);
        if (isInForeground) {
          alertFragment.show(mSupportFragmentManager, FRAGMENT_TAG);
        } else {
          mFragmentToShow = alertFragment;
        }
      } else {
        AlertFragment alertFragment = new AlertFragment(actionListener, arguments);
        if (isInForeground) {
          alertFragment.show(mFragmentManager, FRAGMENT_TAG);
        } else {
          mFragmentToShow = alertFragment;
        }
      }
    }
  }

  /* package */ class AlertFragmentListener implements OnClickListener, OnDismissListener {

    private final Callback mCallback;
    private boolean mCallbackConsumed = false;

    public AlertFragmentListener(Callback callback) {
      mCallback = callback;
    }

    @Override
    public void onClick(DialogInterface dialog, int which) {
      if (!mCallbackConsumed) {
        if (getReactApplicationContext().hasActiveCatalystInstance()) {
          mCallback.invoke(ACTION_BUTTON_CLICKED, which);
          mCallbackConsumed = true;
        }
      }
    }

    @Override
    public void onDismiss(DialogInterface dialog) {
      if (!mCallbackConsumed) {
        if (getReactApplicationContext().hasActiveCatalystInstance()) {
          mCallback.invoke(ACTION_DISMISSED);
          mCallbackConsumed = true;
        }
      }
    }
  }

  @Override
  public Map<String, Object> getConstants() {
    return CONSTANTS;
  }

  @Override
  public void initialize() {
    getReactApplicationContext().addLifecycleEventListener(this);
  }

  @Override
  public void onHostPause() {
    // Don't show the dialog if the host is paused.
    mIsInForeground = false;
  }

  @Override
  public void onHostDestroy() {
  }

  @Override
  public void onHostResume() {
    mIsInForeground = true;
    // Check if a dialog has been created while the host was paused, so that we can show it now.
    FragmentManagerHelper fragmentManagerHelper = getFragmentManagerHelper();
    if (fragmentManagerHelper != null) {
      fragmentManagerHelper.showPendingAlert();
    } else {
      FLog.w(DialogModule.class, "onHostResume called but no FragmentManager found");
    }
  }

  @ReactMethod
  public void showAlert(
      ReadableMap options,
      Callback errorCallback,
      Callback actionCallback) {
    FragmentManagerHelper fragmentManagerHelper = getFragmentManagerHelper();
    if (fragmentManagerHelper == null) {
      errorCallback.invoke("Tried to show an alert while not attached to an Activity");
      return;
    }

    final Bundle args = new Bundle();
    if (options.hasKey(KEY_TITLE)) {
      args.putString(AlertFragment.ARG_TITLE, options.getString(KEY_TITLE));
    }
    if (options.hasKey(KEY_MESSAGE)) {
      args.putString(AlertFragment.ARG_MESSAGE, options.getString(KEY_MESSAGE));
    }
    if (options.hasKey(KEY_BUTTON_POSITIVE)) {
      args.putString(AlertFragment.ARG_BUTTON_POSITIVE, options.getString(KEY_BUTTON_POSITIVE));
    }
    if (options.hasKey(KEY_BUTTON_NEGATIVE)) {
      args.putString(AlertFragment.ARG_BUTTON_NEGATIVE, options.getString(KEY_BUTTON_NEGATIVE));
    }
    if (options.hasKey(KEY_BUTTON_NEUTRAL)) {
      args.putString(AlertFragment.ARG_BUTTON_NEUTRAL, options.getString(KEY_BUTTON_NEUTRAL));
    }
    if (options.hasKey(KEY_ITEMS)) {
      ReadableArray items = options.getArray(KEY_ITEMS);
      CharSequence[] itemsArray = new CharSequence[items.size()];
      for (int i = 0; i < items.size(); i ++) {
        itemsArray[i] = items.getString(i);
      }
      args.putCharSequenceArray(AlertFragment.ARG_ITEMS, itemsArray);
    }

    fragmentManagerHelper.showNewAlert(mIsInForeground, args, actionCallback);
  }

  /**
   * Creates a new helper to work with either the FragmentManager or the legacy support
   * FragmentManager transparently. Returns null if we're not attached to an Activity.
   *
   * DO NOT HOLD LONG-LIVED REFERENCES TO THE OBJECT RETURNED BY THIS METHOD, AS THIS WILL CAUSE
   * MEMORY LEAKS.
   */
  private @Nullable FragmentManagerHelper getFragmentManagerHelper() {
    Activity activity = getCurrentActivity();
    if (activity == null) {
      return null;
    }
    if (activity instanceof FragmentActivity) {
      return new FragmentManagerHelper(((FragmentActivity) activity).getSupportFragmentManager());
    } else {
      return new FragmentManagerHelper(activity.getFragmentManager());
    }
  }
}
