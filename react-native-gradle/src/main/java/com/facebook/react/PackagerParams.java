package com.facebook.react;

/**
 * POJO for packager parameters.
 */
public class PackagerParams {
  private boolean dev = true;
  private boolean inlineSourceMap = false;
  private boolean minify = false;
  private boolean runModule = true;
  private boolean skip = false;

  /**
   * Returns default parameters for debug builds.
   */
  public static PackagerParams devDefaults() {
    PackagerParams params = new PackagerParams();
    params.dev = true;
    params.inlineSourceMap = false;
    params.minify = false;
    params.runModule = true;
    params.skip = true;
    return params;
  }

  /**
   * Returns default parameters for release builds.
   */
  public static PackagerParams releaseDefaults() {
    PackagerParams params = new PackagerParams();
    params.dev = false;
    params.inlineSourceMap = false;
    params.minify = true;
    params.runModule = true;
    params.skip = false;
    return params;
  }

  /**
   * Extract packager parameters from a configuration, or return default values.
   *
   * @param config the configuration to extract from
   * @param debug whether default values should be for debug or prod
   */
  public static PackagerParams getPackagerParams(ReactGradleExtension config, boolean debug) {
    if (debug) {
      return config.getDevParams() != null
          ? config.getDevParams()
          : PackagerParams.devDefaults();
    } else {
      return config.getReleaseParams() != null
          ? config.getReleaseParams()
          : PackagerParams.releaseDefaults();
    }
  }

  public boolean isDev() {
    return dev;
  }

  public void dev(boolean dev) {
    this.dev = dev;
  }

  public boolean isInlineSourceMap() {
    return inlineSourceMap;
  }

  public void inlineSourceMap(boolean inlineSourceMap) {
    this.inlineSourceMap = inlineSourceMap;
  }

  public boolean isMinify() {
    return minify;
  }

  public void minify(boolean minify) {
    this.minify = minify;
  }

  public boolean isRunModule() {
    return runModule;
  }

  public void runModule(boolean runModule) {
    this.runModule = runModule;
  }

  public boolean isSkip() {
    return skip;
  }

  public void skip(boolean skip) {
    this.skip = skip;
  }
}
