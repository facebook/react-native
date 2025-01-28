/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.content.Context;
import androidx.annotation.Nullable;
import com.facebook.debug.holder.PrinterHolder;
import com.facebook.debug.tags.ReactDebugOverlayTags;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.SurfaceDelegateFactory;
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener;
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager;
import com.facebook.react.devsupport.interfaces.DevSplitBundleCallback;
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager;
import com.facebook.react.devsupport.interfaces.RedBoxHandler;
import com.facebook.react.packagerconnection.RequestHandler;
import java.util.Map;

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
 */
public final class BridgeDevSupportManager extends DevSupportManagerBase {
  private boolean mIsSamplingProfilerEnabled = false;

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
      @Nullable DevLoadingViewManager devLoadingViewManager,
      @Nullable PausedInDebuggerOverlayManager pausedInDebuggerOverlayManager) {
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
        devLoadingViewManager,
        pausedInDebuggerOverlayManager);
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
            bundleLoader.loadScript(getCurrentReactContext().getCatalystInstance());
            getCurrentReactContext()
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

  @Override
  public void handleReloadJS() {

    UiThreadUtil.assertOnUiThread();

    ReactMarker.logMarker(
        ReactMarkerConstants.RELOAD,
        getDevSettings().getPackagerConnectionSettings().getDebugServerHost());

    // dismiss redbox if exists
    hideRedboxDialog();

    PrinterHolder.getPrinter()
        .logMessage(ReactDebugOverlayTags.RN_CORE, "RNCore: load from Server");
    String bundleURL =
        getDevServerHelper().getDevServerBundleURL(Assertions.assertNotNull(getJSAppBundleName()));
    reloadJSFromServer(
        bundleURL,
        () ->
            UiThreadUtil.runOnUiThread(
                () -> getReactInstanceDevHelper().onJSBundleLoadedFromServer()));
  }
}
