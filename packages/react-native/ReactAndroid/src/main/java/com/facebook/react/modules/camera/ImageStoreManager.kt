/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.camera

import android.net.Uri
import android.util.Base64
import android.util.Base64OutputStream
import com.facebook.fbreact.specs.NativeImageStoreAndroidSpec
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import java.io.ByteArrayOutputStream
import java.io.Closeable
import java.io.FileNotFoundException
import java.io.IOException
import java.io.InputStream
import java.util.concurrent.Executors

@ReactModule(name = NativeImageStoreAndroidSpec.NAME)
internal class ImageStoreManager(reactContext: ReactApplicationContext) :
    NativeImageStoreAndroidSpec(reactContext) {

  /**
   * Calculate the base64 representation for an image. The "tag" comes from iOS naming.
   *
   * @param uri the URI of the image, file:// or content://
   * @param success callback to be invoked with the base64 string as the only argument
   * @param error callback to be invoked on error (e.g. file not found, not readable etc.)
   */
  override public fun getBase64ForTag(uri: String, success: Callback, error: Callback) {
    val executor = Executors.newSingleThreadExecutor()
    executor.execute {
      try {
        val contentResolver = getReactApplicationContext().getContentResolver()
        val parsedUri = Uri.parse(uri)
        val inputStream = contentResolver.openInputStream(parsedUri) as InputStream
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
  }
}
