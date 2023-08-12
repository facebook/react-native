/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import com.facebook.common.logging.FLog;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.devsupport.interfaces.PackagerStatusCallback;
import java.io.IOException;
import java.util.Locale;
import java.util.concurrent.TimeUnit;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;

/** Use this class to check if the JavaScript packager is running on the provided host. */
public class PackagerStatusCheck {

  private static final String PACKAGER_OK_STATUS = "packager-status:running";
  private static final int HTTP_CONNECT_TIMEOUT_MS = 5000;
  private static final String PACKAGER_STATUS_URL_TEMPLATE = "http://%s/status";

  private final OkHttpClient mClient;

  public PackagerStatusCheck() {
    mClient =
        new OkHttpClient.Builder()
            .connectTimeout(HTTP_CONNECT_TIMEOUT_MS, TimeUnit.MILLISECONDS)
            .readTimeout(0, TimeUnit.MILLISECONDS)
            .writeTimeout(0, TimeUnit.MILLISECONDS)
            .build();
  }

  public PackagerStatusCheck(OkHttpClient client) {
    mClient = client;
  }

  public void run(String host, final PackagerStatusCallback callback) {
    String statusURL = createPackagerStatusURL(host);
    Request request = new Request.Builder().url(statusURL).build();

    mClient
        .newCall(request)
        .enqueue(
            new Callback() {
              @Override
              public void onFailure(Call call, IOException e) {
                FLog.w(
                    ReactConstants.TAG,
                    "The packager does not seem to be running as we got an IOException requesting "
                        + "its status: "
                        + e.getMessage());
                callback.onPackagerStatusFetched(false);
              }

              @Override
              public void onResponse(Call call, Response response) throws IOException {
                if (!response.isSuccessful()) {
                  FLog.e(
                      ReactConstants.TAG,
                      "Got non-success http code from packager when requesting status: "
                          + response.code());
                  callback.onPackagerStatusFetched(false);
                  return;
                }
                ResponseBody body = response.body();
                if (body == null) {
                  FLog.e(
                      ReactConstants.TAG,
                      "Got null body response from packager when requesting status");
                  callback.onPackagerStatusFetched(false);
                  return;
                }
                String bodyString =
                    body.string(); // cannot call body.string() twice, stored it into variable.
                // https://github.com/square/okhttp/issues/1240#issuecomment-68142603
                if (!PACKAGER_OK_STATUS.equals(bodyString)) {
                  FLog.e(
                      ReactConstants.TAG,
                      "Got unexpected response from packager when requesting status: "
                          + bodyString);
                  callback.onPackagerStatusFetched(false);
                  return;
                }
                callback.onPackagerStatusFetched(true);
              }
            });
  }

  private static String createPackagerStatusURL(String host) {
    return String.format(Locale.US, PACKAGER_STATUS_URL_TEMPLATE, host);
  }
}
