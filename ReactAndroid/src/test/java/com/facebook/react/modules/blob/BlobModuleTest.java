/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.modules.blob;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

import android.net.Uri;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactTestHelper;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.util.Arrays;
import java.util.Random;
import java.util.UUID;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

@PrepareForTest({Arguments.class})
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
@Config(manifest = Config.NONE)
public class BlobModuleTest {

  private byte[] mBytes;
  private String mBlobId;
  private BlobModule mBlobModule;

  @Rule public PowerMockRule rule = new PowerMockRule();

  @Before
  public void prepareModules() throws Exception {
    PowerMockito.mockStatic(Arguments.class);
    Mockito.when(Arguments.createMap())
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) throws Throwable {
                return new JavaOnlyMap();
              }
            });

    mBytes = new byte[120];
    new Random().nextBytes(mBytes);

    mBlobModule = new BlobModule(ReactTestHelper.createCatalystContextForTest());
    mBlobId = mBlobModule.store(mBytes);
  }

  @After
  public void cleanUp() {
    mBlobModule.remove(mBlobId);
  }

  @Test
  public void testResolve() {
    assertArrayEquals(mBytes, mBlobModule.resolve(mBlobId, 0, mBytes.length));
    byte[] expectedRange = Arrays.copyOfRange(mBytes, 30, mBytes.length);
    assertArrayEquals(expectedRange, mBlobModule.resolve(mBlobId, 30, mBytes.length - 30));
  }

  @Test
  public void testResolveUri() {
    Uri uri =
        new Uri.Builder()
            .appendPath(mBlobId)
            .appendQueryParameter("offset", "0")
            .appendQueryParameter("size", String.valueOf(mBytes.length))
            .build();

    assertArrayEquals(mBytes, mBlobModule.resolve(uri));
  }

  @Test
  public void testResolveMap() {
    JavaOnlyMap blob = new JavaOnlyMap();
    blob.putString("blobId", mBlobId);
    blob.putInt("offset", 0);
    blob.putInt("size", mBytes.length);

    assertArrayEquals(mBytes, mBlobModule.resolve(blob));
  }

  @Test
  public void testRemove() {
    assertNotNull(mBlobModule.resolve(mBlobId, 0, mBytes.length));

    mBlobModule.remove(mBlobId);

    assertNull(mBlobModule.resolve(mBlobId, 0, mBytes.length));
  }

  @Test
  public void testCreateFromParts() {
    String id = UUID.randomUUID().toString();

    JavaOnlyMap blobData = new JavaOnlyMap();
    blobData.putString("blobId", mBlobId);
    blobData.putInt("offset", 0);
    blobData.putInt("size", mBytes.length);
    JavaOnlyMap blob = new JavaOnlyMap();
    blob.putMap("data", blobData);
    blob.putString("type", "blob");

    String stringData = "i \u2665 dogs";
    byte[] stringBytes = stringData.getBytes(Charset.forName("UTF-8"));
    JavaOnlyMap string = new JavaOnlyMap();
    string.putString("data", stringData);
    string.putString("type", "string");

    JavaOnlyArray parts = new JavaOnlyArray();
    parts.pushMap(blob);
    parts.pushMap(string);

    mBlobModule.createFromParts(parts, id);

    int resultSize = mBytes.length + stringBytes.length;

    byte[] result = mBlobModule.resolve(id, 0, resultSize);

    ByteBuffer buffer = ByteBuffer.allocate(resultSize);
    buffer.put(mBytes);
    buffer.put(stringBytes);

    assertArrayEquals(result, buffer.array());
  }

  @Test
  public void testRelease() {
    assertNotNull(mBlobModule.resolve(mBlobId, 0, mBytes.length));

    mBlobModule.release(mBlobId);

    assertNull(mBlobModule.resolve(mBlobId, 0, mBytes.length));
  }
}
