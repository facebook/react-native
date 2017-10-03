/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.blob;

import android.net.Uri;
import com.facebook.react.bridge.*;
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

import javax.annotation.Nullable;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.util.Random;
import java.util.UUID;

import static org.junit.Assert.*;

@PrepareForTest({Arguments.class})
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
@Config(manifest = Config.NONE)
public class BlobModuleTest {

  private byte[] bytes;
  private String blobId;
  private BlobModule blobModule;

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  @Before
  public void prepareModules() throws Exception {
    PowerMockito.mockStatic(Arguments.class);
    Mockito.when(Arguments.createMap()).thenAnswer(new Answer<Object>() {
      @Override
      public Object answer(InvocationOnMock invocation) throws Throwable {
        return new JavaOnlyMap();
      }
    });

    bytes = new byte[120];
    new Random().nextBytes(bytes);
    blobId = BlobModule.store(bytes);
    blobModule = new BlobModule(ReactTestHelper.createCatalystContextForTest());

    BlobModule spy = PowerMockito.spy(blobModule);

    PowerMockito.when(spy, "getBytesFromUri", Uri.class).thenReturn(bytes);
    PowerMockito.when(spy, "getNameFromUri", Uri.class).thenReturn("test.png");
    PowerMockito.when(spy, "getLastModifiedFromUri", Uri.class).thenReturn(1482276506);
    PowerMockito.when(spy, "getMimeTypeFromUri", Uri.class).thenReturn("image/png");
  }

  @After
  public void cleanUp() {
    BlobModule.remove(blobId);
  }

  @Test
  public void testResolve() {
    assertArrayEquals(bytes, BlobModule.resolve(blobId, 0, bytes.length));
    assertArrayEquals(bytes, BlobModule.resolve(blobId, 30, bytes.length - 30));
  }

  @Test
  public void testResolveUri() {
    Uri uri = new Uri.Builder()
        .appendPath(blobId)
        .appendQueryParameter("offset", "0")
        .appendQueryParameter("size", String.valueOf(bytes.length))
        .build();

    assertArrayEquals(bytes, BlobModule.resolve(uri));
  }

  @Test
  public void testResolveMap() {
    JavaOnlyMap blob = new JavaOnlyMap();
    blob.putString("blobId", blobId);
    blob.putInt("offset", 0);
    blob.putInt("size", bytes.length);

    assertArrayEquals(bytes, BlobModule.resolve(blob));
  }

  @Test
  public void testRemove() {
    assertNotNull(BlobModule.resolve(blobId, 0, bytes.length));

    BlobModule.remove(blobId);

    assertNull(BlobModule.resolve(blobId, 0, bytes.length));
  }

  @Test
  public void testCreateFromParts() {
    String id = UUID.randomUUID().toString();

    JavaOnlyMap blobData = new JavaOnlyMap();
    blobData.putString("blobId", blobId);
    blobData.putInt("offset", 0);
    blobData.putInt("size", bytes.length);
    JavaOnlyMap blob = new JavaOnlyMap();
    blob.putMap("data", blobData);
    blob.putString("type", "blob");

    String stringData = "i ♥ dogs";
    byte[] stringBytes = stringData.getBytes(Charset.forName("UTF-8"));
    JavaOnlyMap string = new JavaOnlyMap();
    string.putString("data", stringData);
    string.putString("type", "blob");

    JavaOnlyArray parts = new JavaOnlyArray();
    parts.pushMap(blob);
    parts.pushMap(string);

    blobModule.createFromParts(parts, id);

    int resultSize = bytes.length + stringBytes.length;

    byte[] result = BlobModule.resolve(id, 0, resultSize);

    ByteBuffer buffer = ByteBuffer.allocate(resultSize);
    buffer.put(bytes);
    buffer.put(stringBytes);

    assertArrayEquals(result, buffer.array());
  }

  @Test
  public void testCreateFromURI() {
    final SimplePromise promise = new SimplePromise();

    blobModule.createFromURI("content://photos/holiday-season", promise);

    JavaOnlyMap map = (JavaOnlyMap) promise.getValue();

    assertNotNull(map.getString("blobId"));
    assertEquals(map.getInt("offset"), 0);
    assertEquals(map.getInt("size"), bytes.length);
    assertEquals(map.getString("type"), "image/png");
    assertEquals(map.getString("name"), "test");
    assertEquals(map.getInt("lastModified"), 1482276506);
  }

  @Test
  public void testRelease() {
    assertNotNull(BlobModule.resolve(blobId, 0, bytes.length));

    blobModule.release(blobId);

    assertNull(BlobModule.resolve(blobId, 0, bytes.length));
  }

  final static class SimplePromise implements Promise {
    private Object mValue;

    public Object getValue() {
      return mValue;
    }

    @Override
    public void resolve(Object value) {
      mValue = value;
    }

    @Override
    public void reject(String code, String message) {
      reject(code, message, /*Throwable*/null);
    }

    @Override
    @Deprecated
    public void reject(String message) {}

    @Override
    public void reject(String code, Throwable e) {}

    @Override
    public void reject(Throwable e) {}

    @Override
    public void reject(String code, String message, @Nullable Throwable e) {}
  }

}
