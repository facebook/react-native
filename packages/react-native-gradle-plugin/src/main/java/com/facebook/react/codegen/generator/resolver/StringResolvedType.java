/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.resolver;

import com.facebook.react.codegen.generator.model.StringType;
import com.facebook.react.codegen.generator.model.TypeData;
import com.squareup.javapoet.TypeName;

public final class StringResolvedType extends ResolvedType<StringType> {

  private StringResolvedType(final StringType type, final boolean nullable) {
    super(type, nullable);
  }

  public static StringResolvedType create(
      final StringType type, final TypeData typeData, final boolean nullable) {
    return new StringResolvedType(type, nullable);
  }

  @Override
  public TypeName getNativeType(final NativeTypeContext typeContext) {
    return TypeUtils.makeNullable(ClassNames.STRING, mNullable);
  }
}
