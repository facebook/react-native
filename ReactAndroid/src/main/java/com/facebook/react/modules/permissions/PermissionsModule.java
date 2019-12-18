/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.permissions;

import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Process;
import android.util.SparseArray;
import com.facebook.fbreact.specs.NativePermissionsAndroidSpec;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;
import java.util.ArrayList;

/** Module that exposes the Android M Permission system to JS. */
@ReactModule(name = PermissionsModule.NAME)
public class PermissionsModule extends NativePermissionsAndroidSpec implements PermissionListener {

  private static final String ERROR_INVALID_ACTIVITY = "E_INVALID_ACTIVITY";
  public static final String NAME = "PermissionsAndroid";
  private final SparseArray<Callback> mCallbacks;
  private int mRequestCode = 0;
  private final String GRANTED = "granted";
  private final String DENIED = "denied";
  private final String NEVER_ASK_AGAIN = "never_ask_again";

  public PermissionsModule(ReactApplicationContext reactContext) {
    super(reactContext);
    mCallbacks = new SparseArray<Callback>();
  }

  @Override
  public String getName() {
    return NAME;
  }

  /**
   * Check if the app has the permission given. successCallback is called with true if the
   * permission had been granted, false otherwise. See {@link Activity#checkSelfPermission}.
   */
  @Override
  public void checkPermission(final String permission, final Promise promise) {
    Context context = getReactApplicationContext().getBaseContext();
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      promise.resolve(
          context.checkPermission(permission, Process.myPid(), Process.myUid())
              == PackageManager.PERMISSION_GRANTED);
      return;
    }
    promise.resolve(context.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED);
  }

  /**
   * Check whether the app should display a message explaining why a certain permission is needed.
   * successCallback is called with true if the app should display a message, false otherwise. This
   * message is only displayed if the user has revoked this permission once before, and if the
   * permission dialog will be shown to the user (the user can choose to not be shown that dialog
   * again). For devices before Android M, this always returns false. See {@link
   * Activity#shouldShowRequestPermissionRationale}.
   */
  @Override
  public void shouldShowRequestPermissionRationale(final String permission, final Promise promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      promise.resolve(false);
      return;
    }
    try {
      promise.resolve(
          getPermissionAwareActivity().shouldShowRequestPermissionRationale(permission));
    } catch (IllegalStateException e) {
      promise.reject(ERROR_INVALID_ACTIVITY, e);
    }
  }

  /**
   * Request the given permission. successCallback is called with GRANTED if the permission had been
   * granted, DENIED or NEVER_ASK_AGAIN otherwise. For devices before Android M, this checks if the
   * user has the permission given or not and resolves with GRANTED or DENIED. See {@link
   * Activity#checkSelfPermission}.
   */
  @Override
  public void requestPermission(final String permission, final Promise promise) {
    Context context = getReactApplicationContext().getBaseContext();
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      promise.resolve(
          context.checkPermission(permission, Process.myPid(), Process.myUid())
                  == PackageManager.PERMISSION_GRANTED
              ? GRANTED
              : DENIED);
      return;
    }
    if (context.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED) {
      promise.resolve(GRANTED);
      return;
    }

    try {
      PermissionAwareActivity activity = getPermissionAwareActivity();

      mCallbacks.put(
          mRequestCode,
          new Callback() {
            @Override
            public void invoke(Object... args) {
              int[] results = (int[]) args[0];
              if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) {
                promise.resolve(GRANTED);
              } else {
                PermissionAwareActivity activity = (PermissionAwareActivity) args[1];
                if (activity.shouldShowRequestPermissionRationale(permission)) {
                  promise.resolve(DENIED);
                } else {
                  promise.resolve(NEVER_ASK_AGAIN);
                }
              }
            }
          });

      activity.requestPermissions(new String[] {permission}, mRequestCode, this);
      mRequestCode++;
    } catch (IllegalStateException e) {
      promise.reject(ERROR_INVALID_ACTIVITY, e);
    }
  }

  @Override
  public void requestMultiplePermissions(final ReadableArray permissions, final Promise promise) {
    final WritableMap grantedPermissions = new WritableNativeMap();
    final ArrayList<String> permissionsToCheck = new ArrayList<String>();
    int checkedPermissionsCount = 0;

    Context context = getReactApplicationContext().getBaseContext();

    for (int i = 0; i < permissions.size(); i++) {
      String perm = permissions.getString(i);

      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
        grantedPermissions.putString(
            perm,
            context.checkPermission(perm, Process.myPid(), Process.myUid())
                    == PackageManager.PERMISSION_GRANTED
                ? GRANTED
                : DENIED);
        checkedPermissionsCount++;
      } else if (context.checkSelfPermission(perm) == PackageManager.PERMISSION_GRANTED) {
        grantedPermissions.putString(perm, GRANTED);
        checkedPermissionsCount++;
      } else {
        permissionsToCheck.add(perm);
      }
    }
    if (permissions.size() == checkedPermissionsCount) {
      promise.resolve(grantedPermissions);
      return;
    }
    try {

      PermissionAwareActivity activity = getPermissionAwareActivity();

      mCallbacks.put(
          mRequestCode,
          new Callback() {
            @Override
            public void invoke(Object... args) {
              int[] results = (int[]) args[0];
              PermissionAwareActivity activity = (PermissionAwareActivity) args[1];
              for (int j = 0; j < permissionsToCheck.size(); j++) {
                String permission = permissionsToCheck.get(j);
                if (results.length > 0 && results[j] == PackageManager.PERMISSION_GRANTED) {
                  grantedPermissions.putString(permission, GRANTED);
                } else {
                  if (activity.shouldShowRequestPermissionRationale(permission)) {
                    grantedPermissions.putString(permission, DENIED);
                  } else {
                    grantedPermissions.putString(permission, NEVER_ASK_AGAIN);
                  }
                }
              }
              promise.resolve(grantedPermissions);
            }
          });

      activity.requestPermissions(permissionsToCheck.toArray(new String[0]), mRequestCode, this);
      mRequestCode++;
    } catch (IllegalStateException e) {
      promise.reject(ERROR_INVALID_ACTIVITY, e);
    }
  }

  /** Method called by the activity with the result of the permission request. */
  @Override
  public boolean onRequestPermissionsResult(
      int requestCode, String[] permissions, int[] grantResults) {
    mCallbacks.get(requestCode).invoke(grantResults, getPermissionAwareActivity());
    mCallbacks.remove(requestCode);
    return mCallbacks.size() == 0;
  }

  private PermissionAwareActivity getPermissionAwareActivity() {
    Activity activity = getCurrentActivity();
    if (activity == null) {
      throw new IllegalStateException(
          "Tried to use permissions API while not attached to an " + "Activity.");
    } else if (!(activity instanceof PermissionAwareActivity)) {
      throw new IllegalStateException(
          "Tried to use permissions API but the host Activity doesn't"
              + " implement PermissionAwareActivity.");
    }
    return (PermissionAwareActivity) activity;
  }
}
