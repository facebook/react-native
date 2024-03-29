/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import com.facebook.infer.annotation.Nullsafe;

@Nullsafe(Nullsafe.Mode.LOCAL)
public class ReactInvalidPropertyException extends RuntimeException {

  public ReactInvalidPropertyException(String property, String value, String expectedValues) {
    super(
        "Invalid React property `"
            + property
            + "` with value `"
            + value
            + "`, expected "
            + expectedValues);
  }
}
