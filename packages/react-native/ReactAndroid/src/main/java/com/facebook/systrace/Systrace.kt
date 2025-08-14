/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.systrace

import androidx.tracing.Trace
import java.lang.Runnable
import kotlin.text.StringBuilder

/**
 * Systrace stub that mostly does nothing but delegates to Trace for beginning/ending sections. The
 * internal version of this file has not been opensourced yet.
 */
@Suppress("UNUSED_PARAMETER")
internal object Systrace {

  const val TRACE_TAG_REACT: Long = 0L

  @JvmStatic fun registerListener(listener: TraceListener?): Unit = Unit

  @JvmStatic fun unregisterListener(listener: TraceListener?): Unit = Unit

  @JvmStatic fun isTracing(tag: Long): Boolean = false

  @JvmStatic fun traceInstant(tag: Long, title: String?, scope: EventScope?): Unit = Unit

  @JvmStatic
  fun traceSection(tag: Long, sectionName: String, block: Runnable) {
    beginSection(tag, sectionName)
    try {
      block.run()
    } finally {
      endSection(tag)
    }
  }

  @JvmStatic
  fun beginSection(tag: Long, sectionName: String) {
    Trace.beginSection(sectionName)
  }

  @JvmStatic
  fun beginSection(tag: Long, sectionName: String, args: Array<String>, argsLength: Int) {
    Trace.beginSection(sectionName + "|" + convertArgsToText(args, argsLength))
  }

  private fun convertArgsToText(args: Array<String>, argsLength: Int): String {
    val argsText: StringBuilder = StringBuilder()
    var ii = 1
    while (ii < argsLength) {
      val key = args[ii - 1]
      val value = args[ii]
      argsText.append(key)
      argsText.append('=')
      argsText.append(value)
      if (ii < argsLength - 1) {
        argsText.append(';')
      }
      ii += 2
    }
    return argsText.toString()
  }

  @JvmStatic
  fun endSection(tag: Long) {
    Trace.endSection()
  }

  @JvmStatic
  fun beginAsyncSection(tag: Long, sectionName: String, cookie: Int) {
    Trace.beginAsyncSection(sectionName, cookie)
  }

  @JvmStatic
  fun beginAsyncSection(tag: Long, sectionName: String, cookie: Int, startNanos: Long) {
    beginAsyncSection(tag, sectionName, cookie)
  }

  @JvmStatic
  fun endAsyncSection(tag: Long, sectionName: String, cookie: Int) {
    Trace.endAsyncSection(sectionName, cookie)
  }

  @JvmStatic
  fun endAsyncSection(tag: Long, sectionName: String, cookie: Int, endNanos: Long) {
    endAsyncSection(tag, sectionName, cookie)
  }

  @JvmStatic
  fun traceCounter(tag: Long, counterName: String, counterValue: Int) {
    Trace.setCounter(counterName, counterValue)
  }

  @JvmStatic
  fun startAsyncFlow(tag: Long, sectionName: String, cookie: Int) {
    beginAsyncSection(tag, sectionName, cookie)
  }

  @JvmStatic fun stepAsyncFlow(tag: Long, sectionName: String, cookie: Int): Unit = Unit

  @JvmStatic
  fun endAsyncFlow(tag: Long, sectionName: String, cookie: Int) {
    endAsyncSection(tag, sectionName, cookie)
  }

  enum class EventScope(val code: Char) {
    THREAD('t'),
    PROCESS('p'),
    GLOBAL('g'),
  }
}
