/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.dialog;

import android.app.Activity;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.content.DialogInterface.OnDismissListener;
import android.os.Bundle;
import androidx.fragment.app.FragmentActivity;
import androidx.fragment.app.FragmentManager;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.SoftAssertions;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import java.util.Map;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

@ReactModule(name = DialogModule.NAME)
public class DialogModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

  /* package */ static final String FRAGMENT_TAG =
      "com.facebook.catalyst.react.dialog.DialogModule";

  public static final String NAME = "DialogManagerAndroid";

  /* package */ static final String ACTION_BUTTON_CLICKED = "buttonClicked";
  /* package */ static final String ACTION_DISMISSED = "dismissed";
  /* package */ static final String KEY_TITLE = "title";
  /* package */ static final String KEY_MESSAGE = "message";
  /* package */ static final String KEY_BUTTON_POSITIVE = "buttonPositive";
  /* package */ static final String KEY_BUTTON_NEGATIVE = "buttonNegative";
  /* package */ static final String KEY_BUTTON_NEUTRAL = "buttonNeutral";
  /* package */ static final String KEY_ITEMS = "items";
  /* package */ static final String KEY_CANCELABLE = "cancelable";

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
  public @Nonnull String getName() {
    return NAME;
  }

  private class FragmentManagerHelper {
    private final @Nonnull FragmentManager mFragmentManager;

    private @Nullable Object mFragmentToShow;

    public FragmentManagerHelper(@Nonnull FragmentManager fragmentManager) {
      mFragmentManager = fragmentManager;
    }

    public void showPendingAlert() {
      UiThreadUtil.assertOnUiThread();
      SoftAssertions.assertCondition(mIsInForeground, "showPendingAlert() called in background");
      if (mFragmentToShow == null) {
        return;
      }

      dismissExisting();
      ((AlertFragment) mFragmentToShow).show(mFragmentManager, FRAGMENT_TAG);
      mFragmentToShow = null;
    }

    private void dismissExisting() {
      if (!mIsInForeground) {
        return;
      }
      AlertFragment oldFragment =
        (AlertFragment) mFragmentManager.findFragmentByTag(FRAGMENT_TAG);
      if (oldFragment != null && oldFragment.isResumed()) {
        oldFragment.dismiss();
      }
    }

    public void showNewAlert(Bundle arguments, Callback actionCallback) {
      UiThreadUtil.assertOnUiThread();

      dismissExisting();

      AlertFragmentListener actionListener =
          actionCallback != null ? new AlertFragmentListener(actionCallback) : null;

      AlertFragment alertFragment = new AlertFragment(actionListener, arguments);
      if (mIsInForeground && !mFragmentManager.isStateSaved()) {
        if (arguments.containsKey(KEY_CANCELABLE)) {
          alertFragment.setCancelable(arguments.getBoolean(KEY_CANCELABLE));
        }
        alertFragment.show(mFragmentManager, FRAGMENT_TAG);
      } else {
        mFragmentToShow = alertFragment;
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
      final Callback actionCallback) {
    final FragmentManagerHelper fragmentManagerHelper = getFragmentManagerHelper();
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
    if (options.hasKey(KEY_CANCELABLE)) {
      args.putBoolean(KEY_CANCELABLE, options.getBoolean(KEY_CANCELABLE));
    }

    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        fragmentManagerHelper.showNewAlert(args, actionCallback);
      }
    });

  }

  /**
   * Creates a new helper to work with FragmentManager.
   * Returns null if we're not attached to an Activity.
   *
   * DO NOT HOLD LONG-LIVED REFERENCES TO THE OBJECT RETURNED BY THIS METHOD, AS THIS WILL CAUSE
   * MEMORY LEAKS.
   */
  private @Nullable FragmentManagerHelper getFragmentManagerHelper() {
    Activity activity = getCurrentActivity();
    if (activity == null) {
      return null;
    }
    return new FragmentManagerHelper(((FragmentActivity) activity).getSupportFragmentManager());
  }
}
