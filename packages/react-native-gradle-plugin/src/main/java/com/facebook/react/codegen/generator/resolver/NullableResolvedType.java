/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.resolver;

import com.facebook.react.codegen.generator.model.NullableType;
import com.facebook.react.codegen.generator.model.TypeData;
import com.squareup.javapoet.TypeName;
import com.squareup.javapoet.TypeSpec;
import javax.annotation.Nullable;

public final class NullableResolvedType extends ResolvedType<NullableType> {

  private NullableResolvedType(final NullableType type, final boolean nullable) {
    super(type, nullable);
    throw new UnsupportedOperationException();
  }

  public static ResolvedType create(
      final NullableType type, final TypeData typeData, final boolean nullable) {
    return resolveType(type.innerType, typeData, true);
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
