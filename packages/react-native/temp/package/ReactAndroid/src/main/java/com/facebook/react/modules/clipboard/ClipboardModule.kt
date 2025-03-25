/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.clipboard

import android.content.ClipData
import android.content.ClipboardManager
import com.facebook.fbreact.specs.NativeClipboardSpec
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule

/** A module that allows JS to get/set clipboard contents. */
@ReactModule(name = NativeClipboardSpec.NAME)
public class ClipboardModule(context: ReactApplicationContext) : NativeClipboardSpec(context) {

  private val clipboardService: ClipboardManager
    get() =
        getReactApplicationContext().getSystemService(ReactApplicationContext.CLIPBOARD_SERVICE)
            as ClipboardManager

  public override fun getString(promise: Promise) {
    try {
      val clipboard = clipboardService
      val clipData = clipboard.primaryClip
      if (clipData != null && clipData.itemCount >= 1) {
        val firstItem = clipData.getItemAt(0)
        promise.resolve("${firstItem.text}")
      } else {
        promise.resolve("")
      }
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  public override fun setString(text: String?) {
    val clipdata: ClipData = ClipData.newPlainText(null, text)
    clipboardService.setPrimaryClip(clipdata)
  }

  public companion object {
    public const val NAME: String = NativeClipboardSpec.NAME
  }
}
