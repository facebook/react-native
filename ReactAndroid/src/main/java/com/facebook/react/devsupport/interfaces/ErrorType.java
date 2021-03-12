/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.interfaces;

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
