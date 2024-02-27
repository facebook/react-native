/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // Suppressing as we want to test RCTEventEmitter here

package com.facebook.react

import android.app.Activity
import android.graphics.Insets
import android.graphics.Rect
import android.view.MotionEvent
import android.view.WindowInsets
import android.view.WindowManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.SystemClock
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.RCTEventEmitter
import java.util.Date
import org.assertj.core.api.Assertions.*
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentCaptor
import org.mockito.ArgumentMatchers
import org.mockito.MockedStatic
import org.mockito.Mockito
import org.mockito.Mockito.*
import org.mockito.Mockito.`when` as whenever
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class RootViewTest {

  private lateinit var reactContext: ReactContext
  private lateinit var catalystInstanceMock: CatalystInstance

  private lateinit var arguments: MockedStatic<Arguments>
  private lateinit var systemClock: MockedStatic<SystemClock>

  @Before
  fun setUp() {
    arguments = Mockito.mockStatic(Arguments::class.java)
    arguments.`when`<WritableArray> { Arguments.createArray() }.thenAnswer { JavaOnlyArray() }
    arguments.`when`<WritableMap> { Arguments.createMap() }.thenAnswer { JavaOnlyMap() }

    val ts = SystemClock.uptimeMillis()
    systemClock = Mockito.mockStatic(SystemClock::class.java)
    systemClock.`when`<Long> { SystemClock.uptimeMillis() }.thenReturn(ts)

    catalystInstanceMock = ReactTestHelper.createMockCatalystInstance()
    reactContext = spy(BridgeReactContext(RuntimeEnvironment.getApplication()))
    reactContext.initialize(catalystInstanceMock)

    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(reactContext)
    val uiManagerModuleMock = mock(UIManagerModule::class.java)
    whenever(catalystInstanceMock.getNativeModule(UIManagerModule::class.java))
        .thenReturn(uiManagerModuleMock)
  }

  @After
  fun tearDown() {
    systemClock.close()
    arguments.close()
  }

  @Test
  fun testTouchEmitter() {
    val instanceManager = mock(ReactInstanceManager::class.java)
    whenever(instanceManager.currentReactContext).thenReturn(reactContext)
    val uiManager = mock(UIManagerModule::class.java)
    val eventDispatcher = mock(EventDispatcher::class.java)
    val eventEmitterModuleMock = mock(RCTEventEmitter::class.java)
    whenever(catalystInstanceMock.getNativeModule(UIManagerModule::class.java))
        .thenReturn(uiManager)
    whenever(uiManager.eventDispatcher).thenReturn(eventDispatcher)

    // RootView IDs is React Native follow the 11, 21, 31, ... progression.
    val rootViewId = 11
    val rootView = ReactRootView(reactContext)
    rootView.id = rootViewId
    rootView.rootViewTag = rootViewId
    rootView.startReactApplication(instanceManager, "")
    rootView.simulateAttachForTesting()
    val ts = SystemClock.currentTimeMillis()

    // Test ACTION_DOWN event
    rootView.onTouchEvent(MotionEvent.obtain(100, ts, MotionEvent.ACTION_DOWN, 0f, 0f, 0))

    val downEventCaptor = ArgumentCaptor.forClass(Event::class.java)
    verify(eventDispatcher).dispatchEvent(downEventCaptor.capture())
    verifyNoMoreInteractions(eventDispatcher)
    downEventCaptor.value.dispatch(eventEmitterModuleMock)
    val downActionTouchesArgCaptor = ArgumentCaptor.forClass(JavaOnlyArray::class.java)
    verify(eventEmitterModuleMock)
        .receiveTouches(
            ArgumentMatchers.eq("topTouchStart"),
            downActionTouchesArgCaptor.capture(),
            ArgumentMatchers.any(JavaOnlyArray::class.java))
    verifyNoMoreInteractions(eventEmitterModuleMock)
    assertThat(downActionTouchesArgCaptor.value.size()).isEqualTo(1)
    assertThat(downActionTouchesArgCaptor.value.getMap(0))
        .isEqualTo(
            JavaOnlyMap.of(
                "pageX",
                0.0,
                "pageY",
                0.0,
                "locationX",
                0.0,
                "locationY",
                0.0,
                "target",
                rootViewId,
                "timestamp",
                ts.toDouble(),
                "identifier",
                0.0,
                "targetSurface",
                -1))

    // Test ACTION_UP event
    reset(eventEmitterModuleMock, eventDispatcher)
    val upEventCaptor = ArgumentCaptor.forClass(Event::class.java)
    val upActionTouchesArgCaptor = ArgumentCaptor.forClass(JavaOnlyArray::class.java)

    rootView.onTouchEvent(MotionEvent.obtain(50, ts, MotionEvent.ACTION_UP, 0f, 0f, 0))

    verify(eventDispatcher).dispatchEvent(upEventCaptor.capture())
    verifyNoMoreInteractions(eventDispatcher)
    upEventCaptor.value.dispatch(eventEmitterModuleMock)
    verify(eventEmitterModuleMock)
        .receiveTouches(
            ArgumentMatchers.eq("topTouchEnd"),
            upActionTouchesArgCaptor.capture(),
            ArgumentMatchers.any(WritableArray::class.java))
    verifyNoMoreInteractions(eventEmitterModuleMock)
    assertThat(upActionTouchesArgCaptor.value.size()).isEqualTo(1)
    assertThat(upActionTouchesArgCaptor.value.getMap(0))
        .isEqualTo(
            JavaOnlyMap.of(
                "pageX",
                0.0,
                "pageY",
                0.0,
                "locationX",
                0.0,
                "locationY",
                0.0,
                "target",
                rootViewId,
                "timestamp",
                ts.toDouble(),
                "identifier",
                0.0,
                "targetSurface",
                -1))

    // Test other action
    reset(eventDispatcher)

    rootView.onTouchEvent(
        MotionEvent.obtain(50, Date().time, MotionEvent.ACTION_HOVER_MOVE, 0f, 0f, 0))

    verifyNoMoreInteractions(eventDispatcher)
  }

  @Test
  fun testRemountApplication() {
    val instanceManager = mock(ReactInstanceManager::class.java)
    val rootView = ReactRootView(reactContext)
    rootView.startReactApplication(instanceManager, "")
    rootView.unmountReactApplication()
    rootView.startReactApplication(instanceManager, "")
  }

  @Test
  fun testCheckForKeyboardEvents() {
    val instanceManager = mock(ReactInstanceManager::class.java)
    val activity = Robolectric.buildActivity(Activity::class.java).create().get()
    whenever(instanceManager.currentReactContext).thenReturn(reactContext)
    val rootView: ReactRootView =
        object : ReactRootView(activity) {
          override fun getWindowVisibleDisplayFrame(outRect: Rect) {
            if (outRect.bottom == 0) {
              outRect.bottom += 100
              outRect.right += 370
            } else {
              outRect.bottom += 370
            }
          }

          override fun getRootWindowInsets() =
              WindowInsets.Builder()
                  .setInsets(WindowInsets.Type.ime(), Insets.of(0, 0, 0, 370))
                  .setVisible(WindowInsets.Type.ime(), true)
                  .build()
        }
    val rootViewSpy = spy(rootView)
    whenever(rootViewSpy.getLayoutParams()).thenReturn(WindowManager.LayoutParams())

    rootViewSpy.startReactApplication(instanceManager, "")
    rootViewSpy.simulateCheckForKeyboardForTesting()

    val params = Arguments.createMap()
    val endCoordinates = Arguments.createMap()
    val screenHeight = 470.0
    val keyboardHeight = 100.0
    params.putDouble("duration", 0.0)
    endCoordinates.putDouble("width", screenHeight - keyboardHeight)
    endCoordinates.putDouble("screenX", 0.0)
    endCoordinates.putDouble("height", screenHeight - keyboardHeight)
    endCoordinates.putDouble("screenY", keyboardHeight)
    params.putMap("endCoordinates", endCoordinates)
    params.putString("easing", "keyboard")
    verify(reactContext, times(1)).emitDeviceEvent("keyboardDidShow", params)
  }
}
