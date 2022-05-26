/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.module.processing;

import static javax.lang.model.element.Modifier.PUBLIC;
import static javax.tools.Diagnostic.Kind.ERROR;

import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.SuppressFieldNotInitialized;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.module.annotations.ReactModuleList;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.squareup.javapoet.ClassName;
import com.squareup.javapoet.CodeBlock;
import com.squareup.javapoet.JavaFile;
import com.squareup.javapoet.MethodSpec;
import com.squareup.javapoet.ParameterizedTypeName;
import com.squareup.javapoet.TypeName;
import com.squareup.javapoet.TypeSpec;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.annotation.processing.AbstractProcessor;
import javax.annotation.processing.Filer;
import javax.annotation.processing.Messager;
import javax.annotation.processing.ProcessingEnvironment;
import javax.annotation.processing.RoundEnvironment;
import javax.annotation.processing.SupportedAnnotationTypes;
import javax.annotation.processing.SupportedSourceVersion;
import javax.lang.model.SourceVersion;
import javax.lang.model.element.Element;
import javax.lang.model.element.ElementKind;
import javax.lang.model.element.Modifier;
import javax.lang.model.element.TypeElement;
import javax.lang.model.type.MirroredTypesException;
import javax.lang.model.type.TypeMirror;
import javax.lang.model.util.Elements;
import javax.lang.model.util.Types;

/**
 * Generates a list of ReactModuleInfo for modules annotated with {@link ReactModule} in {@link
 * ReactPackage}s annotated with {@link ReactModuleList}.
 */
@SupportedAnnotationTypes({
  "com.facebook.react.module.annotations.ReactModule",
  "com.facebook.react.module.annotations.ReactModuleList",
})
@SupportedSourceVersion(SourceVersion.RELEASE_7)
public class ReactModuleSpecProcessor extends AbstractProcessor {

  private static final TypeName COLLECTIONS_TYPE = ParameterizedTypeName.get(Collections.class);
  private static final TypeName MAP_TYPE =
      ParameterizedTypeName.get(Map.class, String.class, ReactModuleInfo.class);
  private static final TypeName INSTANTIATED_MAP_TYPE = ParameterizedTypeName.get(HashMap.class);

  @SuppressFieldNotInitialized private Filer mFiler;
  @SuppressFieldNotInitialized private Elements mElements;
  @SuppressFieldNotInitialized private Messager mMessager;
  private Types mTypes;

  @Override
  public synchronized void init(ProcessingEnvironment processingEnv) {
    super.init(processingEnv);

    mFiler = processingEnv.getFiler();
    mElements = processingEnv.getElementUtils();
    mMessager = processingEnv.getMessager();
    mTypes = processingEnv.getTypeUtils();
  }

  @Override
  public boolean process(Set<? extends TypeElement> annotations, RoundEnvironment roundEnv) {
    Set<? extends Element> reactModuleListElements =
        roundEnv.getElementsAnnotatedWith(ReactModuleList.class);
    for (Element reactModuleListElement : reactModuleListElements) {
      if (!(reactModuleListElement instanceof TypeElement)) {
        continue;
      }

      TypeElement typeElement = (TypeElement) reactModuleListElement;

      ReactModuleList reactModuleList = null;
      try {
        reactModuleList = typeElement.getAnnotation(ReactModuleList.class);
      } catch (Exception ex) {
        FLog.i(
            ReactConstants.TAG, "Could not reactModuleList from typeElement.getAnnotation()", ex);
        throw ex;
      }

      if (reactModuleList == null) {
        continue;
      }

      ClassName className = ClassName.get(typeElement);
      String packageName = ClassName.get(typeElement).packageName();
      String fileName = className.simpleName();

      List<String> nativeModules = new ArrayList<>();
      try {
        reactModuleList.nativeModules(); // throws MirroredTypesException
      } catch (MirroredTypesException mirroredTypesException) {
        List<? extends TypeMirror> typeMirrors = mirroredTypesException.getTypeMirrors();
        for (TypeMirror typeMirror : typeMirrors) {
          nativeModules.add(typeMirror.toString());
        }
      }

      MethodSpec getReactModuleInfosMethod;
      try {
        getReactModuleInfosMethod =
            MethodSpec.methodBuilder("getReactModuleInfos")
                .addAnnotation(Override.class)
                .addModifiers(PUBLIC)
                .addCode(getCodeBlockForReactModuleInfos(nativeModules))
                .returns(MAP_TYPE)
                .build();
      } catch (ReactModuleSpecException reactModuleSpecException) {
        mMessager.printMessage(ERROR, reactModuleSpecException.mMessage);
        return false;
      }

      TypeSpec reactModulesInfosTypeSpec =
          TypeSpec.classBuilder(fileName + "$$ReactModuleInfoProvider")
              .addModifiers(Modifier.PUBLIC)
              .addMethod(getReactModuleInfosMethod)
              .addSuperinterface(ReactModuleInfoProvider.class)
              .build();

      JavaFile javaFile =
          JavaFile.builder(packageName, reactModulesInfosTypeSpec)
              .addFileComment("Generated by " + getClass().getName())
              .build();

      try {
        javaFile.writeTo(mFiler);
      } catch (IOException e) {
        e.printStackTrace();
      }
    }

    return true;
  }

  private CodeBlock getCodeBlockForReactModuleInfos(List<String> nativeModules)
      throws ReactModuleSpecException {
    final CodeBlock.Builder builder = CodeBlock.builder();
    if (nativeModules == null || nativeModules.isEmpty()) {
      builder.addStatement("return $T.emptyMap()", COLLECTIONS_TYPE);
    } else {
      builder.addStatement("$T map = new $T()", MAP_TYPE, INSTANTIATED_MAP_TYPE);

      String turboModuleInterfaceCanonicalName =
          "com.facebook.react.turbomodule.core.interfaces.TurboModule";
      TypeMirror turboModuleInterface =
          mElements.getTypeElement(turboModuleInterfaceCanonicalName).asType();

      if (turboModuleInterface == null) {
        throw new RuntimeException(
            "com.facebook.react.turbomodule.core.interfaces.TurboModule interface not found.");
      }

      for (String nativeModule : nativeModules) {
        String keyString = nativeModule;

        TypeElement typeElement = mElements.getTypeElement(nativeModule);
        if (typeElement == null) {
          throw new ReactModuleSpecException(
              keyString
                  + " not found by ReactModuleSpecProcessor. "
                  + "Did you misspell the module?");
        }

        ReactModule reactModule = typeElement.getAnnotation(ReactModule.class);
        if (reactModule == null) {
          throw new ReactModuleSpecException(
              keyString
                  + " not found by ReactModuleSpecProcessor. "
                  + "Did you forget to add the @ReactModule annotation to the native module?");
        }

        boolean isTurboModule;
        try {
          isTurboModule = mTypes.isAssignable(typeElement.asType(), turboModuleInterface);
        } catch (Exception ex) {
          throw new RuntimeException(
              "Failed to check if "
                  + nativeModule
                  + " is type-assignable to "
                  + turboModuleInterfaceCanonicalName);
        }

        List<? extends Element> elements = typeElement.getEnclosedElements();
        boolean hasConstants = false;
        if (elements != null) {
          hasConstants =
              elements.stream()
                  .filter(element -> element.getKind() == ElementKind.METHOD)
                  .map(Element::getSimpleName)
                  .anyMatch(
                      name ->
                          name.contentEquals("getConstants")
                              || name.contentEquals("getTypedExportedConstants"));
        }

        String valueString =
            new StringBuilder()
                .append("new ReactModuleInfo(")
                .append("\"")
                .append(reactModule.name())
                .append("\"")
                .append(", ")
                .append("\"")
                .append(keyString)
                .append("\"")
                .append(", ")
                .append(reactModule.canOverrideExistingModule())
                .append(", ")
                .append(reactModule.needsEagerInit())
                .append(", ")
                .append(hasConstants)
                .append(", ")
                .append(reactModule.isCxxModule())
                .append(", ")
                .append(isTurboModule)
                .append(")")
                .toString();

        builder.addStatement("map.put(\"" + reactModule.name() + "\", " + valueString + ")");
      }
      builder.addStatement("return map");
    }
    return builder.build();
  }

  private static class ReactModuleSpecException extends Exception {

    public final String mMessage;

    public ReactModuleSpecException(String message) {
      mMessage = message;
    }
  }
}
