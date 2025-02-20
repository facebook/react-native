/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.processing;

import com.facebook.annotationprocessors.common.ProcessorBase;
import com.facebook.react.common.annotations.internal.LegacyArchitecture;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import javax.annotation.processing.RoundEnvironment;
import javax.annotation.processing.SupportedAnnotationTypes;
import javax.annotation.processing.SupportedSourceVersion;
import javax.lang.model.SourceVersion;
import javax.lang.model.element.Element;
import javax.lang.model.element.TypeElement;

@SupportedAnnotationTypes("com.facebook.react.common.annotations.internal.LegacyArchitecture")
@SupportedSourceVersion(SourceVersion.RELEASE_11)
public class ReactLegacyArchitectureProcessor extends ProcessorBase {

  @Override
  protected boolean processImpl(Set<? extends TypeElement> annotations, RoundEnvironment roundEnv) {
    String outputFileName = System.getenv().get("RN_LEGACY_ARCH_OUTPUT_FILE_NAME");
    if (outputFileName == null || outputFileName.trim().isEmpty()) {
      return true;
    }
    Set<? extends Element> elements = roundEnv.getElementsAnnotatedWith(LegacyArchitecture.class);
    List<String> classes = new ArrayList<>();

    for (Element element : elements) {
      TypeElement classType = (TypeElement) element;
      String className = classType.getQualifiedName().toString().replace(".", "/");
      classes.add("type L" + className + ";");
    }

    try (FileWriter writer = new FileWriter(outputFileName, true)) {
      for (String clazz : classes) {
        writer.write(clazz + "\n");
      }
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
    return true;
  }
}
