/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.model;

import java.util.Collections;
import java.util.List;

public final class ObjectType extends Type {
  public static final String TYPE_NAME = "ObjectTypeAnnotation";

  public static class Property {
    public final String name;
    public final Type type;
    public final boolean optional;

    public Property(String name, Type type, boolean optional) {
      this.name = name;
      this.type = type;
      this.optional = optional;
    }

    @Override
    public String toString() {
      return (optional ? "?" : "") + name + ": " + type;
    }
  }

  public final List<Property> properties;

  public ObjectType(final TypeId typeId, final List<Property> properties) {
    super(typeId);
    this.properties = Collections.unmodifiableList(properties);
  }

  @Override
  public String toString() {
    return getTypeId() + " -> " + properties;
  }
}
