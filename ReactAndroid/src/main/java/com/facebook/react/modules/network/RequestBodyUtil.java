/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.network;

import android.content.Context;
import android.net.Uri;
import com.facebook.common.logging.FLog;
import com.facebook.react.common.ReactConstants;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.nio.channels.Channels;
import java.nio.channels.ReadableByteChannel;
import java.util.zip.GZIPOutputStream;
import javax.annotation.Nullable;
import okhttp3.MediaType;
import okhttp3.RequestBody;
import okhttp3.internal.Util;
import okio.BufferedSink;
import okio.ByteString;
import okio.Okio;
import okio.Source;

/**
 * Helper class that provides the necessary methods for creating the RequestBody from a file
 * specification, such as a contentUri.
 */
/*package*/ class RequestBodyUtil {

  private static final String CONTENT_ENCODING_GZIP = "gzip";
  private static final String NAME = "RequestBodyUtil";
  private static final String TEMP_FILE_SUFFIX = "temp";

  /**
   * Returns whether encode type indicates the body needs to be gzip-ed.
   */
  public static boolean isGzipEncoding(@Nullable final String encodingType) {
    return CONTENT_ENCODING_GZIP.equalsIgnoreCase(encodingType);
  }

  /**
   * Returns the input stream for a file given by its contentUri. Returns null if the file has not
   * been found or if an error as occurred.
   */
  public static @Nullable InputStream getFileInputStream(
      Context context,
      String fileContentUriStr) {
    try {
      Uri fileContentUri = Uri.parse(fileContentUriStr);

      if (fileContentUri.getScheme().startsWith("http")) {
        return getDownloadFileInputStream(context, fileContentUri);
      }
      return context.getContentResolver().openInputStream(fileContentUri);
    } catch (Exception e) {
      FLog.e(
          ReactConstants.TAG,
          "Could not retrieve file for contentUri " + fileContentUriStr,
          e);
      return null;
    }
  }

  /**
   * Download and cache a file locally. This should be used when document picker returns a URI that
   * points to a file on the network. Returns input stream for the downloaded file.
   */
  private static InputStream getDownloadFileInputStream(Context context, Uri uri)
      throws IOException {
    final File outputDir = context.getApplicationContext().getCacheDir();
    final File file = File.createTempFile(NAME, TEMP_FILE_SUFFIX, outputDir);
    file.deleteOnExit();

    final URL url = new URL(uri.toString());
    final InputStream is = url.openStream();
    try {
      final ReadableByteChannel channel = Channels.newChannel(is);
      try {
        final FileOutputStream stream = new FileOutputStream(file);
        try {
          stream.getChannel().transferFrom(channel, 0, Long.MAX_VALUE);
          return new FileInputStream(file);
        } finally {
          stream.close();
        }
      } finally {
        channel.close();
      }
    } finally {
      is.close();
    }
  }

  /** Creates a RequestBody from a mediaType and gzip-ed body string */
  public static @Nullable RequestBody createGzip(final MediaType mediaType, final String body) {
    ByteArrayOutputStream gzipByteArrayOutputStream = new ByteArrayOutputStream();
    try {
      OutputStream gzipOutputStream = new GZIPOutputStream(gzipByteArrayOutputStream);
      gzipOutputStream.write(body.getBytes());
      gzipOutputStream.close();
    } catch (IOException e) {
      return null;
    }
    return RequestBody.create(mediaType, gzipByteArrayOutputStream.toByteArray());
  }

  /**
   * Creates a RequestBody from a mediaType and inputStream given.
   */
  public static RequestBody create(final MediaType mediaType, final InputStream inputStream) {
    return new RequestBody() {
      @Override
      public MediaType contentType() {
        return mediaType;
      }

      @Override
      public long contentLength() {
        try {
          return inputStream.available();
        } catch (IOException e) {
          return 0;
        }
      }

      @Override
      public void writeTo(BufferedSink sink) throws IOException {
        Source source = null;
        try {
          source = Okio.source(inputStream);
          sink.writeAll(source);
        } finally {
          Util.closeQuietly(source);
        }
      }
    };
  }

  /**
   * Creates a ProgressRequestBody that can be used for showing uploading progress
   */
  public static ProgressRequestBody createProgressRequest(
      RequestBody requestBody,
      ProgressListener listener) {
    return new ProgressRequestBody(requestBody, listener);
  }

  /**
   * Creates a empty RequestBody if required by the http method spec, otherwise use null
   */
  public static RequestBody getEmptyBody(String method) {
    if (method.equals("POST") || method.equals("PUT") || method.equals("PATCH")) {
      return RequestBody.create(null, ByteString.EMPTY);
    } else {
      return null;
    }
  }
}
