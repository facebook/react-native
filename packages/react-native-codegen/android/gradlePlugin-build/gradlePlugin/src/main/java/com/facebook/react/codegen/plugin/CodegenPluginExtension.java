/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.plugin;

import com.google.common.base.CaseFormat;
import java.io.File;
import java.util.StringTokenizer;
import org.gradle.api.Project;

public class CodegenPluginExtension {
  // TODO: Remove beta.
  public String codegenJavaPackageName = "com.facebook.fbreact.specs.beta";
  public boolean enableCodegen = false;
  public File jsRootDir;
  public String libraryName;
  public String[] nodeExecutableAndArgs = {"node"};
  public File reactNativeRootDir;
  public boolean useJavaGenerator = false;

  public CodegenPluginExtension(final Project project) {
    this.reactNativeRootDir = new File(project.getRootDir(), "node_modules/react-native");
    this.libraryName = projectPathToLibraryName(project.getPath());
  }

  public File codegenDir() {
    return new File(this.reactNativeRootDir, "packages/react-native-codegen");
  }

  public File codegenGenerateSchemaCLI() {
    return new File(this.codegenDir(), "lib/cli/combine/combine-js-to-schema-cli.js");
  }

  public File codegenGenerateNativeModuleSpecsCLI() {
    return new File(this.reactNativeRootDir, "scripts/generate-native-modules-specs-cli.js");
  }

  private String projectPathToLibraryName(final String projectPath) {
    final StringTokenizer tokenizer = new StringTokenizer(projectPath, ":-_.");
    final StringBuilder nameBuilder = new StringBuilder();

    while (tokenizer.hasMoreTokens()) {
      nameBuilder.append(CaseFormat.LOWER_CAMEL.to(CaseFormat.UPPER_CAMEL, tokenizer.nextToken()));
    }
    nameBuilder.append("Spec");

    return nameBuilder.toString();
  }
}
