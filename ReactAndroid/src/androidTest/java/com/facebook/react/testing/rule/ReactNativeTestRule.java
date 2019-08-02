//  Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.testing.rule;

import android.app.Activity;
import android.view.ViewTreeObserver.OnGlobalLayoutListener;
import androidx.test.rule.ActivityTestRule;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactPackage;
import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.react.testing.ReactTestHelper;
import com.facebook.react.testing.idledetection.ReactBridgeIdleSignaler;
import com.facebook.react.testing.idledetection.ReactIdleDetectionUtil;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.UIImplementation;
import com.facebook.react.uimanager.UIManagerModule;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.Rule;
import org.junit.rules.TestRule;
import org.junit.runner.Description;
import org.junit.runners.model.Statement;

/** A test rule to simplify React Native rendering tests. */
public class ReactNativeTestRule implements TestRule {

  // we need a bigger timeout for CI builds because they run on a slow emulator
  private static final long IDLE_TIMEOUT_MS = 120000;

  @Rule public ActivityTestRule<Activity> mActivityRule = new ActivityTestRule<>(Activity.class);

  private final String mBundleName;
  private ReactPackage mReactPackage;
  private ReactInstanceManager mReactInstanceManager;
  private ReactBridgeIdleSignaler mBridgeIdleSignaler;
  private ReactRootView mView;
  private CountDownLatch mLatch;

  public ReactNativeTestRule(String bundleName) {
    this(bundleName, null);
  }

  public ReactNativeTestRule(String bundleName, ReactPackage reactPackage) {
    mBundleName = bundleName;
    mReactPackage = reactPackage;
  }

  @Override
  public Statement apply(final Statement base, final Description description) {
    return new Statement() {
      @Override
      public void evaluate() throws Throwable {
        setUp();
        base.evaluate();
        tearDown();
      }
    };
  }

  @SuppressWarnings("deprecation")
  private void setUp() {
    final Activity activity = mActivityRule.launchActivity(null);
    mView = new ReactRootView(activity);

    activity.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            mBridgeIdleSignaler = new ReactBridgeIdleSignaler();
            mReactInstanceManager =
                ReactTestHelper.getReactTestFactory()
                    .getReactInstanceManagerBuilder()
                    .setApplication(activity.getApplication())
                    .setBundleAssetName(mBundleName)
                    .setInitialLifecycleState(LifecycleState.BEFORE_CREATE)
                    .setBridgeIdleDebugListener(mBridgeIdleSignaler)
                    .addPackage(mReactPackage != null ? mReactPackage : new MainReactPackage())
                    .build();
            mReactInstanceManager.onHostResume(activity);

            // This threading garbage will be replaced by Surface
            final AtomicBoolean isLayoutUpdated = new AtomicBoolean(false);
            mReactInstanceManager.addReactInstanceEventListener(
                new ReactInstanceManager.ReactInstanceEventListener() {
                  @Override
                  public void onReactContextInitialized(ReactContext reactContext) {
                    final UIManagerModule uiManagerModule =
                        reactContext.getCatalystInstance().getNativeModule(UIManagerModule.class);
                    uiManagerModule
                        .getUIImplementation()
                        .setLayoutUpdateListener(
                            new UIImplementation.LayoutUpdateListener() {
                              @Override
                              public void onLayoutUpdated(ReactShadowNode reactShadowNode) {
                                uiManagerModule.getUIImplementation().removeLayoutUpdateListener();
                                isLayoutUpdated.set(true);
                              }
                            });
                  }
                });
            mView
                .getViewTreeObserver()
                .addOnGlobalLayoutListener(
                    new OnGlobalLayoutListener() {
                      @Override
                      public void onGlobalLayout() {
                        if (isLayoutUpdated.get()) {
                          mView.getViewTreeObserver().removeOnGlobalLayoutListener(this);
                          mLatch.countDown();
                        }
                      }
                    });
          }
        });
  }

  private void tearDown() {
    final ReactRootView view = mView;
    final ReactInstanceManager reactInstanceManager = mReactInstanceManager;
    mView = null;
    mReactInstanceManager = null;
    mActivityRule
        .getActivity()
        .runOnUiThread(
            new Runnable() {
              @Override
              public void run() {
                view.unmountReactApplication();
                reactInstanceManager.destroy();
              }
            });
  }

  /** Renders the react component and waits until the layout has completed before returning */
  public void render(final String componentName) {
    mLatch = new CountDownLatch(1);
    final Activity activity = mActivityRule.getActivity();
    activity.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            ReactRootView view = getView();
            view.startReactApplication(mReactInstanceManager, componentName);
            activity.setContentView(view);
          }
        });
    int timeoutSec = 10;
    try {
      mLatch.await(timeoutSec, TimeUnit.SECONDS);
    } catch (InterruptedException e) {
      throw new RuntimeException(
          "Failed to render " + componentName + " after " + timeoutSec + " seconds");
    }
  }

  public void waitForIdleSync() {
    ReactIdleDetectionUtil.waitForBridgeAndUIIdle(
        mBridgeIdleSignaler, mReactInstanceManager.getCurrentReactContext(), IDLE_TIMEOUT_MS);
  }

  /** Returns the react view */
  public ReactRootView getView() {
    return mView;
  }

  public ReactContext getContext() {
    return mReactInstanceManager.getCurrentReactContext();
  }
}
