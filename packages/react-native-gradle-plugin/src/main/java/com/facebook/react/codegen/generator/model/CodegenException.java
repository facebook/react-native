/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.model;

public class CodegenException extends RuntimeException {
  private static final long serialVersionUID = 1L;

  public CodegenException(final String message) {
    super(message);
  }
}
