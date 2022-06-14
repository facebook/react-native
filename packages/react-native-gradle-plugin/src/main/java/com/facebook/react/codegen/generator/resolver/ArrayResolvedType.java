/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.resolver;

import com.facebook.react.codegen.generator.model.ArrayType;
import com.facebook.react.codegen.generator.model.TypeData;
import com.squareup.javapoet.ArrayTypeName;
import com.squareup.javapoet.TypeName;

public final class ArrayResolvedType extends ResolvedType<ArrayType> {

  private final ResolvedType mElementResolvedType;

  private ArrayResolvedType(final ArrayType type, final TypeData typeData, final boolean nullable) {
    super(type, nullable);
    mElementResolvedType = resolveType(mType.elementType, typeData, nullable);
  }

  public static ArrayResolvedType create(
      final ArrayType type, final TypeData typeData, final boolean nullable) {
    return new ArrayResolvedType(type, typeData, nullable);
  }

  public ResolvedType getElementResolvedType() {
    return mElementResolvedType;
  }

  @Override
  public TypeName getNativeType(final NativeTypeContext typeContext) {
    switch (typeContext) {
      case FUNCTION_ARGUMENT:
        return TypeUtils.makeNullable(ReactClassNames.REACT_READABLE_ARRAY, mNullable);
      case FUNCTION_RETURN:
        return TypeUtils.makeNullable(ReactClassNames.REACT_WRITABLE_ARRAY, mNullable);
      default:
        return TypeUtils.makeNullable(
            ArrayTypeName.of(mElementResolvedType.getNativeType(typeContext)), mNullable);
    }
  }
}
