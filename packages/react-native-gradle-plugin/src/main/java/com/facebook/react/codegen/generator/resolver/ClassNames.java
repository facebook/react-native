/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.resolver;

import com.squareup.javapoet.ClassName;
import com.squareup.javapoet.ParameterizedTypeName;
import com.squareup.javapoet.TypeName;
import java.util.Map;

/** Names of Java classes required by generated code. */
public class ClassNames {

  // Java standard classes
  public static final TypeName STRING = ClassName.get(String.class);

  public static final ParameterizedTypeName CONSTANTS_MAP =
      ParameterizedTypeName.get(ClassName.get(Map.class), ClassNames.STRING, ClassName.OBJECT);
}
