/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.resolver;

import com.facebook.react.codegen.generator.model.AliasType;
import com.facebook.react.codegen.generator.model.AnyType;
import com.facebook.react.codegen.generator.model.ArrayType;
import com.facebook.react.codegen.generator.model.BooleanType;
import com.facebook.react.codegen.generator.model.FunctionType;
import com.facebook.react.codegen.generator.model.GenericObjectType;
import com.facebook.react.codegen.generator.model.NativeModuleType;
import com.facebook.react.codegen.generator.model.NullableType;
import com.facebook.react.codegen.generator.model.NumberType;
import com.facebook.react.codegen.generator.model.ObjectType;
import com.facebook.react.codegen.generator.model.PromiseType;
import com.facebook.react.codegen.generator.model.ReservedFunctionValueType;
import com.facebook.react.codegen.generator.model.StringType;
import com.facebook.react.codegen.generator.model.Type;
import com.facebook.react.codegen.generator.model.TypeData;
import com.facebook.react.codegen.generator.model.VoidType;

public final class TypeResolver {
  public static ResolvedType resolveType(
      final Type type, final TypeData typeData, final boolean nullable) {

    if (type instanceof AliasType) {
      return AliasResolvedType.create((AliasType) type, typeData, nullable);
    }

    if (type instanceof AnyType) {
      return AnyResolvedType.create((AnyType) type, typeData, nullable);
    }

    if (type instanceof ArrayType) {
      return ArrayResolvedType.create((ArrayType) type, typeData, nullable);
    }

    if (type instanceof BooleanType) {
      return BooleanResolvedType.create((BooleanType) type, typeData, nullable);
    }

    if (type instanceof FunctionType) {
      return FunctionResolvedType.create((FunctionType) type, typeData, nullable);
    }

    if (type instanceof GenericObjectType) {
      return GenericObjectResolvedType.create((GenericObjectType) type, typeData, nullable);
    }

    if (type instanceof NativeModuleType) {
      return NativeModuleResolvedType.create((NativeModuleType) type, typeData, nullable);
    }

    if (type instanceof NullableType) {
      return NullableResolvedType.create((NullableType) type, typeData, nullable);
    }

    if (type instanceof NumberType) {
      return NumberResolvedType.create((NumberType) type, typeData, nullable);
    }

    if (type instanceof ObjectType) {
      return ObjectResolvedType.create((ObjectType) type, typeData, nullable);
    }

    if (type instanceof PromiseType) {
      return PromiseResolvedType.create((PromiseType) type, typeData, nullable);
    }

    if (type instanceof ReservedFunctionValueType) {
      return ReservedFunctionValueResolvedType.create(
          (ReservedFunctionValueType) type, typeData, nullable);
    }

    if (type instanceof StringType) {
      return StringResolvedType.create((StringType) type, typeData, nullable);
    }

    if (type instanceof VoidType) {
      return VoidResolvedType.create((VoidType) type, typeData, nullable);
    }

    throw new IllegalArgumentException("Unable to resolve unsupported type: " + type.getClass());
  }
}
