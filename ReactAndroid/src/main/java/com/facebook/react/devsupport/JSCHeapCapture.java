/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import androidx.annotation.Nullable;
import com.facebook.fbreact.specs.NativeJSCHeapCaptureSpec;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;
import java.io.File;

// This module is being called only by Java via the static method "captureHeap" that
// requires it to already be initialized, thus we eagerly initialize this module
@ReactModule(name = JSCHeapCapture.TAG, needsEagerInit = true)
public class JSCHeapCapture extends NativeJSCHeapCaptureSpec {
  public static final String TAG = "JSCHeapCapture";

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

    ReactApplicationContext reactApplicationContext = getReactApplicationContextIfActiveOrWarn();

    if (reactApplicationContext != null) {
      HeapCapture heapCapture = reactApplicationContext.getJSModule(HeapCapture.class);
      if (heapCapture == null) {
        callback.onFailure(new CaptureException("Heap capture js module not registered."));
        return;
      }
      mCaptureInProgress = callback;
      heapCapture.captureHeap(f.getPath());
    }
  }

  @Override
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
