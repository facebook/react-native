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
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

import android.app.Application;
import android.support.test.InstrumentationRegistry;
import android.test.AndroidTestCase;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.SoftAssertions;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.ApplicationHolder;
import com.facebook.react.common.futures.SimpleSettableFuture;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.modules.core.Timing;
import com.facebook.soloader.SoLoader;

import static org.mockito.Mockito.mock;

/**
 * Use this class for writing integration tests of catalyst. This class will run all JNI call
 * within separate android looper, thus you don't need to care about starting your own looper.
 *
 * Keep in mind that all JS remote method calls and script load calls are asynchronous and you
 * should not expect them to return results immediately.
 *
 * In order to write catalyst integration:
 *  1) Make {@link ReactIntegrationTestCase} a base class of your test case
 *  2) Use {@link ReactTestHelper#catalystInstanceBuilder()}
 *  instead of {@link com.facebook.react.bridge.CatalystInstanceImpl.Builder} to build catalyst
 *  instance for testing purposes
 *
 */
public abstract class ReactIntegrationTestCase extends AndroidTestCase {

  // we need a bigger timeout for CI builds because they run on a slow emulator
  private static final long IDLE_TIMEOUT_MS = 60000;

  private @Nullable CatalystInstance mInstance;
  private @Nullable ReactBridgeIdleSignaler mBridgeIdleSignaler;
  private @Nullable ReactApplicationContext mReactContext;

  @Override
  public ReactApplicationContext getContext() {
    if (mReactContext == null) {
      mReactContext = new ReactApplicationContext(super.getContext());
      Assertions.assertNotNull(mReactContext);
    }

    return mReactContext;
  }

  public void shutDownContext() {
    if (mInstance != null) {
      final ReactContext contextToDestroy = mReactContext;
      mReactContext = null;
      mInstance = null;

      final SimpleSettableFuture<Void> semaphore = new SimpleSettableFuture<>();
      UiThreadUtil.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          if (contextToDestroy != null) {
            contextToDestroy.destroy();
          }
          semaphore.set(null);
        }
      });
      semaphore.getOrThrow();
    }
  }

  /**
   * This method isn't safe since it doesn't factor in layout-only view removal. Use
   * {@link #getViewByTestId} instead.
   */
  @Deprecated
  public <T extends View> T getViewAtPath(ViewGroup rootView, int... path) {
    return ReactTestHelper.getViewAtPath(rootView, path);
  }

  public <T extends View> T getViewByTestId(ViewGroup rootView, String testID) {
    return (T) ReactTestHelper.getViewWithReactTestId(rootView, testID);
  }

  public static class Event {
    private final CountDownLatch mLatch;

    public Event() {
      this(1);
    }

    public Event(int counter) {
      mLatch = new CountDownLatch(counter);
    }

    public void occur() {
      mLatch.countDown();
    }

    public boolean didOccur() {
      return mLatch.getCount() == 0;
    }

    public boolean await(long millis) {
      try {
        return mLatch.await(millis, TimeUnit.MILLISECONDS);
      } catch (InterruptedException ignore) {
        return false;
      }
    }
  }

  /**
   * Timing module needs to be created on the main thread so that it gets the correct Choreographer.
   */
  protected Timing createTimingModule() {
    final SimpleSettableFuture<Timing> simpleSettableFuture = new SimpleSettableFuture<Timing>();
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            Timing timing = new Timing(getContext(), mock(DevSupportManager.class));
            simpleSettableFuture.set(timing);
          }
        });
    try {
      return simpleSettableFuture.get(5000, TimeUnit.MILLISECONDS);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  public void initializeWithInstance(CatalystInstance instance) {
    mInstance = instance;
    mBridgeIdleSignaler = new ReactBridgeIdleSignaler();
    mInstance.addBridgeIdleDebugListener(mBridgeIdleSignaler);
    getContext().initializeWithInstance(mInstance);
  }

  public boolean waitForBridgeIdle(long millis) {
    return Assertions.assertNotNull(mBridgeIdleSignaler).waitForIdle(millis);
  }

  public void waitForIdleSync() {
    InstrumentationRegistry.getInstrumentation().waitForIdleSync();
  }

  public void waitForBridgeAndUIIdle() {
    ReactIdleDetectionUtil.waitForBridgeAndUIIdle(
        Assertions.assertNotNull(mBridgeIdleSignaler),
        getContext(),
        IDLE_TIMEOUT_MS);
  }

  @Override
  protected void setUp() throws Exception {
    super.setUp();
    SoLoader.init(getContext(), /* native exopackage */ false);
    ApplicationHolder.setApplication((Application) getContext().getApplicationContext());
  }

  @Override
  protected void tearDown() throws Exception {
    super.tearDown();
    shutDownContext();
  }

  protected static void initializeJavaModule(final BaseJavaModule javaModule) {
    final Semaphore semaphore = new Semaphore(0);
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            javaModule.initialize();
            if (javaModule instanceof LifecycleEventListener) {
              ((LifecycleEventListener) javaModule).onHostResume();
            }
            semaphore.release();
          }
        });
    try {
      SoftAssertions.assertCondition(
          semaphore.tryAcquire(5000, TimeUnit.MILLISECONDS),
          "Timed out initializing timing module");
    } catch (InterruptedException e) {
      throw new RuntimeException(e);
    }
  }
}
