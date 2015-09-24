package com.facebook.react;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.FileSystems;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.PathMatcher;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.SystemUtils;
import org.gradle.api.DefaultTask;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Base class for tasks that build JS packages. Handles requesting a bundle from the packager server
 * and putting it into the appropriate folder.
 */
public abstract class AbstractPackageJsTask extends DefaultTask {

  /**
   * Describes the status of the JS packager server.
   *
   * @see #getPackagerStatus
   */
  private enum PackagerStatus {
    /**
     * Packager is up and running
     */
    RUNNING,

    /**
     * Packager is not running, but could be started
     */
    NOT_RUNNING,

    /**
     * Packager is not running and can't be started, something else is listening on the configured
     * port
     */
    UNKNOWN
  }

  private final boolean mDebug;
  private final ReactGradleExtension mConfig;
  private final PackagerParams mPackagerParams;

  private final Logger mLogger = LoggerFactory.getLogger(getClass());

  public AbstractPackageJsTask(boolean debug) throws IOException {
    mDebug = debug;

    mConfig = ReactGradleExtension.getConfig(getProject());
    mPackagerParams = PackagerParams.getPackagerParams(mConfig, mDebug);

    if (mPackagerParams.isSkip()) {
      setEnabled(false);
    } else {
      setupInputs(mConfig);
      setupOutputs(mConfig);
    }
  }

  /**
   * Get a bundle from packager and copy it to the appropriate folder.
   */
  protected void copyBundle() throws Exception {
    File bundle = getOutputFile(mConfig);
    bundle.getParentFile().mkdirs();

    PackagerStatus packagerStatus = getPackagerStatus(mConfig);
    if (packagerStatus == PackagerStatus.NOT_RUNNING) {
      boolean started = startPackager();
      if (started) {
        packagerStatus = getPackagerStatus(mConfig);
      }
      if (!started || packagerStatus != PackagerStatus.RUNNING) {
        throw new Exception(
            "Could not start packager server. Please start it manually and try again.");
      }
    }
    if (packagerStatus == PackagerStatus.RUNNING) {
      URL packageUrl = getPackageUrl(mConfig, mPackagerParams);

      InputStream packageStream = packageUrl.openStream();
      OutputStream bundleStream = new FileOutputStream(bundle);
      IOUtils.copy(packageStream, bundleStream);
      IOUtils.closeQuietly(packageStream);
      IOUtils.closeQuietly(bundleStream);
    } else if (packagerStatus == PackagerStatus.UNKNOWN) {
      throw new Exception(
          "Did not recognize the server at " + mConfig.getPackagerHost() +
              ". Please stop the service listening at this address and try again.");
    }
  }

  /**
   * Tests if there is an HTTP server running at the configured address and if it is our packager.
   * See {@link PackagerStatus} for the possible return values and their meaning.
   *
   * @param config the project config that contains packager address information
   */
  private PackagerStatus getPackagerStatus(ReactGradleExtension config) throws URISyntaxException {
    try {
      URL statusUrl = new URI("http", config.getPackagerHost(), "/status", null, null).toURL();
      HttpURLConnection conn = (HttpURLConnection) statusUrl.openConnection();
      if (conn.getResponseCode() != 200) {
        // something else must be running on this port
        return PackagerStatus.UNKNOWN;
      }
      InputStream is = conn.getInputStream();
      String status = IOUtils.toString(is);
      IOUtils.closeQuietly(is);
      return status.contains("packager-status:running")
          ? PackagerStatus.RUNNING
          : PackagerStatus.UNKNOWN;
    } catch (IOException e) {
      // connect must have failed
      return PackagerStatus.NOT_RUNNING;
    }
  }

  /**
   * Tries to spawn a process to run the packager server. Currently support OSX and Linux by running
   * {@code open launchPackager.command} and {@code xterm -e bash launchPackager.command}
   * respectively. Always waits 5 seconds for the server to finish initializing.
   *
   * @return {@code true} if the server process was started successfully, {@code false} otherwise.
   */
  private boolean startPackager() throws IOException, InterruptedException {
    if (SystemUtils.IS_OS_MAC_OSX || SystemUtils.IS_OS_LINUX) {
      String launchPackagerScript =
          Paths.get(getProject().getProjectDir().getAbsolutePath(), mConfig.getPackagerCommand())
              .normalize().toString();
      if (SystemUtils.IS_OS_MAC_OSX) {
        Runtime.getRuntime().exec(new String[]{"open", launchPackagerScript}, null, null);
      } else if (SystemUtils.IS_OS_LINUX) {
        Runtime.getRuntime()
            .exec(new String[]{"xterm", "-e", "bash", launchPackagerScript}, null, null);
      }
      // wait for server to be ready
      Thread.sleep(5000);
      return true;
    }
    return false;
  }

  /**
   * Generate a packager URL for a specific configuration.
   *
   * @param config the top-level config of the plugin
   * @param params packager params to include in the URL
   */
  private URL getPackageUrl(ReactGradleExtension config, PackagerParams params)
      throws URISyntaxException, MalformedURLException {
    String query = "dev=" + params.isDev() + "&" +
        "inlineSourceMap=" + params.isInlineSourceMap() + "&" +
        "minify=" + params.isMinify() + "&" +
        "runModule=" + params.isRunModule();
    return new URI(
        "http",
        config.getPackagerHost(),
        config.getBundlePath(),
        query,
        null).toURL();
  }

  private void setupInputs(ReactGradleExtension config) throws IOException {
    final long startTime = System.currentTimeMillis();
    InputsScanner scanner = new InputsScanner();
    Files.walkFileTree(
        Paths.get(getProject().getProjectDir().getAbsolutePath(), config.getJsRoot()).normalize(),
        scanner);
    final long endTime = System.currentTimeMillis();
    mLogger.info("Added {} .js files in {}ms", scanner.getCount(), endTime - startTime);
  }

  private void setupOutputs(ReactGradleExtension config) {
    getOutputs().file(getOutputFile(config));
  }

  private File getOutputFile(ReactGradleExtension config) {
    File assets = new File(
        getProject().getProjectDir(),
        FilenameUtils
            .separatorsToSystem("build/intermediates/assets/" + (mDebug ? "debug" : "release")));
    return new File(assets, config.getBundleFileName());
  }

  private class InputsScanner extends SimpleFileVisitor<Path> {

    private final PathMatcher mMatcher = FileSystems.getDefault().getPathMatcher("glob:*.js");
    private int mCount = 0;

    @Override
    public FileVisitResult preVisitDirectory(
        Path dir, BasicFileAttributes attrs) throws IOException {
      if ("build".equals(dir.getFileName().toString())) {
        return FileVisitResult.SKIP_SUBTREE;
      } else {
        return FileVisitResult.CONTINUE;
      }
    }

    @Override
    public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
      if (mMatcher.matches(file.getFileName())) {
        getInputs().file(file.toString());
        mCount++;
      }
      return FileVisitResult.CONTINUE;
    }

    public int getCount() {
      return mCount;
    }
  }
}
