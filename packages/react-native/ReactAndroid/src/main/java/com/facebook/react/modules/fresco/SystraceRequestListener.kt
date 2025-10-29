/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.fresco

import android.util.Pair
import com.facebook.imagepipeline.listener.BaseRequestListener
import com.facebook.imagepipeline.request.ImageRequest
import com.facebook.systrace.Systrace

/** Logs requests to Systrace */
internal class SystraceRequestListener : BaseRequestListener() {
  private var currentId: Int = 0
  private val producerId: MutableMap<String, Pair<Int, String>> = mutableMapOf()
  private val requestsId: MutableMap<String, Pair<Int, String>> = mutableMapOf()

  override fun onProducerStart(requestId: String, producerName: String) {
    if (!Systrace.isTracing(Systrace.TRACE_TAG_REACT)) {
      return
    }
    val entryName = StringBuilder()
    entryName.append("FRESCO_PRODUCER_")
    entryName.append(producerName.replace(':', '_'))
    val requestPair = Pair.create(currentId, entryName.toString())
    Systrace.beginAsyncSection(Systrace.TRACE_TAG_REACT, requestPair.second, currentId)
    producerId[requestId] = requestPair
    currentId++
  }

  override fun onProducerFinishWithSuccess(
      requestId: String,
      producerName: String,
      extraMap: Map<String, String>?,
  ) {
    if (!Systrace.isTracing(Systrace.TRACE_TAG_REACT)) {
      return
    }

    val entry = producerId[requestId]
    if (entry != null) {
      Systrace.endAsyncSection(Systrace.TRACE_TAG_REACT, entry.second, entry.first)
      producerId.remove(requestId)
    }
  }

  override fun onProducerFinishWithFailure(
      requestId: String,
      producerName: String,
      t: Throwable,
      extraMap: Map<String, String>?,
  ) {
    if (!Systrace.isTracing(Systrace.TRACE_TAG_REACT)) {
      return
    }

    val entry = producerId[requestId]
    if (entry != null) {
      Systrace.endAsyncSection(Systrace.TRACE_TAG_REACT, entry.second, entry.first)
      producerId.remove(requestId)
    }
  }

  override fun onProducerFinishWithCancellation(
      requestId: String,
      producerName: String,
      extraMap: Map<String, String>?,
  ) {
    if (!Systrace.isTracing(Systrace.TRACE_TAG_REACT)) {
      return
    }

    val entry = producerId[requestId]
    if (entry != null) {
      Systrace.endAsyncSection(Systrace.TRACE_TAG_REACT, entry.second, entry.first)
      producerId.remove(requestId)
    }
  }

  override fun onProducerEvent(requestId: String, producerName: String, eventName: String) {
    if (!Systrace.isTracing(Systrace.TRACE_TAG_REACT)) {
      return
    }
    val entryName = StringBuilder()
    entryName.append("FRESCO_PRODUCER_EVENT_")
    entryName.append(requestId.replace(':', '_'))
    entryName.append("_")
    entryName.append(producerName.replace(':', '_'))
    entryName.append("_")
    entryName.append(eventName.replace(':', '_'))
    Systrace.traceInstant(
        Systrace.TRACE_TAG_REACT,
        entryName.toString(),
        Systrace.EventScope.THREAD,
    )
  }

  override fun onRequestStart(
      request: ImageRequest,
      callerContext: Any,
      requestId: String,
      isPrefetch: Boolean,
  ) {
    if (!Systrace.isTracing(Systrace.TRACE_TAG_REACT)) {
      return
    }

    val entryName = StringBuilder()
    entryName.append("FRESCO_REQUEST_")
    entryName.append(request.sourceUri.toString().replace(':', '_'))
    val requestPair = Pair.create(currentId, entryName.toString())
    Systrace.beginAsyncSection(Systrace.TRACE_TAG_REACT, requestPair.second, currentId)
    requestsId[requestId] = requestPair
    currentId++
  }

  override fun onRequestSuccess(request: ImageRequest, requestId: String, isPrefetch: Boolean) {
    if (!Systrace.isTracing(Systrace.TRACE_TAG_REACT)) {
      return
    }

    val entry = requestsId[requestId]
    if (entry != null) {
      Systrace.endAsyncSection(Systrace.TRACE_TAG_REACT, entry.second, entry.first)
      requestsId.remove(requestId)
    }
  }

  override fun onRequestFailure(
      request: ImageRequest,
      requestId: String,
      throwable: Throwable,
      isPrefetch: Boolean,
  ) {
    if (!Systrace.isTracing(Systrace.TRACE_TAG_REACT)) {
      return
    }

    val entry = requestsId[requestId]
    if (entry != null) {
      Systrace.endAsyncSection(Systrace.TRACE_TAG_REACT, entry.second, entry.first)
      requestsId.remove(requestId)
    }
  }

  override fun onRequestCancellation(requestId: String) {
    if (!Systrace.isTracing(Systrace.TRACE_TAG_REACT)) {
      return
    }

    val entry = requestsId[requestId]
    if (entry != null) {
      Systrace.endAsyncSection(Systrace.TRACE_TAG_REACT, entry.second, entry.first)
      requestsId.remove(requestId)
    }
  }

  override fun requiresExtraMap(requestId: String): Boolean = false
}
