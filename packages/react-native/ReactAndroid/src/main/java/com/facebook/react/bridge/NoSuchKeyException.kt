/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.proguard.annotations.DoNotStrip

/** Exception thrown by [ReadableNativeMap] when a key that does not exist is requested. */
@DoNotStrip
public class NoSuchKeyException @DoNotStrip constructor(msg: String) : RuntimeException(msg)
