/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.inspector

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.proguard.annotations.DoNotStripAny

/**
 * JNI wrapper for `jsinspectormodern::NetworkRequestListener`. Handles the `ScopedExecutor`
 * callback use on the C++ side.
 */
@DoNotStripAny
public class InspectorNetworkRequestListener
public constructor(@field:DoNotStrip private val mHybridData: HybridData) {
  public external fun onHeaders(httpStatusCode: Int, headers: Map<String?, String?>?)

  public external fun onData(data: String?)

  public external fun onError(message: String?)

  public external fun onCompletion()
}
