/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import javax.annotation.Nullable;

import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;

import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

// This module is being called only by Java via the static method "poke" that
// requires it to alreay be initialized, thus we eagerly initialize this module
@ReactModule(name = "JSCSamplingProfiler", needsEagerInit = true)
public class JSCSamplingProfiler extends ReactContextBaseJavaModule {
  public interface SamplingProfiler extends JavaScriptModule {
    void poke(int token);
  }

  public static class ProfilerException extends Exception {
    ProfilerException(String message) {
      super(message);
    }
  }

  private @Nullable SamplingProfiler mSamplingProfiler;
  private boolean mOperationInProgress;
  private int mOperationToken;
  private @Nullable String mOperationError;
  private @Nullable String mSamplingProfilerResult;

  private static final HashSet<JSCSamplingProfiler> sRegisteredDumpers =
    new HashSet<>();

  private static synchronized void registerSamplingProfiler(
      JSCSamplingProfiler dumper) {
    if (sRegisteredDumpers.contains(dumper)) {
      throw new RuntimeException(
        "a JSCSamplingProfiler registered more than once");
    }
    sRegisteredDumpers.add(dumper);
  }

  private static synchronized void unregisterSamplingProfiler(
      JSCSamplingProfiler dumper) {
    sRegisteredDumpers.remove(dumper);
  }

  public static synchronized List<String> poke(long timeout)
      throws ProfilerException {
    LinkedList<String> results = new LinkedList<>();
    if (sRegisteredDumpers.isEmpty()) {
      throw new ProfilerException("No JSC registered");
    }

    for (JSCSamplingProfiler dumper : sRegisteredDumpers) {
      dumper.pokeHelper(timeout);
      results.add(dumper.mSamplingProfilerResult);
    }
    return results;
  }

  public JSCSamplingProfiler(ReactApplicationContext reactContext) {
    super(reactContext);
    mSamplingProfiler = null;
    mOperationInProgress = false;
    mOperationToken = 0;
    mOperationError = null;
    mSamplingProfilerResult = null;
  }

  private synchronized void pokeHelper(long timeout) throws ProfilerException {
    if (mSamplingProfiler == null) {
      throw new ProfilerException("SamplingProfiler.js module not connected");
    }
    mSamplingProfiler.poke(getOperationToken());
    waitForOperation(timeout);
  }

  private int getOperationToken() throws ProfilerException {
    if (mOperationInProgress) {
      throw new ProfilerException("Another operation already in progress.");
    }
    mOperationInProgress = true;
    return ++mOperationToken;
  }

  private void waitForOperation(long timeout) throws ProfilerException {
    try {
      wait(timeout);
    } catch (InterruptedException e) {
      throw new ProfilerException(
          "Waiting for heap capture failed: " + e.getMessage());
    }

    if (mOperationInProgress) {
      mOperationInProgress = false;
      throw new ProfilerException("heap capture timed out.");
    }

    if (mOperationError != null) {
      throw new ProfilerException(mOperationError);
    }
  }

  @ReactMethod
  public synchronized void operationComplete(
      int token, String result, String error) {
    if (token == mOperationToken) {
      mOperationInProgress = false;
      mSamplingProfilerResult = result;
      mOperationError = error;
      this.notify();
    } else {
      throw new RuntimeException("Completed operation is not in progress.");
    }
  }

  @Override
  public String getName() {
    return "JSCSamplingProfiler";
  }

  @Override
  public void initialize() {
    super.initialize();
    mSamplingProfiler =
      getReactApplicationContext().getJSModule(SamplingProfiler.class);
    registerSamplingProfiler(this);
  }

  @Override
  public void onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy();
    unregisterSamplingProfiler(this);
    mSamplingProfiler = null;
  }
}
