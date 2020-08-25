/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.resolver;

import com.facebook.react.codegen.generator.model.FunctionType;
import com.facebook.react.codegen.generator.model.TypeData;
import com.squareup.javapoet.TypeName;
import java.util.Collections;
import java.util.Map;
import java.util.stream.Collectors;

public final class FunctionResolvedType extends ResolvedType<FunctionType> {
  private final Map<String, ResolvedType> mResolvedArgTypes;
  private final ResolvedType mResolvedReturnType;

  private FunctionResolvedType(
      final FunctionType type, final TypeData typeData, final boolean nullable) {
    super(type, nullable);
    mResolvedReturnType = resolveType(type.returnType, typeData, nullable);
    mResolvedArgTypes =
        Collections.unmodifiableMap(
            type.parameters.stream()
                .collect(
                    Collectors.toMap(
                        item -> item.name, item -> resolveType(item.type, typeData, false))));
  }

  public static FunctionResolvedType create(
      final FunctionType type, final TypeData typeData, final boolean nullable) {
    return new FunctionResolvedType(type, typeData, nullable);
  }

  public ResolvedType getResolvedReturnType() {
    return mResolvedReturnType;
  }

  public Map<String, ResolvedType> getResolvedArgTypes() {
    return mResolvedArgTypes;
  }

  @Override
  public TypeName getNativeType(final NativeTypeContext typeContext) {
    return TypeUtils.makeNullable(ReactClassNames.REACT_CALLBACK, mNullable);
  }
}
