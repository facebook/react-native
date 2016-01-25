/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.testing;

import android.view.View;
import android.view.ViewGroup;

import com.facebook.react.bridge.CatalystInstanceImpl;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.NativeModuleCallExceptionHandler;
import com.facebook.react.bridge.JSCJavaScriptExecutor;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.NativeModuleRegistry;
import com.facebook.react.bridge.JavaScriptModulesConfig;
import com.facebook.react.bridge.queue.ReactQueueConfigurationSpec;

import com.android.internal.util.Predicate;

public class ReactTestHelper {

  public static class ReactInstanceEasyBuilder {

    private final ReactIntegrationTestCase mTestCase;
    private final NativeModuleRegistry.Builder mNativeModuleRegistryBuilder;
    private final JavaScriptModulesConfig.Builder mJSModulesConfigBuilder;

    private ReactInstanceEasyBuilder(ReactIntegrationTestCase testCase) {
      mTestCase = testCase;
      mNativeModuleRegistryBuilder = new NativeModuleRegistry.Builder();
      mJSModulesConfigBuilder = new JavaScriptModulesConfig.Builder();
    }

    public CatalystInstanceImpl build() {
      CatalystInstanceImpl instance = mTestCase.new ReactTestInstanceBuilder()
          .setReactQueueConfigurationSpec(ReactQueueConfigurationSpec.createDefault())
          .setJSExecutor(new JSCJavaScriptExecutor())
          .setRegistry(mNativeModuleRegistryBuilder.build())
          .setJSModulesConfig(mJSModulesConfigBuilder.build())
          .setJSBundleLoader(JSBundleLoader.createFileLoader(
                  mTestCase.getContext(),
                  "assets://AndroidTestBundle.js"))
          .setNativeModuleCallExceptionHandler(
              new NativeModuleCallExceptionHandler() {
                @Override
                public void handleException(Exception e) {
                  throw new RuntimeException(e);
                }
              })
          .build();
      instance.runJSBundle();
      mTestCase.waitForBridgeAndUIIdle();
      return instance;
    }

    public ReactInstanceEasyBuilder addNativeModule(NativeModule module) {
      mNativeModuleRegistryBuilder.add(module);
      return this;
    }

    public ReactInstanceEasyBuilder addJSModule(Class moduleInterfaceClass) {
      mJSModulesConfigBuilder.add(moduleInterfaceClass);
      return this;
    }
  }

  public static ReactInstanceEasyBuilder catalystInstanceBuilder(
      ReactIntegrationTestCase testCase) {
    return new ReactInstanceEasyBuilder(testCase);
  }

  /**
   * Gets the view at given path in the UI hierarchy, ignoring modals.
   */
  public static <T extends View> T getViewAtPath(ViewGroup rootView, int... path) {
    // The application root element is wrapped in a helper view in order
    // to be able to display modals. See renderApplication.js.
    ViewGroup appWrapperView = rootView;
    View view = appWrapperView.getChildAt(0);
    for (int i = 0; i < path.length; i++) {
      view = ((ViewGroup) view).getChildAt(path[i]);
    }
    return (T) view;
  }

  /**
   * Gets the view with a given react test ID in the UI hierarchy. React test ID is currently
   * propagated into view content description.
   */
  public static View getViewWithReactTestId(View rootView, String testId) {
    return findChild(rootView, hasTagValue(testId));
  }

  public static String getTestId(View view) {
    return view.getTag() instanceof String ? (String) view.getTag() : null;
  }

  private static View findChild(View root, Predicate<View> predicate) {
    if (predicate.apply(root)) {
      return root;
    }
    if (root instanceof ViewGroup) {
      ViewGroup viewGroup = (ViewGroup) root;
      for (int i = 0; i < viewGroup.getChildCount(); i++) {
        View child = viewGroup.getChildAt(i);
        View result = findChild(child, predicate);
        if (result != null) {
          return result;
        }
      }
    }
    return null;
  }

  private static Predicate<View> hasTagValue(final String tagValue) {
    return new Predicate<View>() {
      @Override
      public boolean apply(View view) {
        Object tag = view.getTag();
        return tag != null && tag.equals(tagValue);
      }
    };
  }
}
