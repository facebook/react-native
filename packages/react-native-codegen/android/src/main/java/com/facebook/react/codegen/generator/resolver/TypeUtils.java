/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.resolver;

import com.facebook.react.codegen.generator.model.CodegenException;
import com.squareup.javapoet.ParameterizedTypeName;
import com.squareup.javapoet.TypeName;
import com.squareup.javapoet.TypeVariableName;

public class TypeUtils {

  public static TypeName getNativeClassName(TypeName className) {
    while (className instanceof ParameterizedTypeName) {
      className = ((ParameterizedTypeName) className).rawType;
    }

    return (className instanceof TypeVariableName) ? TypeName.OBJECT : className.box();
  }

  public static TypeName makeNullable(final TypeName typeName, final boolean isNullable) {
    if (isNullable) {
      if (typeName.isPrimitive()) {
        return typeName.box();
      }
      if (!typeName.annotations.contains(Annotations.NULLABLE)) {
        return typeName.annotated(Annotations.NULLABLE);
      }
    }
    return typeName;
  }

  public static void assertCondition(final boolean condition, final String errorMessage)
      throws CodegenException {
    if (!condition) {
      throw new CodegenException(errorMessage);
    }
  }
}
