/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.inspector;

import androidx.annotation.Nullable;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStripAny;
import java.util.Map;

/**
 * JNI wrapper for {@code jsinspectormodern::NetworkRequestListener}. Handles the {@code
 * ScopedExecutor} callback use on the C++ side.
 */
@DoNotStripAny
public class InspectorNetworkRequestListener {
  private final HybridData mHybridData;

  public InspectorNetworkRequestListener(HybridData hybridData) {
    mHybridData = hybridData;
  }

  public native void onHeaders(int httpStatusCode, Map<String, String> headers);

  public native void onData(String data);

  public native void onError(@Nullable String message);

  public native void onCompletion();
}
