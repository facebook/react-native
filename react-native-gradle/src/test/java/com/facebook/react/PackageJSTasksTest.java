package com.facebook.react;

import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;

import com.squareup.okhttp.mockwebserver.MockResponse;
import com.squareup.okhttp.mockwebserver.MockWebServer;
import com.squareup.okhttp.mockwebserver.RecordedRequest;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.gradle.api.Action;
import org.gradle.api.Project;
import org.gradle.api.Task;
import org.gradle.testfixtures.ProjectBuilder;
import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

public class PackageJSTasksTest {

  private MockWebServer server;
  private Project project;

  @Before
  public void setupMocks() throws IOException {
    server = new MockWebServer();
    server.enqueue(new MockResponse().setBody("This is some javascript"));
    server.start();

    project = ProjectBuilder.builder().build();
    project.getPlugins().apply("com.facebook.react");
    project.getExtensions().configure(
        ReactGradleExtension.class,
        new Action<ReactGradleExtension>() {
          @Override
          public void execute(ReactGradleExtension config) {
            config.setPackagerHost(server.getHostName() + ":" + server.getPort());
            config.setBundleFileName("test.js");
            config.setBundlePath("/test.bundle");
          }
        });
  }

  @Test
  public void packageDebugJS() throws IOException, URISyntaxException, InterruptedException {
    Task task = project.getTasks().findByName("packageDebugJS");
    assertTrue(task != null && task instanceof PackageDebugJsTask);

    ((PackageDebugJsTask) task).packageJS();

    RecordedRequest request = server.takeRequest();
    assertEquals(
        "/test.bundle?dev=true&inlineSourceMap=false&minify=false&runModule=true",
        request.getPath());
    assertEquals(
        "This is some javascript",
        FileUtils.readFileToString(
            new File(
                project.getProjectDir(),
                FilenameUtils.separatorsToSystem("build/intermediates/assets/debug/test.js"))));
  }

  @Test
  public void packageReleaseJS() throws IOException, URISyntaxException, InterruptedException {
    Task task = project.getTasks().findByName("packageReleaseJS");
    assertTrue(task != null && task instanceof PackageReleaseJsTask);

    ((PackageReleaseJsTask) task).packageJS();

    RecordedRequest request = server.takeRequest();
    assertEquals(
        "/test.bundle?dev=false&inlineSourceMap=false&minify=true&runModule=true",
        request.getPath());
    assertEquals(
        "This is some javascript",
        FileUtils.readFileToString(
            new File(
                project.getProjectDir(),
                FilenameUtils.separatorsToSystem("build/intermediates/assets/release/test.js"))));
  }

}
