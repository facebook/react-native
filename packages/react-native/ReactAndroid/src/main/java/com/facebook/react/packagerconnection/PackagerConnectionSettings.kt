/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.packagerconnection

import android.content.Context
import com.facebook.common.logging.FLog
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers

public open class PackagerConnectionSettings(private val appContext: Context) {
  public val packageName: String = appContext.packageName
  private val _additionalOptionsForPackager: MutableMap<String, String> = mutableMapOf()
  private var _packagerOptionsUpdater: (Map<String, String>) -> Map<String, String> = { it }
  private var cachedHost: String? = null

  public open var debugServerHost: String
    get() {
      // Check cached host first. If empty try to detect emulator type and use default
      // hostname for those
      cachedHost?.let {
        return it
      }
      val host = AndroidInfoHelpers.getServerHost(appContext)
      if (host == AndroidInfoHelpers.DEVICE_LOCALHOST) {
        FLog.w(
            TAG,
            "You seem to be running on device. Run '${AndroidInfoHelpers.getAdbReverseTcpCommand(appContext)}' to forward the debug server's port to the device.",
        )
      }

      cachedHost = host
      return host
    }
    set(host) {
      if (host.isEmpty()) {
        cachedHost = null
      } else {
        cachedHost = host
      }
    }

  public open fun resetDebugServerHost() {
    cachedHost = null
  }

  public fun setPackagerOptionsUpdater(queryMapper: (Map<String, String>) -> Map<String, String>) {
    _packagerOptionsUpdater = queryMapper
  }

  public fun updatePackagerOptions(options: Map<String, String>): Map<String, String> =
      _packagerOptionsUpdater(options)

  public fun setAdditionalOptionForPackager(key: String, value: String) {
    _additionalOptionsForPackager[key] = value
  }

  public val additionalOptionsForPackager: Map<String, String>
    get() = _additionalOptionsForPackager

  private companion object {
    private val TAG = PackagerConnectionSettings::class.java.simpleName
  }
}
