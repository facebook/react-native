/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.react.R
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager
import java.util.Locale
import org.assertj.core.api.Assertions
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class BaseViewManagerTest {
  private lateinit var viewManager: BaseViewManager<ReactViewGroup, *>
  private lateinit var view: ReactViewGroup
  private lateinit var arguments: MockedStatic<Arguments>

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    viewManager = ReactViewManager()
    view = ReactViewGroup(RuntimeEnvironment.getApplication())
    arguments = Mockito.mockStatic(Arguments::class.java)
    arguments.`when`<WritableArray> { Arguments.createMap() }.thenAnswer { JavaOnlyArray() }
  }

  @After
  fun tearDown() {
    arguments.close()
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
    val accessibilityState = JavaOnlyMap()
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
