package com.facebook.react.devsupport;

import android.util.JsonReader;
import android.util.JsonToken;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.LinkedHashMap;
import javax.annotation.Nullable;
import okio.BufferedSource;

public class BundleDeltaClient {

  final LinkedHashMap<Number, byte[]> mPreModules = new LinkedHashMap<Number, byte[]>();
  final LinkedHashMap<Number, byte[]> mDeltaModules = new LinkedHashMap<Number, byte[]>();
  final LinkedHashMap<Number, byte[]> mPostModules = new LinkedHashMap<Number, byte[]>();
  @Nullable String mDeltaId;

  static boolean isDeltaUrl(String bundleUrl) {
    return bundleUrl.indexOf(".delta?") != -1;
  }

  public void reset() {
    mDeltaId = null;
    mDeltaModules.clear();
    mPreModules.clear();
    mPostModules.clear();
  }

  public String toDeltaUrl(String bundleURL) {
    if (isDeltaUrl(bundleURL) && mDeltaId != null) {
      return bundleURL + "&deltaBundleId=" + mDeltaId;
    }
    return bundleURL;
  }

  public synchronized boolean storeDeltaInFile(BufferedSource body, File outputFile)
    throws IOException {

    JsonReader jsonReader = new JsonReader(new InputStreamReader(body.inputStream()));

    jsonReader.beginObject();

    int numChangedModules = 0;

    while (jsonReader.hasNext()) {
      String name = jsonReader.nextName();
      if (name.equals("id")) {
        mDeltaId = jsonReader.nextString();
      } else if (name.equals("pre")) {
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
      return false;
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

    return true;
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
