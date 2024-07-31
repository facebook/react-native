/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.annotationprocessors.common

import javax.annotation.processing.AbstractProcessor
import javax.annotation.processing.RoundEnvironment
import javax.lang.model.element.TypeElement

public abstract class ProcessorBase : AbstractProcessor() {

  public fun process(annotations: Set<TypeElement?>?, roundEnv: RoundEnvironment?): Boolean =
      processImpl(annotations, roundEnv)

  protected abstract fun processImpl(
      annotations: Set<TypeElement?>?,
      roundEnv: RoundEnvironment?
  ): Boolean
}
