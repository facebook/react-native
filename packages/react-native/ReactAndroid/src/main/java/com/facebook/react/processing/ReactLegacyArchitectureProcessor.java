// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

package com.facebook.react.processing;

import com.facebook.annotationprocessors.common.ProcessorBase;
import java.util.Set;
import javax.annotation.processing.RoundEnvironment;
import javax.annotation.processing.SupportedAnnotationTypes;
import javax.annotation.processing.SupportedSourceVersion;
import javax.lang.model.SourceVersion;
import javax.lang.model.element.TypeElement;

@SupportedAnnotationTypes("com.facebook.react.common.annotations.internal.LegacyArchitecture")
@SupportedSourceVersion(SourceVersion.RELEASE_11)
public class ReactLegacyArchitectureProcessor extends ProcessorBase {

  public ReactLegacyArchitectureProcessor() {
    super();
  }

  @Override
  protected boolean processImpl(Set<? extends TypeElement> annotations, RoundEnvironment roundEnv) {
    // Do nothing for now
    return true;
  }
}
