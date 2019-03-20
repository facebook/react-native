/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.camera;

import java.io.ByteArrayOutputStream;
import java.io.Closeable;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;

import android.content.ContentResolver;
import android.net.Uri;
import android.os.AsyncTask;
import android.util.Base64;
import android.util.Base64OutputStream;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.GuardedAsyncTask;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = "ImageStoreManager")
public class ImageStoreManager extends ReactContextBaseJavaModule {

  private static final int BUFFER_SIZE = 8192;

  public ImageStoreManager(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ImageStoreManager";
  }

  /**
   * Calculate the base64 representation for an image. The "tag" comes from iOS naming.
   *
   * @param uri the URI of the image, file:// or content://
   * @param success callback to be invoked with the base64 string as the only argument
   * @param error callback to be invoked on error (e.g. file not found, not readable etc.)
   */
  @ReactMethod
  public void getBase64ForTag(String uri, Callback success, Callback error) {
    new GetBase64Task(getReactApplicationContext(), uri, success, error)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  private class GetBase64Task extends GuardedAsyncTask<Void, Void> {
    private final String mUri;
    private final Callback mSuccess;
    private final Callback mError;

    private GetBase64Task(
        ReactContext reactContext,
        String uri,
        Callback success,
        Callback error) {
      super(reactContext);
      mUri = uri;
      mSuccess = success;
      mError = error;
    }

    @Override
    protected void doInBackgroundGuarded(Void... params) {
      try {
        ContentResolver contentResolver = getReactApplicationContext().getContentResolver();
        Uri uri = Uri.parse(mUri);
        InputStream is = contentResolver.openInputStream(uri);
        try {
          mSuccess.invoke(convertInputStreamToBase64OutputStream(is));
        } catch (IOException e) {
          mError.invoke(e.getMessage());
        } finally {
          closeQuietly(is);
        }
      } catch (FileNotFoundException e) {
        mError.invoke(e.getMessage());
      }
    }
  }

  String convertInputStreamToBase64OutputStream(InputStream is) throws IOException {
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    Base64OutputStream b64os = new Base64OutputStream(baos, Base64.NO_WRAP);
    byte[] buffer = new byte[BUFFER_SIZE];
    int bytesRead;
    try {
      while ((bytesRead = is.read(buffer)) > -1) {
        b64os.write(buffer, 0, bytesRead);
      }
    } finally {
      closeQuietly(b64os); // this also closes baos and flushes the final content to it
    }
    return baos.toString();
  }

  private static void closeQuietly(Closeable closeable) {
    try {
      closeable.close();
    } catch (IOException e) {
      // shhh
    }
  }
}
