/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.annotation.TargetApi;
import android.app.Activity;
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
import android.support.annotation.Nullable;
import android.util.Pair;
import android.widget.Toast;
import com.facebook.common.logging.FLog;
import com.facebook.debug.holder.PrinterHolder;
import com.facebook.debug.tags.ReactDebugOverlayTags;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.R;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.DefaultNativeModuleCallExceptionHandler;
import com.facebook.react.bridge.JavaJSExecutor;
import com.facebook.react.bridge.NativeDeltaClient;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.DebugServerException;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.ShakeDetector;
import com.facebook.react.common.futures.SimpleSettableFuture;
import com.facebook.react.devsupport.DevServerHelper.PackagerCommandListener;
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener;
import com.facebook.react.devsupport.interfaces.DevOptionHandler;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.devsupport.interfaces.ErrorCustomizer;
import com.facebook.react.devsupport.interfaces.PackagerStatusCallback;
import com.facebook.react.devsupport.interfaces.StackFrame;
import com.facebook.react.modules.debug.interfaces.DeveloperSettings;
import com.facebook.react.packagerconnection.RequestHandler;
import com.facebook.react.packagerconnection.Responder;
import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
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
 * {@link com.facebook.react.ReactInstanceManager} implementation is responsible for instantiating
 * this class as well as for populating with a reference to {@link CatalystInstance} whenever
 * instance manager recreates it (through {@link #onNewReactContextCreated). Also, instance manager
 * is responsible for enabling/disabling dev support in case when app is backgrounded or when all
 * the views has been detached from the instance (through {@link #setDevSupportEnabled} method).
 *
 * IMPORTANT: In order for developer support to work correctly it is required that the
 * manifest of your application contain the following entries:
 * {@code <activity android:name="com.facebook.react.devsupport.DevSettingsActivity"/>}
 * {@code <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>}
 */
@TargetApi(11)
public class DevSupportManagerImpl implements
    DevSupportManager,
    PackagerCommandListener,
    DevInternalSettings.Listener {

  private static final int JAVA_ERROR_COOKIE = -1;
  private static final int JSEXCEPTION_ERROR_COOKIE = -1;
  private static final String JS_BUNDLE_FILE_NAME = "ReactNativeDevBundle.js";
  private static final String RELOAD_APP_ACTION_SUFFIX = ".RELOAD_APP_ACTION";

  private enum ErrorType {
    JS,
    NATIVE
  }

  private static final String EXOPACKAGE_LOCATION_FORMAT
      = "/data/local/tmp/exopackage/%s//secondary-dex";

  public static final String EMOJI_HUNDRED_POINTS_SYMBOL = " \uD83D\uDCAF";
  public static final String EMOJI_FACE_WITH_NO_GOOD_GESTURE = " \uD83D\uDE45";

  private final List<ExceptionLogger> mExceptionLoggers = new ArrayList<>();

  private final Context mApplicationContext;
  private final ShakeDetector mShakeDetector;
  private final BroadcastReceiver mReloadAppBroadcastReceiver;
  private final DevServerHelper mDevServerHelper;
  private final LinkedHashMap<String, DevOptionHandler> mCustomDevOptions =
      new LinkedHashMap<>();
  private final ReactInstanceManagerDevHelper mReactInstanceManagerHelper;
  private final @Nullable String mJSAppBundleName;
  private final File mJSBundleTempFile;
  private final DefaultNativeModuleCallExceptionHandler mDefaultNativeModuleCallExceptionHandler;
  private final DevLoadingViewController mDevLoadingViewController;

  private @Nullable RedBoxDialog mRedBoxDialog;
  private @Nullable AlertDialog mDevOptionsDialog;
  private @Nullable DebugOverlayController mDebugOverlayController;
  private boolean mDevLoadingViewVisible = false;
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
  private @Nullable DevBundleDownloadListener mBundleDownloadListener;
  private @Nullable List<ErrorCustomizer> mErrorCustomizers;

  private InspectorPackagerConnection.BundleStatus mBundleStatus;

  private @Nullable Map<String, RequestHandler> mCustomPackagerCommandHandlers;

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
    ReactInstanceManagerDevHelper reactInstanceManagerHelper,
    @Nullable String packagerPathForJSBundleName,
    boolean enableOnCreate,
    int minNumShakes) {

    this(applicationContext,
      reactInstanceManagerHelper,
      packagerPathForJSBundleName,
      enableOnCreate,
      null,
      null,
      minNumShakes,
      null);
  }

  public DevSupportManagerImpl(
      Context applicationContext,
      ReactInstanceManagerDevHelper reactInstanceManagerHelper,
      @Nullable String packagerPathForJSBundleName,
      boolean enableOnCreate,
      @Nullable RedBoxHandler redBoxHandler,
      @Nullable DevBundleDownloadListener devBundleDownloadListener,
      int minNumShakes,
      @Nullable Map<String, RequestHandler> customPackagerCommandHandlers) {
    mReactInstanceManagerHelper = reactInstanceManagerHelper;
    mApplicationContext = applicationContext;
    mJSAppBundleName = packagerPathForJSBundleName;
    mDevSettings = new DevInternalSettings(applicationContext, this);
    mBundleStatus = new InspectorPackagerConnection.BundleStatus();
    mDevServerHelper = new DevServerHelper(
      mDevSettings,
      mApplicationContext.getPackageName(),
      new InspectorPackagerConnection.BundleStatusProvider() {
        @Override
        public InspectorPackagerConnection.BundleStatus getBundleStatus() {
          return mBundleStatus;
        }
      }
    );
    mBundleDownloadListener = devBundleDownloadListener;

    // Prepare shake gesture detector (will be started/stopped from #reload)
    mShakeDetector = new ShakeDetector(new ShakeDetector.ShakeListener() {
      @Override
      public void onShake() {
        showDevOptionsDialog();
      }
    }, minNumShakes);

    mCustomPackagerCommandHandlers = customPackagerCommandHandlers;

    // Prepare reload APP broadcast receiver (will be registered/unregistered from #reload)
    mReloadAppBroadcastReceiver = new BroadcastReceiver() {
      @Override
      public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (getReloadAppAction(context).equals(action)) {
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
    mDevLoadingViewController =
            new DevLoadingViewController(applicationContext, reactInstanceManagerHelper);

    mExceptionLoggers.add(new JSExceptionLogger());
  }

  @Override
  public void handleException(Exception e) {
    if (mIsDevSupportEnabled) {

      for (ExceptionLogger logger : mExceptionLoggers) {
        logger.log(e);
      }

    } else {
      mDefaultNativeModuleCallExceptionHandler.handleException(e);
    }
  }

  private interface ExceptionLogger {
    void log(Exception ex);
  }

  private class JSExceptionLogger implements ExceptionLogger {

    @Override
    public void log(Exception e) {
      StringBuilder message = new StringBuilder(e.getMessage() == null ? "Exception in native call from JS" : e.getMessage());
      Throwable cause = e.getCause();
      while (cause != null) {
        message.append("\n\n").append(cause.getMessage());
        cause = cause.getCause();
      }

      if (e instanceof JSException) {
        FLog.e(ReactConstants.TAG, "Exception in native call from JS", e);
        String stack = ((JSException) e).getStack();
        message.append("\n\n").append(stack);

        // TODO #11638796: convert the stack into something useful
        showNewError(
          message.toString(),
          new StackFrame[]{},
          JSEXCEPTION_ERROR_COOKIE,
          ErrorType.JS);
      } else {
        showNewJavaError(message.toString(), e);
      }
    }
  }

  @Override
  public void showNewJavaError(@Nullable String message, Throwable e) {
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
  public void registerErrorCustomizer(ErrorCustomizer errorCustomizer){
    if (mErrorCustomizers == null){
      mErrorCustomizers = new ArrayList<>();
    }
    mErrorCustomizers.add(errorCustomizer);
  }

  private Pair<String, StackFrame[]> processErrorCustomizers(
      Pair<String, StackFrame[]> errorInfo) {
    if (mErrorCustomizers == null) {
      return errorInfo;
    } else {
      for (ErrorCustomizer errorCustomizer : mErrorCustomizers) {
        Pair<String, StackFrame[]> result = errorCustomizer.customizeErrorInfo(errorInfo);
        if (result != null) {
          errorInfo = result;
        }
      }
      return errorInfo;
    }
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
          Pair<String, StackFrame[]> errorInfo =
            processErrorCustomizers(Pair.create(message, stack));
          mRedBoxDialog.setExceptionDetails(errorInfo.first, errorInfo.second);
          updateLastErrorInfo(message, stack, errorCookie, ErrorType.JS);
          // JS errors are reported here after source mapping.
          if (mRedBoxHandler != null) {
            mRedBoxHandler.handleRedbox(message, stack, RedBoxHandler.ErrorType.JS);
            mRedBoxDialog.resetReporting();
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
      mRedBoxDialog = null;
    }
  }

  private void hideDevOptionsDialog() {
    if (mDevOptionsDialog != null) {
      mDevOptionsDialog.dismiss();
      mDevOptionsDialog = null;
    }
  }

  private void showNewError(
      @Nullable final String message,
      final StackFrame[] stack,
      final int errorCookie,
      final ErrorType errorType) {
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            if (mRedBoxDialog == null) {
              Activity context = mReactInstanceManagerHelper.getCurrentActivity();
              if (context == null || context.isFinishing()) {
                FLog.e(ReactConstants.TAG, "Unable to launch redbox because react activity " +
                  "is not available, here is the error that redbox would've displayed: " + message);
                return;
              }
              mRedBoxDialog = new RedBoxDialog(context, DevSupportManagerImpl.this, mRedBoxHandler);
            }
            if (mRedBoxDialog.isShowing()) {
              // Sometimes errors cause multiple errors to be thrown in JS in quick succession. Only
              // show the first and most actionable one.
              return;
            }
            Pair<String, StackFrame[]> errorInfo = processErrorCustomizers(Pair.create(message, stack));
            mRedBoxDialog.setExceptionDetails(errorInfo.first, errorInfo.second);
            updateLastErrorInfo(message, stack, errorCookie, errorType);
            // Only report native errors here. JS errors are reported
            // inside {@link #updateJSError} after source mapping.
            if (mRedBoxHandler != null && errorType == ErrorType.NATIVE) {
              mRedBoxHandler.handleRedbox(message, stack, RedBoxHandler.ErrorType.NATIVE);
            }
            mRedBoxDialog.resetReporting();
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
        mApplicationContext.getString(R.string.catalyst_reloadjs),
        new DevOptionHandler() {
          @Override
          public void onOptionSelected() {
            handleReloadJS();
          }
        });
    if (mDevSettings.isNuclideJSDebugEnabled()) {
      // The concatenation is applied directly here because XML isn't emoji-friendly
      String nuclideJsDebugMenuItemTitle =
          mApplicationContext.getString(R.string.catalyst_debugjs_nuclide)
              + EMOJI_HUNDRED_POINTS_SYMBOL;
      options.put(
          nuclideJsDebugMenuItemTitle,
          new DevOptionHandler() {
            @Override
            public void onOptionSelected() {
              mDevServerHelper.attachDebugger(mApplicationContext, "ReactNative");
            }
          });
    }
    String remoteJsDebugMenuItemTitle =
        mDevSettings.isRemoteJSDebugEnabled()
            ? mApplicationContext.getString(R.string.catalyst_debugjs_off)
            : mApplicationContext.getString(R.string.catalyst_debugjs);
    if (mDevSettings.isNuclideJSDebugEnabled()) {
      remoteJsDebugMenuItemTitle += EMOJI_FACE_WITH_NO_GOOD_GESTURE;
    }
    options.put(
        remoteJsDebugMenuItemTitle,
        new DevOptionHandler() {
          @Override
          public void onOptionSelected() {
            mDevSettings.setRemoteJSDebugEnabled(!mDevSettings.isRemoteJSDebugEnabled());
            handleReloadJS();
          }
        });
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
            mReactInstanceManagerHelper.toggleElementInspector();
          }
        });
    options.put(
      mDevSettings.isFpsDebugEnabled()
        ? mApplicationContext.getString(R.string.catalyst_perf_monitor_off)
        : mApplicationContext.getString(R.string.catalyst_perf_monitor),
      new DevOptionHandler() {
        @Override
        public void onOptionSelected() {
          if (!mDevSettings.isFpsDebugEnabled()) {
            // Request overlay permission if needed when "Show Perf Monitor" option is selected
            Context context = mReactInstanceManagerHelper.getCurrentActivity();
            if (context == null) {
              FLog.e(ReactConstants.TAG, "Unable to get reference to react activity");
            } else {
              DebugOverlayController.requestPermission(context);
            }
          }
          mDevSettings.setFpsDebugEnabled(!mDevSettings.isFpsDebugEnabled());
        }
      });
    options.put(
        mApplicationContext.getString(R.string.catalyst_poke_sampling_profiler),
        new DevOptionHandler() {
          @Override
          public void onOptionSelected() {
            handlePokeSamplingProfiler();
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

    Activity context = mReactInstanceManagerHelper.getCurrentActivity();
    if (context == null || context.isFinishing()) {
      FLog.e(ReactConstants.TAG, "Unable to launch dev options menu because react activity " +
              "isn't available");
      return;
    }
    mDevOptionsDialog =
        new AlertDialog.Builder(context)
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
    reloadSettings();
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
          // Base APK has not been updated since we downloaded JS, but if app is using exopackage
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
   * {@link com.facebook.react.ReactInstanceManager} should use that file from assets instead of
   * downloading bundle from dev server
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
    if (UiThreadUtil.isOnUiThread()) {
      reload();
    } else {
      UiThreadUtil.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          reload();
        }
      });
    }
  }

  public void onInternalSettingsChanged() { reloadSettings(); }

  @Override
  public void handleReloadJS() {

    UiThreadUtil.assertOnUiThread();

    ReactMarker.logMarker(
        ReactMarkerConstants.RELOAD,
        mDevSettings.getPackagerConnectionSettings().getDebugServerHost());

    // dismiss redbox if exists
    hideRedboxDialog();

    if (mDevSettings.isRemoteJSDebugEnabled()) {
      PrinterHolder.getPrinter()
          .logMessage(ReactDebugOverlayTags.RN_CORE, "RNCore: load from Proxy");
      mDevLoadingViewController.showForRemoteJSEnabled();
      mDevLoadingViewVisible = true;
      reloadJSInProxyMode();
    } else {
      PrinterHolder.getPrinter()
          .logMessage(ReactDebugOverlayTags.RN_CORE, "RNCore: load from Server");
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
  public void onPackagerConnected() {
    // No-op
  }

  @Override
  public void onPackagerDisconnected() {
    // No-op
  }

  @Override
  public void onPackagerReloadCommand() {
    // Disable debugger to resume the JsVM & avoid thread locks while reloading
    mDevServerHelper.disableDebugger();
    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        handleReloadJS();
      }
    });
  }

  @Override
  public void onPackagerDevMenuCommand() {
    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        showDevOptionsDialog();
      }
    });
  }

  @Override
  public void onCaptureHeapCommand(final Responder responder) {
    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        handleCaptureHeap(responder);
      }
    });
  }

  @Override
  public @Nullable Map<String, RequestHandler> customCommandHandlers() {
    return mCustomPackagerCommandHandlers;
  }

  private void handleCaptureHeap(final Responder responder) {
    if (mCurrentContext == null) {
      return;
    }
    JSCHeapCapture heapCapture = mCurrentContext.getNativeModule(JSCHeapCapture.class);
    heapCapture.captureHeap(
      mApplicationContext.getCacheDir().getPath(),
      new JSCHeapCapture.CaptureCallback() {
        @Override
        public void onSuccess(File capture) {
          responder.respond(capture.toString());
        }

        @Override
        public void onFailure(JSCHeapCapture.CaptureException error) {
          responder.error(error.toString());
        }
      });
  }

  private void handlePokeSamplingProfiler() {
    try {
      List<String> pokeResults = JSCSamplingProfiler.poke(60000);
      for (String result : pokeResults) {
        Toast.makeText(
          mCurrentContext,
          result == null
            ? "Started JSC Sampling Profiler"
            : "Stopped JSC Sampling Profiler",
          Toast.LENGTH_LONG).show();
        new JscProfileTask(getSourceUrl()).executeOnExecutor(
            AsyncTask.THREAD_POOL_EXECUTOR,
            result);
      }
    } catch (JSCSamplingProfiler.ProfilerException e) {
      showNewJavaError(e.getMessage(), e);
    }
  }

  private void updateLastErrorInfo(
      @Nullable final String message,
      final StackFrame[] stack,
      final int errorCookie,
      final ErrorType errorType) {
    mLastErrorTitle = message;
    mLastErrorStack = stack;
    mLastErrorCookie = errorCookie;
    mLastErrorType = errorType;
  }

  private void reloadJSInProxyMode() {
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
            getExecutorConnectCallback(future));
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
    mReactInstanceManagerHelper.onReloadWithJSDebugger(factory);
  }

  private WebsocketJavaScriptExecutor.JSExecutorConnectCallback getExecutorConnectCallback(
      final SimpleSettableFuture<Boolean> future) {
    return new WebsocketJavaScriptExecutor.JSExecutorConnectCallback() {
      @Override
      public void onSuccess() {
        future.set(true);
        mDevLoadingViewController.hide();
        mDevLoadingViewVisible = false;
      }

      @Override
      public void onFailure(final Throwable cause) {
        mDevLoadingViewController.hide();
        mDevLoadingViewVisible = false;
        FLog.e(ReactConstants.TAG, "Unable to connect to remote debugger", cause);
        future.setException(
            new IOException(
                mApplicationContext.getString(R.string.catalyst_remotedbg_error), cause));
      }
    };
  }

  public void reloadJSFromServer(final String bundleURL) {
    ReactMarker.logMarker(ReactMarkerConstants.DOWNLOAD_START);

    mDevLoadingViewController.showForUrl(bundleURL);
    mDevLoadingViewVisible = true;

    final BundleDownloader.BundleInfo bundleInfo = new BundleDownloader.BundleInfo();

    mDevServerHelper.downloadBundleFromURL(
        new DevBundleDownloadListener() {
          @Override
          public void onSuccess(final @Nullable NativeDeltaClient nativeDeltaClient) {
            mDevLoadingViewController.hide();
            mDevLoadingViewVisible = false;
            synchronized (DevSupportManagerImpl.this) {
              mBundleStatus.isLastDownloadSucess = true;
              mBundleStatus.updateTimestamp = System.currentTimeMillis();
            }
            if (mBundleDownloadListener != null) {
              mBundleDownloadListener.onSuccess(nativeDeltaClient);
            }
            UiThreadUtil.runOnUiThread(
                new Runnable() {
                  @Override
                  public void run() {
                    ReactMarker.logMarker(ReactMarkerConstants.DOWNLOAD_END, bundleInfo.toJSONString());
                    mReactInstanceManagerHelper.onJSBundleLoadedFromServer(nativeDeltaClient);
                  }
                });
          }

          @Override
          public void onProgress(@Nullable final String status, @Nullable final Integer done, @Nullable final Integer total) {
            mDevLoadingViewController.updateProgress(status, done, total);
            if (mBundleDownloadListener != null) {
              mBundleDownloadListener.onProgress(status, done, total);
            }
          }

          @Override
          public void onFailure(final Exception cause) {
            mDevLoadingViewController.hide();
            mDevLoadingViewVisible = false;
            synchronized (DevSupportManagerImpl.this) {
              mBundleStatus.isLastDownloadSucess = false;
            }
            if (mBundleDownloadListener != null) {
              mBundleDownloadListener.onFailure(cause);
            }
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
        bundleURL,
        bundleInfo);
  }

  @Override
  public void startInspector() {
    if (mIsDevSupportEnabled) {
      mDevServerHelper.openInspectorConnection();
    }
  }

  @Override
  public void stopInspector() {
    mDevServerHelper.closeInspectorConnection();
  }

  private void reload() {
    UiThreadUtil.assertOnUiThread();

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
        filter.addAction(getReloadAppAction(mApplicationContext));
        mApplicationContext.registerReceiver(mReloadAppBroadcastReceiver, filter);
        mIsReceiverRegistered = true;
      }

      // show the dev loading if it should be
      if (mDevLoadingViewVisible) {
        mDevLoadingViewController.showMessage("Reloading...");
      }

      mDevServerHelper.openPackagerConnection(this.getClass().getSimpleName(), this);
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
      hideRedboxDialog();

      // hide dev options dialog
      hideDevOptionsDialog();

      // hide loading view
      mDevLoadingViewController.hide();
      mDevServerHelper.closePackagerConnection();
      mDevServerHelper.stopPollingOnChangeEndpoint();
    }
  }

  /** Intent action for reloading the JS */
  private static String getReloadAppAction(Context context) {
    return context.getPackageName() + RELOAD_APP_ACTION_SUFFIX;
  }
}
