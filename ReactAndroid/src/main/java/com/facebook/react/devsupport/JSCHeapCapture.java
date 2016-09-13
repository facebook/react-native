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
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;

import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = "JSCHeapCapture")
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
    void onComplete(List<File> captures, List<CaptureException> failures);
  }

  private interface PerCaptureCallback {
    void onSuccess(File capture);
    void onFailure(CaptureException cause);
  }

  private @Nullable HeapCapture mHeapCapture;
  private @Nullable PerCaptureCallback mCaptureInProgress;

  private static final HashSet<JSCHeapCapture> sRegisteredDumpers = new HashSet<>();

  private static synchronized void registerHeapCapture(JSCHeapCapture dumper) {
    if (sRegisteredDumpers.contains(dumper)) {
      throw new RuntimeException(
        "a JSCHeapCapture registered more than once");
    }
    sRegisteredDumpers.add(dumper);
  }

  private static synchronized void unregisterHeapCapture(JSCHeapCapture dumper) {
    sRegisteredDumpers.remove(dumper);
  }

  public static synchronized void captureHeap(String path, final CaptureCallback callback) {
    final LinkedList<File> captureFiles = new LinkedList<>();
    final LinkedList<CaptureException> captureFailures = new LinkedList<>();

    if (sRegisteredDumpers.isEmpty()) {
      captureFailures.add(new CaptureException("No JSC registered"));
      callback.onComplete(captureFiles, captureFailures);
      return;
    }

    int disambiguate = 0;
    File f = new File(path + "/capture" + Integer.toString(disambiguate) + ".json");
    while (f.delete()) {
      disambiguate++;
      f = new File(path + "/capture" + Integer.toString(disambiguate) + ".json");
    }

    final int numRegisteredDumpers = sRegisteredDumpers.size();
    disambiguate = 0;
    for (JSCHeapCapture dumper : sRegisteredDumpers) {
      File file = new File(path + "/capture" + Integer.toString(disambiguate) + ".json");
      dumper.captureHeapHelper(file, new PerCaptureCallback() {
        @Override
        public void onSuccess(File capture) {
          captureFiles.add(capture);
          if (captureFiles.size() + captureFailures.size() == numRegisteredDumpers) {
            callback.onComplete(captureFiles, captureFailures);
          }
        }
        @Override
        public void onFailure(CaptureException cause) {
          captureFailures.add(cause);
          if (captureFiles.size() + captureFailures.size() == numRegisteredDumpers) {
            callback.onComplete(captureFiles, captureFailures);
          }
        }
      });
    }
  }

  public JSCHeapCapture(ReactApplicationContext reactContext) {
    super(reactContext);
    mHeapCapture = null;
    mCaptureInProgress = null;
  }

  private synchronized void captureHeapHelper(File file, PerCaptureCallback callback) {
    if (mHeapCapture == null) {
      callback.onFailure(new CaptureException("HeapCapture.js module not connected"));
      return;
    }
    if (mCaptureInProgress != null) {
      callback.onFailure(new CaptureException("Heap capture already in progress"));
      return;
    }
    mCaptureInProgress = callback;
    mHeapCapture.captureHeap(file.getPath());
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
