/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.blob;

import android.content.res.Resources;
import android.net.Uri;
import android.support.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;

import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@ReactModule(name = "BlobModule")
public class BlobModule extends ReactContextBaseJavaModule {

  public BlobModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "BlobModule";
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
      "BLOB_URI_SCHEME", "content",
      "BLOB_URI_HOST", resources.getString(resourceId));
  }

  private static Map<String, byte[]> sBlobs = new HashMap<>();

  public static String store(byte[] data) {
    String blobId = UUID.randomUUID().toString();
    store(data, blobId);
    return blobId;
  }

  public static void store(byte[] data, String blobId) {
    sBlobs.put(blobId, data);
  }

  public static void remove(String blobId) {
    sBlobs.remove(blobId);
  }

  @Nullable
  public static byte[] resolve(Uri uri) {
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
  public static byte[] resolve(String blobId, int offset, int size) {
    byte[] data = sBlobs.get(blobId);
    if (data == null){
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
  public static byte[] resolve(ReadableMap blob) {
    return resolve(blob.getString("blobId"), blob.getInt("offset"), blob.getInt("size"));
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
