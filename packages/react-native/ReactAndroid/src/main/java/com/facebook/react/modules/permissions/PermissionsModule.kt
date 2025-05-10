/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.permissions

import android.app.Activity
import android.content.pm.PackageManager
import android.util.SparseArray
import com.facebook.common.logging.FLog
import com.facebook.fbreact.specs.NativePermissionsAndroidSpec
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import java.util.ArrayList

/** Module that exposes the Android M Permission system to JS. */
@ReactModule(name = NativePermissionsAndroidSpec.NAME)
public class PermissionsModule(reactContext: ReactApplicationContext?) :
    NativePermissionsAndroidSpec(reactContext), PermissionListener {

  private val callbacks: SparseArray<Callback> = SparseArray<Callback>()
  private var requestCode = 0
  private val GRANTED = "granted"
  private val DENIED = "denied"
  private val NEVER_ASK_AGAIN = "never_ask_again"

  /**
   * Check if the app has the permission given. successCallback is called with true if the
   * permission had been granted, false otherwise. See [Activity.checkSelfPermission].
   */
  public override fun checkPermission(permission: String, promise: Promise): Unit {
    val context = getReactApplicationContext().getBaseContext()
    promise.resolve(context.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED)
  }

  /**
   * Check whether the app should display a message explaining why a certain permission is needed.
   * successCallback is called with true if the app should display a message, false otherwise. This
   * message is only displayed if the user has revoked this permission once before, and if the
   * permission dialog will be shown to the user (the user can choose to not be shown that dialog
   * again). For devices before Android M, this always returns false. See
   * [PermissionAwareActivity.shouldShowRequestPermissionRationale].
   */
  public override fun shouldShowRequestPermissionRationale(
      permission: String,
      promise: Promise
  ): Unit {
    try {
      promise.resolve(permissionAwareActivity.shouldShowRequestPermissionRationale(permission))
    } catch (e: IllegalStateException) {
      promise.reject(ERROR_INVALID_ACTIVITY, e)
    }
  }

  /**
   * Request the given permission. successCallback is called with GRANTED if the permission had been
   * granted, DENIED or NEVER_ASK_AGAIN otherwise. For devices before Android M, this checks if the
   * user has the permission given or not and resolves with GRANTED or DENIED. See
   * [Activity.checkSelfPermission].
   */
  public override fun requestPermission(permission: String, promise: Promise): Unit {
    val context = getReactApplicationContext().getBaseContext()
    if (context.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED) {
      promise.resolve(GRANTED)
      return
    }
    try {
      val activity = permissionAwareActivity
      callbacks.put(
          requestCode,
          object : Callback {
            override operator fun invoke(vararg args: Any?) {
              val results = args[0] as IntArray
              if (results.size > 0 && results[0] == PackageManager.PERMISSION_GRANTED) {
                promise.resolve(GRANTED)
              } else {
                val callbackActivity = args[1] as PermissionAwareActivity
                if (callbackActivity.shouldShowRequestPermissionRationale(permission)) {
                  promise.resolve(DENIED)
                } else {
                  promise.resolve(NEVER_ASK_AGAIN)
                }
              }
            }
          })
      activity.requestPermissions(arrayOf(permission), requestCode, this)
      requestCode++
    } catch (e: IllegalStateException) {
      promise.reject(ERROR_INVALID_ACTIVITY, e)
    }
  }

  public override fun requestMultiplePermissions(
      permissions: ReadableArray,
      promise: Promise
  ): Unit {
    val grantedPermissions = WritableNativeMap()
    val permissionsToCheck = ArrayList<String>()
    var checkedPermissionsCount = 0
    val context = getReactApplicationContext().getBaseContext()
    for (i in 0 until permissions.size()) {
      val perm = permissions.getString(i) ?: continue
      if (context.checkSelfPermission(perm) == PackageManager.PERMISSION_GRANTED) {
        grantedPermissions.putString(perm, GRANTED)
        checkedPermissionsCount++
      } else {
        permissionsToCheck.add(perm)
      }
    }
    if (permissions.size() == checkedPermissionsCount) {
      promise.resolve(grantedPermissions)
      return
    }
    try {
      val activity = permissionAwareActivity
      callbacks.put(
          requestCode,
          object : Callback {
            override operator fun invoke(vararg args: Any?) {
              val results = args[0] as IntArray
              val callbackActivity = args[1] as PermissionAwareActivity
              for (j in permissionsToCheck.indices) {
                val permission = permissionsToCheck[j]
                if (results.size > j && results[j] == PackageManager.PERMISSION_GRANTED) {
                  grantedPermissions.putString(permission, GRANTED)
                } else {
                  if (callbackActivity.shouldShowRequestPermissionRationale(permission)) {
                    grantedPermissions.putString(permission, DENIED)
                  } else {
                    grantedPermissions.putString(permission, NEVER_ASK_AGAIN)
                  }
                }
              }
              promise.resolve(grantedPermissions)
            }
          })
      activity.requestPermissions(permissionsToCheck.toTypedArray<String>(), requestCode, this)
      requestCode++
    } catch (e: IllegalStateException) {
      promise.reject(ERROR_INVALID_ACTIVITY, e)
    }
  }

  /** Method called by the activity with the result of the permission request. */
  override fun onRequestPermissionsResult(
      requestCode: Int,
      permissions: Array<String>,
      grantResults: IntArray
  ): Boolean =
      try {
        val callback = callbacks[requestCode]
        if (callback != null) {
          callback.invoke(grantResults, permissionAwareActivity)
          callbacks.remove(requestCode)
        } else {
          FLog.w("PermissionsModule", "Unable to find callback with requestCode %d", requestCode)
        }
        callbacks.size() == 0
      } catch (e: IllegalStateException) {
        FLog.e(
            "PermissionsModule",
            e,
            "Unexpected invocation of `onRequestPermissionsResult` with invalid current activity")
        false
      }

  private val permissionAwareActivity: PermissionAwareActivity
    get() {
      val activity = reactApplicationContext.getCurrentActivity()
      checkNotNull(activity) { "Tried to use permissions API while not attached to an Activity." }
      check(activity is PermissionAwareActivity) {
        ("Tried to use permissions API but the host Activity doesn't implement PermissionAwareActivity.")
      }
      return activity
    }

  public companion object {
    public const val NAME: String = NativePermissionsAndroidSpec.NAME
    private const val ERROR_INVALID_ACTIVITY = "E_INVALID_ACTIVITY"
  }
}
