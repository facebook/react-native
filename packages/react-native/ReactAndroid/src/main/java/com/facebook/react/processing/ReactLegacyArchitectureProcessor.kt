/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.processing

import com.facebook.annotationprocessors.common.ProcessorBase
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import java.io.FileWriter
import java.io.IOException
import javax.annotation.processing.RoundEnvironment
import javax.annotation.processing.SupportedAnnotationTypes
import javax.annotation.processing.SupportedSourceVersion
import javax.lang.model.SourceVersion
import javax.lang.model.element.TypeElement

@SupportedAnnotationTypes("com.facebook.react.common.annotations.internal.LegacyArchitecture")
@SupportedSourceVersion(SourceVersion.RELEASE_11)
class ReactLegacyArchitectureProcessor : ProcessorBase() {
  override fun processImpl(annotations: Set<TypeElement>, roundEnv: RoundEnvironment): Boolean {
    val outputFileName = System.getenv()["RN_LEGACY_ARCH_OUTPUT_FILE_PATH"]
    if (outputFileName.isNullOrEmpty()) {
      return true
    }
    val elements = roundEnv.getElementsAnnotatedWith(LegacyArchitecture::class.java)
    val classes: MutableList<String> = mutableListOf()

    elements.forEach { element ->
      val classType = element as TypeElement
      val className = classType.qualifiedName.toString().replace(".", "/")
      classes.add("type L$className;")
    }

    try {
      FileWriter(outputFileName, true).use { writer ->
        for (clazz in classes) {
          writer.write(clazz + "\n")
        }
      }
    } catch (e: IOException) {
      throw RuntimeException(e)
    }
    return true
  }
}
