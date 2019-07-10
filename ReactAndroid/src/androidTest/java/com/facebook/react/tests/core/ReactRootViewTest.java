//  Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.tests.core;

import static org.fest.assertions.api.Assertions.assertThat;

import android.app.Instrumentation;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import androidx.test.InstrumentationRegistry;
import androidx.test.runner.AndroidJUnit4;
import com.facebook.react.ReactPackage;
import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.react.testing.StringRecordingModule;
import com.facebook.react.testing.rule.ReactNativeTestRule;
import com.facebook.react.uimanager.PixelUtil;
import java.util.HashMap;
import java.util.Map;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class ReactRootViewTest {

  private interface ReactRootViewTestModule extends JavaScriptModule {
    void setHeight(int height);
  }

  final StringRecordingModule mRecordingModule = new StringRecordingModule();
  final ReactPackage mReactPackage =
      new MainReactPackage() {
        @Override
        public NativeModule getModule(String name, ReactApplicationContext context) {
          if (name.equals(StringRecordingModule.NAME)) {
            return mRecordingModule;
          }

          return super.getModule(name, context);
        }

        @Override
        public ReactModuleInfoProvider getReactModuleInfoProvider() {
          final ReactModuleInfoProvider provider = super.getReactModuleInfoProvider();

          return new ReactModuleInfoProvider() {
            private Map<String, ReactModuleInfo> mModuleInfos = null;

            @Override
            public Map<String, ReactModuleInfo> getReactModuleInfos() {
              if (mModuleInfos != null) {
                return mModuleInfos;
              }

              mModuleInfos = new HashMap<>();
              mModuleInfos.putAll(provider.getReactModuleInfos());

              Class<? extends NativeModule> moduleClass = StringRecordingModule.class;
              ReactModule reactModule = moduleClass.getAnnotation(ReactModule.class);

              mModuleInfos.put(
                  reactModule.name(),
                  new ReactModuleInfo(
                      reactModule.name(),
                      moduleClass.getName(),
                      reactModule.canOverrideExistingModule(),
                      reactModule.needsEagerInit(),
                      reactModule.hasConstants(),
                      reactModule.isCxxModule(),
                      false));

              return mModuleInfos;
            }
          };
        }
      };

  @Rule
  public ReactNativeTestRule mReactNativeRule =
      new ReactNativeTestRule("AndroidTestBundle.js", mReactPackage);

  @Before
  public void setup() {
    mReactNativeRule.render("CatalystRootViewTestApp");
  }

  @Test
  public void testResizeRootView() {
    final ReactRootView rootView = mReactNativeRule.getView();
    final View childView = rootView.getChildAt(0);

    assertThat(rootView.getWidth()).isEqualTo(childView.getWidth());

    final int newWidth = rootView.getWidth() / 2;

    Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
    instrumentation.runOnMainSync(
        new Runnable() {
          @Override
          public void run() {
            rootView.setLayoutParams(
                new FrameLayout.LayoutParams(newWidth, ViewGroup.LayoutParams.MATCH_PARENT));
          }
        });

    instrumentation.waitForIdleSync();
    mReactNativeRule.waitForIdleSync();

    assertThat(newWidth).isEqualTo(childView.getWidth());
  }

  @Test
  public void testRootViewWrapContent() {
    final ReactRootView rootView = mReactNativeRule.getView();

    Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
    instrumentation.runOnMainSync(
        new Runnable() {
          @Override
          public void run() {
            rootView.setLayoutParams(
                new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));
          }
        });

    instrumentation.waitForIdleSync();
    mReactNativeRule.waitForIdleSync();

    int newComponentHeight = 500;
    mReactNativeRule
        .getContext()
        .getJSModule(ReactRootViewTestModule.class)
        .setHeight(newComponentHeight);

    instrumentation.waitForIdleSync();
    mReactNativeRule.waitForIdleSync();
    instrumentation.waitForIdleSync();

    // added 0.5 to account for rounding issues
    assertThat(rootView.getMeasuredHeight())
        .isEqualTo((int) (PixelUtil.toPixelFromDIP(newComponentHeight) + 0.5));
  }

  /**
   * Verify that removing the root view from hierarchy will trigger subviews removal both on JS and
   * native side
   */
  @Test
  public void testRemoveRootView() {
    final ReactRootView rootView = mReactNativeRule.getView();

    assertThat(rootView.getChildCount()).isEqualTo(1);

    Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
    instrumentation.runOnMainSync(
        new Runnable() {
          @Override
          public void run() {
            ViewGroup parent = (ViewGroup) rootView.getParent();
            parent.removeView(rootView);
            // removing from parent should not remove child views, child views should be removed as
            // an effect of native call to UIManager.removeRootView
            assertThat(rootView.getChildCount()).isEqualTo(1);
          }
        });

    instrumentation.waitForIdleSync();
    mReactNativeRule.waitForIdleSync();

    assertThat(mRecordingModule.getCalls().size())
        .isEqualTo(0)
        .overridingErrorMessage("root component should not be automatically unmounted");
    assertThat(rootView.getChildCount()).isEqualTo(1);

    instrumentation.runOnMainSync(
        new Runnable() {
          @Override
          public void run() {
            rootView.unmountReactApplication();
          }
        });
    mReactNativeRule.waitForIdleSync();

    assertThat(mRecordingModule.getCalls().size()).isEqualTo(1);
    assertThat(mRecordingModule.getCalls().get(0)).isEqualTo("RootComponentWillUnmount");
    assertThat(rootView.getChildCount()).isEqualTo(0);
  }
}
