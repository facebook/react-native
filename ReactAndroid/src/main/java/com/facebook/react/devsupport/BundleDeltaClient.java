/**
 * Copyright (c) 2018-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.LinkedHashMap;
import javax.annotation.Nullable;

import android.util.JsonReader;
import android.util.JsonToken;
import android.util.Pair;
import com.facebook.react.bridge.NativeDeltaClient;
import okhttp3.Headers;
import okio.Buffer;
import okio.BufferedSource;

public abstract class BundleDeltaClient {

  private static final String METRO_DELTA_ID_HEADER = "X-Metro-Delta-ID";
  @Nullable private String mDeltaId;

  public enum ClientType {
    NONE,
    DEV_SUPPORT,
    NATIVE
  }

  static boolean isDeltaUrl(String bundleUrl) {
    return bundleUrl.indexOf(".delta?") != -1;
  }

  @Nullable
  static BundleDeltaClient create(ClientType type) {
    switch (type) {
      case DEV_SUPPORT:
        return new BundleDeltaJavaClient();
      case NATIVE:
        return new BundleDeltaNativeClient();
    }
    return null;
  }

  abstract public boolean canHandle(ClientType type);

  abstract protected Pair<Boolean, NativeDeltaClient> processDelta(
    BufferedSource body,
    File outputFile) throws IOException;

  final public String extendUrlForDelta(String bundleURL) {
    return mDeltaId != null ? bundleURL + "&deltaBundleId=" + mDeltaId : bundleURL;
  }

  public void reset() {
    mDeltaId = null;
  }

  public Pair<Boolean, NativeDeltaClient> processDelta(
    Headers headers,
    BufferedSource body,
    File outputFile) throws IOException {

    mDeltaId = headers.get(METRO_DELTA_ID_HEADER);
    return processDelta(body, outputFile);
  }

  private static class BundleDeltaJavaClient extends BundleDeltaClient {

    final LinkedHashMap<Number, byte[]> mPreModules = new LinkedHashMap<Number, byte[]>();
    final LinkedHashMap<Number, byte[]> mDeltaModules = new LinkedHashMap<Number, byte[]>();
    final LinkedHashMap<Number, byte[]> mPostModules = new LinkedHashMap<Number, byte[]>();

    @Override
    public boolean canHandle(ClientType type) {
      return type == ClientType.DEV_SUPPORT;
    }

    public void reset() {
      super.reset();
      mDeltaModules.clear();
      mPreModules.clear();
      mPostModules.clear();
    }

    @Override
    public synchronized Pair<Boolean, NativeDeltaClient> processDelta(
      BufferedSource body,
      File outputFile) throws IOException {

      JsonReader jsonReader = new JsonReader(new InputStreamReader(body.inputStream()));
      jsonReader.beginObject();
      int numChangedModules = 0;

      while (jsonReader.hasNext()) {
        String name = jsonReader.nextName();
        if (name.equals("pre")) {
          numChangedModules += patchDelta(jsonReader, mPreModules);
        } else if (name.equals("post")) {
          numChangedModules += patchDelta(jsonReader, mPostModules);
        } else if (name.equals("delta")) {
          numChangedModules += patchDelta(jsonReader, mDeltaModules);
        } else {
          jsonReader.skipValue();
        }
      }

      jsonReader.endObject();
      jsonReader.close();

      if (numChangedModules == 0) {
        // If we receive an empty delta, we don't need to save the file again (it'll have the
        // same content).
        return Pair.create(Boolean.FALSE, null);
      }

      FileOutputStream fileOutputStream = new FileOutputStream(outputFile);

      try {
        for (byte[] code : mPreModules.values()) {
          fileOutputStream.write(code);
          fileOutputStream.write('\n');
        }

        for (byte[] code : mDeltaModules.values()) {
          fileOutputStream.write(code);
          fileOutputStream.write('\n');
        }

        for (byte[] code : mPostModules.values()) {
          fileOutputStream.write(code);
          fileOutputStream.write('\n');
        }
      } finally {
        fileOutputStream.flush();
        fileOutputStream.close();
      }

      return Pair.create(Boolean.TRUE, null);
    }

    private static int patchDelta(JsonReader jsonReader, LinkedHashMap<Number, byte[]> map)
      throws IOException {
      jsonReader.beginArray();

      int numModules = 0;
      while (jsonReader.hasNext()) {
        jsonReader.beginArray();

        int moduleId = jsonReader.nextInt();

        if (jsonReader.peek() == JsonToken.NULL) {
          jsonReader.skipValue();
          map.remove(moduleId);
        } else {
          map.put(moduleId, jsonReader.nextString().getBytes());
        }

        jsonReader.endArray();
        numModules++;
      }

      jsonReader.endArray();

      return numModules;
    }
  }

  private static class BundleDeltaNativeClient extends BundleDeltaClient {
    private final NativeDeltaClient nativeClient = new NativeDeltaClient();

    @Override
    public boolean canHandle(ClientType type) {
      return type == ClientType.NATIVE;
    }

    @Override
    protected Pair<Boolean, NativeDeltaClient> processDelta(
        BufferedSource body,
        File outputFile) throws IOException {
      nativeClient.processDelta(body);
      return Pair.create(Boolean.FALSE, nativeClient);
    }

    @Override
    public void reset() {
      super.reset();
      nativeClient.reset();
    }
  }
}
