/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.content.Context;
import android.widget.Toast;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.debug.holder.PrinterHolder;
import com.facebook.debug.tags.ReactDebugOverlayTags;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.JavaJSExecutor;
import com.facebook.react.bridge.JavaScriptExecutorFactory;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.SurfaceDelegateFactory;
import com.facebook.react.common.futures.SimpleSettableFuture;
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener;
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager;
import com.facebook.react.devsupport.interfaces.DevOptionHandler;
import com.facebook.react.devsupport.interfaces.DevSplitBundleCallback;
import com.facebook.react.devsupport.interfaces.RedBoxHandler;
import com.facebook.react.packagerconnection.RequestHandler;
import java.io.File;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

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
 * {@code <activity android:name="com.facebook.react.devsupport.DevSettingsActivity" android:exported="false"/>}
 * {@code <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>}
 */
public final class BridgeDevSupportManager extends DevSupportManagerBase {
  private boolean mIsSamplingProfilerEnabled = false;
  private ReactInstanceDevHelper mReactInstanceManagerHelper;
  private @Nullable DevLoadingViewManager mDevLoadingViewManager;

  public BridgeDevSupportManager(
      Context applicationContext,
      ReactInstanceDevHelper reactInstanceManagerHelper,
      @Nullable String packagerPathForJSBundleName,
      boolean enableOnCreate,
      @Nullable RedBoxHandler redBoxHandler,
      @Nullable DevBundleDownloadListener devBundleDownloadListener,
      int minNumShakes,
      @Nullable Map<String, RequestHandler> customPackagerCommandHandlers,
      @Nullable SurfaceDelegateFactory surfaceDelegateFactory,
      @Nullable DevLoadingViewManager devLoadingViewManager) {
    super(
        applicationContext,
        reactInstanceManagerHelper,
        packagerPathForJSBundleName,
        enableOnCreate,
        redBoxHandler,
        devBundleDownloadListener,
        minNumShakes,
        customPackagerCommandHandlers,
        surfaceDelegateFactory,
        devLoadingViewManager);

    mReactInstanceManagerHelper = reactInstanceManagerHelper;
    mDevLoadingViewManager = devLoadingViewManager;

    if (getDevSettings().isStartSamplingProfilerOnInit()) {
      // Only start the profiler. If its already running, there is an error
      if (!mIsSamplingProfilerEnabled) {
        toggleJSSamplingProfiler();
      } else {
        Toast.makeText(
                applicationContext,
                "JS Sampling Profiler was already running, so did not start the sampling profiler",
                Toast.LENGTH_LONG)
            .show();
      }
    }

    addCustomDevOption(
        mIsSamplingProfilerEnabled ? "Disable Sampling Profiler" : "Enable Sampling Profiler",
        new DevOptionHandler() {
          @Override
          public void onOptionSelected() {
            toggleJSSamplingProfiler();
          }
        });

    if (!getDevSettings().isDeviceDebugEnabled()) {
      // For remote debugging, we open up Chrome running the app in a web worker.
      // Note that this requires async communication, which will not work for Turbo Modules.
      addCustomDevOption(
          getDevSettings().isRemoteJSDebugEnabled()
              ? applicationContext.getString(com.facebook.react.R.string.catalyst_debug_stop)
              : applicationContext.getString(com.facebook.react.R.string.catalyst_debug),
          new DevOptionHandler() {
            @Override
            public void onOptionSelected() {
              getDevSettings().setRemoteJSDebugEnabled(!getDevSettings().isRemoteJSDebugEnabled());
              handleReloadJS();
            }
          });
    }
  }

  public DevLoadingViewManager getDevLoadingViewManager() {
    return mDevLoadingViewManager;
  }

  public ReactInstanceDevHelper getReactInstanceManagerHelper() {
    return mReactInstanceManagerHelper;
  }

  @Override
  protected String getUniqueTag() {
    return "Bridge";
  }

  @Override
  public void loadSplitBundleFromServer(
      final String bundlePath, final DevSplitBundleCallback callback) {
    fetchSplitBundleAndCreateBundleLoader(
        bundlePath,
        new CallbackWithBundleLoader() {
          @Override
          public void onSuccess(JSBundleLoader bundleLoader) {
            bundleLoader.loadScript(getCurrentContext().getCatalystInstance());
            getCurrentContext()
                .getJSModule(HMRClient.class)
                .registerBundle(getDevServerHelper().getDevServerSplitBundleURL(bundlePath));
            callback.onSuccess();
          }

          @Override
          public void onError(String url, Throwable cause) {
            callback.onError(url, cause);
          }
        });
  }

  private WebsocketJavaScriptExecutor.JSExecutorConnectCallback getExecutorConnectCallback(
      final SimpleSettableFuture<Boolean> future) {
    return new WebsocketJavaScriptExecutor.JSExecutorConnectCallback() {
      @Override
      public void onSuccess() {
        future.set(true);
        hideDevLoadingView();
      }

      @Override
      public void onFailure(final Throwable cause) {
        hideDevLoadingView();
        FLog.e(ReactConstants.TAG, "Failed to connect to debugger!", cause);
        future.setException(
            new IOException(
                getApplicationContext().getString(com.facebook.react.R.string.catalyst_debug_error),
                cause));
      }
    };
  }

  private void reloadJSInProxyMode() {
    // When using js proxy, there is no need to fetch JS bundle as proxy executor will do that
    // anyway
    getDevServerHelper().launchJSDevtools();

    JavaJSExecutor.Factory factory =
        new JavaJSExecutor.Factory() {
          @Override
          public JavaJSExecutor create() throws Exception {
            WebsocketJavaScriptExecutor executor = new WebsocketJavaScriptExecutor();
            SimpleSettableFuture<Boolean> future = new SimpleSettableFuture<>();
            executor.connect(
                getDevServerHelper().getWebsocketProxyURL(), getExecutorConnectCallback(future));
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
    getReactInstanceDevHelper().onReloadWithJSDebugger(factory);
  }

  @Override
  public void handleReloadJS() {

    UiThreadUtil.assertOnUiThread();

    ReactMarker.logMarker(
        ReactMarkerConstants.RELOAD,
        getDevSettings().getPackagerConnectionSettings().getDebugServerHost());

    // dismiss redbox if exists
    hideRedboxDialog();

    if (getDevSettings().isRemoteJSDebugEnabled()) {
      PrinterHolder.getPrinter()
          .logMessage(ReactDebugOverlayTags.RN_CORE, "RNCore: load from Proxy");
      showDevLoadingViewForRemoteJSEnabled();
      reloadJSInProxyMode();
    } else {
      PrinterHolder.getPrinter()
          .logMessage(ReactDebugOverlayTags.RN_CORE, "RNCore: load from Server");
      String bundleURL =
          getDevServerHelper()
              .getDevServerBundleURL(Assertions.assertNotNull(getJSAppBundleName()));
      reloadJSFromServer(bundleURL);
    }
  }

  /** Starts of stops the sampling profiler */
  private void toggleJSSamplingProfiler() {
    JavaScriptExecutorFactory javaScriptExecutorFactory =
        getReactInstanceDevHelper().getJavaScriptExecutorFactory();
    if (!mIsSamplingProfilerEnabled) {
      try {
        javaScriptExecutorFactory.startSamplingProfiler();
        Toast.makeText(getApplicationContext(), "Starting Sampling Profiler", Toast.LENGTH_SHORT)
            .show();
      } catch (UnsupportedOperationException e) {
        Toast.makeText(
                getApplicationContext(),
                javaScriptExecutorFactory.toString() + " does not support Sampling Profiler",
                Toast.LENGTH_LONG)
            .show();
      } finally {
        mIsSamplingProfilerEnabled = true;
      }
    } else {
      try {
        final String outputPath =
            File.createTempFile(
                    "sampling-profiler-trace", ".cpuprofile", getApplicationContext().getCacheDir())
                .getPath();
        javaScriptExecutorFactory.stopSamplingProfiler(outputPath);
        Toast.makeText(
                getApplicationContext(),
                "Saved results from Profiler to " + outputPath,
                Toast.LENGTH_LONG)
            .show();
      } catch (IOException e) {
        FLog.e(
            ReactConstants.TAG,
            "Could not create temporary file for saving results from Sampling Profiler");
      } catch (UnsupportedOperationException e) {
        Toast.makeText(
                getApplicationContext(),
                javaScriptExecutorFactory.toString() + "does not support Sampling Profiler",
                Toast.LENGTH_LONG)
            .show();
      } finally {
        mIsSamplingProfilerEnabled = false;
      }
    }
  }
}
