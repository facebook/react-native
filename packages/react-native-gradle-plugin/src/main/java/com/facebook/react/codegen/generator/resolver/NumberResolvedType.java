/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.resolver;

import com.facebook.react.codegen.generator.model.CodegenException;
import com.facebook.react.codegen.generator.model.DoubleType;
import com.facebook.react.codegen.generator.model.FloatType;
import com.facebook.react.codegen.generator.model.Int32Type;
import com.facebook.react.codegen.generator.model.NumberType;
import com.facebook.react.codegen.generator.model.TypeData;
import com.squareup.javapoet.TypeName;

public final class NumberResolvedType extends ResolvedType<NumberType> {

  private NumberResolvedType(final NumberType type, final boolean nullable) {
    super(type, nullable);
  }

  public static NumberResolvedType create(
      final NumberType type, final TypeData typeData, final boolean nullable) {
    return new NumberResolvedType(type, nullable);
  }

  @Override
  public TypeName getNativeType(final NativeTypeContext typeContext) {
    if (mType instanceof Int32Type) {
      return TypeUtils.makeNullable(TypeName.INT, mNullable);
    }
    if (mType instanceof FloatType) {
      return TypeUtils.makeNullable(TypeName.FLOAT, mNullable);
    }
    if (mType instanceof DoubleType) {
      return TypeUtils.makeNullable(TypeName.DOUBLE, mNullable);
    }
    throw new CodegenException("Unsupported NumberType: " + mType.getClass());
  }
}
