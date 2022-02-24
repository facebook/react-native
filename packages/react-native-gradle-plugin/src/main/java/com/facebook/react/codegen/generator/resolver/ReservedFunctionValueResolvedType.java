/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.resolver;

import com.facebook.react.codegen.generator.model.CodegenException;
import com.facebook.react.codegen.generator.model.DoubleType;
import com.facebook.react.codegen.generator.model.ReservedFunctionValueType;
import com.facebook.react.codegen.generator.model.TypeData;
import com.squareup.javapoet.TypeName;
import com.squareup.javapoet.TypeSpec;
import javax.annotation.Nullable;

public final class ReservedFunctionValueResolvedType
    extends ResolvedType<ReservedFunctionValueType> {

  private ReservedFunctionValueResolvedType(
      final ReservedFunctionValueType type, final boolean nullable) {
    super(type, nullable);
    throw new UnsupportedOperationException();
  }

  public static ResolvedType create(
      final ReservedFunctionValueType type, final TypeData typeData, final boolean nullable) {
    switch (type.reservedName) {
      case RootTag:
        return resolveType(new DoubleType(type.getTypeId()), typeData, nullable);
      default:
        break;
    }

    throw new CodegenException("Unsupported ReservedFunctionValueType: " + type);
  }

  @Override
  public TypeName getNativeType(final NativeTypeContext typeContext) {
    throw new UnsupportedOperationException();
  }

  @Override
  public @Nullable TypeSpec getGeneratedCode(final String packageName) {
    throw new UnsupportedOperationException();
  }
}
