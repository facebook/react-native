/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.model.ModelAutolinkingConfigJson
import com.facebook.react.model.ModelPackageJson
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonElement
import java.io.File

object JsonUtils {
  private val gsonConverter = Gson()

  fun fromPackageJson(input: File): ModelPackageJson? =
      input.bufferedReader().use {
        runCatching { gsonConverter.fromJson(it, ModelPackageJson::class.java) }.getOrNull()
      }

  fun fromAutolinkingConfigJson(input: File): ModelAutolinkingConfigJson? =
      input.bufferedReader().use {
        runCatching { gsonConverter.fromJson(it, ModelAutolinkingConfigJson::class.java) }
            .getOrNull()
      }

  fun fromAutolinkingConfigJsonSimplified(input: File): String? {
    val out = input.bufferedReader().use {
      runCatching { gsonConverter.fromJson(it, JsonElement::class.java)}
    }
    val configJson = out.getOrNull()?.asJsonObject ?: return null
    if (configJson.has("commands")) {
      configJson.addProperty("commands", "// removed from output...")
    }
    return GsonBuilder().setPrettyPrinting().create().toJson(configJson)
  }
}
