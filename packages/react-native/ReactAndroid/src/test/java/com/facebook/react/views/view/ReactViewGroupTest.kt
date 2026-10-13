/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.app.Activity
import android.content.Context
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.accessibility.AccessibilityEvent
import android.widget.FrameLayout
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.HasElevatedDescendantCache
import com.facebook.react.uimanager.PointerEvents
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.shadows.ShadowLooper

@RunWith(RobolectricTestRunner::class)
class ReactViewGroupTest {

  private lateinit var context: Context

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    context = Robolectric.buildActivity(Activity::class.java).create().get()
  }

  @After
  fun tearDown() {
    setDispatchPointerEvents(false)
  }

  @Test
  fun `hover with pointer events dispatched still sends the accessibility hover event`() {
    setDispatchPointerEvents(true)
    val rvg = attachForHover()
    val sentEventTypes = recordSentAccessibilityEvents(rvg)

    rvg.onHoverEvent(obtainHoverEvent(MotionEvent.ACTION_HOVER_ENTER))

    assertThat(sentEventTypes).contains(AccessibilityEvent.TYPE_VIEW_HOVER_ENTER)
  }

  @Test
  fun `hover with pointer events dispatched still answers whether the view is a touch target`() {
    setDispatchPointerEvents(true)
    val rvg = attachForHover()

    assertThat(rvg.onHoverEvent(obtainHoverEvent(MotionEvent.ACTION_HOVER_MOVE))).isTrue()
    rvg.pointerEvents = PointerEvents.NONE
    assertThat(rvg.onHoverEvent(obtainHoverEvent(MotionEvent.ACTION_HOVER_MOVE))).isFalse()
  }

  @Test
  fun `View clipping - ensure allChildren properly resizes when adding views in sequence`() {
    val rvg = ReactViewGroup(context)
    rvg.left = 0
    rvg.right = 100
    rvg.top = 0
    rvg.bottom = 100
    FrameLayout(context).addView(rvg)
    rvg.removeClippedSubviews = true
    for (i in 0..20) {
      rvg.addViewWithSubviewClippingEnabled(TestView(context, i * 10), i)
    }
    rvg.updateClippingRect()
    assertThat(rvg.childCount).isEqualTo(10)
  }

  @Test
  fun `View clipping - ensure allChildren properly resizes when adding views out of sequence`() {
    val rvg = ReactViewGroup(context)
    rvg.left = 0
    rvg.right = 100
    rvg.top = 0
    rvg.bottom = 100
    FrameLayout(context).addView(rvg)
    rvg.removeClippedSubviews = true
    for (i in 0..10) {
      rvg.addViewWithSubviewClippingEnabled(TestView(context, i * 10), i)
    }
    repeat(10) { rvg.addViewWithSubviewClippingEnabled(TestView(context, 90), 10) }
    rvg.updateClippingRect()
    assertThat(rvg.childCount).isEqualTo(20)
  }

  @Test
  fun `auto offscreen compositing - true when flag on, alpha lt 1, and elevated descendant`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    mount(rvg, elevatedChild())
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - true even at alpha 1 so the layer is ready for a later alpha change`() {
    // Returning true at full opacity is what bakes the offscreen decision into the RenderNode, so a
    // later alpha change -- including a native-driver opacity animation -- composites uniformly. No
    // layer is actually allocated until alpha < 1, so this costs nothing while opaque.
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    mount(rvg, elevatedChild())
    rvg.alpha = 1f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - false when there is no elevated descendant`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    mount(rvg, View(context))
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isFalse()
  }

  @Test
  fun `auto offscreen compositing - false when flag is off`() {
    overrideAutoOffscreenFlag(false)
    val rvg = ReactViewGroup(context)
    mount(rvg, elevatedChild())
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isFalse()
  }

  @Test
  fun `auto offscreen compositing - detects a nested elevated descendant`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    val inner = ReactViewGroup(context)
    inner.addView(elevatedChild())
    mount(rvg, inner)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - detects an elevated view inside a non-ReactViewGroup container`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    val container = FrameLayout(context)
    container.addView(elevatedChild())
    mount(rvg, container)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - invalidation bubbles through a non-ReactViewGroup ancestor`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    val container = FrameLayout(context)
    val inner = ReactViewGroup(context)
    rvg.addView(container)
    container.addView(inner)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isFalse()
    // An elevated view mounted deep under a non-RVG container must still invalidate the RVG
    // ancestor.
    inner.addView(elevatedChild())
    HasElevatedDescendantCache.invalidateAncestors(inner)
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - reflects an elevated child added after a prior query`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isFalse()
    mount(rvg, elevatedChild())
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - false once the elevated descendant is removed`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    val child = elevatedChild()
    mount(rvg, child)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
    unmount(rvg, child)
    assertThat(rvg.hasOverlappingRendering()).isFalse()
  }

  @Test
  fun `needsOffscreenAlphaCompositing forces overlapping rendering regardless of flag`() {
    val rvg = ReactViewGroup(context)
    rvg.setNeedsOffscreenAlphaCompositing(true)
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - recycling a child invalidates the parent`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    val inner = ReactViewGroup(context)
    inner.addView(elevatedChild())
    mount(rvg, inner)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
    inner.recycleView()
    assertThat(rvg.hasOverlappingRendering()).isFalse()
  }

  @Test
  fun `auto offscreen compositing - counts an elevated descendant that is currently clipped out`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    rvg.left = 0
    rvg.right = 100
    rvg.top = 0
    rvg.bottom = 100
    FrameLayout(context).addView(rvg)
    rvg.removeClippedSubviews = true
    // Elevated child positioned far below the viewport, so it is clipped out (detached, only in
    // allChildren). The logical scan must still count it.
    val elevated =
        View(context).apply {
          elevation = 10f
          left = 0
          right = 100
          top = 1000
          bottom = 1010
        }
    rvg.addViewWithSubviewClippingEnabled(elevated, 0)
    rvg.updateClippingRect()
    HasElevatedDescendantCache.invalidateAncestors(rvg)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - invalidateAncestors refreshes an outer ReactViewGroup across a nested one`() {
    overrideAutoOffscreenFlag(true)
    val outer = ReactViewGroup(context)
    val inner = ReactViewGroup(context)
    mount(outer, inner)
    assertThat(outer.hasOverlappingRendering()).isFalse()

    // Add deep, then invalidate starting from the inner node: the walk must reach and refresh
    // outer.
    inner.addView(elevatedChild())
    HasElevatedDescendantCache.invalidateAncestors(inner)
    assertThat(outer.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - invalidateElevatedDescendantCache reports whether it changed state`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    rvg.addView(elevatedChild())
    // Prime the cache.
    assertThat(rvg.hasOverlappingRendering()).isTrue()

    // First invalidation clears a valid cache; the second finds it already stale.
    assertThat(rvg.invalidateElevatedDescendantCache()).isTrue()
    assertThat(rvg.invalidateElevatedDescendantCache()).isFalse()
  }

  @Test
  fun `auto offscreen compositing - invalidateAncestors short-circuits at an already-stale node`() {
    overrideAutoOffscreenFlag(true)
    val outer = ReactViewGroup(context)
    val inner = ReactViewGroup(context)
    mount(outer, elevatedChild()) // direct elevated child, scanned first
    mount(outer, inner) // nested ReactViewGroup, scanned second

    // Querying outer returns true from its own elevated child and short-circuits before descending
    // inner, so inner's cache is left stale.
    assertThat(outer.hasOverlappingRendering()).isTrue()

    // Invalidating from inner finds inner already stale and stops there; outer's still-correct
    // cached result must be unaffected.
    HasElevatedDescendantCache.invalidateAncestors(inner)
    assertThat(outer.hasOverlappingRendering()).isTrue()
  }

  // Mirrors the ViewManager mount/unmount hooks: attach/detach the child, then refresh the cache.
  private fun mount(parent: ReactViewGroup, child: View) {
    parent.addView(child)
    HasElevatedDescendantCache.invalidateAncestors(parent)
  }

  private fun unmount(parent: ReactViewGroup, child: View) {
    parent.removeView(child)
    HasElevatedDescendantCache.invalidateAncestors(parent)
  }

  private fun overrideAutoOffscreenFlag(enabled: Boolean) {
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun enableAndroidAutoOffscreenCompositingForElevation(): Boolean = enabled
        },
    )
  }

  private fun elevatedChild(): View = View(context).apply { elevation = 10f }

  @Suppress("DEPRECATION")
  private fun setDispatchPointerEvents(enabled: Boolean) {
    com.facebook.react.config.ReactFeatureFlags.dispatchPointerEvents = enabled
  }

  // An accessibility hover event is sent only from a view attached to a window.
  private fun attachForHover(): ReactViewGroup {
    val activity = Robolectric.buildActivity(Activity::class.java).setup().get()
    val rvg = ReactViewGroup(activity)
    rvg.importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
    activity.setContentView(rvg)
    ShadowLooper.idleMainLooper()
    rvg.layout(0, 0, 100, 100)
    assertThat(rvg.isAttachedToWindow).isTrue()
    return rvg
  }

  private fun recordSentAccessibilityEvents(view: View): List<Int> {
    val sentEventTypes = mutableListOf<Int>()
    view.accessibilityDelegate =
        object : View.AccessibilityDelegate() {
          override fun sendAccessibilityEvent(host: View, eventType: Int) {
            sentEventTypes.add(eventType)
          }
        }
    return sentEventTypes
  }

  private fun obtainHoverEvent(action: Int): MotionEvent =
      MotionEvent.obtain(0L, 0L, action, 50f, 50f, 0)
}

class TestView(context: Context, yPos: Int) : View(context) {
  init {
    left = 0
    right = 100
    top = yPos
    bottom = top + 10
  }
}

class TestParent(context: Context) : ViewGroup(context) {
  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) = Unit
}
