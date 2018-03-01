/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.testing;

import android.graphics.Bitmap;
import android.os.Bundle;
import android.support.v4.app.FragmentActivity;
import android.view.View;
import android.view.ViewTreeObserver;
import android.widget.FrameLayout;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactInstanceManagerBuilder;
import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.react.testing.idledetection.ReactBridgeIdleSignaler;
import com.facebook.react.testing.idledetection.ReactIdleDetectionUtil;
import com.facebook.react.uimanager.UIImplementationProvider;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import javax.annotation.Nullable;

public class ReactAppTestActivity extends FragmentActivity
    implements DefaultHardwareBackBtnHandler, PermissionAwareActivity {

  private static final String DEFAULT_BUNDLE_NAME = "AndroidTestBundle.js";
  private static final int ROOT_VIEW_ID = 8675309;
  // we need a bigger timeout for CI builds because they run on a slow emulator
  private static final long IDLE_TIMEOUT_MS = 120000;

  private CountDownLatch mLayoutEvent = new CountDownLatch(1);
  private @Nullable ReactBridgeIdleSignaler mBridgeIdleSignaler;
  private ScreenshotingFrameLayout mScreenshotingFrameLayout;
  private final CountDownLatch mDestroyCountDownLatch = new CountDownLatch(1);
  private @Nullable ReactInstanceManager mReactInstanceManager;
  private @Nullable ReactRootView mReactRootView;
  private LifecycleState mLifecycleState = LifecycleState.BEFORE_RESUME;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    overridePendingTransition(0, 0);

    // We wrap screenshot layout in another FrameLayout in order to handle custom dimensions of the
    // screenshot view set through {@link #setScreenshotDimensions}
    FrameLayout rootView = new FrameLayout(this);
    setContentView(rootView);

    mScreenshotingFrameLayout = new ScreenshotingFrameLayout(this);
    mScreenshotingFrameLayout.setId(ROOT_VIEW_ID);
    rootView.addView(mScreenshotingFrameLayout);

    mReactRootView = new ReactRootView(this);
    mScreenshotingFrameLayout.addView(mReactRootView);
  }

  @Override
  protected void onPause() {
    super.onPause();

    mLifecycleState = LifecycleState.BEFORE_RESUME;

    overridePendingTransition(0, 0);

    if (mReactInstanceManager != null) {
      mReactInstanceManager.onHostPause();
    }
  }

  @Override
  protected void onResume() {
    super.onResume();

    mLifecycleState = LifecycleState.RESUMED;

    if (mReactInstanceManager != null) {
      mReactInstanceManager.onHostResume(this, this);
    }
  }

  @Override
  protected void onDestroy() {
    super.onDestroy();
    mDestroyCountDownLatch.countDown();

    if (mReactInstanceManager != null) {
      mReactInstanceManager.destroy();
      mReactInstanceManager = null;
    }
    if (mReactRootView != null) {
      mReactRootView.unmountReactApplication();
      mReactRootView = null;
    }

    mScreenshotingFrameLayout.clean();
  }

  public void waitForDestroy(long timeoutMs) throws InterruptedException {
    mDestroyCountDownLatch.await(timeoutMs, TimeUnit.MILLISECONDS);
  }

  public void loadApp(String appKey, ReactInstanceSpecForTest spec, boolean enableDevSupport) {
    loadApp(appKey, spec, null, DEFAULT_BUNDLE_NAME, enableDevSupport);
  }

  public void loadApp(String appKey, ReactInstanceSpecForTest spec, String bundleName) {
    loadApp(appKey, spec, null, bundleName, false /* = useDevSupport */);
  }

  public void loadApp(
    String appKey,
    ReactInstanceSpecForTest spec,
    String bundleName,
    UIImplementationProvider uiImplementationProvider) {
    loadApp(appKey, spec, null, bundleName, false /* = useDevSupport */, uiImplementationProvider);
  }

  public void resetRootViewForScreenshotTests() {
    if (mReactInstanceManager != null) {
      mReactInstanceManager.destroy();
      mReactInstanceManager = null;
    }
    if (mReactRootView != null) {
      mReactRootView.unmountReactApplication();
    }
    mReactRootView = new ReactRootView(this);
    mScreenshotingFrameLayout.removeAllViews();
    mScreenshotingFrameLayout.clean();
    mScreenshotingFrameLayout.addView(mReactRootView);
  }

  public void loadApp(
      String appKey,
      ReactInstanceSpecForTest spec,
      @Nullable Bundle initialProps,
      String bundleName,
      boolean useDevSupport) {
    loadApp(appKey, spec, initialProps, bundleName, useDevSupport, null);
  }

  public void loadApp(
    String appKey,
    ReactInstanceSpecForTest spec,
    @Nullable Bundle initialProps,
    String bundleName,
    boolean useDevSupport,
    UIImplementationProvider uiImplementationProvider) {

    final CountDownLatch currentLayoutEvent = mLayoutEvent = new CountDownLatch(1);
    mBridgeIdleSignaler = new ReactBridgeIdleSignaler();

    ReactInstanceManagerBuilder builder =
        ReactTestHelper.getReactTestFactory()
            .getReactInstanceManagerBuilder()
            .setApplication(getApplication())
            .setBundleAssetName(bundleName);
    if (!spec.getAlternativeReactPackagesForTest().isEmpty()) {
      builder.addPackages(spec.getAlternativeReactPackagesForTest());
    } else {
      builder.addPackage(new MainReactPackage());
    }
    builder
        .addPackage(new InstanceSpecForTestPackage(spec))
        // By not setting a JS module name, we force the bundle to be always loaded from
        // assets, not the devserver, even if dev mode is enabled (such as when testing redboxes).
        // This makes sense because we never run the devserver in tests.
        //.setJSMainModuleName()
        .setUseDeveloperSupport(useDevSupport)
        .setBridgeIdleDebugListener(mBridgeIdleSignaler)
        .setInitialLifecycleState(mLifecycleState)
        .setUIImplementationProvider(uiImplementationProvider);

    mReactInstanceManager = builder.build();
    mReactInstanceManager.onHostResume(this, this);

    Assertions.assertNotNull(mReactRootView).getViewTreeObserver().addOnGlobalLayoutListener(
        new ViewTreeObserver.OnGlobalLayoutListener() {
          @Override
          public void onGlobalLayout() {
            currentLayoutEvent.countDown();
          }
        });
    Assertions.assertNotNull(mReactRootView)
        .startReactApplication(mReactInstanceManager, appKey, initialProps);
  }

  public boolean waitForLayout(long millis) throws InterruptedException {
    return mLayoutEvent.await(millis, TimeUnit.MILLISECONDS);
  }

  public void waitForBridgeAndUIIdle() {
    waitForBridgeAndUIIdle(IDLE_TIMEOUT_MS);
  }

  public void waitForBridgeAndUIIdle(long timeoutMs) {
    ReactIdleDetectionUtil.waitForBridgeAndUIIdle(
        Assertions.assertNotNull(mBridgeIdleSignaler),
        getReactContext(),
        timeoutMs);
  }

  public View getRootView() {
    return Assertions.assertNotNull(mReactRootView);
  }

  public ReactContext getReactContext() {
    return waitForReactContext();
  }

  // Because react context is created asynchronously, we may have to wait until it is available.
  // It's simpler than exposing synchronosition mechanism to notify listener than react context
  // creation has completed.
  private ReactContext waitForReactContext() {
    Assertions.assertNotNull(mReactInstanceManager);

    try {
      while (true) {
        ReactContext reactContext = mReactInstanceManager.getCurrentReactContext();
        if (reactContext != null) {
           return reactContext;
        }
        Thread.sleep(100);
      }
    } catch (InterruptedException e) {
      throw new RuntimeException(e);
    }
  }

  public void postDelayed(Runnable r, int delayMS) {
    getRootView().postDelayed(r, delayMS);
  }

  /**
   * Does not ensure that this is run on the UI thread or that the UI Looper is idle like
   * {@link ReactAppInstrumentationTestCase#getScreenshot()}. You probably want to use that
   * instead.
   */
  public Bitmap getCurrentScreenshot() {
    return mScreenshotingFrameLayout.getLastDrawnBitmap();
  }

  public boolean isScreenshotReady() {
    return mScreenshotingFrameLayout.isScreenshotReady();
  }

  public void setScreenshotDimensions(int width, int height) {
    mScreenshotingFrameLayout.setLayoutParams(new FrameLayout.LayoutParams(width, height));
  }

  @Override
  public void invokeDefaultOnBackPressed() {
    super.onBackPressed();
  }

  @Override
  public void onRequestPermissionsResult(
      int requestCode,
      String[] permissions,
      int[] grantResults) {
  }

  @Override
  public void requestPermissions(
      String[] permissions, int requestCode, PermissionListener listener) {}
}
