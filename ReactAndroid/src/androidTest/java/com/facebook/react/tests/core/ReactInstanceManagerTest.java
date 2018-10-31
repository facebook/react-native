package com.facebook.react.tests.core;

import android.app.Activity;
import android.support.test.annotation.UiThreadTest;
import android.support.test.rule.ActivityTestRule;
import android.support.test.runner.AndroidJUnit4;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactRootView;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.react.testing.ReactTestHelper;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class ReactInstanceManagerTest {

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

  @Test
  @UiThreadTest
  public void testMountUnmount() {
    mReactInstanceManager.onHostResume(mActivityRule.getActivity());
    mReactRootView.startReactApplication(mReactInstanceManager, "ViewLayoutTestApp");
    mReactRootView.unmountReactApplication();
  }
}
