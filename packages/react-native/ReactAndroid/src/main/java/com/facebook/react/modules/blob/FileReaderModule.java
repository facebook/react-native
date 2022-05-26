/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.blob;

import android.util.Base64;
import com.facebook.fbreact.specs.NativeFileReaderModuleSpec;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = FileReaderModule.NAME)
public class FileReaderModule extends NativeFileReaderModuleSpec {

  public static final String NAME = "FileReaderModule";
  private static final String ERROR_INVALID_BLOB = "ERROR_INVALID_BLOB";

  public FileReaderModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return NAME;
  }

  private BlobModule getBlobModule(String reason) {
    ReactApplicationContext reactApplicationContext = getReactApplicationContextIfActiveOrWarn();

    if (reactApplicationContext != null) {
      return reactApplicationContext.getNativeModule(BlobModule.class);
    }

    return null;
  }

  @Override
  public void readAsText(ReadableMap blob, String encoding, Promise promise) {
    BlobModule blobModule = getBlobModule("readAsText");

    if (blobModule == null) {
      promise.reject(
          new IllegalStateException("Could not get BlobModule from ReactApplicationContext"));
      return;
    }

    byte[] bytes =
        blobModule.resolve(blob.getString("blobId"), blob.getInt("offset"), blob.getInt("size"));

    if (bytes == null) {
      promise.reject(ERROR_INVALID_BLOB, "The specified blob is invalid");
      return;
    }

    try {
      promise.resolve(new String(bytes, encoding));
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @Override
  public void readAsDataURL(ReadableMap blob, Promise promise) {
    BlobModule blobModule = getBlobModule("readAsDataURL");

    if (blobModule == null) {
      promise.reject(
          new IllegalStateException("Could not get BlobModule from ReactApplicationContext"));
      return;
    }

    byte[] bytes =
        blobModule.resolve(blob.getString("blobId"), blob.getInt("offset"), blob.getInt("size"));

    if (bytes == null) {
      promise.reject(ERROR_INVALID_BLOB, "The specified blob is invalid");
      return;
    }

    try {
      StringBuilder sb = new StringBuilder();
      sb.append("data:");

      if (blob.hasKey("type") && !blob.getString("type").isEmpty()) {
        sb.append(blob.getString("type"));
      } else {
        sb.append("application/octet-stream");
      }

      sb.append(";base64,");
      sb.append(Base64.encodeToString(bytes, Base64.NO_WRAP));

      promise.resolve(sb.toString());
    } catch (Exception e) {
      promise.reject(e);
    }
  }
}
