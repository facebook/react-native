/**
<<<<<<< HEAD
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

=======
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * <p>This source code is licensed under the BSD-style license found in the LICENSE file in the root
 * directory of this source tree. An additional grant of patent rights can be found in the PATENTS
 * file in the same directory.
 */
>>>>>>> master
package com.facebook.react.modules.blob;

import android.content.ContentProvider;
import android.content.ContentValues;
<<<<<<< HEAD
=======
import android.content.Context;
>>>>>>> master
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.support.annotation.Nullable;
<<<<<<< HEAD

=======
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.bridge.ReactContext;
>>>>>>> master
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.OutputStream;

public final class BlobProvider extends ContentProvider {

  @Override
  public boolean onCreate() {
<<<<<<< HEAD
    return false;
  }

  @Nullable
  @Override
  public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
    return null;
  }

  @Nullable
  @Override
  public String getType(Uri uri) {
    return null;
  }

  @Nullable
  @Override
  public Uri insert(Uri uri, ContentValues values) {
=======
    return true;
  }

  @Override
  public @Nullable Cursor query(
      Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
    return null;
  }

  @Override
  public @Nullable String getType(Uri uri) {
    return null;
  }

  @Override
  public @Nullable Uri insert(Uri uri, ContentValues values) {
>>>>>>> master
    return null;
  }

  @Override
  public int delete(Uri uri, String selection, String[] selectionArgs) {
    return 0;
  }

  @Override
  public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) {
    return 0;
  }

  @Override
  public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
    if (!mode.equals("r")) {
      throw new FileNotFoundException("Cannot open " + uri.toString() + " in mode '" + mode + "'");
    }
<<<<<<< HEAD
    byte[] data = BlobModule.resolve(uri);
=======

    BlobModule blobModule = null;
    Context context = getContext().getApplicationContext();
    if (context instanceof ReactApplication) {
      ReactNativeHost host = ((ReactApplication) context).getReactNativeHost();
      ReactContext reactContext = host.getReactInstanceManager().getCurrentReactContext();
      blobModule = reactContext.getNativeModule(BlobModule.class);
    }

    if (blobModule == null) {
      throw new RuntimeException("No blob module associated with BlobProvider");
    }

    byte[] data = blobModule.resolve(uri);
>>>>>>> master
    if (data == null) {
      throw new FileNotFoundException("Cannot open " + uri.toString() + ", blob not found.");
    }

    ParcelFileDescriptor[] pipe;
    try {
      pipe = ParcelFileDescriptor.createPipe();
    } catch (IOException exception) {
      return null;
    }
    ParcelFileDescriptor readSide = pipe[0];
    ParcelFileDescriptor writeSide = pipe[1];

    OutputStream outputStream = new ParcelFileDescriptor.AutoCloseOutputStream(writeSide);
    try {
      outputStream.write(data);
      outputStream.close();
    } catch (IOException exception) {
      return null;
    }

    return readSide;
  }
}
