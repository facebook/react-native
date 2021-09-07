/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.model;

public final class ObjectType extends Type {

  public ObjectType(final TypeId typeId) {
    super(typeId);
  }

  public static class Property {
    public final String propertyName;
    public final Type type;
    public final boolean optional;

    public Property(String propertyName, Type type, boolean optional) {
      this.propertyName = propertyName;
      this.type = type;
      this.optional = optional;
    }

    @Override
    public String toString() {
      return propertyName + " " + type;
    }
  }
}
