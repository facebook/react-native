/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator;

import com.squareup.javapoet.JavaFile;
import com.squareup.javapoet.MethodSpec;
import com.squareup.javapoet.TypeSpec;
import java.io.IOException;
import java.nio.file.Paths;
import javax.lang.model.element.Modifier;

// TODO: Implement proper generator - this is a sample usage of JavaPoet
public final class JavaGenerator {

  private String mSchemaFilePath;
  private String mOutputDir;

  public JavaGenerator(String schemaFilePath, String outputDir) {
    mSchemaFilePath = schemaFilePath;
    mOutputDir = outputDir;
  }

  public void build() throws IOException {
    MethodSpec main =
        MethodSpec.methodBuilder("main")
            .addModifiers(Modifier.PUBLIC, Modifier.STATIC)
            .returns(void.class)
            .addParameter(String[].class, "args")
            .addStatement("$T.out.println($S)", System.class, "Hello, JavaPoet!")
            .build();

    TypeSpec helloWorld =
        TypeSpec.classBuilder("ReactNativeCodegen")
            .addModifiers(Modifier.PUBLIC, Modifier.FINAL)
            .addMethod(main)
            .build();

    JavaFile javaFile = JavaFile.builder("com.facebook.react.codegen", helloWorld).build();

    System.out.println(javaFile.toString());

    if (!mOutputDir.isEmpty()) {
      javaFile.writeToPath(Paths.get(mOutputDir));
    }
  }
}
