/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import android.app.Activity
import android.os.Looper
import com.facebook.react.MemoryPressureRouter
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.MemoryPressureListener
import com.facebook.react.bridge.UIManager
import com.facebook.react.common.LifecycleState
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.devsupport.ReleaseDevSupportManager
import com.facebook.react.devsupport.interfaces.PackagerStatusCallback
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.interfaces.TaskInterface
import com.facebook.react.runtime.internal.bolts.TaskCompletionSource
import com.facebook.react.uimanager.events.BlackHoleEventDispatcher
import com.facebook.testutils.shadows.ShadowSoLoader
import java.util.concurrent.TimeUnit
import org.assertj.core.api.Assertions
import org.junit.After
import org.junit.Before
import org.junit.Ignore
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentMatchers
import org.mockito.MockedConstruction
import org.mockito.Mockito
import org.mockito.Mockito.withSettings
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows
import org.robolectric.android.controller.ActivityController
import org.robolectric.annotation.Config
import org.robolectric.annotation.LooperMode

/** Tests [ReactHostImpl] */
@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
@LooperMode(LooperMode.Mode.PAUSED)
@OptIn(UnstableReactNativeAPI::class)
class ReactHostTest {
  private lateinit var reactHostDelegate: ReactHostDelegate
  private lateinit var reactInstance: ReactInstance
  private lateinit var memoryPressureRouter: MemoryPressureRouter
  private lateinit var jSBundleLoader: JSBundleLoader
  private lateinit var reactHost: ReactHostImpl
  private lateinit var activityController: ActivityController<Activity>
  private lateinit var componentFactory: ComponentFactory
  private lateinit var bridgelessReactContext: BridgelessReactContext

  private lateinit var mockedReactInstanceCtor: MockedConstruction<ReactInstance>
  private lateinit var mockedReactHostInspectorTargetCtor:
      MockedConstruction<ReactHostInspectorTarget>
  private lateinit var mockedDevSupportManagerCtor: MockedConstruction<BridgelessDevSupportManager>
  private lateinit var mockedBridgelessReactContextCtor: MockedConstruction<BridgelessReactContext>
  private lateinit var mockedMemoryPressureRouterCtor: MockedConstruction<MemoryPressureRouter>
  private lateinit var mockedTaskCompletionSourceCtor: MockedConstruction<TaskCompletionSource<*>>

  @Before
  fun setUp() {
    activityController = Robolectric.buildActivity(Activity::class.java).create().start().resume()

    reactHostDelegate = Mockito.mock(ReactHostDelegate::class.java)
    reactInstance = Mockito.mock(ReactInstance::class.java)
    memoryPressureRouter = Mockito.mock(MemoryPressureRouter::class.java)
    jSBundleLoader = Mockito.mock(JSBundleLoader::class.java)
    componentFactory = Mockito.mock(ComponentFactory::class.java)
    bridgelessReactContext = Mockito.mock(BridgelessReactContext::class.java)

    mockedReactInstanceCtor = Mockito.mockConstruction(ReactInstance::class.java)
    mockedReactHostInspectorTargetCtor =
        Mockito.mockConstruction(ReactHostInspectorTarget::class.java)
    mockedDevSupportManagerCtor = Mockito.mockConstruction(BridgelessDevSupportManager::class.java)
    mockedBridgelessReactContextCtor = Mockito.mockConstruction(BridgelessReactContext::class.java)
    mockedMemoryPressureRouterCtor = Mockito.mockConstruction(MemoryPressureRouter::class.java)

    Mockito.doReturn(jSBundleLoader).`when`(reactHostDelegate).jsBundleLoader
    reactHost =
        ReactHostImpl(
            activityController.get().application, reactHostDelegate, componentFactory, false, false)
    val taskCompletionSource = TaskCompletionSource<Boolean>().apply { setResult(true) }
    mockedTaskCompletionSourceCtor =
        Mockito.mockConstruction(
            TaskCompletionSource::class.java, withSettings().useConstructor(taskCompletionSource))
  }

  @After
  fun tearDown() {
    mockedReactInstanceCtor.close()
    mockedReactHostInspectorTargetCtor.close()
    mockedDevSupportManagerCtor.close()
    mockedBridgelessReactContextCtor.close()
    mockedMemoryPressureRouterCtor.close()
    mockedTaskCompletionSourceCtor.close()
  }

  @Test
  fun getEventDispatcher_returnsBlackHoleEventDispatcher() {
    val eventDispatcher = reactHost.eventDispatcher
    Assertions.assertThat(eventDispatcher).isInstanceOf(BlackHoleEventDispatcher::class.java)
  }

  @Test
  fun getUIManager_returnsNullIfNoInstance() {
    val uiManager: UIManager? = reactHost.uiManager
    Assertions.assertThat(uiManager).isNull()
  }

  @Test
  fun testGetDevSupportManager() {
    // BridgelessDevSupportManager is created only for debug
    // we check if it was instantiated or if ReleaseDevSupportManager was created (for release).
    if (mockedDevSupportManagerCtor.constructed().isNotEmpty()) {
      val devSupportManager = mockedDevSupportManagerCtor.constructed().first()
      Assertions.assertThat(reactHost.devSupportManager).isEqualTo(devSupportManager)
    } else {
      Assertions.assertThat(reactHost.devSupportManager)
          .isInstanceOf(ReleaseDevSupportManager::class.java)
    }
  }

  @Test
  @Ignore("Test is currently failing in OSS and needs to be looked into")
  fun testStart() {
    val devSupportManager = mockedDevSupportManagerCtor.constructed().first()

    Mockito.doNothing()
        .`when`(devSupportManager)
        .isPackagerRunning(ArgumentMatchers.any(PackagerStatusCallback::class.java))
    Assertions.assertThat(reactHost.isInstanceInitialized).isFalse()
    waitForTaskUIThread(reactHost.start())
    Assertions.assertThat(reactHost.isInstanceInitialized).isTrue()
    Assertions.assertThat(reactHost.currentReactContext).isNotNull()
    Mockito.verify(memoryPressureRouter)
        .addMemoryPressureListener(ArgumentMatchers.any<Any>() as MemoryPressureListener)
  }

  @Test
  @Ignore("Test is currently failing in OSS and needs to be looked into")
  fun testDestroy() {
    startReactHost()
    waitForTaskUIThread(reactHost.destroy("Destroying from testing infra", null))
    Assertions.assertThat(reactHost.isInstanceInitialized).isFalse()
    Assertions.assertThat(reactHost.currentReactContext).isNull()
  }

  @Test
  @Ignore("Test is currently failing in OSS and needs to be looked into")
  fun testReload() {
    startReactHost()
    val oldReactContext = reactHost.currentReactContext
    val newReactContext = Mockito.mock(BridgelessReactContext::class.java)
    Assertions.assertThat(newReactContext).isNotEqualTo(oldReactContext)
    // TODO This should be replaced with proper mocking once this test is un-ignored
    //  whenNew(BridgelessReactContext.class).withAnyArguments().thenReturn(newReactContext);
    waitForTaskUIThread(reactHost.reload("Reload from testing infra"))
    Assertions.assertThat(reactHost.isInstanceInitialized).isTrue()
    Assertions.assertThat(reactHost.currentReactContext).isNotNull()
    Assertions.assertThat(reactHost.currentReactContext).isEqualTo(newReactContext)
    Assertions.assertThat(reactHost.currentReactContext).isNotEqualTo(oldReactContext)
  }

  @Test
  @Ignore("Test is currently failing in OSS and needs to be looked into")
  fun testLifecycleStateChanges() {
    startReactHost()
    Assertions.assertThat(reactHost.lifecycleState).isEqualTo(LifecycleState.BEFORE_CREATE)
    reactHost.onHostResume(activityController.get())
    Assertions.assertThat(reactHost.lifecycleState).isEqualTo(LifecycleState.RESUMED)
    reactHost.onHostPause(activityController.get())
    Assertions.assertThat(reactHost.lifecycleState).isEqualTo(LifecycleState.BEFORE_RESUME)
    reactHost.onHostDestroy(activityController.get())
    Assertions.assertThat(reactHost.lifecycleState).isEqualTo(LifecycleState.BEFORE_CREATE)
  }

  private fun startReactHost() {
    waitForTaskUIThread(reactHost.start())
  }

  companion object {
    @Throws(InterruptedException::class)
    private fun <T> waitForTaskUIThread(task: TaskInterface<T>) {
      var isTaskCompleted = false
      while (!isTaskCompleted) {
        if (!task.waitForCompletion(4, TimeUnit.MILLISECONDS)) {
          Shadows.shadowOf(Looper.getMainLooper()).idle()
        } else {
          if (task.isCancelled() || task.isFaulted()) {
            throw RuntimeException("Task was cancelled or faulted. Error: " + task.getError())
          }
          isTaskCompleted = true
        }
      }
    }
  }
}
