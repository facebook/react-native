/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.model.ModelPackageJson
import com.google.gson.Gson
import java.io.File

object JsonUtils {
  private val gsonConverter = Gson()

  fun fromCodegenJson(input: File): ModelPackageJson? =
      input.bufferedReader().use {
        runCatching { gsonConverter.fromJson(it, ModelPackageJson::class.java) }.getOrNull()
      }
}
