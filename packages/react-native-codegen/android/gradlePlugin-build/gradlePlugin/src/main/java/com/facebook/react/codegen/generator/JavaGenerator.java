/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator;

import com.facebook.react.codegen.generator.model.RawSchema;
import com.squareup.javapoet.JavaFile;
import com.squareup.javapoet.MethodSpec;
import com.squareup.javapoet.TypeSpec;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import javax.lang.model.element.Modifier;

// TODO: Implement proper generator - this is a sample usage of JavaPoet
public final class JavaGenerator {
  private final File mSchemaFile;
  private final String mJavaPackageName;
  private final File mOutputDir;

  public JavaGenerator(final File schemaFile, final String javaPackageName, final File outputDir) {
    mSchemaFile = schemaFile;
    mJavaPackageName = javaPackageName;
    mOutputDir = outputDir;
  }

  public void build() throws FileNotFoundException, IOException {
    final RawSchema rawSchema = SchemaJsonParser.parse(mSchemaFile);
    // TODO (T71663018): remove - this is for debugging
    System.out.println(rawSchema);

    final MethodSpec main =
        MethodSpec.methodBuilder("main")
            .addModifiers(Modifier.PUBLIC, Modifier.STATIC)
            .returns(void.class)
            .addParameter(String[].class, "args")
            .addStatement("$T.out.println($S)", System.class, "Hello, JavaPoet!")
            .build();

    final TypeSpec helloWorld =
        TypeSpec.classBuilder("ReactNativeCodegen")
            .addModifiers(Modifier.PUBLIC, Modifier.FINAL)
            .addMethod(main)
            .build();

    final JavaFile javaFile = JavaFile.builder(mJavaPackageName, helloWorld).build();

    javaFile.writeTo(mOutputDir);
  }
}
