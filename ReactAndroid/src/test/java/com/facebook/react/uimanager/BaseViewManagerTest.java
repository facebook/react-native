/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.uimanager;

import static org.fest.assertions.api.Assertions.assertThat;

import com.facebook.react.R;
import com.facebook.react.uimanager.ReactAccessibilityDelegate.AccessibilityRole;
import com.facebook.react.views.view.ReactViewGroup;
import com.facebook.react.views.view.ReactViewManager;
import java.util.Locale;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

@RunWith(RobolectricTestRunner.class)
public class BaseViewManagerTest {

  private BaseViewManager mViewManager;
  private ReactViewGroup mView;

  @Before
  public void setUp() {
    mViewManager = new ReactViewManager();
    mView = new ReactViewGroup(RuntimeEnvironment.application);
  }

  @Test
  public void testAccessibilityRoleNone() {
    mViewManager.setAccessibilityRole(mView, "none");
    assertThat(mView.getTag(R.id.reactandroid_accessibility_role)).isEqualTo(AccessibilityRole.NONE);
  }

  @Test
  public void testAccessibilityRoleTurkish() {
    Locale.setDefault(Locale.forLanguageTag("tr-TR"));
    mViewManager.setAccessibilityRole(mView, "image");
    assertThat(mView.getTag(R.id.reactandroid_accessibility_role)).isEqualTo(AccessibilityRole.IMAGE);
  }
}
