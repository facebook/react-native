package com.facebook.react;

import groovy.lang.Closure;
import org.gradle.api.Project;

/**
 * POJO-ish class for configuring the plugin.
 */
public class ReactGradleExtension {
  private String bundleFileName = "index.android.bundle";
  private String bundlePath = "/index.android.bundle";
  private String jsRoot = "../../";
  private String packagerHost = "localhost:8082";
  private String packagerCommand =
      "../../node_modules/react-native/packager/launchAndroidPackager.command";

  private PackagerParams devParams;
  private PackagerParams releaseParams;

  private Project project;

  public ReactGradleExtension(Project project) {
    this.project = project;
  }

  /**
   * Get the configuration for a project, or a blank config.
   */
  public static ReactGradleExtension getConfig(Project project) {
    ReactGradleExtension config =
        project.getExtensions().findByType(ReactGradleExtension.class);
    if (config == null) {
      config = new ReactGradleExtension(project);
    }
    return config;
  }

  public String getBundleFileName() {
    return bundleFileName;
  }

  public void setBundleFileName(String bundleFileName) {
    this.bundleFileName = bundleFileName;
  }

  public String getBundlePath() {
    return bundlePath;
  }

  public void setBundlePath(String bundlePath) {
    this.bundlePath = bundlePath;
  }

  public String getJsRoot() {
    return jsRoot;
  }

  public void setJsRoot(String jsRoot) {
    this.jsRoot = jsRoot;
  }

  public void setPackagerCommand(String packagerCommand) {
    this.packagerCommand = packagerCommand;
  }

  public String getPackagerCommand() {
    return packagerCommand;
  }

  public String getPackagerHost() {
    return packagerHost;
  }

  public void setPackagerHost(String packagerHost) {
    this.packagerHost = packagerHost;
  }

  public PackagerParams getDevParams() {
    return devParams;
  }

  public void devParams(Closure closure) {
    devParams = new PackagerParams();
    project.configure(devParams, closure);
  }

  public PackagerParams getReleaseParams() {
    return releaseParams;
  }

  public void releaseParams(Closure closure) {
    releaseParams = new PackagerParams();
    project.configure(releaseParams, closure);
  }
}
