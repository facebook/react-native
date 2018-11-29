//  Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.tests.core;

import android.app.Activity;
import android.support.test.InstrumentationRegistry;
import android.support.test.annotation.UiThreadTest;
import android.support.test.rule.ActivityTestRule;
import android.support.test.runner.AndroidJUnit4;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactRootView;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.react.testing.ReactTestHelper;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class ReactInstanceManagerTest {

  private static final String TEST_MODULE = "ViewLayoutTestApp";

  private ReactInstanceManager mReactInstanceManager;
  private ReactRootView mReactRootView;

  @Rule public ActivityTestRule<Activity> mActivityRule = new ActivityTestRule<>(Activity.class);

  @Before
  public void setup() {
    Activity activity = mActivityRule.getActivity();
    mReactRootView = new ReactRootView(activity);
    mReactInstanceManager =
      ReactTestHelper.getReactTestFactory()
        .getReactInstanceManagerBuilder()
        .setApplication(activity.getApplication())
        .setBundleAssetName("AndroidTestBundle.js")
        .setInitialLifecycleState(LifecycleState.BEFORE_CREATE)
        .addPackage(new MainReactPackage())
        .build();
  }

  @After
  public void tearDown() {
    final ReactRootView reactRootView = mReactRootView;
    final ReactInstanceManager reactInstanceManager = mReactInstanceManager;
    InstrumentationRegistry.getInstrumentation().runOnMainSync(new Runnable() {
      @Override
      public void run() {
        reactRootView.unmountReactApplication();
        reactInstanceManager.destroy();
      }
    });
  }

  @Test
  @UiThreadTest
  public void testMountUnmount() {
    mReactInstanceManager.onHostResume(mActivityRule.getActivity());
    mReactRootView.startReactApplication(mReactInstanceManager, TEST_MODULE);
    mReactRootView.unmountReactApplication();
  }

  @Test
  @UiThreadTest
  public void testResume() throws InterruptedException {
    mReactInstanceManager.onHostResume(mActivityRule.getActivity());
    mReactRootView.startReactApplication(mReactInstanceManager, TEST_MODULE);
    mReactInstanceManager.onHostResume(mActivityRule.getActivity());
  }

  @Test
  @UiThreadTest
  public void testRecreateContext() throws InterruptedException {
    mReactInstanceManager.onHostResume(mActivityRule.getActivity());
    mReactInstanceManager.createReactContextInBackground();
    mReactRootView.startReactApplication(mReactInstanceManager, TEST_MODULE);
  }

  @Test
  @UiThreadTest
  public void testMountTwice() {
    mReactInstanceManager.onHostResume(mActivityRule.getActivity());
    mReactRootView.startReactApplication(mReactInstanceManager, TEST_MODULE);
    mReactInstanceManager.attachRootView(mReactRootView);
  }
}
