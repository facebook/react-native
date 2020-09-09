/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.model;

public final class ReservedFunctionValueType extends Type {
  public static final String TYPE_NAME = "ReservedFunctionValueTypeAnnotation";

  public enum ReservedName {
    RootTag,
  }

  public ReservedName reservedName;

  public ReservedFunctionValueType(final TypeId typeId, ReservedName reservedName) {
    super(typeId);
    this.reservedName = reservedName;
  }

  @Override
  public String toString() {
    return mTypeId + "(" + reservedName.toString() + ")";
  }
}
