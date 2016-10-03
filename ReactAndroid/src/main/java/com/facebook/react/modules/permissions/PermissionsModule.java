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
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;

import java.util.ArrayList;

/**
 * Module that exposes the Android M Permission system to JS.
 */
@ReactModule(name = "PermissionsAndroid")
public class PermissionsModule extends ReactContextBaseJavaModule implements PermissionListener {

  private final SparseArray<Callback> mCallbacks;
  private int mRequestCode = 0;
  private final String PERMISSION_GRANTED = "PERMISSION_GRANTED";
  private final String PERMISSION_DENIED = "PERMISSION_DENIED";
  private final String PERMISSION_NEVER_ASK_AGAIN = "PERMISSION_NEVER_ASK_AGAIN";

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
      promise.resolve(activity.checkPermission(permission, Process.myPid(), Process.myUid()) == PackageManager.PERMISSION_GRANTED);
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
        PackageManager.PERMISSION_GRANTED ? PERMISSION_GRANTED : PERMISSION_DENIED);
      return;
    }
    if (activity.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED) {
      promise.resolve(PERMISSION_GRANTED);
      return;
    }

    mCallbacks.put(
      mRequestCode, new Callback() {
        @Override
        public void invoke(Object... args) {
          int[] results = (int[]) args[0];
          if (results[0] == PackageManager.PERMISSION_GRANTED) {
            promise.resolve(PERMISSION_GRANTED);
          } else {
            PermissionAwareActivity activity = (PermissionAwareActivity) args[1];
            if (activity.shouldShowRequestPermissionRationale(permission)) {
              promise.resolve(PERMISSION_DENIED);
            } else {
              promise.resolve(PERMISSION_NEVER_ASK_AGAIN);
            }
          }
        }
      });

    activity.requestPermissions(new String[]{permission}, mRequestCode, this);
    mRequestCode++;
  }

  @ReactMethod
  public void requestMultiplePermissions(final ReadableArray permissions, final Promise promise) {
    PermissionAwareActivity activity = getPermissionAwareActivity();
    final WritableMap grantedPermissions = new WritableNativeMap();
    final ArrayList<String> permissionsToCheck = new ArrayList<String>();
    int checkedPermissionsCount = 0;

    for (int i = 0; i < permissions.size(); i++) {
      String perm = permissions.getString(i);

      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
        grantedPermissions.putString(perm, activity.checkPermission(perm, Process.myPid(), Process.myUid()) ==
        PackageManager.PERMISSION_GRANTED ? PERMISSION_GRANTED : PERMISSION_DENIED);
        checkedPermissionsCount++;
      } else if (activity.checkSelfPermission(perm) == PackageManager.PERMISSION_GRANTED) {
        grantedPermissions.putString(perm, PERMISSION_GRANTED);
        checkedPermissionsCount++;
      } else {
        permissionsToCheck.add(perm);
      }
    }
    if (permissions.size() == checkedPermissionsCount) {
      promise.resolve(grantedPermissions);
      return;
    }


    mCallbacks.put(
    mRequestCode, new Callback() {
      @Override
      public void invoke(Object... args) {
        int[] results = (int[]) args[0];
        PermissionAwareActivity activity = (PermissionAwareActivity) args[1];
        for (int j = 0; j < permissionsToCheck.size(); j++) {
          String permission = permissionsToCheck.get(j);
          if (results[j] == PackageManager.PERMISSION_GRANTED) {
            grantedPermissions.putString(permission, PERMISSION_GRANTED);
          } else {
            if (activity.shouldShowRequestPermissionRationale(permission)) {
              grantedPermissions.putString(permission, PERMISSION_DENIED);
            } else {
              grantedPermissions.putString(permission, PERMISSION_NEVER_ASK_AGAIN);
            }
          }
        }
        promise.resolve(grantedPermissions);
      }
    });

    activity.requestPermissions(permissionsToCheck.toArray(new String[0]), mRequestCode, this);
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
      mCallbacks.get(requestCode).invoke(grantResults, getPermissionAwareActivity());
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
