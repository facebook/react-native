/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.model;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import javax.annotation.Nullable;

/** A collection of all types information based on the parsed schema. */
public final class TypeData {
  private final Map<TypeId, Type> mTypes = new HashMap<>();

  public void addType(final TypeId typeId, final Type type) throws IllegalStateException {
    if (getType(typeId) != null) {
      throw new IllegalStateException("Found duplicated TypeId: " + typeId + " for: " + type);
    }
    mTypes.put(typeId, type);
  }

  public void addType(final Type type) {
    addType(type.getTypeId(), type);
  }

  public @Nullable Type getType(final TypeId typeId) {
    return mTypes.get(typeId);
  }

  public Set<TypeId> getAllTypes() {
    return mTypes.keySet();
  }

  @Override
  public String toString() {
    final StringBuilder builder = new StringBuilder();
    mTypes.forEach(
        (k, v) -> {
          builder.append(v.toString());
          builder.append("\n");
        });
    return builder.toString();
  }
}
