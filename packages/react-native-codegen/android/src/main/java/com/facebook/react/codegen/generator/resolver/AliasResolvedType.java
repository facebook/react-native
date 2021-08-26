/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.resolver;

import com.facebook.react.codegen.generator.model.AliasType;
import com.facebook.react.codegen.generator.model.AnyType;
import com.facebook.react.codegen.generator.model.Type;
import com.facebook.react.codegen.generator.model.TypeData;
import com.squareup.javapoet.TypeName;
import com.squareup.javapoet.TypeSpec;
import javax.annotation.Nullable;

public final class AliasResolvedType extends ResolvedType<AliasType> {

  private AliasResolvedType(final AliasType type, final boolean nullable) {
    super(type, nullable);
    throw new UnsupportedOperationException();
  }

  public static ResolvedType create(
      final AliasType type, final TypeData typeData, final boolean nullable) {
    Type referredType = typeData.getType(type.referredTypeId);
    if (referredType != null) {
      return resolveType(referredType, typeData, nullable);
    }
    return resolveType(new AnyType(type.getTypeId()), typeData, nullable);
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
