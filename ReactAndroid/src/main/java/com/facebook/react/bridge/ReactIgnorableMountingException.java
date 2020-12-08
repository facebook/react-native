/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

/**
 * If thrown during a MountItem execution, FabricUIManager will print diagnostics and ignore the
 * error. Use this carefully and sparingly!
 */
public class ReactIgnorableMountingException extends RuntimeException {
  public ReactIgnorableMountingException(String m) {
    super(m);
  }

  public ReactIgnorableMountingException(String m, Throwable e) {
    super(m, e);
  }

  public ReactIgnorableMountingException(Throwable e) {
    super(e);
  }

  public static boolean isIgnorable(Throwable e) {
    while (e != null) {
      if (e instanceof ReactIgnorableMountingException) {
        return true;
      }
      e = e.getCause();
    }
    return false;
  }
}
