/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.network;

import java.io.IOException;
import java.net.SocketTimeoutException;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;

/**
 * Util methods to send network responses to JS.
 */
public class ResponseUtil {
  public static void onDataSend(
    RCTDeviceEventEmitter eventEmitter,
    int requestId,
    long progress,
    long total) {
    WritableArray args = Arguments.createArray();
    args.pushInt(requestId);
    args.pushInt((int) progress);
    args.pushInt((int) total);
    eventEmitter.emit("didSendNetworkData", args);
  }

  public static void onDataReceived(
    RCTDeviceEventEmitter eventEmitter,
    int requestId,
    String data) {
    WritableArray args = Arguments.createArray();
    args.pushInt(requestId);
    args.pushString(data);

    eventEmitter.emit("didReceiveNetworkData", args);
  }

  public static void onRequestError(
    RCTDeviceEventEmitter eventEmitter,
    int requestId,
    String error,
    IOException e) {
    WritableArray args = Arguments.createArray();
    args.pushInt(requestId);
    args.pushString(error);

    if ((e != null) && (e.getClass() == SocketTimeoutException.class)) {
      args.pushBoolean(true); // last argument is a time out boolean
    }

    eventEmitter.emit("didCompleteNetworkResponse", args);
  }

  public static void onRequestSuccess(RCTDeviceEventEmitter eventEmitter, int requestId) {
    WritableArray args = Arguments.createArray();
    args.pushInt(requestId);
    args.pushNull();

    eventEmitter.emit("didCompleteNetworkResponse", args);
  }

  public static void onResponseReceived(
    RCTDeviceEventEmitter eventEmitter,
    int requestId,
    int statusCode,
    WritableMap headers,
    String url) {
    WritableArray args = Arguments.createArray();
    args.pushInt(requestId);
    args.pushInt(statusCode);
    args.pushMap(headers);
    args.pushString(url);

    eventEmitter.emit("didReceiveNetworkResponse", args);
  }
}
