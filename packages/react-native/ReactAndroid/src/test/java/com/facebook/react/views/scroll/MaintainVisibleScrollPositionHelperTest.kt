/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.content.Context
import android.view.View
import android.widget.FrameLayout
import com.facebook.react.bridge.UIManager
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.views.scroll.ReactScrollViewHelper.HasScrollEventThrottle
import com.facebook.react.views.scroll.ReactScrollViewHelper.HasSmoothScroll
import com.facebook.react.views.view.ReactViewGroup
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class MaintainVisibleScrollPositionHelperTest {
  private lateinit var context: Context
  private val uiManager: UIManager = mock()

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    context = RuntimeEnvironment.getApplication()
  }

  @Test
  fun shrinkingContentAdjustsFromOffsetBeforeLayoutClamp() {
    val scrollView = TestScrollView(context)
    val content = ReactViewGroup(context)
    val anchor = View(context)
    content.addView(anchor)
    scrollView.addView(content)
    anchor.layout(0, 900, 100, 1000)
    scrollView.scrollTo(0, 900)

    val helper = MaintainVisibleScrollPositionHelper(scrollView, horizontal = false)
    helper.config = MaintainVisibleScrollPositionHelper.Config(0, null)
    helper.willMountItems(uiManager)

    anchor.layout(0, 300, 100, 400)
    scrollView.scrollTo(0, 100) // Layout clamped the old offset before didMountItems.
    helper.didMountItems(uiManager)

    assertThat(scrollView.requestedY).isEqualTo(300)
  }

  @Test
  fun shrinkingHorizontalContentAdjustsFromOffsetBeforeLayoutClamp() {
    val scrollView = TestScrollView(context)
    val content = ReactViewGroup(context)
    val anchor = View(context)
    content.addView(anchor)
    scrollView.addView(content)
    anchor.layout(900, 0, 1000, 100)
    scrollView.scrollTo(900, 0)

    val helper = MaintainVisibleScrollPositionHelper(scrollView, horizontal = true)
    helper.config = MaintainVisibleScrollPositionHelper.Config(0, null)
    helper.willMountItems(uiManager)

    anchor.layout(300, 0, 400, 100)
    scrollView.scrollTo(100, 0)
    helper.didMountItems(uiManager)

    assertThat(scrollView.requestedX).isEqualTo(300)
  }

  @Test
  fun growingContentStillAdjustsFromOffsetBeforeMount() {
    val scrollView = TestScrollView(context)
    val content = ReactViewGroup(context)
    val anchor = View(context)
    content.addView(anchor)
    scrollView.addView(content)
    anchor.layout(0, 300, 100, 400)
    scrollView.scrollTo(0, 300)

    val helper = MaintainVisibleScrollPositionHelper(scrollView, horizontal = false)
    helper.config = MaintainVisibleScrollPositionHelper.Config(0, null)
    helper.willMountItems(uiManager)

    anchor.layout(0, 900, 100, 1000)
    helper.didMountItems(uiManager)

    assertThat(scrollView.requestedY).isEqualTo(900)
  }

  private class TestScrollView(context: Context) :
      FrameLayout(context), HasScrollEventThrottle, HasSmoothScroll {
    override var scrollEventThrottle: Int = 0
    override var lastScrollDispatchTime: Long = 0
    var requestedX: Int? = null
    var requestedY: Int? = null

    override fun reactSmoothScrollTo(x: Int, y: Int) {
      scrollTo(x, y)
    }

    override fun scrollToPreservingMomentum(x: Int, y: Int) {
      requestedX = x
      requestedY = y
      scrollTo(x, y)
    }
  }
}
