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
import android.webkit.MimeTypeMap;
import com.facebook.react.bridge.*;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;

import java.io.*;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.util.*;

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

  private static void store(byte[] data, String blobId) {
    sBlobs.put(blobId, data);
  }

  public static String store(byte[] data) {
    String blobId = UUID.randomUUID().toString();
    store(data, blobId);
    return blobId;
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
    if (offset >= 0) {
      data = Arrays.copyOfRange(data, offset, offset + size);
    }
    return data;
  }

  @Nullable
  public static byte[] resolve(ReadableMap blob) {
    return resolve(blob.getString("blobId"), blob.getInt("offset"), blob.getInt("size"));
  }

  private byte[] getBytesFromUri(Uri contentUri) throws IOException {
    ContentResolver resolver = getReactApplicationContext().getContentResolver();
    InputStream is = resolver.openInputStream(contentUri);

    if (is == null) {
      throw new FileNotFoundException("File not found for " + contentUri);
    }

    ByteArrayOutputStream byteBuffer = new ByteArrayOutputStream();
    int bufferSize = 1024;
    byte[] buffer = new byte[bufferSize];
    int len;
    while ((len = is.read(buffer)) != -1) {
      byteBuffer.write(buffer, 0, len);
    }
    return byteBuffer.toByteArray();
  }

  private String getNameFromUri(Uri contentUri) {
    if (contentUri.getScheme().equals("file")) {
      return contentUri.getLastPathSegment();
    }
    String[] projection = {MediaStore.MediaColumns.DISPLAY_NAME};
    Cursor metaCursor = getReactApplicationContext().getContentResolver().query(contentUri, projection, null, null, null);
    if (metaCursor != null) {
      try {
        if (metaCursor.moveToFirst()) {
          return metaCursor.getString(0);
        }
      } finally {
        metaCursor.close();
      }
    }
    return contentUri.getLastPathSegment();
  }

  private long getLastModifiedFromUri(Uri contentUri) {
    if (contentUri.getScheme().equals("file")) {
      return new File(contentUri.toString()).lastModified();
    }
    return 0;
  }

  private String getMimeTypeFromUri(Uri contentUri) {
    ContentResolver resolver = getReactApplicationContext().getContentResolver();
    String type = resolver.getType(contentUri);

    if (type == null) {
      String ext = MimeTypeMap.getFileExtensionFromUrl(contentUri.getPath());
      if (ext != null) {
        type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
      }
    }

    if (type == null) {
      type = "";
    }

    return type;
  }

  @ReactMethod
  public void createFromParts(ReadableArray parts, String blobId) {
    int totalBlobSize = 0;
    ArrayList<byte[]> partList = new ArrayList<>(parts.size());
    for (int i = 0; i < parts.size(); i++) {
      ReadableMap part = parts.getMap(i);
      switch (part.getString("type")) {
        case "blob":
          ReadableMap blob = part.getMap("data");
          totalBlobSize += blob.getInt("size");
          partList.add(i, resolve(blob));
          break;
        case "string":
          byte[] bytes = part.getString("data").getBytes(Charset.forName("UTF-8"));
          totalBlobSize += bytes.length;
          partList.add(i, bytes);
          break;
        default:
          throw new IllegalArgumentException("Invalid type for blob: " + part.getString("type"));
      }
    }
    ByteBuffer buffer = ByteBuffer.allocate(totalBlobSize);
    for (byte[] bytes : partList) {
      buffer.put(bytes);
    }
    store(buffer.array(), blobId);
  }

  @ReactMethod
  public void createFromURI(String path, Promise promise) {
    try {
      Uri uri = Uri.parse(path);
      byte[] data = getBytesFromUri(uri);

      WritableMap blob = Arguments.createMap();
      blob.putString("blobId", store(data));
      blob.putInt("offset", 0);
      blob.putInt("size", data.length);
      blob.putString("type", getMimeTypeFromUri(uri));

      // Needed for files
      blob.putString("name", getNameFromUri(uri));
      blob.putDouble("lastModified", getLastModifiedFromUri(uri));

      promise.resolve(blob);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ReactMethod
  public void release(String blobId) {
    remove(blobId);
  }
}
