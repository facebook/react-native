/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.react.R
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager
import java.util.Locale
import org.assertj.core.api.Assertions
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.powermock.api.mockito.PowerMockito.mockStatic
import org.powermock.api.mockito.PowerMockito.`when` as whenever
import org.powermock.core.classloader.annotations.PowerMockIgnore
import org.powermock.core.classloader.annotations.PrepareForTest
import org.powermock.modules.junit4.rule.PowerMockRule
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@PrepareForTest(Arguments::class)
@RunWith(RobolectricTestRunner::class)
@PowerMockIgnore("org.mockito.*", "org.robolectric.*", "androidx.*", "android.*")
class BaseViewManagerTest {
  private lateinit var viewManager: BaseViewManager<ReactViewGroup, *>
  private lateinit var view: ReactViewGroup

  @get:Rule var rule = PowerMockRule()

  @Before
  fun setUp() {
    viewManager = ReactViewManager()
    view = ReactViewGroup(RuntimeEnvironment.getApplication())
    mockStatic(Arguments::class.java)
    whenever(Arguments.createMap()).thenAnswer { JavaOnlyMap() }
  }

  @Test
  fun testAccessibilityRoleNone() {
    viewManager.setAccessibilityRole(view, "none")
    Assertions.assertThat(view.getTag(R.id.accessibility_role))
        .isEqualTo(ReactAccessibilityDelegate.AccessibilityRole.NONE)
  }

  @Test
  fun testAccessibilityRoleTurkish() {
    Locale.setDefault(Locale.forLanguageTag("tr-TR"))
    viewManager.setAccessibilityRole(view, "image")
    Assertions.assertThat(view.getTag(R.id.accessibility_role))
        .isEqualTo(ReactAccessibilityDelegate.AccessibilityRole.IMAGE)
  }

  @Test
  fun testAccessibilityStateSelected() {
    val accessibilityState = Arguments.createMap()
    accessibilityState.putBoolean("selected", true)
    viewManager.setViewState(view, accessibilityState)
    Assertions.assertThat(view.getTag(R.id.accessibility_state)).isEqualTo(accessibilityState)
    Assertions.assertThat(view.isSelected).isEqualTo(true)
  }

  @Test
  fun testRoleList() {
    viewManager.setRole(view, "list")
    Assertions.assertThat(view.getTag(R.id.role)).isEqualTo(ReactAccessibilityDelegate.Role.LIST)
  }
}
