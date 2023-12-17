/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime;

import static android.os.Looper.getMainLooper;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.MockitoAnnotations.initMocks;
import static org.robolectric.Shadows.shadowOf;

import android.app.Activity;
import com.facebook.react.MemoryPressureRouter;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.MemoryPressureListener;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.devsupport.interfaces.PackagerStatusCallback;
import com.facebook.react.fabric.ComponentFactory;
import com.facebook.react.interfaces.TaskInterface;
import com.facebook.react.runtime.internal.bolts.TaskCompletionSource;
import com.facebook.react.uimanager.events.BlackHoleEventDispatcher;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.testutils.shadows.ShadowSoLoader;
import java.util.concurrent.TimeUnit;
import org.junit.Before;
import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.LooperMode;

/** Tests {@linkcom.facebook.react.runtime.ReactHostImpl} */
@Ignore("Ignore for now as these tests fail in OSS only")
@RunWith(RobolectricTestRunner.class)
@Config(shadows = ShadowSoLoader.class)
@LooperMode(LooperMode.Mode.PAUSED)
public class ReactHostTest {

  private ReactHostDelegate mReactHostDelegate;
  private ReactInstance mReactInstance;
  private MemoryPressureRouter mMemoryPressureRouter;
  private BridgelessDevSupportManager mDevSupportManager;
  private JSBundleLoader mJSBundleLoader;
  private ReactHostImpl mReactHost;
  private ActivityController<Activity> mActivityController;
  private ComponentFactory mComponentFactory;
  private BridgelessReactContext mBridgelessReactContext;

  @Before
  public void setUp() throws Exception {
    initMocks(this);

    mActivityController = Robolectric.buildActivity(Activity.class).create().start().resume();

    mReactHostDelegate = mock(ReactHostDelegate.class);
    mReactInstance = mock(ReactInstance.class);
    mMemoryPressureRouter = mock(MemoryPressureRouter.class);
    mDevSupportManager = mock(BridgelessDevSupportManager.class);
    mJSBundleLoader = mock(JSBundleLoader.class);
    mComponentFactory = mock(ComponentFactory.class);
    mBridgelessReactContext = mock(BridgelessReactContext.class);

    // TODO This should be replaced with proper mocking once this test is un-ignored
    //  whenNew(ReactInstance.class).withAnyArguments().thenReturn(mReactInstance);
    //
    // whenNew(BridgelessReactContext.class).withAnyArguments().thenReturn(mBridgelessReactContext);
    //  whenNew(MemoryPressureRouter.class).withAnyArguments().thenReturn(mMemoryPressureRouter);
    //
    // whenNew(BridgelessDevSupportManager.class).withAnyArguments().thenReturn(mDevSupportManager);

    doReturn(mJSBundleLoader).when(mReactHostDelegate).getJsBundleLoader();

    mReactHost =
        new ReactHostImpl(
            mActivityController.get().getApplication(),
            mReactHostDelegate,
            mComponentFactory,
            false,
            null,
            false);

    TaskCompletionSource<Boolean> taskCompletionSource = new TaskCompletionSource<>();
    taskCompletionSource.setResult(true);
    // TODO This should be replaced with proper mocking once this test is un-ignored
    //  whenNew(TaskCompletionSource.class).withAnyArguments().thenReturn(taskCompletionSource);
  }

  @Test
  public void getEventDispatcher_returnsBlackHoleEventDispatcher() {
    EventDispatcher eventDispatcher = mReactHost.getEventDispatcher();
    assertThat(eventDispatcher).isInstanceOf(BlackHoleEventDispatcher.class);
  }

  @Test
  public void getUIManager_returnsNullIfNoInstance() {
    UIManager uiManager = mReactHost.getUIManager();
    assertThat(uiManager).isNull();
  }

  @Test
  public void testGetDevSupportManager() {
    assertThat(mReactHost.getDevSupportManager()).isEqualTo(mDevSupportManager);
  }

  @Test
  public void testStart() throws Exception {
    doNothing().when(mDevSupportManager).isPackagerRunning(any(PackagerStatusCallback.class));
    assertThat(mReactHost.isInstanceInitialized()).isFalse();

    waitForTaskUIThread(mReactHost.start());

    assertThat(mReactHost.isInstanceInitialized()).isTrue();
    assertThat(mReactHost.getCurrentReactContext()).isNotNull();
    verify(mMemoryPressureRouter).addMemoryPressureListener((MemoryPressureListener) any());
  }

  private void startReactHost() throws Exception {
    waitForTaskUIThread(mReactHost.start());
  }

  @Test
  public void testDestroy() throws Exception {
    startReactHost();

    waitForTaskUIThread(mReactHost.destroy("Destroying from testing infra", null));
    assertThat(mReactHost.isInstanceInitialized()).isFalse();
    assertThat(mReactHost.getCurrentReactContext()).isNull();
  }

  @Test
  public void testReload() throws Exception {
    startReactHost();

    ReactContext oldReactContext = mReactHost.getCurrentReactContext();
    BridgelessReactContext newReactContext = mock(BridgelessReactContext.class);
    assertThat(newReactContext).isNotEqualTo(oldReactContext);
    // TODO This should be replaced with proper mocking once this test is un-ignored
    //  whenNew(BridgelessReactContext.class).withAnyArguments().thenReturn(newReactContext);

    waitForTaskUIThread(mReactHost.reload("Reload from testing infra"));

    assertThat(mReactHost.isInstanceInitialized()).isTrue();
    assertThat(mReactHost.getCurrentReactContext()).isNotNull();
    assertThat(mReactHost.getCurrentReactContext()).isEqualTo(newReactContext);
    assertThat(mReactHost.getCurrentReactContext()).isNotEqualTo(oldReactContext);
  }

  @Test
  public void testLifecycleStateChanges() throws Exception {
    startReactHost();

    assertThat(mReactHost.getLifecycleState()).isEqualTo(LifecycleState.BEFORE_CREATE);
    mReactHost.onHostResume(mActivityController.get());
    assertThat(mReactHost.getLifecycleState()).isEqualTo(LifecycleState.RESUMED);
    mReactHost.onHostPause(mActivityController.get());
    assertThat(mReactHost.getLifecycleState()).isEqualTo(LifecycleState.BEFORE_RESUME);
    mReactHost.onHostDestroy(mActivityController.get());
    assertThat(mReactHost.getLifecycleState()).isEqualTo(LifecycleState.BEFORE_CREATE);
  }

  private static <T> void waitForTaskUIThread(TaskInterface<T> task) throws InterruptedException {
    boolean isTaskCompleted = false;
    while (!isTaskCompleted) {
      if (!task.waitForCompletion(4, TimeUnit.MILLISECONDS)) {
        shadowOf(getMainLooper()).idle();
      } else {
        if (task.isCancelled() || task.isFaulted()) {
          throw new RuntimeException("Task was cancelled or faulted. Error: " + task.getError());
        }
        isTaskCompleted = true;
      }
    }
  }
}
