/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO T185922447 migrate from deprecated AsyncTask
@file:Suppress("DEPRECATION")

package com.facebook.react.modules.camera

import android.net.Uri
import android.os.AsyncTask
import android.util.Base64
import android.util.Base64OutputStream
import com.facebook.fbreact.specs.NativeImageStoreAndroidSpec
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.GuardedAsyncTask
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.module.annotations.ReactModule
import java.io.ByteArrayOutputStream
import java.io.Closeable
import java.io.FileNotFoundException
import java.io.IOException
import java.io.InputStream

@ReactModule(name = NativeImageStoreAndroidSpec.NAME)
public class ImageStoreManager(reactContext: ReactApplicationContext) :
    NativeImageStoreAndroidSpec(reactContext) {

  /**
   * Calculate the base64 representation for an image. The "tag" comes from iOS naming.
   *
   * @param uri the URI of the image, file:// or content://
   * @param success callback to be invoked with the base64 string as the only argument
   * @param error callback to be invoked on error (e.g. file not found, not readable etc.)
   */
  override public fun getBase64ForTag(uri: String, success: Callback, error: Callback) {
    GetBase64Task(getReactApplicationContext(), uri, success, error)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
  }

  private inner class GetBase64Task(
      reactContext: ReactContext,
      private val uri: String,
      private val success: Callback,
      private val error: Callback
  ) : GuardedAsyncTask<Void?, Void?>(reactContext) {
    protected override fun doInBackgroundGuarded(vararg params: Void?) {
      try {
        val contentResolver = getReactApplicationContext().getContentResolver()
        val uri = Uri.parse(uri)
        val inputStream = contentResolver.openInputStream(uri) as InputStream
        try {
          success.invoke(convertInputStreamToBase64OutputStream(inputStream))
        } catch (e: IOException) {
          error.invoke(e.message)
        } finally {
          closeQuietly(inputStream)
        }
      } catch (e: FileNotFoundException) {
        error.invoke(e.message)
      }
    }
  }

  @Throws(IOException::class)
  internal fun convertInputStreamToBase64OutputStream(inputStream: InputStream): String {
    val baos = ByteArrayOutputStream()
    val b64os = Base64OutputStream(baos, Base64.NO_WRAP)
    val buffer = ByteArray(BUFFER_SIZE)
    var bytesRead: Int
    try {
      while (inputStream.read(buffer).also { bytesRead = it } > -1) {
        b64os.write(buffer, 0, bytesRead)
      }
    } finally {
      closeQuietly(b64os) // this also closes baos and flushes the final content to it
    }
    return baos.toString()
  }

  public companion object {
    public const val NAME: String = NativeImageStoreAndroidSpec.NAME

    private const val BUFFER_SIZE = 8_192

    private fun closeQuietly(closeable: Closeable) {
      try {
        closeable.close()
      } catch (e: IOException) {
        // shhh
      }
    }
  }
}
