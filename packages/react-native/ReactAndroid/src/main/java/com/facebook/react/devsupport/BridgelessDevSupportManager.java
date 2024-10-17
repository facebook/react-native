/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.content.Context;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.ReactContext;
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
 * An implementation of {@link com.facebook.react.devsupport.interfaces.DevSupportManager} that
 * extends the functionality in {@link DevSupportManagerBase} with some additional, more flexible
 * APIs for asynchronously loading the JS bundle.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
class BridgelessDevSupportManager extends DevSupportManagerBase {

  public BridgelessDevSupportManager(
      Context context,
      ReactInstanceDevHelper reactInstanceManagerHelper,
      @Nullable String packagerPathForJSBundleName) {
    this(
        context.getApplicationContext(),
        reactInstanceManagerHelper,
        packagerPathForJSBundleName,
        true /* enableOnCreate */,
        null /* redBoxHandler */,
        null /* devBundleDownloadListener */,
        2 /* minNumShakes */,
        null /* customPackagerCommandHandlers */,
        null /* surfaceDelegateFactory */,
        null /* devLoadingViewManager */,
        null /* pausedInDebuggerOverlayManager */);
  }

  /**
   * This constructor mirrors the same constructor we have for {@link BridgeDevSupportManager} and
   * is kept for backward compatibility.
   */
  public BridgelessDevSupportManager(
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
    return "Bridgeless";
  }

  @Override
  public void loadSplitBundleFromServer(
      final String bundlePath, final DevSplitBundleCallback callback) {
    fetchSplitBundleAndCreateBundleLoader(
        bundlePath,
        new CallbackWithBundleLoader() {
          @Override
          public void onSuccess(final JSBundleLoader bundleLoader) {
            try {
              mReactInstanceDevHelper.loadBundle(bundleLoader).waitForCompletion();
              String bundleURL = getDevServerHelper().getDevServerSplitBundleURL(bundlePath);
              ReactContext reactContext = mReactInstanceDevHelper.getCurrentReactContext();
              if (reactContext != null) {
                reactContext.getJSModule(HMRClient.class).registerBundle(bundleURL);
              }
              callback.onSuccess();
            } catch (InterruptedException e) {
              Thread.currentThread().interrupt();
              throw new RuntimeException(
                  "[BridgelessDevSupportManager]: Got interrupted while loading bundle", e);
            }
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

    // dismiss redbox if exists
    hideRedboxDialog();
    mReactInstanceDevHelper.reload("BridgelessDevSupportManager.handleReloadJS()");
  }
}
