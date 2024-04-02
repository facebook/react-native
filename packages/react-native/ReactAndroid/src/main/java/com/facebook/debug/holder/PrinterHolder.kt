/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.debug.holder

/** Holder for debugging tool instance. */
public object PrinterHolder {
  @JvmStatic public var printer: Printer = NoopPrinter
}
