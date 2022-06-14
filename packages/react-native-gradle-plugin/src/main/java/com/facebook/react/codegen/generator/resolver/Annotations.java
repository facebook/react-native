/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.resolver;

import com.squareup.javapoet.AnnotationSpec;
import javax.annotation.Nullable;

public class Annotations {
  public static final AnnotationSpec OVERRIDE = AnnotationSpec.builder(Override.class).build();
  public static final AnnotationSpec NULLABLE = AnnotationSpec.builder(Nullable.class).build();
}
