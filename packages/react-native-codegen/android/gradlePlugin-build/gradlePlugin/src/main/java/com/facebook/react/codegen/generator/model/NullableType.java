/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.model;

public final class NullableType extends Type {
  public static final String TYPE_NAME = "NullableTypeAnnotation";

  public final Type referredType;

  public NullableType(final TypeId typeId, final Type referredType) {
    super(typeId);
    this.referredType = referredType;
  }
}
