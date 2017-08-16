/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * <p>This source code is licensed under the BSD-style license found in the LICENSE file in the root
 * directory of this source tree. An additional grant of patent rights can be found in the PATENTS
 * file in the same directory.
 */
package com.facebook.react.modules.blob;

import android.content.res.Resources;
import android.net.Uri;
import android.support.annotation.Nullable;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.websocket.WebSocketModule;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import okio.ByteString;

@ReactModule(name = BlobModule.NAME)
public class BlobModule extends ReactContextBaseJavaModule {

  protected static final String NAME = "BlobModule";

  private final Map<String, byte[]> mBlobs = new HashMap<>();

  protected final WebSocketModule.ContentHandler mContentHandler =
      new WebSocketModule.ContentHandler() {
        @Override
        public void onMessage(String text, WritableMap params) {
          params.putString("data", text);
        }

        @Override
        public void onMessage(ByteString bytes, WritableMap params) {
          byte[] data = bytes.toByteArray();

          WritableMap blob = Arguments.createMap();

          blob.putString("blobId", store(data));
          blob.putInt("offset", 0);
          blob.putInt("size", data.length);

          params.putMap("data", blob);
          params.putString("type", "blob");
        }
      };

  public BlobModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  @Nullable
  public Map getConstants() {
    // The application can register BlobProvider as a ContentProvider so that blobs are resolvable.
    // If it does, it needs to tell us what authority was used via this string resource.
    Resources resources = getReactApplicationContext().getResources();
    String packageName = getReactApplicationContext().getPackageName();
    int resourceId = resources.getIdentifier("blob_provider_authority", "string", packageName);
    if (resourceId == 0) {
      return null;
    }

    return MapBuilder.of(
        "BLOB_URI_SCHEME", "content", "BLOB_URI_HOST", resources.getString(resourceId));
  }

  public String store(byte[] data) {
    String blobId = UUID.randomUUID().toString();
    store(data, blobId);
    return blobId;
  }

  public void store(byte[] data, String blobId) {
    mBlobs.put(blobId, data);
  }

  public void remove(String blobId) {
    mBlobs.remove(blobId);
  }

  @Nullable
  public byte[] resolve(Uri uri) {
    String blobId = uri.getLastPathSegment();
    int offset = 0;
    int size = -1;
    String offsetParam = uri.getQueryParameter("offset");
    if (offsetParam != null) {
      offset = Integer.parseInt(offsetParam, 10);
    }
    String sizeParam = uri.getQueryParameter("size");
    if (sizeParam != null) {
      size = Integer.parseInt(sizeParam, 10);
    }
    return resolve(blobId, offset, size);
  }

  @Nullable
  public byte[] resolve(String blobId, int offset, int size) {
    byte[] data = mBlobs.get(blobId);
    if (data == null) {
      return null;
    }
    if (size == -1) {
      size = data.length - offset;
    }
    if (offset > 0) {
      data = Arrays.copyOfRange(data, offset, offset + size);
    }
    return data;
  }

  @Nullable
  public byte[] resolve(ReadableMap blob) {
    return resolve(blob.getString("blobId"), blob.getInt("offset"), blob.getInt("size"));
  }

  private WebSocketModule getWebSocketModule() {
    return getReactApplicationContext().getNativeModule(WebSocketModule.class);
  }

  @ReactMethod
  public void enableBlobSupport(final int id) {
    getWebSocketModule().setContentHandler(id, mContentHandler);
  }

  @ReactMethod
  public void disableBlobSupport(final int id) {
    getWebSocketModule().setContentHandler(id, null);
  }

  @ReactMethod
  public void sendBlob(ReadableMap blob, int id) {
    byte[] data = resolve(blob.getString("blobId"), blob.getInt("offset"), blob.getInt("size"));

    if (data != null) {
      getWebSocketModule().sendBinary(ByteString.of(data), id);
    } else {
      getWebSocketModule().sendBinary((ByteString) null, id);
    }
  }

  @ReactMethod
  public void createFromParts(ReadableArray parts, String blobId) {
    int totalBlobSize = 0;
    ArrayList<ReadableMap> partList = new ArrayList<>(parts.size());
    for (int i = 0; i < parts.size(); i++) {
      ReadableMap part = parts.getMap(i);
      totalBlobSize += part.getInt("size");
      partList.add(i, part);
    }
    ByteBuffer buffer = ByteBuffer.allocate(totalBlobSize);
    for (ReadableMap part : partList) {
      buffer.put(resolve(part));
    }
    store(buffer.array(), blobId);
  }

  @ReactMethod
  public void release(String blobId) {
    remove(blobId);
  }
}
