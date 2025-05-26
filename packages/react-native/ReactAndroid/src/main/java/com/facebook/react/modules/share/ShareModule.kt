/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.share

import android.content.Intent
import com.facebook.fbreact.specs.NativeShareModuleSpec
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.buildReadableMap
import com.facebook.react.module.annotations.ReactModule

/** Intent module. Launch other activities or open URLs. */
@ReactModule(name = NativeShareModuleSpec.NAME)
internal class ShareModule(reactContext: ReactApplicationContext) :
    NativeShareModuleSpec(reactContext) {

  /**
   * Open a chooser dialog to send text content to other apps.
   *
   * Refer http://developer.android.com/intl/ko/training/sharing/send.html
   *
   * @param content the data to send
   * @param dialogTitle the title of the chooser dialog
   */
  override fun share(content: ReadableMap?, dialogTitle: String?, promise: Promise) {
    if (content == null) {
      promise.reject(ERROR_INVALID_CONTENT, "Content cannot be null")
      return
    }
    try {
      val intent = Intent(Intent.ACTION_SEND)
      intent.setTypeAndNormalize("text/plain")
      if (content.hasKey("title")) {
        intent.putExtra(Intent.EXTRA_SUBJECT, content.getString("title"))
      }
      if (content.hasKey("message")) {
        intent.putExtra(Intent.EXTRA_TEXT, content.getString("message"))
      }
      val chooser = Intent.createChooser(intent, dialogTitle)
      chooser.addCategory(Intent.CATEGORY_DEFAULT)
      val currentActivity = reactApplicationContext.getCurrentActivity()
      if (currentActivity != null) {
        currentActivity.startActivity(chooser)
      } else {
        reactApplicationContext.startActivity(chooser)
      }
      val result = buildReadableMap { put("action", ACTION_SHARED) }
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject(ERROR_UNABLE_TO_OPEN_DIALOG, "Failed to open share dialog")
    }
  }

  companion object {
    const val NAME: String = NativeShareModuleSpec.NAME
    private const val ACTION_SHARED: String = "sharedAction"
    const val ERROR_INVALID_CONTENT: String = "E_INVALID_CONTENT"
    private const val ERROR_UNABLE_TO_OPEN_DIALOG: String = "E_UNABLE_TO_OPEN_DIALOG"
  }
}
