package com.facebook.react;

import java.io.IOException;

import org.gradle.api.tasks.TaskAction;

/**
 * Gradle task that copies the dev bundle to the debug build's assets.
 */
public class PackageDebugJsTask extends AbstractPackageJsTask {

  public PackageDebugJsTask() throws IOException {
    super(true);
  }

  @TaskAction
  public void packageJS() throws Exception {
    copyBundle();
  }
}
