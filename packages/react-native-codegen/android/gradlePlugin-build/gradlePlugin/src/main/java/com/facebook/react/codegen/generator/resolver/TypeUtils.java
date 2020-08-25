/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.resolver;

import com.squareup.javapoet.AnnotationSpec;
import com.squareup.javapoet.ParameterizedTypeName;
import com.squareup.javapoet.TypeName;
import com.squareup.javapoet.TypeVariableName;
import javax.annotation.Nullable;

public class TypeUtils {

  public static class Annotations {
    public static final AnnotationSpec OVERRIDE = AnnotationSpec.builder(Override.class).build();
    public static final AnnotationSpec NULLABLE = AnnotationSpec.builder(Nullable.class).build();
  }

  public static TypeName getNativeClassName(TypeName className) {
    while (className instanceof ParameterizedTypeName) {
      className = ((ParameterizedTypeName) className).rawType;
    }

    return (className instanceof TypeVariableName) ? TypeName.OBJECT : className.box();
  }

  public static TypeName makeNullable(TypeName typeName, boolean isNullable) {
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
}
