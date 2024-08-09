/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.interfaces;

import com.facebook.infer.annotation.Nullsafe;

@Nullsafe(Nullsafe.Mode.LOCAL)
public enum ErrorType {
  JS("JS"),
  NATIVE("Native");

  private final String name;

  ErrorType(String name) {
    this.name = name;
  }

  public String getName() {
    return name;
  }
}
