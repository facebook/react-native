/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.resolver;

import com.facebook.react.codegen.generator.model.CodegenException;
import com.facebook.react.codegen.generator.model.ObjectType;
import com.facebook.react.codegen.generator.model.TypeData;
import com.squareup.javapoet.TypeName;
import com.squareup.javapoet.TypeSpec;
import java.util.Collections;
import java.util.Map;
import java.util.stream.Collectors;
import javax.annotation.Nullable;

public final class ObjectResolvedType extends ResolvedType<ObjectType> {
  private final Map<String, ResolvedType> mResolvedPropertyTypes;

  private ObjectResolvedType(
      final ObjectType type, final TypeData typeData, final boolean nullable) {
    super(type, nullable);
    mResolvedPropertyTypes =
        Collections.unmodifiableMap(
            type.properties.stream()
                .collect(
                    Collectors.toMap(
                        item -> item.name,
                        // TODO: Optional Object property is not necessarily nullable.
                        item -> resolveType(item.type, typeData, item.optional))));
  }

  public static ObjectResolvedType create(
      final ObjectType type, final TypeData typeData, final boolean nullable) {
    return new ObjectResolvedType(type, typeData, nullable);
  }

  public Map<String, ResolvedType> getResolvedPropertyTypes() {
    return mResolvedPropertyTypes;
  }

  @Override
  public TypeName getNativeType(final NativeTypeContext typeContext) {
    // TODO: It should return its own class type.
    // However, the NativeModule system only supports built-in ReadableMap/WritableMap for now.
    switch (typeContext) {
      case FUNCTION_ARGUMENT:
        return TypeUtils.makeNullable(ReactClassNames.REACT_READABLE_MAP, mNullable);
      case FUNCTION_RETURN:
        return TypeUtils.makeNullable(ReactClassNames.REACT_WRITABLE_MAP, mNullable);
      default:
        break;
    }

    throw new CodegenException(
        "Unsupported ObjectType: " + mType + " - typeContext: " + typeContext);
  }

  @Override
  public @Nullable TypeSpec getGeneratedCode(final String packageName) {
    // TODO: Object type should produce is own class to represent its shape.
    // However, the NativeModule system only supports built-in ReadableMap/WritableMap for now.
    return null;
  }
}
