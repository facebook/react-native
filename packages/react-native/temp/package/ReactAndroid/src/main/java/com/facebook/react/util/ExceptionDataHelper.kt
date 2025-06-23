/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.util

import android.util.JsonWriter
import com.facebook.react.bridge.JsonWriterHelper
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import java.io.IOException
import java.io.StringWriter

public object ExceptionDataHelper {

  public const val EXTRA_DATA_FIELD: String = "extraData"

  @JvmStatic
  public fun getExtraDataAsJson(metadata: ReadableMap?): String? {
    if (metadata == null || metadata.getType(EXTRA_DATA_FIELD) == ReadableType.Null) {
      return null
    }
    try {
      val extraDataWriter = StringWriter()
      val json = JsonWriter(extraDataWriter)
      JsonWriterHelper.value(json, metadata.getDynamic(EXTRA_DATA_FIELD))
      json.close()
      extraDataWriter.close()
      return extraDataWriter.toString()
    } catch (ex: IOException) {}
    return null
  }
}
