/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.model;

import java.util.Objects;

public abstract class Type {
  public static String TYPE_NAME = "<NONE>";

  protected final TypeId mTypeId;

  public static <T extends Type> void assertType(
      final Type type, final Class<T> expectedTypeClass) {
    if (!expectedTypeClass.isInstance(type)) {
      throw new IllegalStateException(
          "Expected: " + expectedTypeClass.getName() + " but found: " + type.getClass().getName());
    }
  }

  public Type(final TypeId typeId) {
    mTypeId = typeId;
  }

  public TypeId getTypeId() {
    return mTypeId;
  }

  @Override
  public String toString() {
    return mTypeId.toString();
  }

  @Override
  public boolean equals(final Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    final Type type = (Type) o;
    return Objects.equals(mTypeId, type.mTypeId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(mTypeId);
  }
}
