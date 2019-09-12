/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

import java.util.Random;

public class InstanceHandleHelper {

  private static final Random random = new Random();

  public static long randomInstanceHandle() {
    return random.nextLong();
  }
}
