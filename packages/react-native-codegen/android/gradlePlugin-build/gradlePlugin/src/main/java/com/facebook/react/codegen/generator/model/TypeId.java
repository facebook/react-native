/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.model;

import java.util.Objects;
import javax.annotation.Nullable;

/** Represents the fully qualified name for a Flow type. */
public final class TypeId {
  public final String moduleName;
  public final String typeName;

  private static final String EMPTY_TYPE_NAME = "";

  private TypeId(final String moduleName, final String typeName) {
    this.moduleName = moduleName;
    this.typeName = typeName;
  }

  public static TypeId of(final String moduleName) {
    return new TypeId(moduleName, EMPTY_TYPE_NAME);
  }

  public static TypeId of(final String moduleName, @Nullable final String typeName) {
    if (typeName == null) {
      return TypeId.of(moduleName);
    }

    if (moduleName.equals(typeName)) {
      return TypeId.of(moduleName);
    }

    return new TypeId(moduleName, typeName);
  }

  public static TypeId of(final TypeId typeId) {
    return of(typeId.moduleName, typeId.typeName);
  }

  public static TypeId expandOf(final TypeId typeId, String suffix) {
    return of(typeId.moduleName, typeId.typeName + suffix);
  }

  @Override
  public String toString() {
    return String.format(
        "<moduleName = %s, typeName = %s>",
        moduleName, EMPTY_TYPE_NAME.equals(typeName) ? "\"\"" : typeName);
  }

  @Override
  public boolean equals(final Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }

    final TypeId typeId = (TypeId) o;
    return Objects.equals(moduleName, typeId.moduleName)
        && Objects.equals(typeName, typeId.typeName);
  }

  @Override
  public int hashCode() {
    return Objects.hash(moduleName, typeName);
  }
}
