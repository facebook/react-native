/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.resolver;

import com.facebook.react.codegen.generator.model.TypeData;
import com.facebook.react.codegen.generator.model.VoidType;
import com.squareup.javapoet.TypeName;
import com.squareup.javapoet.TypeSpec;
import javax.annotation.Nullable;

public final class VoidResolvedType extends ResolvedType<VoidType> {

  private VoidResolvedType(final VoidType type, final boolean nullable) {
    super(type, nullable);
  }

  public static VoidResolvedType create(
      final VoidType type, final TypeData typeData, final boolean nullable) {
    return new VoidResolvedType(type, nullable);
  }

  @Override
  public TypeName getNativeType(final NativeTypeContext typeContext) {
    return TypeName.VOID;
  }

  @Override
  public @Nullable TypeSpec getGeneratedCode(final String packageName) {
    throw new UnsupportedOperationException();
  }
}
