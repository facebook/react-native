/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime;

import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.view.View;
import com.facebook.debug.holder.PrinterHolder;
import com.facebook.debug.tags.ReactDebugOverlayTags;
import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.JavaJSExecutor;
import com.facebook.react.bridge.JavaScriptExecutorFactory;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.devsupport.DevSupportManagerBase;
import com.facebook.react.devsupport.HMRClient;
import com.facebook.react.devsupport.ReactInstanceDevHelper;
import com.facebook.react.devsupport.interfaces.DevSplitBundleCallback;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.runtime.internal.bolts.Continuation;
import com.facebook.react.runtime.internal.bolts.Task;
import javax.annotation.Nullable;

/**
 * An implementation of {@link com.facebook.react.devsupport.interfaces.DevSupportManager} that
 * extends the functionality in {@link DevSupportManagerBase} with some additional, more flexible
 * APIs for asynchronously loading the JS bundle.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
class BridgelessDevSupportManager extends DevSupportManagerBase {

  private final ReactHostImpl mReactHost;

  public BridgelessDevSupportManager(
      ReactHostImpl host, Context context, @Nullable String packagerPathForJSBundleName) {
    super(
        context.getApplicationContext(),
        createInstanceDevHelper(host),
        packagerPathForJSBundleName,
        true /* enableOnCreate */,
        null /* redBoxHandler */,
        null /* devBundleDownloadListener */,
        2 /* minNumShakes */,
        null /* customPackagerCommandHandlers */,
        null /* surfaceDelegateFactory */,
        null /* devLoadingViewManager */);
    mReactHost = host;
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
            mReactHost
                .loadBundle(bundleLoader)
                .onSuccess(
                    new Continuation<Boolean, Void>() {
                      @Override
                      public Void then(Task<Boolean> task) {
                        if (task.getResult().equals(Boolean.TRUE)) {
                          String bundleURL =
                              getDevServerHelper().getDevServerSplitBundleURL(bundlePath);
                          ReactContext reactContext = mReactHost.getCurrentReactContext();
                          if (reactContext != null) {
                            reactContext.getJSModule(HMRClient.class).registerBundle(bundleURL);
                          }
                          callback.onSuccess();
                        }
                        return null;
                      }
                    });
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
    mReactHost.reload("BridgelessDevSupportManager.handleReloadJS()");

    PrinterHolder.getPrinter()
        .logMessage(ReactDebugOverlayTags.RN_CORE, "RNCore: load from Server");
    String bundleURL =
        getDevServerHelper().getDevServerBundleURL(Assertions.assertNotNull(getJSAppBundleName()));
    reloadJSFromServer(bundleURL);
  }

  private static ReactInstanceDevHelper createInstanceDevHelper(final ReactHostImpl reactHost) {
    return new ReactInstanceDevHelper() {
      @Override
      public void onReloadWithJSDebugger(JavaJSExecutor.Factory proxyExecutorFactory) {
        // Not implemented
      }

      @Override
      public void onJSBundleLoadedFromServer() {
        // Not implemented
      }

      @Override
      public void toggleElementInspector() {
        ReactContext reactContext = reactHost.getCurrentReactContext();
        if (reactContext != null) {
          reactContext
              .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
              .emit("toggleElementInspector", null);
        }
      }

      @androidx.annotation.Nullable
      @Override
      public Activity getCurrentActivity() {
        return reactHost.getLastUsedActivity();
      }

      @Override
      public JavaScriptExecutorFactory getJavaScriptExecutorFactory() {
        throw new IllegalStateException("Not implemented for bridgeless mode");
      }

      @androidx.annotation.Nullable
      @Override
      public View createRootView(String appKey) {
        Activity currentActivity = getCurrentActivity();
        if (currentActivity != null && !reactHost.isSurfaceWithModuleNameAttached(appKey)) {
          ReactSurfaceImpl reactSurface =
              ReactSurfaceImpl.createWithView(currentActivity, appKey, new Bundle());
          reactSurface.attach(reactHost);
          reactSurface.start();

          return reactSurface.getView();
        }
        return null;
      }

      @Override
      public void destroyRootView(View rootView) {
        // Not implemented
      }
    };
  }
}
