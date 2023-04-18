/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridgeless;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.MockitoAnnotations.initMocks;
import static org.powermock.api.mockito.PowerMockito.whenNew;

import android.app.Activity;
import com.facebook.react.MemoryPressureRouter;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.MemoryPressureListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.bridgeless.internal.bolts.TaskCompletionSource;
import com.facebook.react.devsupport.interfaces.PackagerStatusCallback;
import com.facebook.react.fabric.ComponentFactory;
import com.facebook.react.uimanager.events.BlackHoleEventDispatcher;
import com.facebook.react.uimanager.events.EventDispatcher;
import org.junit.Before;
import org.junit.Ignore;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentMatchers;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.core.classloader.annotations.SuppressStaticInitializationFor;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.android.controller.ActivityController;

/** Tests {@linkcom.facebook.react.bridgeless.ReactHost} */
@SuppressStaticInitializationFor("com.facebook.react.fabric.ComponentFactory")
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({
  "org.mockito.*",
  "org.robolectric.*",
  "android.*",
  "androidx.*",
  "javax.net.ssl.*"
})
@PrepareForTest({ReactHost.class, ComponentFactory.class})
@Ignore("Ignore for now as these tests fail in OSS only")
public class ReactHostTest {

  private ReactInstanceDelegate mReactInstanceDelegate;
  private ReactInstance mReactInstance;
  private MemoryPressureRouter mMemoryPressureRouter;
  private BridgelessDevSupportManager mDevSupportManager;
  private JSBundleLoader mJSBundleLoader;
  private ReactHost mReactHost;
  private ActivityController<Activity> mActivityController;
  private ComponentFactory mComponentFactory;

  @Rule public PowerMockRule rule = new PowerMockRule();

  @Before
  public void setUp() throws Exception {
    initMocks(this);

    mActivityController = Robolectric.buildActivity(Activity.class).create().start().resume();

    mReactInstanceDelegate = mock(ReactInstanceDelegate.class);
    mReactInstance = mock(ReactInstance.class);
    mMemoryPressureRouter = mock(MemoryPressureRouter.class);
    mDevSupportManager = mock(BridgelessDevSupportManager.class);
    mJSBundleLoader = mock(JSBundleLoader.class);
    mComponentFactory = mock(ComponentFactory.class);

    whenNew(ReactInstance.class).withAnyArguments().thenReturn(mReactInstance);
    whenNew(MemoryPressureRouter.class).withAnyArguments().thenReturn(mMemoryPressureRouter);
    whenNew(BridgelessDevSupportManager.class).withAnyArguments().thenReturn(mDevSupportManager);

    doReturn(mJSBundleLoader)
        .when(mReactInstanceDelegate)
        .getJSBundleLoader(ArgumentMatchers.<ReactApplicationContext>any());

    mReactHost =
        new ReactHost(
            mActivityController.get().getApplication(),
            mReactInstanceDelegate,
            mComponentFactory,
            false,
            null,
            false);
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

  @Ignore("FIXME")
  public void testGetDevSupportManager() {
    assertThat(mReactHost.getDevSupportManager()).isEqualTo(mDevSupportManager);
  }

  @Ignore("waitForCompletion is locking the test thread making the entire venice tests to timeout")
  public void testPreload() throws Exception {
    TaskCompletionSource<Boolean> taskCompletionSource = new TaskCompletionSource<>();
    taskCompletionSource.setResult(true);
    whenNew(TaskCompletionSource.class).withAnyArguments().thenReturn(taskCompletionSource);
    doNothing().when(mDevSupportManager).isPackagerRunning(any(PackagerStatusCallback.class));

    assertThat(mReactHost.isInstanceInitialized()).isFalse();

    mReactHost.preload().waitForCompletion();

    assertThat(mReactHost.isInstanceInitialized()).isTrue();
    assertThat(mReactHost.getCurrentReactContext()).isNotNull();
    verify(mMemoryPressureRouter).addMemoryPressureListener((MemoryPressureListener) any());
  }
}
