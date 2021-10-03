/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.resolver;

import com.facebook.react.codegen.generator.model.Type;
import com.facebook.react.codegen.generator.model.TypeData;
import com.squareup.javapoet.TypeName;
import com.squareup.javapoet.TypeSpec;
import javax.annotation.Nullable;

public abstract class ResolvedType<T extends Type> {
  /** Contexts native types can appear in. */
  public enum NativeTypeContext {
    FUNCTION_ARGUMENT,
    FUNCTION_RETURN,
    DEFAULT,
  }

  protected final T mType;
  protected final boolean mNullable;

  protected ResolvedType(final T type, final boolean nullable) {
    mType = type;
    mNullable = nullable;
  }

  protected static ResolvedType resolveType(
      final Type type, final TypeData typeData, final boolean nullable) {
    return TypeResolver.resolveType(type, typeData, nullable);
  }

  public T getType() {
    return mType;
  }

  public boolean isNullable() {
    return mNullable;
  }

  /** The Java type generated for this type */
  public abstract TypeName getNativeType(NativeTypeContext typeContext);

  /** Generate code for this type itself, if applicable. */
  public @Nullable TypeSpec getGeneratedCode(final String packageName) {
    return null;
  }
}
