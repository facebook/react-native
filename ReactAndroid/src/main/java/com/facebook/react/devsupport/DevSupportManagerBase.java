/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

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
import android.graphics.Color;
import android.graphics.Typeface;
import android.hardware.SensorManager;
import android.util.Pair;
import android.view.Gravity;
import android.view.View;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.Nullable;
import androidx.annotation.UiThread;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.R;
import com.facebook.react.bridge.DefaultNativeModuleCallExceptionHandler;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.DebugServerException;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.ShakeDetector;
import com.facebook.react.devsupport.DevServerHelper.PackagerCommandListener;
import com.facebook.react.devsupport.interfaces.BundleLoadCallback;
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener;
import com.facebook.react.devsupport.interfaces.DevOptionHandler;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.devsupport.interfaces.ErrorCustomizer;
import com.facebook.react.devsupport.interfaces.ErrorType;
import com.facebook.react.devsupport.interfaces.PackagerStatusCallback;
import com.facebook.react.devsupport.interfaces.StackFrame;
import com.facebook.react.modules.core.RCTNativeAppEventEmitter;
import com.facebook.react.packagerconnection.RequestHandler;
import com.facebook.react.packagerconnection.Responder;
import java.io.File;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public abstract class DevSupportManagerBase implements DevSupportManager {

  public interface CallbackWithBundleLoader {
    void onSuccess(JSBundleLoader bundleLoader);

    void onError(String url, Throwable cause);
  }

  private static final int JAVA_ERROR_COOKIE = -1;
  private static final int JSEXCEPTION_ERROR_COOKIE = -1;
  private static final String RELOAD_APP_ACTION_SUFFIX = ".RELOAD_APP_ACTION";
  private static final String FLIPPER_DEBUGGER_URL =
      "flipper://null/Hermesdebuggerrn?device=React%20Native";
  private static final String FLIPPER_DEVTOOLS_URL = "flipper://null/React?device=React%20Native";
  private static final String EXOPACKAGE_LOCATION_FORMAT =
      "/data/local/tmp/exopackage/%s//secondary-dex";

  public static final String EMOJI_HUNDRED_POINTS_SYMBOL = " \uD83D\uDCAF";
  public static final String EMOJI_FACE_WITH_NO_GOOD_GESTURE = " \uD83D\uDE45";

  private final Context mApplicationContext;
  private final ShakeDetector mShakeDetector;
  private final BroadcastReceiver mReloadAppBroadcastReceiver;
  private final DevServerHelper mDevServerHelper;
  private final LinkedHashMap<String, DevOptionHandler> mCustomDevOptions = new LinkedHashMap<>();
  private final ReactInstanceDevHelper mReactInstanceDevHelper;
  private final @Nullable String mJSAppBundleName;
  private final File mJSBundleDownloadedFile;
  private final File mJSSplitBundlesDir;
  private final DefaultNativeModuleCallExceptionHandler mDefaultNativeModuleCallExceptionHandler;
  private final DevLoadingViewController mDevLoadingViewController;

  private @Nullable RedBoxDialog mRedBoxDialog;
  private @Nullable AlertDialog mDevOptionsDialog;
  private @Nullable DebugOverlayController mDebugOverlayController;
  private boolean mDevLoadingViewVisible = false;
  private int mPendingJSSplitBundleRequests = 0;
  private @Nullable ReactContext mCurrentContext;
  private DevInternalSettings mDevSettings;
  private boolean mIsReceiverRegistered = false;
  private boolean mIsShakeDetectorStarted = false;
  private boolean mIsDevSupportEnabled = false;
  private @Nullable RedBoxHandler mRedBoxHandler;
  private @Nullable String mLastErrorTitle;
  private @Nullable StackFrame[] mLastErrorStack;
  private @Nullable ErrorType mLastErrorType;
  private int mLastErrorCookie = 0;
  private @Nullable DevBundleDownloadListener mBundleDownloadListener;
  private @Nullable List<ErrorCustomizer> mErrorCustomizers;
  private @Nullable PackagerLocationCustomizer mPackagerLocationCustomizer;

  private InspectorPackagerConnection.BundleStatus mBundleStatus;

  private @Nullable Map<String, RequestHandler> mCustomPackagerCommandHandlers;

  private @Nullable Activity currentActivity;

  public DevSupportManagerBase(
      Context applicationContext,
      ReactInstanceDevHelper reactInstanceDevHelper,
      @Nullable String packagerPathForJSBundleName,
      boolean enableOnCreate,
      @Nullable RedBoxHandler redBoxHandler,
      @Nullable DevBundleDownloadListener devBundleDownloadListener,
      int minNumShakes,
      @Nullable Map<String, RequestHandler> customPackagerCommandHandlers) {
    mReactInstanceDevHelper = reactInstanceDevHelper;
    mApplicationContext = applicationContext;
    mJSAppBundleName = packagerPathForJSBundleName;
    mDevSettings =
        new DevInternalSettings(
            applicationContext,
            new DevInternalSettings.Listener() {
              @Override
              public void onInternalSettingsChanged() {
                reloadSettings();
              }
            });
    mBundleStatus = new InspectorPackagerConnection.BundleStatus();
    mDevServerHelper =
        new DevServerHelper(
            mDevSettings,
            mApplicationContext.getPackageName(),
            new InspectorPackagerConnection.BundleStatusProvider() {
              @Override
              public InspectorPackagerConnection.BundleStatus getBundleStatus() {
                return mBundleStatus;
              }
            });
    mBundleDownloadListener = devBundleDownloadListener;

    // Prepare shake gesture detector (will be started/stopped from #reload)
    mShakeDetector =
        new ShakeDetector(
            new ShakeDetector.ShakeListener() {
              @Override
              public void onShake() {
                showDevOptionsDialog();
              }
            },
            minNumShakes);

    mCustomPackagerCommandHandlers = customPackagerCommandHandlers;

    // Prepare reload APP broadcast receiver (will be registered/unregistered from #reload)
    mReloadAppBroadcastReceiver =
        new BroadcastReceiver() {
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
    final String subclassTag = getUniqueTag();
    final String bundleFile = subclassTag + "ReactNativeDevBundle.js";
    mJSBundleDownloadedFile = new File(applicationContext.getFilesDir(), bundleFile);

    final String splitBundlesDir = subclassTag.toLowerCase() + "_dev_js_split_bundles";
    mJSSplitBundlesDir = mApplicationContext.getDir(splitBundlesDir, Context.MODE_PRIVATE);

    mDefaultNativeModuleCallExceptionHandler = new DefaultNativeModuleCallExceptionHandler();

    setDevSupportEnabled(enableOnCreate);

    mRedBoxHandler = redBoxHandler;
    mDevLoadingViewController = new DevLoadingViewController(reactInstanceDevHelper);
  }

  protected abstract String getUniqueTag();

  @Override
  public void handleException(Exception e) {
    if (mIsDevSupportEnabled) {
      logJSException(e);
    } else {
      mDefaultNativeModuleCallExceptionHandler.handleException(e);
    }
  }

  private void logJSException(Exception e) {
    StringBuilder message =
        new StringBuilder(
            e.getMessage() == null ? "Exception in native call from JS" : e.getMessage());
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
      showNewError(message.toString(), new StackFrame[] {}, JSEXCEPTION_ERROR_COOKIE, ErrorType.JS);
    } else {
      showNewJavaError(message.toString(), e);
    }
  }

  @Override
  public void showNewJavaError(@Nullable String message, Throwable e) {
    FLog.e(ReactConstants.TAG, "Exception in native call", e);
    showNewError(
        message, StackTraceHelper.convertJavaStackTrace(e), JAVA_ERROR_COOKIE, ErrorType.NATIVE);
  }

  /**
   * Add option item to dev settings dialog displayed by this manager. In the case user select given
   * option from that dialog, the appropriate handler passed as {@param optionHandler} will be
   * called.
   */
  @Override
  public void addCustomDevOption(String optionName, DevOptionHandler optionHandler) {
    mCustomDevOptions.put(optionName, optionHandler);
  }

  @Override
  public void showNewJSError(String message, ReadableArray details, int errorCookie) {
    showNewError(message, StackTraceHelper.convertJsStackTrace(details), errorCookie, ErrorType.JS);
  }

  @Override
  public void registerErrorCustomizer(ErrorCustomizer errorCustomizer) {
    if (mErrorCustomizers == null) {
      mErrorCustomizers = new ArrayList<>();
    }
    mErrorCustomizers.add(errorCustomizer);
  }

  private Pair<String, StackFrame[]> processErrorCustomizers(Pair<String, StackFrame[]> errorInfo) {
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
      final String message, final ReadableArray details, final int errorCookie) {
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            // Since we only show the first JS error in a succession of JS errors, make sure we only
            // update the error message for that error message. This assumes that updateJSError
            // belongs to the most recent showNewJSError
            if (mRedBoxDialog == null
                || !mRedBoxDialog.isShowing()
                || errorCookie != mLastErrorCookie) {
              return;
            }
            StackFrame[] stack = StackTraceHelper.convertJsStackTrace(details);
            Pair<String, StackFrame[]> errorInfo =
                processErrorCustomizers(Pair.create(message, stack));
            mRedBoxDialog.setExceptionDetails(errorInfo.first, errorInfo.second);
            updateLastErrorInfo(message, stack, errorCookie, ErrorType.JS);
            // JS errors are reported here after source mapping.
            if (mRedBoxHandler != null) {
              mRedBoxHandler.handleRedbox(message, stack, ErrorType.JS);
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

  public @Nullable View createRootView(String appKey) {
    return mReactInstanceDevHelper.createRootView(appKey);
  }

  public void destroyRootView(View rootView) {
    mReactInstanceDevHelper.destroyRootView(rootView);
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
            Activity context = mReactInstanceDevHelper.getCurrentActivity();
            if (mRedBoxDialog == null || context != currentActivity) {
              if (context == null || context.isFinishing()) {
                FLog.e(
                    ReactConstants.TAG,
                    "Unable to launch redbox because react activity "
                        + "is not available, here is the error that redbox would've displayed: "
                        + message);
                return;
              }
              currentActivity = context;
              mRedBoxDialog =
                  new RedBoxDialog(currentActivity, DevSupportManagerBase.this, mRedBoxHandler);
            }
            if (mRedBoxDialog.isShowing()) {
              // Sometimes errors cause multiple errors to be thrown in JS in quick succession. Only
              // show the first and most actionable one.
              return;
            }
            Pair<String, StackFrame[]> errorInfo =
                processErrorCustomizers(Pair.create(message, stack));
            mRedBoxDialog.setExceptionDetails(errorInfo.first, errorInfo.second);
            updateLastErrorInfo(message, stack, errorCookie, errorType);
            // Only report native errors here. JS errors are reported
            // inside {@link #updateJSError} after source mapping.
            if (mRedBoxHandler != null && errorType == ErrorType.NATIVE) {
              mRedBoxHandler.handleRedbox(message, stack, ErrorType.NATIVE);
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
        mApplicationContext.getString(R.string.catalyst_reload),
        new DevOptionHandler() {
          @Override
          public void onOptionSelected() {
            if (!mDevSettings.isJSDevModeEnabled()
                && mDevSettings.isHotModuleReplacementEnabled()) {
              Toast.makeText(
                      mApplicationContext,
                      mApplicationContext.getString(R.string.catalyst_hot_reloading_auto_disable),
                      Toast.LENGTH_LONG)
                  .show();
              mDevSettings.setHotModuleReplacementEnabled(false);
            }
            handleReloadJS();
          }
        });

    if (mDevSettings.isDeviceDebugEnabled()) {
      // For on-device debugging we link out to Flipper.
      // Since we're assuming Flipper is available, also include the DevTools.

      // Reset the old debugger setting so no one gets stuck.
      // TODO: Remove in a few weeks.
      if (mDevSettings.isRemoteJSDebugEnabled()) {
        mDevSettings.setRemoteJSDebugEnabled(false);
        handleReloadJS();
      }
      options.put(
          mApplicationContext.getString(R.string.catalyst_debug_open),
          new DevOptionHandler() {
            @Override
            public void onOptionSelected() {
              mDevServerHelper.openUrl(
                  mCurrentContext,
                  FLIPPER_DEBUGGER_URL,
                  mApplicationContext.getString(R.string.catalyst_open_flipper_error));
            }
          });
      options.put(
          mApplicationContext.getString(R.string.catalyst_devtools_open),
          new DevOptionHandler() {
            @Override
            public void onOptionSelected() {
              mDevServerHelper.openUrl(
                  mCurrentContext,
                  FLIPPER_DEVTOOLS_URL,
                  mApplicationContext.getString(R.string.catalyst_open_flipper_error));
            }
          });
    }

    options.put(
        mApplicationContext.getString(R.string.catalyst_change_bundle_location),
        new DevOptionHandler() {
          @Override
          public void onOptionSelected() {
            Activity context = mReactInstanceDevHelper.getCurrentActivity();
            if (context == null || context.isFinishing()) {
              FLog.e(
                  ReactConstants.TAG,
                  "Unable to launch change bundle location because react activity is not available");
              return;
            }

            final EditText input = new EditText(context);
            input.setHint("localhost:8081");

            AlertDialog bundleLocationDialog =
                new AlertDialog.Builder(context)
                    .setTitle(
                        mApplicationContext.getString(R.string.catalyst_change_bundle_location))
                    .setView(input)
                    .setPositiveButton(
                        android.R.string.ok,
                        new DialogInterface.OnClickListener() {
                          @Override
                          public void onClick(DialogInterface dialog, int which) {
                            String host = input.getText().toString();
                            mDevSettings.getPackagerConnectionSettings().setDebugServerHost(host);
                            handleReloadJS();
                          }
                        })
                    .create();
            bundleLocationDialog.show();
          }
        });

    options.put(
        mDevSettings.isElementInspectorEnabled()
            ? mApplicationContext.getString(R.string.catalyst_inspector_stop)
            : mApplicationContext.getString(R.string.catalyst_inspector),
        new DevOptionHandler() {
          @Override
          public void onOptionSelected() {
            mDevSettings.setElementInspectorEnabled(!mDevSettings.isElementInspectorEnabled());
            mReactInstanceDevHelper.toggleElementInspector();
          }
        });

    options.put(
        mDevSettings.isHotModuleReplacementEnabled()
            ? mApplicationContext.getString(R.string.catalyst_hot_reloading_stop)
            : mApplicationContext.getString(R.string.catalyst_hot_reloading),
        new DevOptionHandler() {
          @Override
          public void onOptionSelected() {
            boolean nextEnabled = !mDevSettings.isHotModuleReplacementEnabled();
            mDevSettings.setHotModuleReplacementEnabled(nextEnabled);
            if (mCurrentContext != null) {
              if (nextEnabled) {
                mCurrentContext.getJSModule(HMRClient.class).enable();
              } else {
                mCurrentContext.getJSModule(HMRClient.class).disable();
              }
            }
            if (nextEnabled && !mDevSettings.isJSDevModeEnabled()) {
              Toast.makeText(
                      mApplicationContext,
                      mApplicationContext.getString(R.string.catalyst_hot_reloading_auto_enable),
                      Toast.LENGTH_LONG)
                  .show();
              mDevSettings.setJSDevModeEnabled(true);
              handleReloadJS();
            }
          }
        });

    options.put(
        mDevSettings.isFpsDebugEnabled()
            ? mApplicationContext.getString(R.string.catalyst_perf_monitor_stop)
            : mApplicationContext.getString(R.string.catalyst_perf_monitor),
        new DevOptionHandler() {
          @Override
          public void onOptionSelected() {
            if (!mDevSettings.isFpsDebugEnabled()) {
              // Request overlay permission if needed when "Show Perf Monitor" option is selected
              Context context = mReactInstanceDevHelper.getCurrentActivity();
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
        mApplicationContext.getString(R.string.catalyst_settings),
        new DevOptionHandler() {
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

    Activity context = mReactInstanceDevHelper.getCurrentActivity();
    if (context == null || context.isFinishing()) {
      FLog.e(
          ReactConstants.TAG,
          "Unable to launch dev options menu because react activity " + "isn't available");
      return;
    }

    final TextView textView = new TextView(getApplicationContext());
    textView.setText("React Native DevMenu (" + getUniqueTag() + ")");
    textView.setPadding(0, 50, 0, 0);
    textView.setGravity(Gravity.CENTER);
    textView.setTextColor(Color.BLACK);
    textView.setTextSize(17);
    textView.setTypeface(textView.getTypeface(), Typeface.BOLD);

    mDevOptionsDialog =
        new AlertDialog.Builder(context)
            .setCustomTitle(textView)
            .setItems(
                options.keySet().toArray(new String[0]),
                new DialogInterface.OnClickListener() {
                  @Override
                  public void onClick(DialogInterface dialog, int which) {
                    optionHandlers[which].onOptionSelected();
                    mDevOptionsDialog = null;
                  }
                })
            .setOnCancelListener(
                new DialogInterface.OnCancelListener() {
                  @Override
                  public void onCancel(DialogInterface dialog) {
                    mDevOptionsDialog = null;
                  }
                })
            .create();
    mDevOptionsDialog.show();
    if (mCurrentContext != null) {
      mCurrentContext.getJSModule(RCTNativeAppEventEmitter.class).emit("RCTDevMenuShown", null);
    }
  }

  /**
   * {@link ReactInstanceDevCommandsHandler} is responsible for enabling/disabling dev support when
   * a React view is attached/detached or when application state changes (e.g. the application is
   * backgrounded).
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
  public DevInternalSettings getDevSettings() {
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
    return mJSBundleDownloadedFile.getAbsolutePath();
  }

  /**
   * @return {@code true} if {@link com.facebook.react.ReactInstanceManager} should use downloaded
   *     JS bundle file instead of using JS file from assets. This may happen when app has not been
   *     updated since the last time we fetched the bundle.
   */
  @Override
  public boolean hasUpToDateJSBundleInCache() {
    if (mIsDevSupportEnabled && mJSBundleDownloadedFile.exists()) {
      try {
        String packageName = mApplicationContext.getPackageName();
        PackageInfo thisPackage =
            mApplicationContext.getPackageManager().getPackageInfo(packageName, 0);
        if (mJSBundleDownloadedFile.lastModified() > thisPackage.lastUpdateTime) {
          // Base APK has not been updated since we downloaded JS, but if app is using exopackage
          // it may only be a single dex that has been updated. We check for exopackage dir update
          // time in that case.
          File exopackageDir =
              new File(String.format(Locale.US, EXOPACKAGE_LOCATION_FORMAT, packageName));
          if (exopackageDir.exists()) {
            return mJSBundleDownloadedFile.lastModified() > exopackageDir.lastModified();
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

    if (mCurrentContext != null) {
      try {
        URL sourceUrl = new URL(getSourceUrl());
        String path = sourceUrl.getPath().substring(1); // strip initial slash in path
        String host = sourceUrl.getHost();
        int port = sourceUrl.getPort();
        mCurrentContext
            .getJSModule(HMRClient.class)
            .setup("android", path, host, port, mDevSettings.isHotModuleReplacementEnabled());
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
      UiThreadUtil.runOnUiThread(
          new Runnable() {
            @Override
            public void run() {
              reload();
            }
          });
    }
  }

  protected @Nullable ReactContext getCurrentContext() {
    return mCurrentContext;
  }

  protected @Nullable String getJSAppBundleName() {
    return mJSAppBundleName;
  }

  protected Context getApplicationContext() {
    return mApplicationContext;
  }

  protected DevServerHelper getDevServerHelper() {
    return mDevServerHelper;
  }

  protected ReactInstanceDevHelper getReactInstanceDevHelper() {
    return mReactInstanceDevHelper;
  }

  @UiThread
  private void showDevLoadingViewForUrl(String bundleUrl) {
    mDevLoadingViewController.showForUrl(bundleUrl);
    mDevLoadingViewVisible = true;
  }

  @UiThread
  protected void showDevLoadingViewForRemoteJSEnabled() {
    mDevLoadingViewController.showForRemoteJSEnabled();
    mDevLoadingViewVisible = true;
  }

  @UiThread
  protected void hideDevLoadingView() {
    mDevLoadingViewController.hide();
    mDevLoadingViewVisible = false;
  }

  public void fetchSplitBundleAndCreateBundleLoader(
      String bundlePath, final CallbackWithBundleLoader callback) {
    final String bundleUrl = mDevServerHelper.getDevServerSplitBundleURL(bundlePath);
    // The bundle path may contain the '/' character, which is not allowed in file names.
    final File bundleFile =
        new File(mJSSplitBundlesDir, bundlePath.replaceAll("/", "_") + ".jsbundle");
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            showSplitBundleDevLoadingView(bundleUrl);
            mDevServerHelper.downloadBundleFromURL(
                new DevBundleDownloadListener() {
                  @Override
                  public void onSuccess() {
                    UiThreadUtil.runOnUiThread(
                        new Runnable() {
                          @Override
                          public void run() {
                            hideSplitBundleDevLoadingView();
                          }
                        });

                    @Nullable ReactContext context = mCurrentContext;
                    if (context == null || !context.hasActiveReactInstance()) {
                      return;
                    }

                    JSBundleLoader bundleLoader =
                        JSBundleLoader.createCachedSplitBundleFromNetworkLoader(
                            bundleUrl, bundleFile.getAbsolutePath());

                    callback.onSuccess(bundleLoader);
                  }

                  @Override
                  public void onProgress(
                      @Nullable String status, @Nullable Integer done, @Nullable Integer total) {
                    mDevLoadingViewController.updateProgress(status, done, total);
                  }

                  @Override
                  public void onFailure(Exception cause) {
                    UiThreadUtil.runOnUiThread(
                        new Runnable() {
                          @Override
                          public void run() {
                            hideSplitBundleDevLoadingView();
                          }
                        });
                    callback.onError(bundleUrl, cause);
                  }
                },
                bundleFile,
                bundleUrl,
                null);
          }
        });
  }

  @UiThread
  private void showSplitBundleDevLoadingView(String bundleUrl) {
    showDevLoadingViewForUrl(bundleUrl);
    mPendingJSSplitBundleRequests++;
  }

  @UiThread
  private void hideSplitBundleDevLoadingView() {
    if (--mPendingJSSplitBundleRequests == 0) {
      hideDevLoadingView();
    }
  }

  @Override
  public void isPackagerRunning(final PackagerStatusCallback callback) {
    Runnable checkPackagerRunning =
        new Runnable() {
          @Override
          public void run() {
            mDevServerHelper.isPackagerRunning(callback);
          }
        };
    if (mPackagerLocationCustomizer != null) {
      mPackagerLocationCustomizer.run(checkPackagerRunning);
    } else {
      checkPackagerRunning.run();
    }
  }

  @Override
  public @Nullable File downloadBundleResourceFromUrlSync(
      final String resourceURL, final File outputFile) {
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
  public @Nullable ErrorType getLastErrorType() {
    return mLastErrorType;
  }

  private void handleCaptureHeap(final Responder responder) {
    if (mCurrentContext == null) {
      return;
    }
    JSCHeapCapture heapCapture = mCurrentContext.getNativeModule(JSCHeapCapture.class);

    if (heapCapture != null) {
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

  public void reloadJSFromServer(final String bundleURL) {
    reloadJSFromServer(
        bundleURL,
        new BundleLoadCallback() {
          @Override
          public void onSuccess() {
            UiThreadUtil.runOnUiThread(
                new Runnable() {
                  @Override
                  public void run() {
                    mReactInstanceDevHelper.onJSBundleLoadedFromServer();
                  }
                });
          }
        });
  }

  public void reloadJSFromServer(final String bundleURL, final BundleLoadCallback callback) {
    ReactMarker.logMarker(ReactMarkerConstants.DOWNLOAD_START);

    showDevLoadingViewForUrl(bundleURL);

    final BundleDownloader.BundleInfo bundleInfo = new BundleDownloader.BundleInfo();

    mDevServerHelper.downloadBundleFromURL(
        new DevBundleDownloadListener() {
          @Override
          public void onSuccess() {
            hideDevLoadingView();
            synchronized (DevSupportManagerBase.this) {
              mBundleStatus.isLastDownloadSucess = true;
              mBundleStatus.updateTimestamp = System.currentTimeMillis();
            }
            if (mBundleDownloadListener != null) {
              mBundleDownloadListener.onSuccess();
            }
            ReactMarker.logMarker(ReactMarkerConstants.DOWNLOAD_END, bundleInfo.toJSONString());
            callback.onSuccess();
          }

          @Override
          public void onProgress(
              @Nullable final String status,
              @Nullable final Integer done,
              @Nullable final Integer total) {
            mDevLoadingViewController.updateProgress(status, done, total);
            if (mBundleDownloadListener != null) {
              mBundleDownloadListener.onProgress(status, done, total);
            }
          }

          @Override
          public void onFailure(final Exception cause) {
            hideDevLoadingView();
            synchronized (DevSupportManagerBase.this) {
              mBundleStatus.isLastDownloadSucess = false;
            }
            if (mBundleDownloadListener != null) {
              mBundleDownloadListener.onFailure(cause);
            }
            FLog.e(ReactConstants.TAG, "Unable to download JS bundle", cause);
            reportBundleLoadingFailure(cause);
          }
        },
        mJSBundleDownloadedFile,
        bundleURL,
        bundleInfo);
  }

  private void reportBundleLoadingFailure(final Exception cause) {
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            if (cause instanceof DebugServerException) {
              DebugServerException debugServerException = (DebugServerException) cause;
              showNewJavaError(debugServerException.getMessage(), cause);
            } else {
              showNewJavaError(
                  mApplicationContext.getString(R.string.catalyst_reload_error), cause);
            }
          }
        });
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

  @Override
  public void setHotModuleReplacementEnabled(final boolean isHotModuleReplacementEnabled) {
    if (!mIsDevSupportEnabled) {
      return;
    }

    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            mDevSettings.setHotModuleReplacementEnabled(isHotModuleReplacementEnabled);
            handleReloadJS();
          }
        });
  }

  @Override
  public void setRemoteJSDebugEnabled(final boolean isRemoteJSDebugEnabled) {
    if (!mIsDevSupportEnabled) {
      return;
    }

    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            mDevSettings.setRemoteJSDebugEnabled(isRemoteJSDebugEnabled);
            handleReloadJS();
          }
        });
  }

  @Override
  public void setFpsDebugEnabled(final boolean isFpsDebugEnabled) {
    if (!mIsDevSupportEnabled) {
      return;
    }

    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            mDevSettings.setFpsDebugEnabled(isFpsDebugEnabled);
          }
        });
  }

  @Override
  public void toggleElementInspector() {
    if (!mIsDevSupportEnabled) {
      return;
    }

    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            mDevSettings.setElementInspectorEnabled(!mDevSettings.isElementInspectorEnabled());
            mReactInstanceDevHelper.toggleElementInspector();
          }
        });
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

      mDevServerHelper.openPackagerConnection(
          this.getClass().getSimpleName(),
          new PackagerCommandListener() {
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
              UiThreadUtil.runOnUiThread(
                  new Runnable() {
                    @Override
                    public void run() {
                      handleReloadJS();
                    }
                  });
            }

            @Override
            public void onPackagerDevMenuCommand() {
              UiThreadUtil.runOnUiThread(
                  new Runnable() {
                    @Override
                    public void run() {
                      showDevOptionsDialog();
                    }
                  });
            }

            @Override
            public void onCaptureHeapCommand(final Responder responder) {
              UiThreadUtil.runOnUiThread(
                  new Runnable() {
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
          });
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
    }
  }

  /** Intent action for reloading the JS */
  private static String getReloadAppAction(Context context) {
    return context.getPackageName() + RELOAD_APP_ACTION_SUFFIX;
  }

  @Override
  public void setPackagerLocationCustomizer(
      DevSupportManager.PackagerLocationCustomizer packagerLocationCustomizer) {
    mPackagerLocationCustomizer = packagerLocationCustomizer;
  }
}
