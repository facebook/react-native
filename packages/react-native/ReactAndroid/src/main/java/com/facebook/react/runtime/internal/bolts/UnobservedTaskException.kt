/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime.internal.bolts

/** Used to signify that a Task's error went unobserved. */
internal class UnobservedTaskException(cause: Throwable?) : RuntimeException(cause) {}
