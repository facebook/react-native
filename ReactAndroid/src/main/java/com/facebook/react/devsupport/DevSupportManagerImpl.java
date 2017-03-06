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
import java.net.MalformedURLException;
import java.net.URL;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import android.app.ActivityManager;
import android.app.AlertDialog;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.hardware.SensorManager;
import android.net.Uri;
import android.os.AsyncTask;
import android.view.WindowManager;
import android.widget.Toast;

import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.R;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.DefaultNativeModuleCallExceptionHandler;
import com.facebook.react.bridge.Inspector;
import com.facebook.react.bridge.JavaJSExecutor;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.ShakeDetector;
import com.facebook.react.common.futures.SimpleSettableFuture;
import com.facebook.react.devsupport.DevServerHelper.PackagerCommandListener;
import com.facebook.react.devsupport.interfaces.DevOptionHandler;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.devsupport.interfaces.PackagerStatusCallback;
import com.facebook.react.devsupport.interfaces.StackFrame;
import com.facebook.react.modules.debug.interfaces.DeveloperSettings;
import com.facebook.react.packagerconnection.JSPackagerClient;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;

/**
 * Interface for accessing and interacting with development features. Following features
 * are supported through this manager class:
 * 1) Displaying JS errors (aka RedBox)
 * 2) Displaying developers menu (Reload JS, Debug JS)
 * 3) Communication with developer server in order to download updated JS bundle
 * 4) Starting/stopping broadcast receiver for js reload signals
 * 5) Starting/stopping motion sensor listener that recognize shake gestures which in turn may
 *    trigger developers menu.
 * 6) Launching developers settings view
 *
 * This class automatically monitors the state of registered views and activities to which they are
 * bound to make sure that we don't display overlay or that we we don't listen for sensor events
 * when app is backgrounded.
 *
 * {@link ReactInstanceDevCommandsHandler} implementation is responsible for instantiating this
 * instance and for populating with an instance of {@link CatalystInstance} whenever instance
 * manager recreates it (through {@link #onNewCatalystContextCreated}). Also, instance manager is
 * responsible for enabling/disabling dev support in case when app is backgrounded or when all the
 * views has been detached from the instance (through {@link #setDevSupportEnabled} method).
 *
 * IMPORTANT: In order for developer support to work correctly it is required that the
 * manifest of your application contain the following entries:
 * {@code <activity android:name="com.facebook.react.devsupport.DevSettingsActivity"/>}
 * {@code <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>}
 */
public class DevSupportManagerImpl implements
    DevSupportManager,
    PackagerCommandListener,
    DevInternalSettings.Listener {

  private static final int JAVA_ERROR_COOKIE = -1;
  private static final int JSEXCEPTION_ERROR_COOKIE = -1;
  private static final String JS_BUNDLE_FILE_NAME = "ReactNativeDevBundle.js";
  private static enum ErrorType {
    JS,
    NATIVE
  }

  private static final String EXOPACKAGE_LOCATION_FORMAT
      = "/data/local/tmp/exopackage/%s//secondary-dex";

  private final Context mApplicationContext;
  private final ShakeDetector mShakeDetector;
  private final BroadcastReceiver mReloadAppBroadcastReceiver;
  private final DevServerHelper mDevServerHelper;
  private final LinkedHashMap<String, DevOptionHandler> mCustomDevOptions =
      new LinkedHashMap<>();
  private final ReactInstanceDevCommandsHandler mReactInstanceCommandsHandler;
  private final @Nullable String mJSAppBundleName;
  private final File mJSBundleTempFile;
  private final DefaultNativeModuleCallExceptionHandler mDefaultNativeModuleCallExceptionHandler;

  private @Nullable RedBoxDialog mRedBoxDialog;
  private @Nullable AlertDialog mDevOptionsDialog;
  private @Nullable DebugOverlayController mDebugOverlayController;
  private @Nullable ReactContext mCurrentContext;
  private DevInternalSettings mDevSettings;
  private boolean mIsReceiverRegistered = false;
  private boolean mIsShakeDetectorStarted = false;
  private boolean mIsDevSupportEnabled = false;
  private @Nullable RedBoxHandler mRedBoxHandler;
  private @Nullable String mLastErrorTitle;
  private @Nullable StackFrame[] mLastErrorStack;
  private int mLastErrorCookie = 0;
  private @Nullable ErrorType mLastErrorType;

  private static class JscProfileTask extends AsyncTask<String, Void, Void> {
    private static final MediaType JSON =
      MediaType.parse("application/json; charset=utf-8");

    private final String mSourceUrl;

    private JscProfileTask(String sourceUrl) {
      mSourceUrl = sourceUrl;
    }

    @Override
    protected Void doInBackground(String... jsonData) {
      try {
        String jscProfileUrl =
            Uri.parse(mSourceUrl).buildUpon()
                .path("/jsc-profile")
                .query(null)
                .build()
                .toString();
        OkHttpClient client = new OkHttpClient();
        for (String json: jsonData) {
          RequestBody body = RequestBody.create(JSON, json);
          Request request =
            new Request.Builder().url(jscProfileUrl).post(body).build();
          client.newCall(request).execute();
        }
      } catch (IOException e) {
        FLog.e(ReactConstants.TAG, "Failed not talk to server", e);
      }
      return null;
    }
  }

  public DevSupportManagerImpl(
    Context applicationContext,
    ReactInstanceDevCommandsHandler reactInstanceCommandsHandler,
    @Nullable String packagerPathForJSBundleName,
    boolean enableOnCreate) {

    this(applicationContext,
      reactInstanceCommandsHandler,
      packagerPathForJSBundleName,
      enableOnCreate,
      null);
  }

  public DevSupportManagerImpl(
      Context applicationContext,
      ReactInstanceDevCommandsHandler reactInstanceCommandsHandler,
      @Nullable String packagerPathForJSBundleName,
      boolean enableOnCreate,
      @Nullable RedBoxHandler redBoxHandler) {

    mReactInstanceCommandsHandler = reactInstanceCommandsHandler;
    mApplicationContext = applicationContext;
    mJSAppBundleName = packagerPathForJSBundleName;
    mDevSettings = new DevInternalSettings(applicationContext, this);
    mDevServerHelper = new DevServerHelper(mDevSettings);

    // Prepare shake gesture detector (will be started/stopped from #reload)
    mShakeDetector = new ShakeDetector(new ShakeDetector.ShakeListener() {
      @Override
      public void onShake() {
        showDevOptionsDialog();
      }
    });

    // Prepare reload APP broadcast receiver (will be registered/unregistered from #reload)
    mReloadAppBroadcastReceiver = new BroadcastReceiver() {
      @Override
      public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (DevServerHelper.getReloadAppAction(context).equals(action)) {
          if (intent.getBooleanExtra(DevServerHelper.RELOAD_APP_EXTRA_JS_PROXY, false)) {
            mDevSettings.setRemoteJSDebugEnabled(true);
            mDevServerHelper.launchJSDevtools();
          } else {
            mDevSettings.setRemoteJSDebugEnabled(false);
          }
          handleReloadJS();
        }
      }
    };

    // We store JS bundle loaded from dev server in a single destination in app's data dir.
    // In case when someone schedule 2 subsequent reloads it may happen that JS thread will
    // start reading first reload output while the second reload starts writing to the same
    // file. As this should only be the case in dev mode we leave it as it is.
    // TODO(6418010): Fix readers-writers problem in debug reload from HTTP server
    mJSBundleTempFile = new File(applicationContext.getFilesDir(), JS_BUNDLE_FILE_NAME);

    mDefaultNativeModuleCallExceptionHandler = new DefaultNativeModuleCallExceptionHandler();

    setDevSupportEnabled(enableOnCreate);

    mRedBoxHandler = redBoxHandler;
  }

  @Override
  public void handleException(Exception e) {
    if (mIsDevSupportEnabled) {
      if (e instanceof JSException) {
        FLog.e(ReactConstants.TAG, "Exception in native call from JS", e);
        // TODO #11638796: convert the stack into something useful
        showNewError(
            e.getMessage() + "\n\n" + ((JSException) e).getStack(),
            new StackFrame[] {},
            JSEXCEPTION_ERROR_COOKIE,
            ErrorType.JS);
      } else {
        showNewJavaError(e.getMessage(), e);
      }
    } else {
      mDefaultNativeModuleCallExceptionHandler.handleException(e);
    }
  }

  @Override
  public void showNewJavaError(String message, Throwable e) {
    FLog.e(ReactConstants.TAG, "Exception in native call", e);
    showNewError(message, StackTraceHelper.convertJavaStackTrace(e), JAVA_ERROR_COOKIE, ErrorType.NATIVE);
  }

  /**
   * Add option item to dev settings dialog displayed by this manager. In the case user select given
   * option from that dialog, the appropriate handler passed as {@param optionHandler} will be
   * called.
   */
  @Override
  public void addCustomDevOption(
      String optionName,
      DevOptionHandler optionHandler) {
    mCustomDevOptions.put(optionName, optionHandler);
  }

  @Override
  public void showNewJSError(String message, ReadableArray details, int errorCookie) {
    showNewError(message, StackTraceHelper.convertJsStackTrace(details), errorCookie, ErrorType.JS);
  }

  @Override
  public void updateJSError(
      final String message,
      final ReadableArray details,
      final int errorCookie) {
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            // Since we only show the first JS error in a succession of JS errors, make sure we only
            // update the error message for that error message. This assumes that updateJSError
            // belongs to the most recent showNewJSError
            if (mRedBoxDialog == null ||
                !mRedBoxDialog.isShowing() ||
                errorCookie != mLastErrorCookie) {
              return;
            }
            StackFrame[] stack = StackTraceHelper.convertJsStackTrace(details);
            mRedBoxDialog.setExceptionDetails(message, stack);
            updateLastErrorInfo(message, stack, errorCookie, ErrorType.JS);
            // JS errors are reported here after source mapping.
            if (mRedBoxHandler != null) {
              mRedBoxHandler.handleRedbox(message, stack, RedBoxHandler.ErrorType.JS);
              mRedBoxDialog.resetReporting(true);
            }
            mRedBoxDialog.show();
          }
        });
  }

  @Override
  public void hideRedboxDialog() {
    // dismiss redbox if exists
    if (mRedBoxDialog != null) {
      mRedBoxDialog.dismiss();
    }
  }

  private void showNewError(
      final String message,
      final StackFrame[] stack,
      final int errorCookie,
      final ErrorType errorType) {
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            if (mRedBoxDialog == null) {
              mRedBoxDialog = new RedBoxDialog(mApplicationContext, DevSupportManagerImpl.this, mRedBoxHandler);
              mRedBoxDialog.getWindow().setType(WindowManager.LayoutParams.TYPE_SYSTEM_ALERT);
            }
            if (mRedBoxDialog.isShowing()) {
              // Sometimes errors cause multiple errors to be thrown in JS in quick succession. Only
              // show the first and most actionable one.
              return;
            }
            mRedBoxDialog.setExceptionDetails(message, stack);
            updateLastErrorInfo(message, stack, errorCookie, errorType);
            // Only report native errors here. JS errors are reported
            // inside {@link #updateJSError} after source mapping.
            if (mRedBoxHandler != null && errorType == ErrorType.NATIVE) {
              mRedBoxHandler.handleRedbox(message, stack, RedBoxHandler.ErrorType.NATIVE);
              mRedBoxDialog.resetReporting(true);
            } else {
              mRedBoxDialog.resetReporting(false);
            }
            mRedBoxDialog.show();
          }
        });
  }

  @Override
  public void showDevOptionsDialog() {
    if (mDevOptionsDialog != null || !mIsDevSupportEnabled || ActivityManager.isUserAMonkey()) {
      return;
    }
    LinkedHashMap<String, DevOptionHandler> options = new LinkedHashMap<>();
    /* register standard options */
    options.put(
        mApplicationContext.getString(R.string.catalyst_reloadjs), new DevOptionHandler() {
          @Override
          public void onOptionSelected() {
            handleReloadJS();
          }
        });
    options.put(
        mDevSettings.isRemoteJSDebugEnabled() ?
            mApplicationContext.getString(R.string.catalyst_debugjs_off) :
            mApplicationContext.getString(R.string.catalyst_debugjs),
        new DevOptionHandler() {
          @Override
          public void onOptionSelected() {
            mDevSettings.setRemoteJSDebugEnabled(!mDevSettings.isRemoteJSDebugEnabled());
            handleReloadJS();
          }
        });
    if (Inspector.isSupported()) {
      options.put(
        "Debug JS on-device (experimental)", new DevOptionHandler() {
          @Override
          public void onOptionSelected() {
            List<Inspector.Page> pages = Inspector.getPages();
            if (pages.size() > 0) {
              // TODO: We should get the actual page id instead of the first one.
              mDevServerHelper.openInspector(String.valueOf(pages.get(0).getId()));
            }
          }
        });
    }
    options.put(
      mDevSettings.isReloadOnJSChangeEnabled()
        ? mApplicationContext.getString(R.string.catalyst_live_reload_off)
        : mApplicationContext.getString(R.string.catalyst_live_reload),
      new DevOptionHandler() {
        @Override
        public void onOptionSelected() {
          mDevSettings.setReloadOnJSChangeEnabled(!mDevSettings.isReloadOnJSChangeEnabled());
        }
      });
    options.put(
            mDevSettings.isHotModuleReplacementEnabled()
                    ? mApplicationContext.getString(R.string.catalyst_hot_module_replacement_off)
                    : mApplicationContext.getString(R.string.catalyst_hot_module_replacement),
            new DevOptionHandler() {
              @Override
              public void onOptionSelected() {
                mDevSettings.setHotModuleReplacementEnabled(!mDevSettings.isHotModuleReplacementEnabled());
                handleReloadJS();
              }
            });
    options.put(
        mApplicationContext.getString(R.string.catalyst_element_inspector),
        new DevOptionHandler() {
          @Override
          public void onOptionSelected() {
            mDevSettings.setElementInspectorEnabled(!mDevSettings.isElementInspectorEnabled());
            mReactInstanceCommandsHandler.toggleElementInspector();
          }
        });
    options.put(
      mDevSettings.isFpsDebugEnabled()
        ? mApplicationContext.getString(R.string.catalyst_perf_monitor_off)
        : mApplicationContext.getString(R.string.catalyst_perf_monitor),
      new DevOptionHandler() {
        @Override
        public void onOptionSelected() {
          mDevSettings.setFpsDebugEnabled(!mDevSettings.isFpsDebugEnabled());
        }
      });
    options.put(
        mApplicationContext.getString(R.string.catalyst_heap_capture),
        new DevOptionHandler() {
          @Override
          public void onOptionSelected() {
            handleCaptureHeap(null);
          }
        });
    options.put(
        mApplicationContext.getString(R.string.catalyst_poke_sampling_profiler),
        new DevOptionHandler() {
          @Override
          public void onOptionSelected() {
            handlePokeSamplingProfiler(null);
          }
        });
    options.put(
        mApplicationContext.getString(R.string.catalyst_settings), new DevOptionHandler() {
          @Override
          public void onOptionSelected() {
            Intent intent = new Intent(mApplicationContext, DevSettingsActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            mApplicationContext.startActivity(intent);
          }
        });

    if (mCustomDevOptions.size() > 0) {
      options.putAll(mCustomDevOptions);
    }

    final DevOptionHandler[] optionHandlers = options.values().toArray(new DevOptionHandler[0]);

    mDevOptionsDialog =
        new AlertDialog.Builder(mApplicationContext)
            .setItems(
                options.keySet().toArray(new String[0]),
                new DialogInterface.OnClickListener() {
                  @Override
                  public void onClick(DialogInterface dialog, int which) {
                    optionHandlers[which].onOptionSelected();
                    mDevOptionsDialog = null;
                  }
                })
            .setOnCancelListener(new DialogInterface.OnCancelListener() {
              @Override
              public void onCancel(DialogInterface dialog) {
                mDevOptionsDialog = null;
              }
            })
            .create();
    mDevOptionsDialog.getWindow().setType(WindowManager.LayoutParams.TYPE_SYSTEM_ALERT);
    mDevOptionsDialog.show();
  }

  /**
   * {@link ReactInstanceDevCommandsHandler} is responsible for
   * enabling/disabling dev support when a React view is attached/detached
   * or when application state changes (e.g. the application is backgrounded).
   */
  @Override
  public void setDevSupportEnabled(boolean isDevSupportEnabled) {
    mIsDevSupportEnabled = isDevSupportEnabled;
    reload();
  }

  @Override
  public boolean getDevSupportEnabled() {
    return mIsDevSupportEnabled;
  }

  @Override
  public DeveloperSettings getDevSettings() {
    return mDevSettings;
  }

  @Override
  public void onNewReactContextCreated(ReactContext reactContext) {
    resetCurrentContext(reactContext);
  }

  @Override
  public void onReactInstanceDestroyed(ReactContext reactContext) {
    if (reactContext == mCurrentContext) {
      // only call reset context when the destroyed context matches the one that is currently set
      // for this manager
      resetCurrentContext(null);
    }
  }

  @Override
  public String getSourceMapUrl() {
    if (mJSAppBundleName == null) {
      return "";
    }

    return mDevServerHelper.getSourceMapUrl(Assertions.assertNotNull(mJSAppBundleName));
  }

  @Override
  public String getSourceUrl() {
    if (mJSAppBundleName == null) {
      return "";
    }

    return mDevServerHelper.getSourceUrl(Assertions.assertNotNull(mJSAppBundleName));
  }

  @Override
  public String getJSBundleURLForRemoteDebugging() {
    return mDevServerHelper.getJSBundleURLForRemoteDebugging(
        Assertions.assertNotNull(mJSAppBundleName));
  }

  @Override
  public String getDownloadedJSBundleFile() {
    return mJSBundleTempFile.getAbsolutePath();
  }

  @Override
  public String getHeapCaptureUploadUrl() {
    return mDevServerHelper.getHeapCaptureUploadUrl();
  }

  /**
   * @return {@code true} if {@link com.facebook.react.ReactInstanceManager} should use downloaded JS bundle file
   * instead of using JS file from assets. This may happen when app has not been updated since
   * the last time we fetched the bundle.
   */
  @Override
  public boolean hasUpToDateJSBundleInCache() {
    if (mIsDevSupportEnabled && mJSBundleTempFile.exists()) {
      try {
        String packageName = mApplicationContext.getPackageName();
        PackageInfo thisPackage = mApplicationContext.getPackageManager()
            .getPackageInfo(packageName, 0);
        if (mJSBundleTempFile.lastModified() > thisPackage.lastUpdateTime) {
          // Base APK has not been updated since we donwloaded JS, but if app is using exopackage
          // it may only be a single dex that has been updated. We check for exopackage dir update
          // time in that case.
          File exopackageDir = new File(
              String.format(Locale.US, EXOPACKAGE_LOCATION_FORMAT, packageName));
          if (exopackageDir.exists()) {
            return mJSBundleTempFile.lastModified() > exopackageDir.lastModified();
          }
          return true;
        }
      } catch (PackageManager.NameNotFoundException e) {
        // Ignore this error and just fallback to loading JS from assets
        FLog.e(ReactConstants.TAG, "DevSupport is unable to get current app info");
      }
    }
    return false;
  }

  /**
   * @return {@code true} if JS bundle {@param bundleAssetName} exists, in that case
   * {@link ReactInstanceManager} should use that file from assets instead of downloading bundle
   * from dev server
   */
  public boolean hasBundleInAssets(String bundleAssetName) {
    try {
      String[] assets = mApplicationContext.getAssets().list("");
      for (int i = 0; i < assets.length; i++) {
        if (assets[i].equals(bundleAssetName)) {
          return true;
        }
      }
    } catch (IOException e) {
      // Ignore this error and just fallback to downloading JS from devserver
      FLog.e(ReactConstants.TAG, "Error while loading assets list");
    }
    return false;
  }

  private void resetCurrentContext(@Nullable ReactContext reactContext) {
    if (mCurrentContext == reactContext) {
      // new context is the same as the old one - do nothing
      return;
    }

    mCurrentContext = reactContext;

    // Recreate debug overlay controller with new CatalystInstance object
    if (mDebugOverlayController != null) {
      mDebugOverlayController.setFpsDebugViewVisible(false);
    }
    if (reactContext != null) {
      mDebugOverlayController = new DebugOverlayController(reactContext);
    }

    if (mDevSettings.isHotModuleReplacementEnabled() && mCurrentContext != null) {
      try {
        URL sourceUrl = new URL(getSourceUrl());
        String path = sourceUrl.getPath().substring(1); // strip initial slash in path
        String host = sourceUrl.getHost();
        int port = sourceUrl.getPort();
        mCurrentContext.getJSModule(HMRClient.class).enable("android", path, host, port);
      } catch (MalformedURLException e) {
        showNewJavaError(e.getMessage(), e);
      }
    }

    reloadSettings();
  }

  @Override
  public void reloadSettings() {
    reload();
  }

  public void onInternalSettingsChanged() { reloadSettings(); }

  @Override
  public void handleReloadJS() {
    UiThreadUtil.assertOnUiThread();

    // dismiss redbox if exists
    if (mRedBoxDialog != null) {
      mRedBoxDialog.dismiss();
    }

    if (mDevSettings.isRemoteJSDebugEnabled()) {
      reloadJSInProxyMode(showProgressDialog());
    } else {
      String bundleURL =
        mDevServerHelper.getDevServerBundleURL(Assertions.assertNotNull(mJSAppBundleName));
      reloadJSFromServer(bundleURL);
    }
  }

  @Override
  public void isPackagerRunning(PackagerStatusCallback callback) {
    mDevServerHelper.isPackagerRunning(callback);
  }

  @Override
  public @Nullable File downloadBundleResourceFromUrlSync(
      final String resourceURL,
      final File outputFile) {
    return mDevServerHelper.downloadBundleResourceFromUrlSync(resourceURL, outputFile);
  }

  @Override
  public @Nullable String getLastErrorTitle() {
    return mLastErrorTitle;
  }

  @Override
  public @Nullable StackFrame[] getLastErrorStack() {
    return mLastErrorStack;
  }

  @Override
  public void onPackagerReloadCommand() {
    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        handleReloadJS();
      }
    });
  }

  @Override
  public void onCaptureHeapCommand(@Nullable final JSPackagerClient.Responder responder) {
    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        handleCaptureHeap(responder);
      }
    });
  }

  @Override
  public void onPokeSamplingProfilerCommand(@Nullable final JSPackagerClient.Responder responder) {
    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        handlePokeSamplingProfiler(responder);
      }
    });
  }

  private void handleCaptureHeap(@Nullable final JSPackagerClient.Responder responder) {
    if (mCurrentContext == null) {
      return;
    }
    JSCHeapCapture heapCapture = mCurrentContext.getNativeModule(JSCHeapCapture.class);
    heapCapture.captureHeap(
      mApplicationContext.getCacheDir().getPath(),
      JSCHeapUpload.captureCallback(mDevServerHelper.getHeapCaptureUploadUrl(), responder));
  }

  private void handlePokeSamplingProfiler(@Nullable final JSPackagerClient.Responder responder) {
    try {
      List<String> pokeResults = JSCSamplingProfiler.poke(60000);
      for (String result : pokeResults) {
        Toast.makeText(
          mCurrentContext,
          result == null
            ? "Started JSC Sampling Profiler"
            : "Stopped JSC Sampling Profiler",
          Toast.LENGTH_LONG).show();
        if (responder != null) {
          // Responder is provided, so there is a client waiting our response
          responder.respond(result == null ? "started" : result);
        } else if (result != null) {
          // The profile was not initiated by external client, so process the
          // profile if there is one in the result
          new JscProfileTask(getSourceUrl()).executeOnExecutor(
              AsyncTask.THREAD_POOL_EXECUTOR,
              result);
        }
      }
    } catch (JSCSamplingProfiler.ProfilerException e) {
      showNewJavaError(e.getMessage(), e);
    }
  }

  private void updateLastErrorInfo(
      final String message,
      final StackFrame[] stack,
      final int errorCookie,
      final ErrorType errorType) {
    mLastErrorTitle = message;
    mLastErrorStack = stack;
    mLastErrorCookie = errorCookie;
    mLastErrorType = errorType;
  }

  private void reloadJSInProxyMode(final AlertDialog progressDialog) {
    // When using js proxy, there is no need to fetch JS bundle as proxy executor will do that
    // anyway
    mDevServerHelper.launchJSDevtools();

    JavaJSExecutor.Factory factory = new JavaJSExecutor.Factory() {
      @Override
      public JavaJSExecutor create() throws Exception {
        WebsocketJavaScriptExecutor executor = new WebsocketJavaScriptExecutor();
        SimpleSettableFuture<Boolean> future = new SimpleSettableFuture<>();
        executor.connect(
            mDevServerHelper.getWebsocketProxyURL(),
            getExecutorConnectCallback(progressDialog, future));
        // TODO(t9349129) Don't use timeout
        try {
          future.get(90, TimeUnit.SECONDS);
          return executor;
        } catch (ExecutionException e) {
          throw (Exception) e.getCause();
        } catch (InterruptedException | TimeoutException e) {
          throw new RuntimeException(e);
        }
      }
    };
    mReactInstanceCommandsHandler.onReloadWithJSDebugger(factory);
  }

  private WebsocketJavaScriptExecutor.JSExecutorConnectCallback getExecutorConnectCallback(
      final AlertDialog progressDialog,
      final SimpleSettableFuture<Boolean> future) {
    return new WebsocketJavaScriptExecutor.JSExecutorConnectCallback() {
      @Override
      public void onSuccess() {
        future.set(true);
        progressDialog.dismiss();
      }

      @Override
      public void onFailure(final Throwable cause) {
        progressDialog.dismiss();
        FLog.e(ReactConstants.TAG, "Unable to connect to remote debugger", cause);
        future.setException(
            new IOException(
                mApplicationContext.getString(R.string.catalyst_remotedbg_error), cause));
      }
    };
  }

  private AlertDialog showProgressDialog() {
    AlertDialog dialog = new AlertDialog.Builder(mApplicationContext)
      .setTitle(R.string.catalyst_jsload_title)
      .setMessage(mApplicationContext.getString(
          mDevSettings.isRemoteJSDebugEnabled() ?
          R.string.catalyst_remotedbg_message :
          R.string.catalyst_jsload_message))
      .create();
    dialog.getWindow().setType(WindowManager.LayoutParams.TYPE_SYSTEM_ALERT);
    dialog.show();
    return dialog;
  }

  public void reloadJSFromServer(final String bundleURL) {
    final AlertDialog progressDialog = showProgressDialog();

    mDevServerHelper.downloadBundleFromURL(
        new DevServerHelper.BundleDownloadCallback() {
          @Override
          public void onSuccess() {
            progressDialog.dismiss();
            UiThreadUtil.runOnUiThread(
                new Runnable() {
                  @Override
                  public void run() {
                    mReactInstanceCommandsHandler.onJSBundleLoadedFromServer();
                  }
                });
          }

          @Override
          public void onFailure(final Exception cause) {
            progressDialog.dismiss();
            FLog.e(ReactConstants.TAG, "Unable to download JS bundle", cause);
            UiThreadUtil.runOnUiThread(
                new Runnable() {
                  @Override
                  public void run() {
                    if (cause instanceof DebugServerException) {
                      DebugServerException debugServerException = (DebugServerException) cause;
                      showNewJavaError(debugServerException.getMessage(), cause);
                    } else {
                      showNewJavaError(
                          mApplicationContext.getString(R.string.catalyst_jsload_error),
                          cause);
                    }
                  }
                });
          }
        },
        mJSBundleTempFile,
        bundleURL);
    progressDialog.setOnCancelListener(new DialogInterface.OnCancelListener() {
      @Override
      public void onCancel(DialogInterface dialog) {
        mDevServerHelper.cancelDownloadBundleFromURL();
      }
    });
    progressDialog.setCancelable(true);
  }

  private void reload() {
    // reload settings, show/hide debug overlay if required & start/stop shake detector
    if (mIsDevSupportEnabled) {
      // update visibility of FPS debug overlay depending on the settings
      if (mDebugOverlayController != null) {
        mDebugOverlayController.setFpsDebugViewVisible(mDevSettings.isFpsDebugEnabled());
      }

      // start shake gesture detector
      if (!mIsShakeDetectorStarted) {
        mShakeDetector.start(
            (SensorManager) mApplicationContext.getSystemService(Context.SENSOR_SERVICE));
        mIsShakeDetectorStarted = true;
      }

      // register reload app broadcast receiver
      if (!mIsReceiverRegistered) {
        IntentFilter filter = new IntentFilter();
        filter.addAction(DevServerHelper.getReloadAppAction(mApplicationContext));
        mApplicationContext.registerReceiver(mReloadAppBroadcastReceiver, filter);
        mIsReceiverRegistered = true;
      }

      mDevServerHelper.openPackagerConnection(this);
      mDevServerHelper.openInspectorConnection();
      if (mDevSettings.isReloadOnJSChangeEnabled()) {
        mDevServerHelper.startPollingOnChangeEndpoint(
            new DevServerHelper.OnServerContentChangeListener() {
          @Override
          public void onServerContentChanged() {
            handleReloadJS();
          }
        });
      } else {
        mDevServerHelper.stopPollingOnChangeEndpoint();
      }
    } else {
      // hide FPS debug overlay
      if (mDebugOverlayController != null) {
        mDebugOverlayController.setFpsDebugViewVisible(false);
      }

      // stop shake gesture detector
      if (mIsShakeDetectorStarted) {
        mShakeDetector.stop();
        mIsShakeDetectorStarted = false;
      }

      // unregister app reload broadcast receiver
      if (mIsReceiverRegistered) {
        mApplicationContext.unregisterReceiver(mReloadAppBroadcastReceiver);
        mIsReceiverRegistered = false;
      }

      // hide redbox dialog
      if (mRedBoxDialog != null) {
        mRedBoxDialog.dismiss();
      }

      // hide dev options dialog
      if (mDevOptionsDialog != null) {
        mDevOptionsDialog.dismiss();
      }

      mDevServerHelper.closePackagerConnection();
      mDevServerHelper.closeInspectorConnection();
      mDevServerHelper.stopPollingOnChangeEndpoint();
    }
  }
}
