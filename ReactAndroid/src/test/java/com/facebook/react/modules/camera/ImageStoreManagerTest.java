/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.camera;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.mockito.Mockito.mock;

import android.util.Base64;
import android.util.Base64InputStream;
import com.facebook.react.bridge.ReactApplicationContext;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Random;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class ImageStoreManagerTest {

  @Test
  public void itDoesNotAddLineBreaks_whenBasicStringProvided() throws IOException {
    byte[] exampleString = "test".getBytes();
    assertEquals("dGVzdA==", invokeConversion(new ByteArrayInputStream(exampleString)));
  }

  @Test
  public void itDoesNotAddLineBreaks_whenEmptyStringProvided() throws IOException {
    byte[] exampleString = "".getBytes();
    assertEquals("", invokeConversion(new ByteArrayInputStream(exampleString)));
  }

  @Test
  public void itDoesNotAddLineBreaks_whenStringWithSpecialCharsProvided() throws IOException {
    byte[] exampleString = "sdfsdf\nasdfsdfsdfsd\r\nasdas".getBytes();
    ByteArrayInputStream inputStream = new ByteArrayInputStream(exampleString);
    assertFalse(invokeConversion(inputStream).contains("\n"));
  }

  /**
   * This test tries to test the conversion when going beyond the current buffer size (8192 bytes)
   */
  @Test
  public void itDoesNotAddLineBreaks_whenStringBiggerThanBuffer() throws IOException {
    ByteArrayInputStream inputStream = new ByteArrayInputStream(generateRandomByteString(10000));
    assertFalse(invokeConversion(inputStream).contains("\n"));
  }

  /** Just to test if using the ByteArrayInputStream isn't missing something */
  @Test
  public void itDoesNotAddLineBreaks_whenBase64InputStream() throws IOException {
    byte[] exampleString = "dGVzdA==".getBytes();
    Base64InputStream inputStream =
        new Base64InputStream(new ByteArrayInputStream(exampleString), Base64.NO_WRAP);
    assertEquals("dGVzdA==", invokeConversion(inputStream));
  }

  private String invokeConversion(InputStream inputStream) throws IOException {
    return new ImageStoreManager(mock(ReactApplicationContext.class))
        .convertInputStreamToBase64OutputStream(inputStream);
  }

  private byte[] generateRandomByteString(final int length) {
    Random r = new Random();
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < length; i++) {
      char c = (char) (r.nextInt((int) (Character.MAX_VALUE)));
      sb.append(c);
    }
    return sb.toString().getBytes();
  }
}
