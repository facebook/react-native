/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

/**
 * Extends RuntimeException so that it may be caught by a
 * [ReactSoftExceptionLogger.ReactSoftExceptionListener]. Any
 * [ReactSoftExceptionLogger.ReactSoftExceptionListener] that catches a ReactNoCrashSoftException
 * should log it only and not crash, no matter what.
 */
public open class ReactNoCrashSoftException : RuntimeException {

  public constructor(m: String) : super(m)

  public constructor(e: Throwable) : super(e)

  public constructor(m: String, e: Throwable?) : super(m, e)
}
