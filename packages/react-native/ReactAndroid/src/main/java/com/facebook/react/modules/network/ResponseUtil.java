/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import java.net.SocketTimeoutException;

/** Util methods to send network responses to JS. */
public class ResponseUtil {
  public static void onDataSend(
      @Nullable ReactApplicationContext reactContext, int requestId, long progress, long total) {
    WritableArray args = Arguments.createArray();
    args.pushInt(requestId);
    args.pushInt((int) progress);
    args.pushInt((int) total);
    if (reactContext != null) {
      reactContext.emitDeviceEvent("didSendNetworkData", args);
    }
  }

  public static void onIncrementalDataReceived(
      @Nullable ReactApplicationContext reactContext,
      int requestId,
      String data,
      long progress,
      long total) {
    WritableArray args = Arguments.createArray();
    args.pushInt(requestId);
    args.pushString(data);
    args.pushInt((int) progress);
    args.pushInt((int) total);

    if (reactContext != null) {
      reactContext.emitDeviceEvent("didReceiveNetworkIncrementalData", args);
    }
  }

  public static void onDataReceivedProgress(
      @Nullable ReactApplicationContext reactContext, int requestId, long progress, long total) {
    WritableArray args = Arguments.createArray();
    args.pushInt(requestId);
    args.pushInt((int) progress);
    args.pushInt((int) total);

    if (reactContext != null) {
      reactContext.emitDeviceEvent("didReceiveNetworkDataProgress", args);
    }
  }

  public static void onDataReceived(
      @Nullable ReactApplicationContext reactContext, int requestId, String data) {
    WritableArray args = Arguments.createArray();
    args.pushInt(requestId);
    args.pushString(data);

    if (reactContext != null) {
      reactContext.emitDeviceEvent("didReceiveNetworkData", args);
    }
  }

  public static void onDataReceived(
      @Nullable ReactApplicationContext reactContext, int requestId, WritableMap data) {
    WritableArray args = Arguments.createArray();
    args.pushInt(requestId);
    args.pushMap(data);

    if (reactContext != null) {
      reactContext.emitDeviceEvent("didReceiveNetworkData", args);
    }
  }

  public static void onRequestError(
      @Nullable ReactApplicationContext reactContext, int requestId, String error, Throwable e) {
    WritableArray args = Arguments.createArray();
    args.pushInt(requestId);
    args.pushString(error);

    if ((e != null) && (e.getClass() == SocketTimeoutException.class)) {
      args.pushBoolean(true); // last argument is a time out boolean
    }

    if (reactContext != null) {
      reactContext.emitDeviceEvent("didCompleteNetworkResponse", args);
    }
  }

  public static void onRequestSuccess(
      @Nullable ReactApplicationContext reactContext, int requestId) {
    WritableArray args = Arguments.createArray();
    args.pushInt(requestId);
    args.pushNull();

    if (reactContext != null) {
      reactContext.emitDeviceEvent("didCompleteNetworkResponse", args);
    }
  }

  public static void onResponseReceived(
      @Nullable ReactApplicationContext reactContext,
      int requestId,
      int statusCode,
      WritableMap headers,
      String url) {
    WritableArray args = Arguments.createArray();
    args.pushInt(requestId);
    args.pushInt(statusCode);
    args.pushMap(headers);
    args.pushString(url);

    if (reactContext != null) {
      reactContext.emitDeviceEvent("didReceiveNetworkResponse", args);
    }
  }
}
