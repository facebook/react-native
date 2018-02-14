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

import java.io.File;

import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

// This module is being called only by Java via the static method "captureHeap" that
// requires it to alreay be initialized, thus we eagerly initialize this module
@ReactModule(name = "JSCHeapCapture", needsEagerInit = true)
public class JSCHeapCapture extends ReactContextBaseJavaModule {
  public interface HeapCapture extends JavaScriptModule {
    void captureHeap(String path);
  }

  public static class CaptureException extends Exception {
    CaptureException(String message) {
      super(message);
    }
    CaptureException(String message, Throwable cause) {
      super(message, cause);
    }
  }

  public interface CaptureCallback {
    void onSuccess(File capture);
    void onFailure(CaptureException error);
  }

  private @Nullable CaptureCallback mCaptureInProgress;

  public JSCHeapCapture(ReactApplicationContext reactContext) {
    super(reactContext);
    mCaptureInProgress = null;
  }

  public synchronized void captureHeap(String path, final CaptureCallback callback) {
    if (mCaptureInProgress != null) {
      callback.onFailure(new CaptureException("Heap capture already in progress."));
      return;
    }
    File f = new File(path + "/capture.json");
    f.delete();

    HeapCapture heapCapture = getReactApplicationContext().getJSModule(HeapCapture.class);
    if (heapCapture == null) {
      callback.onFailure(new CaptureException("Heap capture js module not registered."));
      return;
    }
    mCaptureInProgress = callback;
    heapCapture.captureHeap(f.getPath());
  }

  @ReactMethod
  public synchronized void captureComplete(String path, String error) {
    if (mCaptureInProgress != null) {
      if (error == null) {
        mCaptureInProgress.onSuccess(new File(path));
      } else {
        mCaptureInProgress.onFailure(new CaptureException(error));
      }
      mCaptureInProgress = null;
    }
  }

  @Override
  public String getName() {
    return "JSCHeapCapture";
  }
}
