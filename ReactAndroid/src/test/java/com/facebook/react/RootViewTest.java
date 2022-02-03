/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import android.graphics.Rect;
import android.view.MotionEvent;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.SystemClock;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import java.util.Date;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

@PrepareForTest({Arguments.class, SystemClock.class})
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class RootViewTest {

  @Rule public PowerMockRule rule = new PowerMockRule();

  private ReactContext mReactContext;
  private CatalystInstance mCatalystInstanceMock;

  @Before
  public void setUp() {
    final long ts = SystemClock.uptimeMillis();
    PowerMockito.mockStatic(Arguments.class);
    PowerMockito.when(Arguments.createArray())
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) throws Throwable {
                return new JavaOnlyArray();
              }
            });
    PowerMockito.when(Arguments.createMap())
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) throws Throwable {
                return new JavaOnlyMap();
              }
            });
    PowerMockito.mockStatic(SystemClock.class);
    PowerMockito.when(SystemClock.uptimeMillis())
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) throws Throwable {
                return ts;
              }
            });

    mCatalystInstanceMock = ReactTestHelper.createMockCatalystInstance();
    mReactContext = new ReactApplicationContext(RuntimeEnvironment.application);
    mReactContext.initializeWithInstance(mCatalystInstanceMock);
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(mReactContext);

    UIManagerModule uiManagerModuleMock = mock(UIManagerModule.class);
    when(mCatalystInstanceMock.getNativeModule(UIManagerModule.class))
        .thenReturn(uiManagerModuleMock);
  }

  @Test
  public void testTouchEmitter() {
    ReactInstanceManager instanceManager = mock(ReactInstanceManager.class);
    when(instanceManager.getCurrentReactContext()).thenReturn(mReactContext);

    UIManagerModule uiManager = mock(UIManagerModule.class);
    EventDispatcher eventDispatcher = mock(EventDispatcher.class);
    RCTEventEmitter eventEmitterModuleMock = mock(RCTEventEmitter.class);
    when(mCatalystInstanceMock.getNativeModule(UIManagerModule.class)).thenReturn(uiManager);
    when(uiManager.getEventDispatcher()).thenReturn(eventDispatcher);

    int rootViewId = 7;

    ReactRootView rootView = new ReactRootView(mReactContext);
    rootView.setId(rootViewId);
    rootView.setRootViewTag(rootViewId);
    rootView.startReactApplication(instanceManager, "");
    rootView.simulateAttachForTesting();

    long ts = SystemClock.currentTimeMillis();

    // Test ACTION_DOWN event
    rootView.onTouchEvent(MotionEvent.obtain(100, ts, MotionEvent.ACTION_DOWN, 0, 0, 0));

    ArgumentCaptor<Event> downEventCaptor = ArgumentCaptor.forClass(Event.class);
    verify(eventDispatcher).dispatchEvent(downEventCaptor.capture());
    verifyNoMoreInteractions(eventDispatcher);

    downEventCaptor.getValue().dispatch(eventEmitterModuleMock);

    ArgumentCaptor<JavaOnlyArray> downActionTouchesArgCaptor =
        ArgumentCaptor.forClass(JavaOnlyArray.class);
    verify(eventEmitterModuleMock)
        .receiveTouches(
            eq("topTouchStart"), downActionTouchesArgCaptor.capture(), any(JavaOnlyArray.class));
    verifyNoMoreInteractions(eventEmitterModuleMock);

    assertThat(downActionTouchesArgCaptor.getValue().size()).isEqualTo(1);
    assertThat(downActionTouchesArgCaptor.getValue().getMap(0))
        .isEqualTo(
            JavaOnlyMap.of(
                "pageX",
                0.,
                "pageY",
                0.,
                "locationX",
                0.,
                "locationY",
                0.,
                "target",
                rootViewId,
                "timestamp",
                (double) ts,
                "identifier",
                0.,
                "targetSurface",
                -1));

    // Test ACTION_UP event
    reset(eventEmitterModuleMock, eventDispatcher);

    ArgumentCaptor<Event> upEventCaptor = ArgumentCaptor.forClass(Event.class);
    ArgumentCaptor<JavaOnlyArray> upActionTouchesArgCaptor =
        ArgumentCaptor.forClass(JavaOnlyArray.class);

    rootView.onTouchEvent(MotionEvent.obtain(50, ts, MotionEvent.ACTION_UP, 0, 0, 0));
    verify(eventDispatcher).dispatchEvent(upEventCaptor.capture());
    verifyNoMoreInteractions(eventDispatcher);

    upEventCaptor.getValue().dispatch(eventEmitterModuleMock);
    verify(eventEmitterModuleMock)
        .receiveTouches(
            eq("topTouchEnd"), upActionTouchesArgCaptor.capture(), any(WritableArray.class));
    verifyNoMoreInteractions(eventEmitterModuleMock);

    assertThat(upActionTouchesArgCaptor.getValue().size()).isEqualTo(1);
    assertThat(upActionTouchesArgCaptor.getValue().getMap(0))
        .isEqualTo(
            JavaOnlyMap.of(
                "pageX",
                0.,
                "pageY",
                0.,
                "locationX",
                0.,
                "locationY",
                0.,
                "target",
                rootViewId,
                "timestamp",
                (double) ts,
                "identifier",
                0.,
                "targetSurface",
                -1));

    // Test other action
    reset(eventDispatcher);
    rootView.onTouchEvent(
        MotionEvent.obtain(50, new Date().getTime(), MotionEvent.ACTION_HOVER_MOVE, 0, 0, 0));
    verifyNoMoreInteractions(eventDispatcher);
  }

  @Test
  public void testRemountApplication() {
    ReactInstanceManager instanceManager = mock(ReactInstanceManager.class);

    ReactRootView rootView = new ReactRootView(mReactContext);

    rootView.startReactApplication(instanceManager, "");
    rootView.unmountReactApplication();
    rootView.startReactApplication(instanceManager, "");
  }

  @Test
  public void testCheckForKeyboardEvents() {
    ReactInstanceManager instanceManager = mock(ReactInstanceManager.class);
    RCTDeviceEventEmitter eventEmitterModuleMock = mock(RCTDeviceEventEmitter.class);

    when(instanceManager.getCurrentReactContext()).thenReturn(mReactContext);
    when(mReactContext.getJSModule(RCTDeviceEventEmitter.class)).thenReturn(eventEmitterModuleMock);

    ReactRootView rootView =
        new ReactRootView(mReactContext) {
          @Override
          public void getWindowVisibleDisplayFrame(Rect outRect) {
            if (outRect.bottom == 0) {
              outRect.bottom += 100;
              outRect.right += 370;
            } else {
              outRect.bottom += 370;
            }
          }
        };

    rootView.startReactApplication(instanceManager, "");
    rootView.simulateCheckForKeyboardForTesting();

    WritableMap params = Arguments.createMap();
    WritableMap endCoordinates = Arguments.createMap();
    double screenHeight = 470.0;
    double keyboardHeight = 100.0;
    params.putDouble("duration", 0.0);
    endCoordinates.putDouble("width", screenHeight - keyboardHeight);
    endCoordinates.putDouble("screenX", 0.0);
    endCoordinates.putDouble("height", screenHeight - keyboardHeight);
    endCoordinates.putDouble("screenY", keyboardHeight);
    params.putMap("endCoordinates", endCoordinates);
    params.putString("easing", "keyboard");

    verify(eventEmitterModuleMock, Mockito.times(1)).emit("keyboardDidShow", params);
  }
}
