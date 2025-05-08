/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.systrace

import java.util.ArrayList
import kotlin.jvm.JvmField

internal object SystraceMessage {

  @JvmField var INCLUDE_ARGS: Boolean = false

  @JvmStatic
  fun beginSection(tag: Long, sectionName: String): Builder = StartSectionBuilder(tag, sectionName)

  @JvmStatic fun endSection(tag: Long): Builder = EndSectionBuilder(tag)

  abstract class Builder {
    abstract fun flush()

    abstract fun arg(key: String, value: Any): Builder

    abstract fun arg(key: String, value: Int): Builder

    abstract fun arg(key: String, value: Long): Builder

    abstract fun arg(key: String, value: Double): Builder
  }

  private class StartSectionBuilder(private val tag: Long, private val sectionName: String) :
      Builder() {
    private val args: MutableList<String> = ArrayList()

    override fun flush() {
      Systrace.beginSection(
          tag,
          sectionName +
              if (INCLUDE_ARGS && args.isNotEmpty()) {
                " (${java.lang.String.join(", ", args)})"
              } else {
                ""
              })
    }

    override fun arg(key: String, value: Any): Builder {
      addArg(key, value.toString())
      return this
    }

    override fun arg(key: String, value: Int): Builder {
      addArg(key, value.toString())
      return this
    }

    override fun arg(key: String, value: Long): Builder {
      addArg(key, value.toString())
      return this
    }

    override fun arg(key: String, value: Double): Builder {
      addArg(key, value.toString())
      return this
    }

    private fun addArg(key: String, value: String) {
      args.add("$key: $value")
    }
  }

  private class EndSectionBuilder(private val tag: Long) : Builder() {
    override fun flush() {
      Systrace.endSection(tag)
    }

    override fun arg(key: String, value: Any): Builder = this

    override fun arg(key: String, value: Int): Builder = this

    override fun arg(key: String, value: Long): Builder = this

    override fun arg(key: String, value: Double): Builder = this
  }
}
