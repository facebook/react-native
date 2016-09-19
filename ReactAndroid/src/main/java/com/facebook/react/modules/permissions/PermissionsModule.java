/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.permissions;

import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Process;
import android.util.SparseArray;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;

/**
 * Module that exposes the Android M Permission system to JS.
 */
@ReactModule(name = "PermissionsAndroid")
public class PermissionsModule extends ReactContextBaseJavaModule implements PermissionListener {

  private final SparseArray<Callback> mCallbacks;
  private int mRequestCode = 0;

  public PermissionsModule(ReactApplicationContext reactContext) {
    super(reactContext);
    mCallbacks = new SparseArray<Callback>();
  }

  @Override
  public String getName() {
    return "PermissionsAndroid";
  }

  /**
   * Check if the app has the permission given. successCallback is called with true if the
   * permission had been granted, false otherwise. See {@link Activity#checkSelfPermission}.
   */
  @ReactMethod
  public void checkPermission(final String permission, final Promise promise) {
    PermissionAwareActivity activity = getPermissionAwareActivity();
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      promise.resolve(activity.checkPermission(permission, Process.myPid(), Process.myUid()) ==
        PackageManager.PERMISSION_GRANTED);
      return;
    }
    promise.resolve(activity.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED);
  }

  /**
   * Check whether the app should display a message explaining why a certain permission is needed.
   * successCallback is called with true if the app should display a message, false otherwise.
   * This message is only displayed if the user has revoked this permission once before, and if the
   * permission dialog will be shown to the user (the user can choose to not be shown that dialog
   * again). For devices before Android M, this always returns false.
   * See {@link Activity#shouldShowRequestPermissionRationale}.
   */
  @ReactMethod
  public void shouldShowRequestPermissionRationale(final String permission, final Promise promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      promise.resolve(false);
      return;
    }
    promise.resolve(getPermissionAwareActivity().shouldShowRequestPermissionRationale(permission));
  }

  /**
   * Request the given permission. successCallback is called with true if the permission had been
   * granted, false otherwise. For devices before Android M, this instead checks if the user has
   * the permission given or not.
   * See {@link Activity#checkSelfPermission}.
   */
  @ReactMethod
  public void requestPermission(final String permission, final Promise promise) {
    PermissionAwareActivity activity = getPermissionAwareActivity();
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      promise.resolve(activity.checkPermission(permission, Process.myPid(), Process.myUid()) ==
              PackageManager.PERMISSION_GRANTED);
      return;
    }
    if (activity.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED) {
      promise.resolve(true);
      return;
    }

    mCallbacks.put(
        mRequestCode, new Callback() {
          @Override
          public void invoke(Object... args) {
            promise.resolve(args[0].equals(PackageManager.PERMISSION_GRANTED));
          }
        });

    activity.requestPermissions(new String[]{permission}, mRequestCode, this);
    mRequestCode++;
  }

  /**
   * Method called by the activity with the result of the permission request.
   */
  @Override
  public boolean onRequestPermissionsResult(
      int requestCode,
      String[] permissions,
      int[] grantResults) {
    mCallbacks.get(requestCode).invoke(grantResults[0]);
    mCallbacks.remove(requestCode);
    return mCallbacks.size() == 0;
  }

  private PermissionAwareActivity getPermissionAwareActivity() {
    Activity activity = getCurrentActivity();
    if (activity == null) {
      throw new IllegalStateException("Tried to use permissions API while not attached to an " +
          "Activity.");
    } else if (!(activity instanceof PermissionAwareActivity)) {
      throw new IllegalStateException("Tried to use permissions API but the host Activity doesn't" +
          " implement PermissionAwareActivity.");
    }
    return (PermissionAwareActivity) activity;
  }
}
