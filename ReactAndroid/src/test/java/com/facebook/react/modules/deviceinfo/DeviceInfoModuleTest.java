/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.deviceinfo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;
import static org.powermock.api.mockito.PowerMockito.mockStatic;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import java.util.Arrays;
import java.util.List;
import junit.framework.TestCase;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentCaptor;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

@RunWith(RobolectricTestRunner.class)
@PrepareForTest({Arguments.class, DisplayMetricsHolder.class})
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class DeviceInfoModuleTest extends TestCase {

  @Rule public PowerMockRule rule = new PowerMockRule();

  private DeviceInfoModule mDeviceInfoModule;
  private DeviceEventManagerModule.RCTDeviceEventEmitter mRCTDeviceEventEmitterMock;

  private WritableMap fakePortraitDisplayMetrics;
  private WritableMap fakeLandscapeDisplayMetrics;

  @Before
  public void setUp() {
    initTestData();

    mockStatic(DisplayMetricsHolder.class);

    mRCTDeviceEventEmitterMock = mock(DeviceEventManagerModule.RCTDeviceEventEmitter.class);

    final ReactApplicationContext context =
        spy(new ReactApplicationContext(RuntimeEnvironment.application));
    CatalystInstance catalystInstanceMock = ReactTestHelper.createMockCatalystInstance();
    context.initializeWithInstance(catalystInstanceMock);
    when(context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class))
        .thenReturn(mRCTDeviceEventEmitterMock);

    mDeviceInfoModule = new DeviceInfoModule(context);
  }

  @After
  public void teardown() {
    DisplayMetricsHolder.setWindowDisplayMetrics(null);
    DisplayMetricsHolder.setScreenDisplayMetrics(null);
  }

  @Test
  public void test_itDoesNotEmitAnEvent_whenDisplayMetricsNotChanged() {
    givenDisplayMetricsHolderContains(fakePortraitDisplayMetrics);

    mDeviceInfoModule.getTypedExportedConstants();
    mDeviceInfoModule.emitUpdateDimensionsEvent();

    verifyNoMoreInteractions(mRCTDeviceEventEmitterMock);
  }

  @Test
  public void test_itEmitsOneEvent_whenDisplayMetricsChangedOnce() {
    givenDisplayMetricsHolderContains(fakePortraitDisplayMetrics);

    mDeviceInfoModule.getTypedExportedConstants();
    givenDisplayMetricsHolderContains(fakeLandscapeDisplayMetrics);
    mDeviceInfoModule.emitUpdateDimensionsEvent();

    verifyUpdateDimensionsEventsEmitted(mRCTDeviceEventEmitterMock, fakeLandscapeDisplayMetrics);
  }

  @Test
  public void test_itEmitsJustOneEvent_whenUpdateRequestedMultipleTimes() {
    givenDisplayMetricsHolderContains(fakePortraitDisplayMetrics);
    mDeviceInfoModule.getTypedExportedConstants();
    givenDisplayMetricsHolderContains(fakeLandscapeDisplayMetrics);
    mDeviceInfoModule.emitUpdateDimensionsEvent();
    mDeviceInfoModule.emitUpdateDimensionsEvent();

    verifyUpdateDimensionsEventsEmitted(mRCTDeviceEventEmitterMock, fakeLandscapeDisplayMetrics);
  }

  @Test
  public void test_itEmitsMultipleEvents_whenDisplayMetricsChangedBetweenUpdates() {
    givenDisplayMetricsHolderContains(fakePortraitDisplayMetrics);

    mDeviceInfoModule.getTypedExportedConstants();
    mDeviceInfoModule.emitUpdateDimensionsEvent();
    givenDisplayMetricsHolderContains(fakeLandscapeDisplayMetrics);
    mDeviceInfoModule.emitUpdateDimensionsEvent();
    givenDisplayMetricsHolderContains(fakePortraitDisplayMetrics);
    mDeviceInfoModule.emitUpdateDimensionsEvent();
    givenDisplayMetricsHolderContains(fakeLandscapeDisplayMetrics);
    mDeviceInfoModule.emitUpdateDimensionsEvent();

    verifyUpdateDimensionsEventsEmitted(
        mRCTDeviceEventEmitterMock,
        fakeLandscapeDisplayMetrics,
        fakePortraitDisplayMetrics,
        fakeLandscapeDisplayMetrics);
  }

  private static void givenDisplayMetricsHolderContains(final WritableMap fakeDisplayMetrics) {
    when(DisplayMetricsHolder.getDisplayMetricsWritableMap(1.0)).thenReturn(fakeDisplayMetrics);
  }

  private static void verifyUpdateDimensionsEventsEmitted(
      DeviceEventManagerModule.RCTDeviceEventEmitter emitter, WritableMap... expectedEvents) {
    List<WritableMap> expectedEventList = Arrays.asList(expectedEvents);
    ArgumentCaptor<WritableMap> captor = ArgumentCaptor.forClass(WritableMap.class);
    verify(emitter, times(expectedEventList.size()))
        .emit(eq("didUpdateDimensions"), captor.capture());

    List<WritableMap> actualEvents = captor.getAllValues();
    assertThat(actualEvents).isEqualTo(expectedEventList);
  }

  private void initTestData() {
    mockStatic(Arguments.class);
    when(Arguments.createMap())
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) throws Throwable {
                return new JavaOnlyMap();
              }
            });

    fakePortraitDisplayMetrics = Arguments.createMap();
    fakePortraitDisplayMetrics.putInt("width", 100);
    fakePortraitDisplayMetrics.putInt("height", 200);

    fakeLandscapeDisplayMetrics = Arguments.createMap();
    fakeLandscapeDisplayMetrics.putInt("width", 200);
    fakeLandscapeDisplayMetrics.putInt("height", 100);
  }
}
