/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.resolver;

import com.facebook.react.codegen.generator.model.AnyType;
import com.facebook.react.codegen.generator.model.TypeData;
import com.squareup.javapoet.TypeName;

public final class AnyResolvedType extends ResolvedType<AnyType> {

  private AnyResolvedType(final AnyType type, final boolean nullable) {
    super(type, nullable);
  }

  public static AnyResolvedType create(
      final AnyType type, final TypeData typeData, final boolean nullable) {
    return new AnyResolvedType(type, nullable);
  }

  @Override
  public TypeName getNativeType(final NativeTypeContext typeContext) {
    switch (typeContext) {
      case FUNCTION_ARGUMENT:
        return TypeUtils.makeNullable(ReactClassNames.REACT_READABLE_MAP, mNullable);
      case FUNCTION_RETURN:
        return TypeUtils.makeNullable(ReactClassNames.REACT_WRITABLE_MAP, mNullable);
      default:
        return TypeUtils.makeNullable(TypeName.OBJECT, mNullable);
    }
  }
}
