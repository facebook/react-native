/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.model;

public abstract class NumberType extends Type {
  public static final String TYPE_NAME = "NumberTypeAnnotation";

  public NumberType(final TypeId typeId) {
    super(typeId);
  }
}
