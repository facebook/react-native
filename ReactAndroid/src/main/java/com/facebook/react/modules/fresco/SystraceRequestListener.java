// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.modules.fresco;

import java.util.HashMap;
import java.util.Map;

import android.util.Pair;

import com.facebook.imagepipeline.listener.RequestListener;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.systrace.Systrace;

/**
 * Logs requests to Systrace
 */
public class SystraceRequestListener implements RequestListener {

  int mCurrentID = 0;
  Map<String, Pair<Integer,String>> mProducerID = new HashMap<>();
  Map<String, Pair<Integer,String>> mRequestsID = new HashMap<>();

  @Override
  public void onProducerStart(String requestId, String producerName) {
    if (!Systrace.isTracing(Systrace.TRACE_TAG_REACT_FRESCO)) {
      return;
    }

    StringBuilder entryName = new StringBuilder();
    entryName.append("FRESCO_PRODUCER_");
    entryName.append(producerName.replace(':', '_'));

    Pair<Integer,String> requestPair = Pair.create(mCurrentID, entryName.toString());
    Systrace.beginAsyncSection(
        Systrace.TRACE_TAG_REACT_FRESCO,
        requestPair.second,
        mCurrentID);
    mProducerID.put(requestId, requestPair);
    mCurrentID++;
  }

  @Override
  public void onProducerFinishWithSuccess(
      String requestId,
      String producerName,
      Map<String, String> extraMap) {
    if (!Systrace.isTracing(Systrace.TRACE_TAG_REACT_FRESCO)) {
      return;
    }

    if (mProducerID.containsKey(requestId)) {
      Pair<Integer, String> entry = mProducerID.get(requestId);
      Systrace.endAsyncSection(
          Systrace.TRACE_TAG_REACT_FRESCO,
          entry.second,
          entry.first);
      mProducerID.remove(requestId);
    }
  }

  @Override
  public void onProducerFinishWithFailure(
      String requestId,
      String producerName,
      Throwable throwable,
      Map<String, String> extraMap) {
    if (!Systrace.isTracing(Systrace.TRACE_TAG_REACT_FRESCO)) {
      return;
    }

    if (mProducerID.containsKey(requestId)) {
      Pair<Integer, String> entry = mProducerID.get(requestId);
      Systrace.endAsyncSection(
          Systrace.TRACE_TAG_REACT_FRESCO,
          entry.second,
          entry.first);
      mProducerID.remove(requestId);
    }
  }

  @Override
  public void onProducerFinishWithCancellation(
      String requestId, String producerName, Map<String, String> extraMap) {
    if (!Systrace.isTracing(Systrace.TRACE_TAG_REACT_FRESCO)) {
      return;
    }

    if (mProducerID.containsKey(requestId)) {
      Pair<Integer, String> entry = mProducerID.get(requestId);
      Systrace.endAsyncSection(
          Systrace.TRACE_TAG_REACT_FRESCO,
          entry.second,
          entry.first);
      mProducerID.remove(requestId);
    }
  }

  @Override
  public void onProducerEvent(String requestId, String producerName, String producerEventName) {
    if (!Systrace.isTracing(Systrace.TRACE_TAG_REACT_FRESCO)) {
      return;
    }

    StringBuilder entryName = new StringBuilder();
    entryName.append("FRESCO_PRODUCER_EVENT_");
    entryName.append(requestId.replace(':', '_'));
    entryName.append("_");
    entryName.append(producerName.replace(':', '_'));
    entryName.append("_");
    entryName.append(producerEventName.replace(':', '_'));
    Systrace.traceInstant(
        Systrace.TRACE_TAG_REACT_FRESCO,
        entryName.toString(),
        Systrace.EventScope.THREAD);
  }

  @Override
  public void onRequestStart(
      ImageRequest request,
      Object callerContext,
      String requestId,
      boolean isPrefetch) {
    if (!Systrace.isTracing(Systrace.TRACE_TAG_REACT_FRESCO)) {
      return;
    }

    StringBuilder entryName = new StringBuilder();
    entryName.append("FRESCO_REQUEST_");
    entryName.append(request.getSourceUri().toString().replace(':', '_'));

    Pair<Integer,String> requestPair = Pair.create(mCurrentID, entryName.toString());
    Systrace.beginAsyncSection(
        Systrace.TRACE_TAG_REACT_FRESCO,
        requestPair.second,
        mCurrentID);
    mRequestsID.put(requestId, requestPair);
    mCurrentID++;
  }

  @Override
  public void onRequestSuccess(ImageRequest request, String requestId, boolean isPrefetch) {
    if (!Systrace.isTracing(Systrace.TRACE_TAG_REACT_FRESCO)) {
      return;
    }

    if (mRequestsID.containsKey(requestId)) {
      Pair<Integer, String> entry = mRequestsID.get(requestId);
      Systrace.endAsyncSection(
          Systrace.TRACE_TAG_REACT_FRESCO,
          entry.second,
          entry.first);
      mRequestsID.remove(requestId);
    }
  }

  @Override
  public void onRequestFailure(
      ImageRequest request,
      String requestId,
      Throwable throwable,
      boolean isPrefetch) {
    if (!Systrace.isTracing(Systrace.TRACE_TAG_REACT_FRESCO)) {
      return;
    }

    if (mRequestsID.containsKey(requestId)) {
      Pair<Integer, String> entry = mRequestsID.get(requestId);
      Systrace.endAsyncSection(
          Systrace.TRACE_TAG_REACT_FRESCO,
          entry.second,
          entry.first);
      mRequestsID.remove(requestId);
    }
  }

  @Override
  public void onRequestCancellation(String requestId) {
    if (!Systrace.isTracing(Systrace.TRACE_TAG_REACT_FRESCO)) {
      return;
    }

    if (mRequestsID.containsKey(requestId)) {
      Pair<Integer, String> entry = mRequestsID.get(requestId);
      Systrace.endAsyncSection(
          Systrace.TRACE_TAG_REACT_FRESCO,
          entry.second,
          entry.first);
      mRequestsID.remove(requestId);
    }
  }

  @Override
  public boolean requiresExtraMap(String id) {
    return false;
  }
}
