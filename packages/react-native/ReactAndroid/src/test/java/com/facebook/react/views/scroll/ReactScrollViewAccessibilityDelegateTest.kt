/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.scroll

import android.content.Context
import android.view.View
import android.view.accessibility.AccessibilityEvent
import android.widget.FrameLayout
import com.facebook.react.R
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class ReactScrollViewAccessibilityDelegateTest {

  private lateinit var context: Context
  private lateinit var accessibilityDelegate: ReactScrollViewAccessibilityDelegate

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    context = RuntimeEnvironment.getApplication()
    accessibilityDelegate = ReactScrollViewAccessibilityDelegate()
  }

  @Test
  fun onInitializeAccessibilityEvent_readsNestedCollectionItems() {
    val scrollView = TestAccessibleScrollView(context)
    val contentView = FrameLayout(context)
    val spacer = View(context)
    val row = FrameLayout(context)
    val firstItem = View(context)
    val secondItem = View(context)
    val event = AccessibilityEvent.obtain()

    scrollView.setTag(R.id.accessibility_collection, collection(itemCount = 3))
    firstItem.setTag(
        R.id.accessibility_collection_item,
        collectionItem(itemIndex = 0, rowIndex = 0, columnIndex = 0),
    )
    secondItem.setTag(
        R.id.accessibility_collection_item,
        collectionItem(itemIndex = 1, rowIndex = 0, columnIndex = 1),
    )

    row.addView(firstItem)
    row.addView(secondItem)
    contentView.addView(spacer)
    contentView.addView(row)
    scrollView.addView(contentView)

    accessibilityDelegate.onInitializeAccessibilityEvent(scrollView, event)

    assertThat(event.itemCount).isEqualTo(3)
    assertThat(event.fromIndex).isEqualTo(0)
    assertThat(event.toIndex).isEqualTo(1)
  }

  private fun collection(itemCount: Int): JavaOnlyMap =
      JavaOnlyMap().apply {
        putInt("itemCount", itemCount)
        putInt("rowCount", itemCount)
        putInt("columnCount", 1)
        putBoolean("hierarchical", false)
      }

  private fun collectionItem(
      itemIndex: Int,
      rowIndex: Int,
      columnIndex: Int,
  ): JavaOnlyMap =
      JavaOnlyMap().apply {
        putInt("itemIndex", itemIndex)
        putInt("rowIndex", rowIndex)
        putInt("rowSpan", 1)
        putInt("columnIndex", columnIndex)
        putInt("columnSpan", 1)
        putBoolean("heading", false)
      }

  private class TestAccessibleScrollView(context: Context) :
      FrameLayout(context), ReactAccessibleScrollView {

    override val scrollEnabled: Boolean = true

    override fun isPartiallyScrolledInView(view: View): Boolean = true
  }
}
