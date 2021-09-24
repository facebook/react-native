/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.plugin;

import com.android.build.gradle.BaseExtension;
import com.facebook.react.ReactExtension;
import com.facebook.react.tasks.BuildCodegenCLITask;
import com.facebook.react.tasks.GenerateCodegenArtifactsTask;
import com.facebook.react.tasks.GenerateCodegenSchemaTask;
import com.facebook.react.utils.GradleUtils;
import java.io.File;
import org.gradle.api.Project;
import org.gradle.api.Task;
import org.gradle.api.tasks.TaskProvider;

/**
 * A Gradle plugin to enable react-native-codegen in Gradle environment. See the Gradle API docs for
 * more information: https://docs.gradle.org/6.5.1/javadoc/org/gradle/api/Project.html
 */
public class CodegenPlugin {

  public void apply(final Project project) {
    final ReactExtension extension =
        GradleUtils.createOrGet(project.getExtensions(), "react", ReactExtension.class, project);

    // 1. Set up build dir.
    final File generatedSrcDir = new File(project.getBuildDir(), "generated/source/codegen");

    TaskProvider<BuildCodegenCLITask> buildCodegenTask =
        project
            .getTasks()
            .register(
                "buildCodegenCLI",
                BuildCodegenCLITask.class,
                task -> {
                  task.getCodegenDir().set(extension.getCodegenDir());
                  String bashWindowsHome = (String) project.findProperty("REACT_WINDOWS_BASH");
                  task.getBashWindowsHome().set(bashWindowsHome);
                });

    // 2. Task: produce schema from JS files.
    TaskProvider<GenerateCodegenSchemaTask> generateCodegenSchemaTask =
        project
            .getTasks()
            .register(
                "generateCodegenSchemaFromJavaScript",
                GenerateCodegenSchemaTask.class,
                task -> {
                  task.getJsRootDir().set(extension.getJsRootDir());
                  task.getNodeExecutableAndArgs().set(extension.getNodeExecutableAndArgs());
                  task.getCodegenDir().set(extension.getCodegenDir());
                  task.getGeneratedSrcDir().set(generatedSrcDir);
                  task.dependsOn(buildCodegenTask);
                });

    // 3. Task: generate Java code from schema.
    TaskProvider<GenerateCodegenArtifactsTask> generateCodegenArtifactsTask =
        project
            .getTasks()
            .register(
                "generateCodegenArtifactsFromSchema",
                GenerateCodegenArtifactsTask.class,
                task -> {
                  task.dependsOn(generateCodegenSchemaTask);
                  task.getReactRoot().set(extension.getReactRoot());
                  task.getJsRootDir().set(extension.getJsRootDir());
                  task.getNodeExecutableAndArgs().set(extension.getNodeExecutableAndArgs());
                  task.getCodegenDir().set(extension.getCodegenDir());
                  task.getUseJavaGenerator().set(extension.getUseJavaGenerator());
                  task.getCodegenJavaPackageName().set(extension.getCodegenJavaPackageName());
                  task.getLibraryName().set(extension.getLibraryName());
                  task.getGeneratedSrcDir().set(generatedSrcDir);
                });

    // 4. Add dependencies & generated sources to the project.
    // Note: This last step needs to happen after the project has been evaluated.
    project.afterEvaluate(
        s -> {
          // `preBuild` is one of the base tasks automatically registered by Gradle.
          // This will invoke the codegen before compiling the entire project.
          Task preBuild = project.getTasks().findByName("preBuild");
          if (preBuild != null) {
            preBuild.dependsOn(generateCodegenArtifactsTask);
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
        });
  }
}
