/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.util;

import android.util.JsonWriter;
import com.facebook.react.bridge.JsonWriterHelper;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import java.io.IOException;
import java.io.StringWriter;
import java.io.Writer;
import javax.annotation.Nullable;

public class ExceptionDataHelper {
  static final String EXTRA_DATA_FIELD = "extraData";

  public static String getExtraDataAsJson(@Nullable ReadableMap metadata) {
    if (metadata == null || metadata.getType(EXTRA_DATA_FIELD) == ReadableType.Null) {
      return null;
    }
    try {
      Writer extraDataWriter = new StringWriter();
      JsonWriter json = new JsonWriter(extraDataWriter);
      JsonWriterHelper.value(json, metadata.getDynamic(EXTRA_DATA_FIELD));
      json.close();
      extraDataWriter.close();
      return extraDataWriter.toString();
    } catch (IOException ex) {
    }
    return null;
  }
}
