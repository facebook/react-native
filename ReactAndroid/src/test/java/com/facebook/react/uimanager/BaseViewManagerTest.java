/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import android.content.Context;
import android.content.res.Resources;
import android.view.View;

import com.facebook.csslayout.Spacing;
import com.facebook.react.common.TestIdUtil;

import org.junit.After;
import org.junit.Before;
import org.junit.FixMethodOrder;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.MethodSorters;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.verification.VerificationMode;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

import static org.junit.Assert.assertEquals;
import static org.mockito.AdditionalMatchers.not;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyFloat;
import static org.mockito.Matchers.anyInt;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyZeroInteractions;
import static org.mockito.Mockito.when;
import static org.mockito.internal.verification.VerificationModeFactory.calls;

@Config(manifest= Config.NONE)
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class BaseViewManagerTest {

  @Mock
  Resources resources;
  @Mock
  Context context;
  @Mock
  private View view;
  private BaseViewManager<View, LayoutShadowNode> sut;

  private final String testID = "some-test-id";
  private final int mappedTestID = 23457897;
  private final String myPackage = "com.myApp";


  @Before
  public void setup() {
    MockitoAnnotations.initMocks(this);
    when(view.getContext()).thenReturn(context);
    when(view.getResources()).thenReturn(resources);
    when(resources.getIdentifier(eq(testID), eq("id"), eq(myPackage))).thenReturn(mappedTestID);
    when(resources.getIdentifier(eq(testID), eq("id"), not(eq(myPackage)))).thenReturn(0);
    sut = new ViewManagerStub();
  }

  @After
  public void teardown() {
    TestIdUtil.resetStateInTest();
  }

  @Test
  public void testUsingATestIdNotFoundInResources() {
    when(context.getPackageName()).thenReturn("com.foo");
    sut.setTestId(view, testID);
    verify(view).setId(eq(1));
  }

  @Test
  public void testUsingATestIdFoundInResources() {
    InOrder inOrder = inOrder(view);
    when(context.getPackageName()).thenReturn(myPackage);
    sut.setTestId(view, testID);
    inOrder.verify(view, calls(1)).setId(mappedTestID);
    when(view.getId()).thenReturn((mappedTestID));
    sut.setTestId(view, testID);
    inOrder.verify(view, never()).setId(anyInt());
  }

  private static class ViewManagerStub extends BaseViewManager<View, LayoutShadowNode> {
    @Override
    public String getName() {
      return null;
    }

    @Override
    public LayoutShadowNode createShadowNodeInstance() {
      return null;
    }

    @Override
    public Class<? extends LayoutShadowNode> getShadowNodeClass() {
      return null;
    }

    @Override
    protected View createViewInstance(ThemedReactContext reactContext) {
      return null;
    }

    @Override
    public void updateExtraData(View root, Object extraData) {

    }
  }
}
