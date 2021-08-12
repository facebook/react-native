/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.resolver;

import com.facebook.react.codegen.generator.model.CodegenException;
import com.facebook.react.codegen.generator.model.GenericObjectType;
import com.facebook.react.codegen.generator.model.TypeData;
import com.squareup.javapoet.TypeName;

public final class GenericObjectResolvedType extends ResolvedType<GenericObjectType> {

  private GenericObjectResolvedType(final GenericObjectType type, final boolean nullable) {
    super(type, nullable);
  }

  public static GenericObjectResolvedType create(
      final GenericObjectType type, final TypeData typeData, final boolean nullable) {
    return new GenericObjectResolvedType(type, nullable);
  }

  @Override
  public TypeName getNativeType(final NativeTypeContext typeContext) {
    switch (typeContext) {
      case FUNCTION_ARGUMENT:
        return TypeUtils.makeNullable(ReactClassNames.REACT_READABLE_MAP, mNullable);
      case FUNCTION_RETURN:
        return TypeUtils.makeNullable(ReactClassNames.REACT_WRITABLE_MAP, mNullable);
      default:
        break;
    }

    throw new CodegenException(
        "Unsupported GenericObjectType: " + mType + " - typeContext: " + typeContext);
  }
}
