/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.debug.holder;

/** Holder for debugging tool instance. */
public class PrinterHolder {

  private static Printer sPrinter = NoopPrinter.INSTANCE;

  public static void setPrinter(Printer printer) {
    if (printer == null) {
      sPrinter = NoopPrinter.INSTANCE;
    } else {
      sPrinter = printer;
    }
  }

  public static Printer getPrinter() {
    return sPrinter;
  }
}
