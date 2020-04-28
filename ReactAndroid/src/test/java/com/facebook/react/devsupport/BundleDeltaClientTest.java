/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.devsupport;

import static org.fest.assertions.api.Assertions.assertThat;

import com.facebook.react.common.StandardCharsets;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import okio.BufferedSource;
import okio.Okio;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
public class BundleDeltaClientTest {
  private BundleDeltaClient mClient;

  @Rule public TemporaryFolder mFolder = new TemporaryFolder();

  @Before
  public void setUp() {
    mClient = BundleDeltaClient.create(BundleDeltaClient.ClientType.DEV_SUPPORT);
  }

  @Test
  public void testAcceptsSimpleInitialBundle() throws IOException {
    File file = mFolder.newFile();
    mClient.processDelta(
        bufferedSource(
            "{"
                + "\"pre\": \"console.log('Hello World!');\","
                + "\"post\": \"console.log('That is all folks!');\","
                + "\"modules\": [[0, \"console.log('Best module.');\"]]"
                + "}"),
        file);
    assertThat(contentOf(file))
        .isEqualTo(
            "console.log('Hello World!');\n"
                + "console.log('Best module.');\n"
                + "console.log('That is all folks!');\n");
  }

  @Test
  public void testPatchesInitialBundleWithDeltaBundle() throws IOException {
    File file = mFolder.newFile();
    mClient.processDelta(
        bufferedSource(
            "{"
                + "\"pre\": \"pre\","
                + "\"post\": \"post\","
                + "\"modules\": [[0, \"0\"], [1, \"1\"]]"
                + "}"),
        file);
    file = mFolder.newFile();
    mClient.processDelta(
        bufferedSource(
            "{"
                + "\"added\": [[2, \"2\"]],"
                + "\"modified\": [[0, \"0.1\"]],"
                + "\"deleted\": [1]"
                + "}"),
        file);
    assertThat(contentOf(file)).isEqualTo("pre\n" + "0.1\n" + "2\n" + "post\n");
  }

  @Test
  public void testSortsModulesByIdInInitialBundle() throws IOException {
    File file = mFolder.newFile();
    mClient.processDelta(
        bufferedSource(
            "{"
                + "\"pre\": \"console.log('Hello World!');\","
                + "\"post\": \"console.log('That is all folks!');\","
                + "\"modules\": [[3, \"3\"], [0, \"0\"], [2, \"2\"], [1, \"1\"]]"
                + "}"),
        file);
    assertThat(contentOf(file))
        .isEqualTo(
            "console.log('Hello World!');\n"
                + "0\n"
                + "1\n"
                + "2\n"
                + "3\n"
                + "console.log('That is all folks!');\n");
  }

  @Test
  public void testSortsModulesByIdInPatchedBundle() throws IOException {
    File file = mFolder.newFile();
    mClient.processDelta(
        bufferedSource(
            "{"
                + "\"pre\": \"console.log('Hello World!');\","
                + "\"post\": \"console.log('That is all folks!');\","
                + "\"modules\": [[3, \"3\"], [0, \"0\"], [1, \"1\"]]"
                + "}"),
        file);
    file = mFolder.newFile();
    mClient.processDelta(
        bufferedSource(
            "{"
                + "\"added\": [[2, \"2\"]],"
                + "\"modified\": [[0, \"0.1\"]],"
                + "\"deleted\": [1]"
                + "}"),
        file);
    assertThat(contentOf(file))
        .isEqualTo(
            "console.log('Hello World!');\n"
                + "0.1\n"
                + "2\n"
                + "3\n"
                + "console.log('That is all folks!');\n");
  }

  private static BufferedSource bufferedSource(String string) {
    return Okio.buffer(
        Okio.source(new ByteArrayInputStream(string.getBytes(StandardCharsets.UTF_8))));
  }

  private static String contentOf(File file) throws IOException {
    return new String(Files.readAllBytes(file.toPath()), StandardCharsets.UTF_8);
  }
}
