/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport;

import javax.annotation.Nullable;

import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class JSCHeapCapture extends ReactContextBaseJavaModule {
  public interface HeapCapture extends JavaScriptModule {
    void captureHeap(int token, String path);
    void setAllocationTracking(int token, boolean enabled);
  }

  public static class CaptureException extends Exception {
    CaptureException(String message) {
      super(message);
    }
  }

  private @Nullable HeapCapture mHeapCapture;
  private boolean mOperationInProgress;
  private int mOperationToken;
  private @Nullable String mOperationError;

  private static @Nullable JSCHeapCapture sJSCHeapCapture = null;

  private static synchronized void registerHeapCapture(JSCHeapCapture dumper) {
    if (sJSCHeapCapture != null) {
      throw new RuntimeException(
        "JSCHeapCapture already registered. Are you running more than one JSC?");
    }
    sJSCHeapCapture = dumper;
  }

  private static synchronized void unregisterHeapCapture(JSCHeapCapture dumper) {
    if (sJSCHeapCapture != dumper) {
      throw new RuntimeException("Can't unregister JSCHeapCapture that is not registered.");
    }
    sJSCHeapCapture = null;
  }

  public static synchronized void captureHeap(String path, long timeout) throws CaptureException {
    if (sJSCHeapCapture == null) {
      throw new CaptureException("No JSC registered.");
    }
    sJSCHeapCapture.captureHeapHelper(path, timeout);
  }

  public JSCHeapCapture(ReactApplicationContext reactContext) {
    super(reactContext);
    mHeapCapture = null;
    mOperationInProgress = false;
    mOperationToken = 0;
    mOperationError = null;
  }

  private synchronized void captureHeapHelper(String path, long timeout) throws CaptureException {
    if (mHeapCapture == null) {
      throw new CaptureException("HeapCapture.js module not connected");
    }
    mHeapCapture.captureHeap(getOperationToken(), path);
    waitForOperation(timeout);
  }

  private int getOperationToken() throws CaptureException {
    if (mOperationInProgress) {
      throw new CaptureException("Another operation already in progress.");
    }
    mOperationInProgress = true;
    return ++mOperationToken;
  }

  private void waitForOperation(long timeout) throws CaptureException {
    try {
      wait(timeout);
    } catch (InterruptedException e) {
      throw new CaptureException("Waiting for heap capture failed: " + e.getMessage());
    }

    if (mOperationInProgress) {
      mOperationInProgress = false;
      throw new CaptureException("heap capture timed out.");
    }

    if (mOperationError != null) {
      throw new CaptureException(mOperationError);
    }
  }

  @ReactMethod
  public synchronized void operationComplete(int token, String error) {
    if (token == mOperationToken) {
      mOperationInProgress = false;
      mOperationError = error;
      this.notify();
    } else {
      throw new RuntimeException("Completed operation is not in progress.");
    }
  }

  @Override
  public String getName() {
    return "JSCHeapCapture";
  }

  @Override
  public void initialize() {
    super.initialize();
    mHeapCapture = getReactApplicationContext().getJSModule(HeapCapture.class);
    registerHeapCapture(this);
  }

  @Override
  public void onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy();
    unregisterHeapCapture(this);
    mHeapCapture = null;
  }
}
