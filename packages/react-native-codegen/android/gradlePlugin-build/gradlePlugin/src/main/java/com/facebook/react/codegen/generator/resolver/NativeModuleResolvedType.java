/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.resolver;

import com.facebook.react.codegen.generator.model.NativeModuleType;
import com.facebook.react.codegen.generator.model.TypeData;
import com.squareup.javapoet.MethodSpec;
import com.squareup.javapoet.TypeName;
import com.squareup.javapoet.TypeSpec;
import java.util.Collections;
import java.util.Map;
import java.util.stream.Collectors;
import javax.annotation.Nullable;
import javax.lang.model.element.Modifier;

public final class NativeModuleResolvedType extends ResolvedType<NativeModuleType> {
  private final Map<String, ResolvedType> mResolvedAliasTypes;
  private final Map<String, ResolvedType> mResolvedPropertyTypes;

  private NativeModuleResolvedType(
      final NativeModuleType type, final TypeData typeData, final boolean nullable) {
    super(type, nullable);
    mResolvedAliasTypes =
        Collections.unmodifiableMap(
            type.aliases.stream()
                .collect(
                    Collectors.toMap(
                        item -> item.getTypeId().typeName,
                        item -> resolveType(item, typeData, false))));
    mResolvedPropertyTypes =
        Collections.unmodifiableMap(
            type.properties.stream()
                .collect(
                    Collectors.toMap(
                        item -> item.name,
                        // TODO: Optional Object property is not necessarily nullable.
                        item -> resolveType(item.type, typeData, item.optional))));
  }

  public static NativeModuleResolvedType create(
      final NativeModuleType type, final TypeData typeData, final boolean nullable) {
    return new NativeModuleResolvedType(type, typeData, nullable);
  }

  @Override
  public TypeName getNativeType(final NativeTypeContext typeContext) {
    throw new UnsupportedOperationException(
        "NativeModuleType cannot be referred to by other types.");
  }

  @Override
  public @Nullable TypeSpec getGeneratedCode(final String packageName) {
    // TODO: Remove this placeholder implementation.
    final MethodSpec main =
        MethodSpec.methodBuilder("main")
            .addModifiers(Modifier.PUBLIC, Modifier.STATIC)
            .returns(void.class)
            .addParameter(String[].class, "args")
            .addStatement("$T.out.println($S)", System.class, "Hello, JavaPoet!")
            .build();

    return TypeSpec.classBuilder(mType.getTypeId().typeName)
        .addModifiers(Modifier.PUBLIC, Modifier.FINAL)
        .addMethod(main)
        .build();
  }
}
