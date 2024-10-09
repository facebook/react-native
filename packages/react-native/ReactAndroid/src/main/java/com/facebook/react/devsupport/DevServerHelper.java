/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.content.Context;
import android.net.Uri;
import android.os.AsyncTask;
import android.provider.Settings.Secure;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener;
import com.facebook.react.devsupport.interfaces.PackagerStatusCallback;
import com.facebook.react.modules.debug.interfaces.DeveloperSettings;
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers;
import com.facebook.react.packagerconnection.FileIoHandler;
import com.facebook.react.packagerconnection.JSPackagerClient;
import com.facebook.react.packagerconnection.NotificationOnlyHandler;
import com.facebook.react.packagerconnection.PackagerConnectionSettings;
import com.facebook.react.packagerconnection.ReconnectingWebSocket.ConnectionCallback;
import com.facebook.react.packagerconnection.RequestHandler;
import com.facebook.react.packagerconnection.RequestOnlyHandler;
import com.facebook.react.packagerconnection.Responder;
import com.facebook.react.util.RNLog;
import java.io.File;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okio.Okio;
import okio.Sink;

/**
 * Helper class for all things about the debug server running in the engineer's host machine.
 *
 * <p>One can use 'debug_http_host' shared preferences key to provide a host name for the debug
 * server. If the setting is empty we support and detect two basic configuration that works well for
 * android emulators connection to debug server running on emulator's host:
 *
 * <ul>
 *   <li>Android stock emulator with standard non-configurable local loopback alias: 10.0.2.2
 *   <li>Genymotion emulator with default settings: 10.0.3.2
 * </ul>
 */
public class DevServerHelper {
  public static final String RELOAD_APP_EXTRA_JS_PROXY = "jsproxy";

  private static final int HTTP_CONNECT_TIMEOUT_MS = 5000;

  private static final String DEBUGGER_MSG_DISABLE = "{ \"id\":1,\"method\":\"Debugger.disable\" }";

  public interface PackagerCommandListener {
    void onPackagerConnected();

    void onPackagerDisconnected();

    void onPackagerReloadCommand();

    void onPackagerDevMenuCommand();

    void onCaptureHeapCommand(final Responder responder);

    // Allow apps to provide listeners for custom packager commands.
    @Nullable
    Map<String, RequestHandler> customCommandHandlers();
  }

  private enum BundleType {
    BUNDLE("bundle"),
    MAP("map");

    private final String mTypeID;

    BundleType(String typeID) {
      mTypeID = typeID;
    }

    public String typeID() {
      return mTypeID;
    }
  }

  private final DeveloperSettings mSettings;

  private final PackagerConnectionSettings mPackagerConnectionSettings;

  private final OkHttpClient mClient;
  private final BundleDownloader mBundleDownloader;
  private final PackagerStatusCheck mPackagerStatusCheck;
  private final Context mApplicationContext;
  private final String mPackageName;

  private @Nullable JSPackagerClient mPackagerClient;
  private @Nullable IInspectorPackagerConnection mInspectorPackagerConnection;

  public DevServerHelper(
      DeveloperSettings developerSettings,
      Context applicationContext,
      PackagerConnectionSettings packagerConnectionSettings) {
    mSettings = developerSettings;
    mPackagerConnectionSettings = packagerConnectionSettings;
    mClient =
        new OkHttpClient.Builder()
            .connectTimeout(HTTP_CONNECT_TIMEOUT_MS, TimeUnit.MILLISECONDS)
            .readTimeout(0, TimeUnit.MILLISECONDS)
            .writeTimeout(0, TimeUnit.MILLISECONDS)
            .build();
    mBundleDownloader = new BundleDownloader(mClient);
    mPackagerStatusCheck = new PackagerStatusCheck(mClient);
    mApplicationContext = applicationContext;
    mPackageName = applicationContext.getPackageName();
  }

  public void openPackagerConnection(
      final String clientId, final PackagerCommandListener commandListener) {
    if (mPackagerClient != null) {
      FLog.w(ReactConstants.TAG, "Packager connection already open, nooping.");
      return;
    }
    new AsyncTask<Void, Void, Void>() {
      @Override
      protected Void doInBackground(Void... backgroundParams) {
        Map<String, RequestHandler> handlers = new HashMap<>();
        handlers.put(
            "reload",
            new NotificationOnlyHandler() {
              @Override
              public void onNotification(@Nullable Object params) {
                commandListener.onPackagerReloadCommand();
              }
            });
        handlers.put(
            "devMenu",
            new NotificationOnlyHandler() {
              @Override
              public void onNotification(@Nullable Object params) {
                commandListener.onPackagerDevMenuCommand();
              }
            });
        handlers.put(
            "captureHeap",
            new RequestOnlyHandler() {
              @Override
              public void onRequest(@Nullable Object params, Responder responder) {
                commandListener.onCaptureHeapCommand(responder);
              }
            });
        Map<String, RequestHandler> customHandlers = commandListener.customCommandHandlers();
        if (customHandlers != null) {
          handlers.putAll(customHandlers);
        }
        handlers.putAll(new FileIoHandler().handlers());

        ConnectionCallback onPackagerConnectedCallback =
            new ConnectionCallback() {
              @Override
              public void onConnected() {
                commandListener.onPackagerConnected();
              }

              @Override
              public void onDisconnected() {
                commandListener.onPackagerDisconnected();
              }
            };

        mPackagerClient =
            new JSPackagerClient(
                clientId, mPackagerConnectionSettings, handlers, onPackagerConnectedCallback);
        mPackagerClient.init();

        return null;
      }
    }.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  public void closePackagerConnection() {
    new AsyncTask<Void, Void, Void>() {
      @Override
      protected Void doInBackground(Void... params) {
        if (mPackagerClient != null) {
          mPackagerClient.close();
          mPackagerClient = null;
        }
        return null;
      }
    }.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  public void openInspectorConnection() {
    if (mInspectorPackagerConnection != null) {
      FLog.w(ReactConstants.TAG, "Inspector connection already open, nooping.");
      return;
    }
    new AsyncTask<Void, Void, Void>() {
      @Override
      protected Void doInBackground(Void... params) {
        if (InspectorFlags.getFuseboxEnabled()) {
          mInspectorPackagerConnection =
              new CxxInspectorPackagerConnection(getInspectorDeviceUrl(), mPackageName);
        } else {
          mInspectorPackagerConnection =
              new InspectorPackagerConnection(getInspectorDeviceUrl(), mPackageName);
        }
        mInspectorPackagerConnection.connect();
        return null;
      }
    }.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  public void disableDebugger() {
    if (mInspectorPackagerConnection != null) {
      mInspectorPackagerConnection.sendEventToAllConnections(DEBUGGER_MSG_DISABLE);
    }
  }

  public void closeInspectorConnection() {
    new AsyncTask<Void, Void, Void>() {
      @Override
      protected Void doInBackground(Void... params) {
        if (mInspectorPackagerConnection != null) {
          mInspectorPackagerConnection.closeQuietly();
          mInspectorPackagerConnection = null;
        }
        return null;
      }
    }.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  public String getWebsocketProxyURL() {
    return String.format(
        Locale.US,
        "ws://%s/debugger-proxy?role=client",
        mPackagerConnectionSettings.getDebugServerHost());
  }

  private static String getSHA256(String string) {
    MessageDigest digest = null;
    try {
      digest = MessageDigest.getInstance("SHA-256");
    } catch (NoSuchAlgorithmException e) {
      throw new AssertionError("Could not get standard SHA-256 algorithm", e);
    }
    digest.reset();
    byte[] result;
    try {
      result = digest.digest(string.getBytes("UTF-8"));
    } catch (UnsupportedEncodingException e) {
      throw new AssertionError("This environment doesn't support UTF-8 encoding", e);
    }
    return String.format(
        "%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x",
        result[0],
        result[1],
        result[2],
        result[3],
        result[4],
        result[5],
        result[6],
        result[7],
        result[8],
        result[9],
        result[10],
        result[11],
        result[12],
        result[13],
        result[14],
        result[15],
        result[16],
        result[17],
        result[18],
        result[19]);
  }

  // Returns an opaque ID which is stable for the current combination of device and app, stable
  // across installs, and unique across devices.
  private String getInspectorDeviceId() {
    // Every Android app has a unique application ID that looks like a Java or Kotlin package name,
    // such as com.example.myapp. This ID uniquely identifies your app on the device and in the
    // Google Play Store.
    // [Source: Android docs]
    String packageName = mPackageName;

    // A 64-bit number expressed as a hexadecimal string, which is either:
    // * unique to each combination of app-signing key, user, and device (API level >= 26), or
    // * randomly generated when the user first sets up the device and should remain constant for
    // the lifetime of the user's device (API level < 26).
    // [Source: Android docs]
    String androidId =
        Secure.getString(mApplicationContext.getContentResolver(), Secure.ANDROID_ID);

    String rawDeviceId =
        String.format(
            Locale.US,
            "android-%s-%s-%s",
            packageName,
            androidId,
            InspectorFlags.getFuseboxEnabled() ? "fusebox" : "legacy");

    return getSHA256(rawDeviceId);
  }

  private String getInspectorDeviceUrl() {
    return String.format(
        Locale.US,
        "http://%s/inspector/device?name=%s&app=%s&device=%s",
        mPackagerConnectionSettings.getDebugServerHost(),
        Uri.encode(AndroidInfoHelpers.getFriendlyDeviceName()),
        Uri.encode(mPackageName),
        Uri.encode(getInspectorDeviceId()));
  }

  public void downloadBundleFromURL(
      DevBundleDownloadListener callback,
      File outputFile,
      String bundleURL,
      BundleDownloader.BundleInfo bundleInfo) {
    mBundleDownloader.downloadBundleFromURL(callback, outputFile, bundleURL, bundleInfo);
  }

  public void downloadBundleFromURL(
      DevBundleDownloadListener callback,
      File outputFile,
      String bundleURL,
      BundleDownloader.BundleInfo bundleInfo,
      Request.Builder requestBuilder) {
    mBundleDownloader.downloadBundleFromURL(
        callback, outputFile, bundleURL, bundleInfo, requestBuilder);
  }

  /**
   * @return the host to use when connecting to the bundle server from the host itself.
   */
  private String getHostForJSProxy() {
    // Use custom port if configured. Note that host stays "localhost".
    String host = Assertions.assertNotNull(mPackagerConnectionSettings.getDebugServerHost());
    int portOffset = host.lastIndexOf(':');
    if (portOffset > -1) {
      return "localhost" + host.substring(portOffset);
    } else {
      return AndroidInfoHelpers.DEVICE_LOCALHOST;
    }
  }

  /**
   * @return whether we should enable dev mode when requesting JS bundles.
   */
  private boolean getDevMode() {
    return mSettings.isJSDevModeEnabled();
  }

  /**
   * @return whether we should request minified JS bundles.
   */
  private boolean getJSMinifyMode() {
    return mSettings.isJSMinifyEnabled();
  }

  private String createBundleURL(String mainModuleID, BundleType type, String host) {
    return createBundleURL(mainModuleID, type, host, false, true);
  }

  private String createSplitBundleURL(String mainModuleID, String host) {
    return createBundleURL(mainModuleID, BundleType.BUNDLE, host, true, false);
  }

  private String createBundleURL(
      String mainModuleID, BundleType type, String host, boolean modulesOnly, boolean runModule) {
    boolean dev = getDevMode();
    return String.format(
            Locale.US,
            "http://%s/%s.%s?platform=android&dev=%s&lazy=%s&minify=%s&app=%s&modulesOnly=%s&runModule=%s",
            host,
            mainModuleID,
            type.typeID(),
            dev, // dev
            dev, // lazy
            getJSMinifyMode(),
            mPackageName,
            modulesOnly ? "true" : "false",
            runModule ? "true" : "false")
        + (InspectorFlags.getFuseboxEnabled() ? "&excludeSource=true&sourcePaths=url-server" : "");
  }

  private String createBundleURL(String mainModuleID, BundleType type) {
    return createBundleURL(mainModuleID, type, mPackagerConnectionSettings.getDebugServerHost());
  }

  private static String createResourceURL(String host, String resourcePath) {
    return String.format(Locale.US, "http://%s/%s", host, resourcePath);
  }

  public String getDevServerBundleURL(final String jsModulePath) {
    return createBundleURL(
        jsModulePath, BundleType.BUNDLE, mPackagerConnectionSettings.getDebugServerHost());
  }

  public String getDevServerSplitBundleURL(String jsModulePath) {
    return createSplitBundleURL(jsModulePath, mPackagerConnectionSettings.getDebugServerHost());
  }

  public void isPackagerRunning(final PackagerStatusCallback callback) {
    String host = mPackagerConnectionSettings.getDebugServerHost();
    if (host == null) {
      FLog.w(ReactConstants.TAG, "No packager host configured.");
      callback.onPackagerStatusFetched(false);
    } else {
      mPackagerStatusCheck.run(host, callback);
    }
  }

  private String createLaunchJSDevtoolsCommandUrl() {
    return String.format(
        Locale.US,
        "http://%s/launch-js-devtools",
        mPackagerConnectionSettings.getDebugServerHost());
  }

  public void launchJSDevtools() {
    Request request = new Request.Builder().url(createLaunchJSDevtoolsCommandUrl()).build();
    mClient
        .newCall(request)
        .enqueue(
            new Callback() {
              @Override
              public void onFailure(@NonNull Call call, @NonNull IOException e) {
                // ignore HTTP call response, this is just to open a debugger page and there is no
                // reason to report failures from here
              }

              @Override
              public void onResponse(@NonNull Call call, @NonNull Response response) {
                // ignore HTTP call response - see above
              }
            });
  }

  public String getSourceMapUrl(String mainModuleName) {
    return createBundleURL(mainModuleName, BundleType.MAP);
  }

  public String getSourceUrl(String mainModuleName) {
    return createBundleURL(mainModuleName, BundleType.BUNDLE);
  }

  public String getJSBundleURLForRemoteDebugging(String mainModuleName) {
    // The host we use when connecting to the JS bundle server from the emulator is not the
    // same as the one needed to connect to the same server from the JavaScript proxy running on the
    // host itself.
    return createBundleURL(mainModuleName, BundleType.BUNDLE, getHostForJSProxy());
  }

  /**
   * This is a debug-only utility to allow fetching a file via packager. It's made synchronous for
   * simplicity, but should only be used if it's absolutely necessary.
   *
   * @return the file with the fetched content, or null if there's any failure.
   */
  public @Nullable File downloadBundleResourceFromUrlSync(
      final String resourcePath, final File outputFile) {
    final String resourceURL =
        createResourceURL(mPackagerConnectionSettings.getDebugServerHost(), resourcePath);
    final Request request = new Request.Builder().url(resourceURL).build();

    try (Response response = mClient.newCall(request).execute()) {
      if (!response.isSuccessful()) {
        return null;
      }

      try (Sink output = Okio.sink(outputFile)) {
        Okio.buffer(response.body().source()).readAll(output);
      }

      return outputFile;
    } catch (Exception ex) {
      FLog.e(
          ReactConstants.TAG,
          "Failed to fetch resource synchronously - resourcePath: \"%s\", outputFile: \"%s\"",
          resourcePath,
          outputFile.getAbsolutePath(),
          ex);
      return null;
    }
  }

  /** Attempt to open the JS debugger on the host machine (on-device CDP debugging). */
  public void openDebugger(@Nullable final ReactContext context, final String errorMessage) {
    // TODO(huntie): Requests to dev server should not assume 'http' URL scheme
    String requestUrl =
        String.format(
            Locale.US,
            "http://%s/open-debugger?appId=%s&device=%s",
            mPackagerConnectionSettings.getDebugServerHost(),
            Uri.encode(mPackageName),
            Uri.encode(getInspectorDeviceId()));
    Request request =
        new Request.Builder().url(requestUrl).method("POST", RequestBody.create(null, "")).build();

    mClient
        .newCall(request)
        .enqueue(
            new Callback() {
              @Override
              public void onFailure(@NonNull Call _call, @NonNull IOException _e) {
                RNLog.w(context, errorMessage);
              }

              @Override
              public void onResponse(@NonNull Call _call, @NonNull Response _response) {}
            });
  }
}
