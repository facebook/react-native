/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.resolver;

import com.facebook.react.codegen.generator.model.BooleanType;
import com.facebook.react.codegen.generator.model.TypeData;
import com.squareup.javapoet.TypeName;

public final class BooleanResolvedType extends ResolvedType<BooleanType> {

  private BooleanResolvedType(final BooleanType type, final boolean nullable) {
    super(type, nullable);
  }

  public static BooleanResolvedType create(
      final BooleanType type, final TypeData typeData, final boolean nullable) {
    return new BooleanResolvedType(type, nullable);
  }

  @Override
  public TypeName getNativeType(final NativeTypeContext typeContext) {
    return TypeUtils.makeNullable(TypeName.BOOLEAN, mNullable);
  }
}
