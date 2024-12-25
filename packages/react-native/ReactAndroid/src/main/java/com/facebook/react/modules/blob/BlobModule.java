/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.blob;

import android.content.res.Resources;
import android.database.Cursor;
import android.net.Uri;
import android.provider.MediaStore;
import android.webkit.MimeTypeMap;
import androidx.annotation.Nullable;
import com.facebook.fbreact.specs.NativeBlobModuleSpec;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.network.NetworkingModule;
import com.facebook.react.modules.websocket.WebSocketModule;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import okhttp3.MediaType;
import okhttp3.RequestBody;
import okhttp3.ResponseBody;
import okio.ByteString;

@ReactModule(name = NativeBlobModuleSpec.NAME)
public class BlobModule extends NativeBlobModuleSpec {

  private final Map<String, byte[]> mBlobs = new HashMap<>();

  private final WebSocketModule.ContentHandler mWebSocketContentHandler =
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

  private final NetworkingModule.UriHandler mNetworkingUriHandler =
      new NetworkingModule.UriHandler() {
        @Override
        public boolean supports(Uri uri, String responseType) {
          String scheme = uri.getScheme();
          boolean isRemote = "http".equals(scheme) || "https".equals(scheme);

          return (!isRemote && "blob".equals(responseType));
        }

        @Override
        public WritableMap fetch(Uri uri) throws IOException {
          byte[] data = getBytesFromUri(uri);

          WritableMap blob = Arguments.createMap();
          blob.putString("blobId", store(data));
          blob.putInt("offset", 0);
          blob.putInt("size", data.length);
          blob.putString("type", getMimeTypeFromUri(uri));

          // Needed for files
          blob.putString("name", getNameFromUri(uri));
          blob.putDouble("lastModified", getLastModifiedFromUri(uri));

          return blob;
        }
      };

  private final NetworkingModule.RequestBodyHandler mNetworkingRequestBodyHandler =
      new NetworkingModule.RequestBodyHandler() {
        @Override
        public boolean supports(ReadableMap data) {
          return data.hasKey("blob");
        }

        @Override
        public RequestBody toRequestBody(ReadableMap data, String contentType) {
          String type = contentType;
          if (data.hasKey("type") && !data.getString("type").isEmpty()) {
            type = data.getString("type");
          }
          if (type == null) {
            type = "application/octet-stream";
          }
          ReadableMap blob = data.getMap("blob");
          String blobId = blob.getString("blobId");
          byte[] bytes = resolve(blobId, blob.getInt("offset"), blob.getInt("size"));

          return RequestBody.create(MediaType.parse(type), bytes);
        }
      };

  private final NetworkingModule.ResponseHandler mNetworkingResponseHandler =
      new NetworkingModule.ResponseHandler() {
        @Override
        public boolean supports(String responseType) {
          return "blob".equals(responseType);
        }

        @Override
        public WritableMap toResponseData(ResponseBody body) throws IOException {
          byte[] data = body.bytes();
          WritableMap blob = Arguments.createMap();
          blob.putString("blobId", store(data));
          blob.putInt("offset", 0);
          blob.putInt("size", data.length);
          return blob;
        }
      };

  public BlobModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public void initialize() {
    BlobCollector.install(getReactApplicationContext(), this);
  }

  @Override
  public @Nullable Map<String, Object> getTypedExportedConstants() {
    // The application can register BlobProvider as a ContentProvider so that blobs are resolvable.
    // If it does, it needs to tell us what authority was used via this string resource.
    Resources resources = getReactApplicationContext().getResources();
    String packageName = getReactApplicationContext().getPackageName();
    int resourceId = resources.getIdentifier("blob_provider_authority", "string", packageName);
    if (resourceId == 0) {
      return MapBuilder.<String, Object>of();
    }

    return MapBuilder.<String, Object>of(
        "BLOB_URI_SCHEME", "content", "BLOB_URI_HOST", resources.getString(resourceId));
  }

  public String store(byte[] data) {
    String blobId = UUID.randomUUID().toString();
    store(data, blobId);
    return blobId;
  }

  public void store(byte[] data, String blobId) {
    synchronized (mBlobs) {
      mBlobs.put(blobId, data);
    }
  }

  @DoNotStrip
  public long getLengthOfBlob(String blobId) {
    synchronized (mBlobs) {
      byte[] data = mBlobs.get(blobId);
      return data != null ? data.length : 0;
    }
  }

  @DoNotStrip
  public void remove(String blobId) {
    synchronized (mBlobs) {
      mBlobs.remove(blobId);
    }
  }

  public @Nullable byte[] resolve(Uri uri) {
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

  public @Nullable byte[] resolve(String blobId, int offset, int size) {
    synchronized (mBlobs) {
      byte[] data = mBlobs.get(blobId);
      if (data == null) {
        return null;
      }
      if (size == -1) {
        size = data.length - offset;
      }
      if (offset > 0 || size != data.length) {
        data = Arrays.copyOfRange(data, offset, offset + size);
      }
      return data;
    }
  }

  public @Nullable byte[] resolve(ReadableMap blob) {
    return resolve(blob.getString("blobId"), blob.getInt("offset"), blob.getInt("size"));
  }

  private byte[] getBytesFromUri(Uri contentUri) throws IOException {
    InputStream is = getReactApplicationContext().getContentResolver().openInputStream(contentUri);

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
    if ("file".equals(contentUri.getScheme())) {
      return contentUri.getLastPathSegment();
    }
    String[] projection = {MediaStore.MediaColumns.DISPLAY_NAME};
    Cursor metaCursor =
        getReactApplicationContext()
            .getContentResolver()
            .query(contentUri, projection, null, null, null);
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
    if ("file".equals(contentUri.getScheme())) {
      return new File(contentUri.toString()).lastModified();
    }
    return 0;
  }

  private String getMimeTypeFromUri(Uri contentUri) {
    String type = getReactApplicationContext().getContentResolver().getType(contentUri);

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

  private WebSocketModule getWebSocketModule(String reason) {
    ReactApplicationContext reactApplicationContext = getReactApplicationContextIfActiveOrWarn();

    if (reactApplicationContext != null) {
      return reactApplicationContext.getNativeModule(WebSocketModule.class);
    }

    return null;
  }

  @Override
  public void addNetworkingHandler() {
    ReactApplicationContext reactApplicationContext = getReactApplicationContextIfActiveOrWarn();

    if (reactApplicationContext != null) {
      NetworkingModule networkingModule =
          reactApplicationContext.getNativeModule(NetworkingModule.class);
      networkingModule.addUriHandler(mNetworkingUriHandler);
      networkingModule.addRequestBodyHandler(mNetworkingRequestBodyHandler);
      networkingModule.addResponseHandler(mNetworkingResponseHandler);
    }
  }

  @Override
  public void addWebSocketHandler(final double idDouble) {
    final int id = (int) idDouble;

    WebSocketModule webSocketModule = getWebSocketModule("addWebSocketHandler");

    if (webSocketModule != null) {
      webSocketModule.setContentHandler(id, mWebSocketContentHandler);
    }
  }

  @Override
  public void removeWebSocketHandler(final double idDouble) {
    final int id = (int) idDouble;

    WebSocketModule webSocketModule = getWebSocketModule("removeWebSocketHandler");

    if (webSocketModule != null) {
      webSocketModule.setContentHandler(id, null);
    }
  }

  @Override
  public void sendOverSocket(ReadableMap blob, double idDouble) {
    int id = (int) idDouble;

    WebSocketModule webSocketModule = getWebSocketModule("sendOverSocket");

    if (webSocketModule != null) {
      byte[] data = resolve(blob.getString("blobId"), blob.getInt("offset"), blob.getInt("size"));

      if (data != null) {
        webSocketModule.sendBinary(ByteString.of(data), id);
      } else {
        webSocketModule.sendBinary((ByteString) null, id);
      }
    }
  }

  @Override
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

  @Override
  public void release(String blobId) {
    remove(blobId);
  }
}
