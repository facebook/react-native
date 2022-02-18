/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.model;

public final class ArrayType extends Type {
  public static final String TYPE_NAME = "ArrayTypeAnnotation";

  public final Type elementType;

  public ArrayType(final TypeId typeId, final Type elementType) {
    super(typeId);
    this.elementType = elementType;
  }
}
