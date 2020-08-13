/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.model;

import java.util.Collections;
import java.util.List;
import java.util.Objects;

public final class FunctionType extends Type {

  public static class ArgumentType {
    public final String name;
    public final Type type;

    private ArgumentType(String name, Type type) {
      this.name = name;
      this.type = type;
    }

    @Override
    public boolean equals(Object o) {
      if (this == o) {
        return true;
      }
      if (o == null || getClass() != o.getClass()) {
        return false;
      }

      ArgumentType that = (ArgumentType) o;
      return Objects.equals(this.name, that.name) && Objects.equals(this.type, that.type);
    }

    @Override
    public int hashCode() {
      return Objects.hash(name, type);
    }
  }

  public final List<ArgumentType> parameters;
  public final Type returnType;

  public FunctionType(final TypeId typeId, List<ArgumentType> parameters, Type returnType) {
    super(typeId);
    this.parameters = Collections.unmodifiableList(parameters);
    this.returnType = returnType;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass() || !super.equals(o)) {
      return false;
    }

    FunctionType that = (FunctionType) o;
    return Objects.equals(this.parameters, that.parameters)
        && Objects.equals(this.returnType, that.returnType);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), parameters, returnType);
  }
}
