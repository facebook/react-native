package com.facebook.react;

import org.gradle.api.Action;
import org.gradle.api.Plugin;
import org.gradle.api.Project;
import org.gradle.api.Task;

/**
 * Main entry point for our plugin. When applied to a project, this registers the {@code react}
 * gradle extension used for configuration and the {@code packageDebugJS} and
 * {@code packageReleaseJS} tasks. These are set up to run after {@code mergeDebugAssets} and
 * {@code mergeReleaseAssets} and before {@code processDebugResources} and
 * {@code processReleaseResources} respectively. If any of these tasks are not found the plugin will
 * crash (UnknownTaskException), as it was probably applied to a non-standard Android project, or it
 * was applied incorrectly.
 */
public class ReactGradlePlugin implements Plugin<Project> {
  @Override
  public void apply(Project project) {
    project.getExtensions().create("react", ReactGradleExtension.class, project);

    project.afterEvaluate(
        new Action<Project>() {
          @Override
          public void execute(Project project) {
            PackageDebugJsTask packageDebugJsTask =
                project.getTasks().create("packageDebugJS", PackageDebugJsTask.class);
            PackageReleaseJsTask packageReleaseJsTask =
                project.getTasks().create("packageReleaseJS", PackageReleaseJsTask.class);

            packageDebugJsTask.dependsOn("mergeDebugAssets");
            project.getTasks().getByName("processDebugResources").dependsOn(packageDebugJsTask);

            packageReleaseJsTask.dependsOn("mergeReleaseAssets");
            project.getTasks().getByName("processReleaseResources").dependsOn(packageReleaseJsTask);
          }
        });
  }
}
