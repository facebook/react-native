/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport;

import javax.annotation.Nullable;

import java.io.File;
import java.io.IOException;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

import android.content.Context;
import android.os.Build;
import android.os.Handler;
import android.text.TextUtils;

import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.ReactConstants;

import com.squareup.okhttp.Call;
import com.squareup.okhttp.Callback;
import com.squareup.okhttp.ConnectionPool;
import com.squareup.okhttp.OkHttpClient;
import com.squareup.okhttp.Request;
import com.squareup.okhttp.Response;
import okio.Okio;
import okio.Sink;

/**
 * Helper class for all things about the debug server running in the engineer's host machine.
 *
 * One can use 'debug_http_host' shared preferences key to provide a host name for the debug server.
 * If the setting is empty we support and detect two basic configuration that works well for android
 * emulators connectiong to debug server running on emulator's host:
 *  - Android stock emulator with standard non-configurable local loopback alias: 10.0.2.2,
 *  - Genymotion emulator with default settings: 10.0.3.2
 */
/* package */ class DevServerHelper {

  public static final String RELOAD_APP_EXTRA_JS_PROXY = "jsproxy";
  private static final String RELOAD_APP_ACTION_SUFFIX = ".RELOAD_APP_ACTION";

  private static final String EMULATOR_LOCALHOST = "10.0.2.2:8081";
  private static final String GENYMOTION_LOCALHOST = "10.0.3.2:8081";
  private static final String DEVICE_LOCALHOST = "localhost:8081";

  private static final String BUNDLE_URL_FORMAT =
      "http://%s/%s.bundle?platform=android&dev=%s";
  private static final String SOURCE_MAP_URL_FORMAT =
      BUNDLE_URL_FORMAT.replaceFirst("\\.bundle", ".map");
  private static final String LAUNCH_CHROME_DEVTOOLS_COMMAND_URL_FORMAT =
      "http://%s/launch-chrome-devtools";
  private static final String ONCHANGE_ENDPOINT_URL_FORMAT =
      "http://%s/onchange";
  private static final String WEBSOCKET_PROXY_URL_FORMAT = "ws://%s/debugger-proxy";

  private static final int LONG_POLL_KEEP_ALIVE_DURATION_MS = 2 * 60 * 1000; // 2 mins
  private static final int LONG_POLL_FAILURE_DELAY_MS = 5000;
  private static final int HTTP_CONNECT_TIMEOUT_MS = 5000;

  public interface BundleDownloadCallback {
    void onSuccess();
    void onFailure(Exception cause);
  }

  public interface OnServerContentChangeListener {
    void onServerContentChanged();
  }

  private final DevInternalSettings mSettings;
  private final OkHttpClient mClient;
  private final Handler mRestartOnChangePollingHandler;

  private boolean mOnChangePollingEnabled;
  private @Nullable OkHttpClient mOnChangePollingClient;
  private @Nullable OnServerContentChangeListener mOnServerContentChangeListener;

  public DevServerHelper(DevInternalSettings settings) {
    mSettings = settings;
    mClient = new OkHttpClient();
    mClient.setConnectTimeout(HTTP_CONNECT_TIMEOUT_MS, TimeUnit.MILLISECONDS);

    // No read or write timeouts by default
    mClient.setReadTimeout(0, TimeUnit.MILLISECONDS);
    mClient.setWriteTimeout(0, TimeUnit.MILLISECONDS);
    mRestartOnChangePollingHandler = new Handler();
  }

  /** Intent action for reloading the JS */
  public static String getReloadAppAction(Context context) {
    return context.getPackageName() + RELOAD_APP_ACTION_SUFFIX;
  }

  public String getWebsocketProxyURL() {
    return String.format(Locale.US, WEBSOCKET_PROXY_URL_FORMAT, getDebugServerHost());
  }

  /**
   * @return the host to use when connecting to the bundle server from the host itself.
   */
  private static String getHostForJSProxy() {
    return DEVICE_LOCALHOST;
  }

  /**
   * @return whether we should enabled dev mode or not when requesting JS bundles.
   */
  private boolean getDevMode() {
    return mSettings.isJSDevModeEnabled();
  }

  /**
   * @return the host to use when connecting to the bundle server.
   */
  private String getDebugServerHost() {
    // Check debug server host setting first. If empty try to detect emulator type and use default
    // hostname for those
    String hostFromSettings = mSettings.getDebugServerHost();
    if (!TextUtils.isEmpty(hostFromSettings)) {
      return Assertions.assertNotNull(hostFromSettings);
    }

    // Since genymotion runs in vbox it use different hostname to refer to adb host.
    // We detect whether app runs on genymotion and replace js bundle server hostname accordingly
    if (isRunningOnGenymotion()) {
      return GENYMOTION_LOCALHOST;
    }
    if (isRunningOnStockEmulator()) {
      return EMULATOR_LOCALHOST;
    }
    FLog.w(
        ReactConstants.TAG,
        "You seem to be running on device. Run 'adb reverse tcp:8081 tcp:8081' " +
            "to forward the debug server's port to the device.");
    return DEVICE_LOCALHOST;
  }

  private boolean isRunningOnGenymotion() {
    return Build.FINGERPRINT.contains("vbox");
  }

  private boolean isRunningOnStockEmulator() {
    return Build.FINGERPRINT.contains("generic");
  }

  private String createBundleURL(String host, String jsModulePath, boolean devMode) {
    return String.format(BUNDLE_URL_FORMAT, host, jsModulePath, devMode);
  }

  public void downloadBundleFromURL(
      final BundleDownloadCallback callback,
      final String jsModulePath,
      final File outputFile) {
    final String bundleURL = createBundleURL(getDebugServerHost(), jsModulePath, getDevMode());
    Request request = new Request.Builder()
        .url(bundleURL)
        .build();
    Call call = mClient.newCall(request);
    call.enqueue(new Callback() {
      @Override
      public void onFailure(Request request, IOException e) {
        callback.onFailure(e);
      }

      @Override
      public void onResponse(Response response) throws IOException {
        // Check for server errors. If the server error has the expected form, fail with more info.
        if (!response.isSuccessful()) {
          String body = response.body().string();
          DebugServerException debugServerException = DebugServerException.parse(body);
          if (debugServerException != null) {
            callback.onFailure(debugServerException);
          } else {
            callback.onFailure(new IOException("Unexpected response code: " + response.code()));
          }
          return;
        }

        Sink output = null;
        try {
          output = Okio.sink(outputFile);
          Okio.buffer(response.body().source()).readAll(output);
          callback.onSuccess();
        } finally {
          if (output != null) {
            output.close();
          }
        }
      }
    });
  }

  public void stopPollingOnChangeEndpoint() {
    mOnChangePollingEnabled = false;
    mRestartOnChangePollingHandler.removeCallbacksAndMessages(null);
    if (mOnChangePollingClient != null) {
      mOnChangePollingClient.cancel(this);
      mOnChangePollingClient = null;
    }
    mOnServerContentChangeListener = null;
  }

  public void startPollingOnChangeEndpoint(
      OnServerContentChangeListener onServerContentChangeListener) {
    if (mOnChangePollingEnabled) {
      // polling already enabled
      return;
    }
    mOnChangePollingEnabled = true;
    mOnServerContentChangeListener = onServerContentChangeListener;
    mOnChangePollingClient = new OkHttpClient();
    mOnChangePollingClient
        .setConnectionPool(new ConnectionPool(1, LONG_POLL_KEEP_ALIVE_DURATION_MS))
        .setConnectTimeout(HTTP_CONNECT_TIMEOUT_MS, TimeUnit.MILLISECONDS);
    enqueueOnChangeEndpointLongPolling();
  }

  private void handleOnChangePollingResponse(boolean didServerContentChanged) {
    if (mOnChangePollingEnabled) {
      if (didServerContentChanged) {
        UiThreadUtil.runOnUiThread(new Runnable() {
          @Override
          public void run() {
            if (mOnServerContentChangeListener != null) {
              mOnServerContentChangeListener.onServerContentChanged();
            }
          }
        });
      }
      enqueueOnChangeEndpointLongPolling();
    }
  }

  private void enqueueOnChangeEndpointLongPolling() {
    Request request = new Request.Builder().url(createOnChangeEndpointUrl()).tag(this).build();
    Assertions.assertNotNull(mOnChangePollingClient).newCall(request).enqueue(new Callback() {
      @Override
      public void onFailure(Request request, IOException e) {
        if (mOnChangePollingEnabled) {
          // this runnable is used by onchange endpoint poller to delay subsequent requests in case
          // of a failure, so that we don't flood network queue with frequent requests in case when
          // dev server is down
          FLog.d(ReactConstants.TAG, "Error while requesting /onchange endpoint", e);
          mRestartOnChangePollingHandler.postDelayed(
              new Runnable() {
            @Override
            public void run() {
              handleOnChangePollingResponse(false);
            }
          },
              LONG_POLL_FAILURE_DELAY_MS);
        }
      }

      @Override
      public void onResponse(Response response) throws IOException {
        handleOnChangePollingResponse(response.code() == 205);
      }
    });
  }

  private String createOnChangeEndpointUrl() {
    return String.format(Locale.US, ONCHANGE_ENDPOINT_URL_FORMAT, getDebugServerHost());
  }

  private String createLaunchChromeDevtoolsCommandUrl() {
    return String.format(LAUNCH_CHROME_DEVTOOLS_COMMAND_URL_FORMAT, getDebugServerHost());
  }

  public void launchChromeDevtools() {
    Request request = new Request.Builder()
        .url(createLaunchChromeDevtoolsCommandUrl())
        .build();
    mClient.newCall(request).enqueue(new Callback() {
      @Override
      public void onFailure(Request request, IOException e) {
        // ignore HTTP call response, this is just to open a debugger page and there is no reason
        // to report failures from here
      }

      @Override
      public void onResponse(Response response) throws IOException {
        // ignore HTTP call response - see above
      }
    });
  }

  public String getSourceMapUrl(String mainModuleName) {
    return String.format(Locale.US, SOURCE_MAP_URL_FORMAT, getDebugServerHost(), mainModuleName, getDevMode());
  }

  public String getSourceUrl(String mainModuleName) {
    return String.format(Locale.US, BUNDLE_URL_FORMAT, getDebugServerHost(), mainModuleName, getDevMode());
  }

  public String getJSBundleURLForRemoteDebugging(String mainModuleName) {
    // The host IP we use when connecting to the JS bundle server from the emulator is not the
    // same as the one needed to connect to the same server from the Chrome proxy running on the
    // host itself.
    return createBundleURL(getHostForJSProxy(), mainModuleName, getDevMode());
  }
}
