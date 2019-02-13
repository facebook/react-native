/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.testing;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import javax.annotation.Nullable;

import android.app.Instrumentation;
import android.content.Context;
import android.support.test.InstrumentationRegistry;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.NativeModuleRegistryBuilder;
import com.facebook.react.R;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactInstanceManagerBuilder;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaScriptModuleRegistry;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.NativeModuleCallExceptionHandler;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.queue.ReactQueueConfigurationSpec;
import com.facebook.react.bridge.CatalystInstanceImpl;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.JavaScriptExecutor;
import com.facebook.react.jscexecutor.JSCExecutorFactory;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.uimanager.ViewManager;
import com.android.internal.util.Predicate;

public class ReactTestHelper {
  private static class DefaultReactTestFactory implements ReactTestFactory {
    private static class ReactInstanceEasyBuilderImpl implements ReactInstanceEasyBuilder {

      private NativeModuleRegistryBuilder mNativeModuleRegistryBuilder;

      private @Nullable Context mContext;

      @Override
      public ReactInstanceEasyBuilder setContext(Context context) {
        mContext = context;
        return this;
      }

      @Override
      public ReactInstanceEasyBuilder addNativeModule(final NativeModule nativeModule) {
        if (mNativeModuleRegistryBuilder == null) {
          mNativeModuleRegistryBuilder = new NativeModuleRegistryBuilder(
            (ReactApplicationContext) mContext,
            null);
        }
        Assertions.assertNotNull(nativeModule);
        mNativeModuleRegistryBuilder.processPackage(new ReactPackage(){
        	@Override
        	public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        	   return Collections.emptyList();
        	}

        	@Override
        	public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        		return Arrays.asList(nativeModule);
        	}
        });
        return this;
      }

      @Override
      public CatalystInstance build() {
        if (mNativeModuleRegistryBuilder == null) {
          mNativeModuleRegistryBuilder = new NativeModuleRegistryBuilder(
            (ReactApplicationContext) mContext,
            null);
        }
        JavaScriptExecutor executor = null;
        try {
          executor = new JSCExecutorFactory("ReactTestHelperApp", "ReactTestHelperDevice").create();
        } catch (Exception e) {
          throw new RuntimeException(e);
        }
        return new CatalystInstanceImpl.Builder()
          .setReactQueueConfigurationSpec(ReactQueueConfigurationSpec.createDefault())
          .setJSExecutor(executor)
          .setRegistry(mNativeModuleRegistryBuilder.build())
          .setJSBundleLoader(JSBundleLoader.createAssetLoader(
              mContext,
              "assets://AndroidTestBundle.js",
              false/* Asynchronous */))
          .setNativeModuleCallExceptionHandler(
            new NativeModuleCallExceptionHandler() {
                @Override
                public void handleException(Exception e) {
                  throw new RuntimeException(e);
                }
            })
          .build();
      }
    }

    @Override
    public ReactInstanceEasyBuilder getCatalystInstanceBuilder() {
      return new ReactInstanceEasyBuilderImpl();
    }

    @Override
    public ReactInstanceManagerBuilder getReactInstanceManagerBuilder() {
      return ReactInstanceManager.builder();
    }
  }

  public static ReactTestFactory getReactTestFactory() {
    Instrumentation inst = InstrumentationRegistry.getInstrumentation();
    if (!(inst instanceof ReactTestFactory)) {
      return new DefaultReactTestFactory();
    }

    return (ReactTestFactory) inst;
  }

  public static ReactTestFactory.ReactInstanceEasyBuilder catalystInstanceBuilder(
      final ReactIntegrationTestCase testCase) {
    final ReactTestFactory.ReactInstanceEasyBuilder builder =
      getReactTestFactory().getCatalystInstanceBuilder();
    ReactTestFactory.ReactInstanceEasyBuilder postBuilder =
      new ReactTestFactory.ReactInstanceEasyBuilder() {
        @Override
        public ReactTestFactory.ReactInstanceEasyBuilder setContext(Context context) {
          builder.setContext(context);
          return this;
        }

        @Override
        public ReactTestFactory.ReactInstanceEasyBuilder addNativeModule(NativeModule module) {
          builder.addNativeModule(module);
          return this;
        }

        @Override
        public CatalystInstance build() {
          final CatalystInstance instance = builder.build();
          testCase.initializeWithInstance(instance);
          instance.runJSBundle();
          InstrumentationRegistry.getInstrumentation().runOnMainSync(new Runnable() {
            @Override
            public void run() {
              ReactChoreographer.initialize();
              instance.initialize();
            }
          });
          testCase.waitForBridgeAndUIIdle();
          return instance;
        }
      };

    postBuilder.setContext(testCase.getContext());
    return postBuilder;
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
    return view.getTag(R.id.react_test_id) instanceof String
      ? (String) view.getTag(R.id.react_test_id)
      : null;
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
        Object tag = getTestId(view);
        return tag != null && tag.equals(tagValue);
      }
    };
  }
}
