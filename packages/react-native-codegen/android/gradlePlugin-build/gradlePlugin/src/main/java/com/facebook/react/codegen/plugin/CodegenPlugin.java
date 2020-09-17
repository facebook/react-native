/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.plugin;

import com.android.build.gradle.BaseExtension;
import com.facebook.react.codegen.generator.JavaGenerator;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import java.io.File;
import org.gradle.api.GradleException;
import org.gradle.api.Plugin;
import org.gradle.api.Project;
import org.gradle.api.Task;
import org.gradle.api.tasks.Exec;

/**
 * A Gradle plugin to enable react-native-codegen in Gradle environment. See the Gradle API docs for
 * more information: https://docs.gradle.org/6.5.1/javadoc/org/gradle/api/Project.html
 */
public class CodegenPlugin implements Plugin<Project> {

  public void apply(final Project project) {
    final CodegenPluginExtension extension =
        project.getExtensions().create("react", CodegenPluginExtension.class, project);

    // 1. Set up build dir.
    final File generatedSrcDir = new File(project.getBuildDir(), "generated/source/codegen");
    final File generatedSchemaFile = new File(generatedSrcDir, "schema.json");

    // 2. Task: produce schema from JS files.
    project
        .getTasks()
        .register(
            "generateCodegenSchemaFromJavaScript",
            Exec.class,
            task -> {
              if (!extension.enableCodegen) {
                return;
              }

              task.doFirst(
                  s -> {
                    generatedSrcDir.delete();
                    generatedSrcDir.mkdirs();
                  });

              task.getInputs()
                  .files(project.fileTree(ImmutableMap.of("dir", extension.codegenDir())));
              task.getInputs()
                  .files(
                      project.fileTree(
                          ImmutableMap.of(
                              "dir",
                              extension.jsRootDir,
                              "includes",
                              ImmutableList.of("**/*.js"))));
              task.getOutputs().file(generatedSchemaFile);

              ImmutableList<String> execCommands =
                  new ImmutableList.Builder<String>()
                      .add("yarn")
                      .addAll(ImmutableList.copyOf(extension.nodeExecutableAndArgs))
                      .add(extension.codegenGenerateSchemaCLI().getAbsolutePath())
                      .add(generatedSchemaFile.getAbsolutePath())
                      .add(extension.jsRootDir.getAbsolutePath())
                      .build();
              task.commandLine(execCommands);
            });

    // 3. Task: generate Java code from schema.
    project
        .getTasks()
        .register(
            "generateCodegenArtifactsFromSchema",
            Exec.class,
            task -> {
              if (!extension.enableCodegen) {
                return;
              }

              task.dependsOn("generateCodegenSchemaFromJavaScript");

              task.getInputs()
                  .files(project.fileTree(ImmutableMap.of("dir", extension.codegenDir())));
              task.getInputs().files(generatedSchemaFile);
              task.getOutputs().dir(generatedSrcDir);

              if (extension.useJavaGenerator) {
                task.doLast(
                    s -> {
                      generateJavaFromSchemaWithJavaGenerator(
                          generatedSchemaFile, extension.codegenJavaPackageName, generatedSrcDir);
                    });
              }

              ImmutableList<String> execCommands =
                  new ImmutableList.Builder<String>()
                      .add("yarn")
                      .addAll(ImmutableList.copyOf(extension.nodeExecutableAndArgs))
                      .add(extension.codegenGenerateNativeModuleSpecsCLI().getAbsolutePath())
                      .add("android")
                      .add(generatedSchemaFile.getAbsolutePath())
                      .add(generatedSrcDir.getAbsolutePath())
                      .add(extension.libraryName)
                      .add(extension.codegenJavaPackageName)
                      .build();
              task.commandLine(execCommands);
            });

    // 4. Add dependencies & generated sources to the project.
    // Note: This last step needs to happen after the project has been evaluated.
    project.afterEvaluate(
        s -> {
          if (!extension.enableCodegen) {
            return;
          }

          // `preBuild` is one of the base tasks automatically registered by Gradle.
          // This will invoke the codegen before compiling the entire project.
          Task preBuild = project.getTasks().findByName("preBuild");
          if (preBuild != null) {
            preBuild.dependsOn("generateCodegenArtifactsFromSchema");
          }

          /**
           * Finally, update the android configuration to include the generated sources. This
           * equivalent to this DSL:
           *
           * <p>android { sourceSets { main { java { srcDirs += "$generatedSrcDir/java" } } } }
           *
           * <p>See documentation at
           * https://google.github.io/android-gradle-dsl/current/com.android.build.gradle.BaseExtension.html.
           */
          BaseExtension android = (BaseExtension) project.getExtensions().getByName("android");
          android
              .getSourceSets()
              .getByName("main")
              .getJava()
              .srcDir(new File(generatedSrcDir, "java"));
          // TODO: Add JNI sources.
        });
  }

  // Use Java-based generator implementation to produce the source files, instead of using the
  // JS-based generator.
  private void generateJavaFromSchemaWithJavaGenerator(
      final File schemaFile, final String javaPackageName, final File outputDir) {
    final JavaGenerator generator = new JavaGenerator(schemaFile, javaPackageName, outputDir);
    try {
      generator.build();
    } catch (final Exception ex) {
      throw new GradleException("Failed to generate Java from schema.", ex);
    }
  }
}
