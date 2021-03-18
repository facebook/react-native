/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import static org.fest.assertions.api.Assertions.assertThat;

import com.facebook.react.R;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ReactAccessibilityDelegate.AccessibilityRole;
import com.facebook.react.views.view.ReactViewGroup;
import com.facebook.react.views.view.ReactViewManager;
import java.util.Locale;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

@PrepareForTest({Arguments.class})
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class BaseViewManagerTest {

  @Rule public PowerMockRule rule = new PowerMockRule();

  private BaseViewManager mViewManager;
  private ReactViewGroup mView;

  @Before
  public void setUp() {
    mViewManager = new ReactViewManager();
    mView = new ReactViewGroup(RuntimeEnvironment.application);
    PowerMockito.mockStatic(Arguments.class);
    PowerMockito.when(Arguments.createMap())
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) throws Throwable {
                return new JavaOnlyMap();
              }
            });
  }

  @Test
  public void testAccessibilityRoleNone() {
    mViewManager.setAccessibilityRole(mView, "none");
    assertThat(mView.getTag(R.id.accessibility_role)).isEqualTo(AccessibilityRole.NONE);
  }

  @Test
  public void testAccessibilityRoleTurkish() {
    Locale.setDefault(Locale.forLanguageTag("tr-TR"));
    mViewManager.setAccessibilityRole(mView, "image");
    assertThat(mView.getTag(R.id.accessibility_role)).isEqualTo(AccessibilityRole.IMAGE);
  }

  @Test
  public void testAccessibilityStateSelected() {
    WritableMap accessibilityState = Arguments.createMap();
    accessibilityState.putBoolean("selected", true);
    mViewManager.setViewState(mView, accessibilityState);
    assertThat(mView.getTag(R.id.accessibility_state)).isEqualTo(accessibilityState);
    assertThat(mView.isSelected()).isEqualTo(true);
  }
}
