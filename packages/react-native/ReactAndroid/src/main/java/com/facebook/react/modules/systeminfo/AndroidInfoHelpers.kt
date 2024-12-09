/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.systeminfo

import android.content.Context
import android.os.Build
import com.facebook.common.logging.FLog
import com.facebook.react.R
import java.io.BufferedReader
import java.io.InputStreamReader
import java.nio.charset.Charset
import java.util.Locale

public object AndroidInfoHelpers {

  public const val EMULATOR_LOCALHOST: String = "10.0.2.2"
  public const val GENYMOTION_LOCALHOST: String = "10.0.3.2"
  public const val DEVICE_LOCALHOST: String = "localhost"
  public const val METRO_HOST_PROP_NAME: String = "metro.host"
  private val TAG = AndroidInfoHelpers::class.java.simpleName
  private var metroHostPropValue: String? = null

  private fun isRunningOnGenymotion(): Boolean = Build.FINGERPRINT.contains("vbox")

  private fun isRunningOnStockEmulator(): Boolean =
      Build.FINGERPRINT.contains("generic") || Build.FINGERPRINT.startsWith("google/sdk_gphone")

  @JvmStatic public fun getServerHost(port: Int): String = getServerIpAddress(port)

  @JvmStatic
  public fun getServerHost(context: Context): String = getServerIpAddress(getDevServerPort(context))

  @JvmStatic
  public fun getAdbReverseTcpCommand(port: Int): String = "adb reverse tcp:$port tcp:$port"

  @JvmStatic
  public fun getAdbReverseTcpCommand(context: Context): String =
      getAdbReverseTcpCommand(getDevServerPort(context))

  @JvmStatic
  public fun getFriendlyDeviceName(): String {
    return if (isRunningOnGenymotion()) {
      Build.MODEL
    } else {
      "${Build.MODEL} - ${Build.VERSION.RELEASE} - API ${Build.VERSION.SDK_INT}"
    }
  }

  @JvmStatic
  public fun getInspectorHostMetadata(applicationContext: Context?): Map<String, String?> {
    var appIdentifier: String? = null
    var appDisplayName: String? = null

    if (applicationContext != null) {
      val applicationInfo = applicationContext.applicationInfo
      val labelResourceId = applicationInfo.labelRes

      appIdentifier = applicationContext.packageName
      appDisplayName =
          if (labelResourceId == 0) {
            applicationInfo.nonLocalizedLabel.toString()
          } else {
            applicationContext.getString(labelResourceId)
          }
    }

    return mapOf(
        "appDisplayName" to appDisplayName,
        "appIdentifier" to appIdentifier,
        "platform" to "android",
        "deviceName" to Build.MODEL,
        "reactNativeVersion" to getReactNativeVersionString())
  }

  private fun getReactNativeVersionString(): String {
    val version = ReactNativeVersion.VERSION
    return "${version["major"]}.${version["minor"]}.${version["patch"]}" +
        (version["prerelease"]?.let { "-$it" } ?: "")
  }

  private fun getDevServerPort(context: Context): Int =
      context.resources.getInteger(R.integer.react_native_dev_server_port)

  private fun getServerIpAddress(port: Int): String {
    val ipAddress: String =
        when {
          getMetroHostPropValue().isNotEmpty() -> getMetroHostPropValue()
          isRunningOnGenymotion() -> GENYMOTION_LOCALHOST
          isRunningOnStockEmulator() -> EMULATOR_LOCALHOST
          else -> DEVICE_LOCALHOST
        }
    return String.format(Locale.US, "%s:%d", ipAddress, port)
  }

  @Synchronized
  private fun getMetroHostPropValue(): String {
    if (metroHostPropValue != null) {
      return metroHostPropValue!!
    }
    var process: Process? = null
    var reader: BufferedReader? = null
    try {
      process = Runtime.getRuntime().exec(arrayOf("/system/bin/getprop", METRO_HOST_PROP_NAME))
      reader = BufferedReader(InputStreamReader(process.inputStream, Charset.forName("UTF-8")))

      var lastLine = ""
      var line: String?
      while (reader.readLine().also { line = it } != null) {
        lastLine = line ?: ""
      }
      metroHostPropValue = lastLine
    } catch (e: Exception) {
      FLog.w(TAG, "Failed to query for metro.host prop:", e)
      metroHostPropValue = ""
    } finally {
      reader?.close()
      process?.destroy()
    }
    return metroHostPropValue ?: ""
  }
}
