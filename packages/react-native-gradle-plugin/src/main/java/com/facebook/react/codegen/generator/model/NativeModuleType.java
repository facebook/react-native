/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.model;

import java.util.Collections;
import java.util.List;

public final class NativeModuleType extends Type {
  public static String TYPE_NAME = "<NONE>"; // Not an actual type in the schema.

  public final List<Type> aliases;
  public final List<Property> properties;

  public static class Property {
    public final String name;
    public final FunctionType type;
    public final boolean optional;

    public Property(final String name, final Type type, final boolean optional) {
      assertType(type, FunctionType.class);
      this.name = name;
      this.type = (FunctionType) type;
      this.optional = optional;
    }

    @Override
    public String toString() {
      return name + ": " + (this.optional ? "?" : "") + type;
    }
  }

  public NativeModuleType(
      final TypeId typeId, final List<Type> aliases, final List<Property> properties) {
    super(typeId);
    this.aliases = Collections.unmodifiableList(aliases);
    this.properties = Collections.unmodifiableList(properties);
  }

  @Override
  public String toString() {
    return getTypeId() + "\n  aliases: " + aliases + "\n  properties: " + properties;
  }
}
