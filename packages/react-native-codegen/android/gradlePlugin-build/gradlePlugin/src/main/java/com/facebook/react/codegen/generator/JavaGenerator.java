/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator;

import com.facebook.react.codegen.generator.model.TypeData;
import com.facebook.react.codegen.generator.resolver.ResolvedType;
import com.facebook.react.codegen.generator.resolver.TypeResolver;
import com.squareup.javapoet.JavaFile;
import com.squareup.javapoet.TypeSpec;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;

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
    TypeData typeData = SchemaJsonParser.parse(mSchemaFile);
    typeData
        .getAllTypes()
        .forEach(
            t -> {
              ResolvedType resolvedType =
                  TypeResolver.resolveType(typeData.getType(t), typeData, false);
              TypeSpec spec = resolvedType.getGeneratedCode(mJavaPackageName);
              if (spec != null) {
                final JavaFile javaFile = JavaFile.builder(mJavaPackageName, spec).build();
                System.out.println(javaFile.toString());
                try {
                  javaFile.writeTo(mOutputDir);
                } catch (IOException ex) {
                  // TODO: Handle this in a different way.
                }
              }
            });
  }
}
