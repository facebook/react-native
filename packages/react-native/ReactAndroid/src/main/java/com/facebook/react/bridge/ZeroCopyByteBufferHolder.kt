/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.jni.HybridClassBase
import com.facebook.proguard.annotations.DoNotStrip

/**
 * Retains a native [jsi::MutableBuffer] owner while TurboModule JNI passes a zero-copy
 * [java.nio.ByteBuffer] view to Java.
 */
@DoNotStrip
internal class ZeroCopyByteBufferHolder @DoNotStrip private constructor() : HybridClassBase()
