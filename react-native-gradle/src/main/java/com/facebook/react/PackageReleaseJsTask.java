package com.facebook.react;

import java.io.IOException;

import org.gradle.api.tasks.TaskAction;

/**
 * Gradle task that copies the prod bundle to the debug build's assets.
 */
public class PackageReleaseJsTask extends AbstractPackageJsTask {

  public PackageReleaseJsTask() throws IOException {
    super(false);
  }

  @TaskAction
  public void packageJS() throws Exception {
    copyBundle();
  }
}
