package com.facebook.react;

import org.gradle.api.Project;
import org.gradle.testfixtures.ProjectBuilder;
import org.junit.Test;

import static org.junit.Assert.assertTrue;

public class ReactGradlePluginTest {
  @Test
  public void addsTasksToProject() {
    Project project = ProjectBuilder.builder().build();
    project.getPlugins().apply("com.facebook.react");

    assertTrue(project.getTasks().getByName("packageDebugJS") instanceof PackageDebugJsTask);
    assertTrue(project.getTasks().getByName("packageReleaseJS") instanceof PackageReleaseJsTask);
  }

  @Test
  public void addsExtensionToProject() {
    Project project = ProjectBuilder.builder().build();
    project.getPlugins().apply("com.facebook.react");

    assertTrue(project.getExtensions().getByName("react") instanceof ReactGradleExtension);
  }
}
