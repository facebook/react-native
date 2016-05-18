/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge.webworkers;

import java.io.File;
import java.io.IOException;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.queue.MessageQueueThread;
import com.facebook.react.bridge.queue.MessageQueueThreadImpl;
import com.facebook.react.bridge.queue.ProxyQueueThreadExceptionHandler;
import com.facebook.react.common.build.ReactBuildConfig;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okio.Okio;
import okio.Sink;

@DoNotStrip
public class WebWorkers {

  /**
   * Creates a new MessageQueueThread for a background web worker owned by the JS thread with the
   * given MessageQueueThread.
   */
  @DoNotStrip
  public static MessageQueueThread createWebWorkerThread(int id, MessageQueueThread ownerThread) {
    return MessageQueueThreadImpl.startNewBackgroundThread(
        "web-worker-" + id,
        new ProxyQueueThreadExceptionHandler(ownerThread));
  }

  /**
   * Utility method used to help develop web workers on debug builds. In release builds, worker
   * scripts need to be packaged with the app, but in dev mode we want to fetch/reload the worker
   * script on the fly from the packager. This method fetches the given URL *synchronously* and
   * writes it to the specified temp file.
   *
   * This is exposed from Java only because we don't want to add a C++ networking library dependency
   *
   * NB: The caller is responsible for deleting the file specified by outFileName when they're done
   * with it.
   * NB: We write to a temp file instead of returning a String because, depending on the size of the
   * worker script, allocating the full script string on the Java heap can cause an OOM.
   */
  public static void downloadScriptToFileSync(String url, String outFileName) {
    if (!ReactBuildConfig.DEBUG) {
      throw new RuntimeException(
          "For security reasons, downloading scripts is only allowed in debug builds.");
    }

    OkHttpClient client = new OkHttpClient();
    final File out = new File(outFileName);

    Request request = new Request.Builder()
        .url(url)
        .build();

    try {
      Response response = client.newCall(request).execute();

      Sink output = Okio.sink(out);
      Okio.buffer(response.body().source()).readAll(output);
    } catch (IOException e) {
      throw new RuntimeException("Exception downloading web worker script to file", e);
    }
  }
}
