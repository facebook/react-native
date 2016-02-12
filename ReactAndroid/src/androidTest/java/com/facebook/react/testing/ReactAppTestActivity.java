/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.testing;

import javax.annotation.Nullable;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import android.graphics.Bitmap;
import android.os.Bundle;
import android.support.v4.app.FragmentActivity;
import android.view.View;
import android.view.ViewTreeObserver;
import android.widget.FrameLayout;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.LifecycleState;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactPackage;
import com.facebook.react.ReactRootView;
import com.facebook.react.shell.MainReactPackage;


public class ReactAppTestActivity extends FragmentActivity implements
    DefaultHardwareBackBtnHandler
{

  private static final String DEFAULT_BUNDLE_NAME = "AndroidTestBundle.js";
  private static final int ROOT_VIEW_ID = 8675309;
  // we need a bigger timeout for CI builds because they run on a slow emulator
  private static final long IDLE_TIMEOUT_MS = 60000;

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
      mReactInstanceManager.onPause();
    }
  }

  @Override
  protected void onResume() {
    super.onResume();

    mLifecycleState = LifecycleState.RESUMED;

    if (mReactInstanceManager != null) {
      mReactInstanceManager.onResume(this, this);
    }
  }

  @Override
  protected void onDestroy() {
    super.onDestroy();
    mDestroyCountDownLatch.countDown();

    if (mReactInstanceManager != null) {
      mReactInstanceManager.onDestroy();
    }
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

  public void resetRootViewForScreenshotTests() {
    if (mReactInstanceManager != null) {
      mReactInstanceManager.onDestroy();
      mReactInstanceManager = null;
    }
    mReactRootView = new ReactRootView(this);
    mScreenshotingFrameLayout.removeAllViews();
    mScreenshotingFrameLayout.addView(mReactRootView);
  }

  public void loadApp(
      String appKey,
      ReactInstanceSpecForTest spec,
      @Nullable Bundle initialProps,
      String bundleName,
      boolean useDevSupport) {

    final CountDownLatch currentLayoutEvent = mLayoutEvent = new CountDownLatch(1);
    mBridgeIdleSignaler = new ReactBridgeIdleSignaler();

    ReactInstanceManager.Builder builder =
      ReactTestHelper.getReactTestFactory().getReactInstanceManagerBuilder()
        .setApplication(getApplication())
        .setBundleAssetName(bundleName)
        // By not setting a JS module name, we force the bundle to be always loaded from
        // assets, not the devserver, even if dev mode is enabled (such as when testing redboxes).
        // This makes sense because we never run the devserver in tests.
        //.setJSMainModuleName()
        .addPackage(spec.getAlternativeReactPackageForTest() != null ?
            spec.getAlternativeReactPackageForTest() : new MainReactPackage())
        .addPackage(new InstanceSpecForTestPackage(spec))
        .setUseDeveloperSupport(useDevSupport)
        .setBridgeIdleDebugListener(mBridgeIdleSignaler)
        .setInitialLifecycleState(mLifecycleState);

    mReactInstanceManager = builder.build();
    mReactInstanceManager.onResume(this, this);

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
}
