/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting

import android.view.View
import android.widget.FrameLayout
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.mock
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class ViewTransitionCoordinatorTest {

    private lateinit var coordinator: ViewTransitionCoordinator
    private lateinit var mockManager: SurfaceMountingManager
    private lateinit var reactContext: ReactApplicationContext

    @Before
    fun setup() {
      ReactNativeFeatureFlagsForTests.setUp()
      reactContext = BridgeReactContext(RuntimeEnvironment.getApplication())
      coordinator = ViewTransitionCoordinator(surfaceId = 1)
      mockManager = mock(SurfaceMountingManager::class.java)
    }

    @Test
    fun testViewInTransition_shouldEnqueueOperations() {
        val childTag = 100
        val parentTag = 200

        // Initially, operations should not be enqueued
        assertThat(coordinator.shouldEnqueueOperation(childTag, parentTag))
            .isFalse()

        // Mark view as in transition
        coordinator.markViewInTransition(
            tag = childTag,
            transitioning = true,
            view = null,
            onDetach = {}
        )

        // Now operations should be enqueued
        assertThat(coordinator.shouldEnqueueOperation(childTag, parentTag))
            .isTrue()
    }

    @Test
    fun testEnqueueAndDrainAddOperation() {
        val childTag = 100
        val parentTag = 200
        val index = 0

        val parentView = FrameLayout(reactContext)
        val childView = View(reactContext)

        // Mark view as transitioning
        coordinator.markViewInTransition(
            tag = childTag,
            transitioning = true,
            view = null,
            onDetach = {}
        )

        // Create and enqueue an add operation
        val operation = AddViewOperation(
            parentTag = parentTag,
            childTag = childTag,
            index = index,
            parent = parentView,
            child = childView
        )

        coordinator.enqueueOperation(operation)

        // Operation should be queued
        assertThat(coordinator.shouldEnqueueOperation(childTag, parentTag))
            .isTrue()

        // Mark view as not transitioning anymore
        coordinator.markViewInTransition(
            tag = childTag,
            transitioning = false,
            view = null,
            onDetach = {
                // This would normally be called when view detaches
                coordinator.drainOperationsForChild(childTag, mockManager)
            }
        )
    }

    @Test
    fun testQueueMaintainsOrderForParent() {
        val parent1Tag = 200
        val parent2Tag = 300
        val childTag = 100

        val parentView1 = FrameLayout(reactContext)
        val parentView2 = FrameLayout(reactContext)
        val childView = View(reactContext)

        // Mark child as transitioning
        coordinator.markViewInTransition(
            tag = childTag,
            transitioning = true,
            view = null,
            onDetach = {}
        )

        // Enqueue operations to different parents
        val op1 = AddViewOperation(
            childTag = childTag,
            parentTag = parent1Tag,
            index = 0,
            parent = parentView1,
            child = childView
        )

        val op2 = AddViewOperation(
            childTag = childTag,
            parentTag = parent2Tag,
            index = 0,
            parent = parentView2,
            child = childView
        )

        coordinator.enqueueOperation(op1)
        coordinator.enqueueOperation(op2)

        // Both parents should have queues now
        assertThat(coordinator.shouldEnqueueOperation(999, parent1Tag))
            .isTrue()
        assertThat(coordinator.shouldEnqueueOperation(999, parent2Tag))
            .isTrue()

        // The first parent should be first in line for the child
        assertThat(coordinator.isFirstInLineForChild(childTag, parent1Tag))
            .isTrue()
        assertThat(coordinator.isFirstInLineForChild(childTag, parent2Tag))
            .isFalse()
    }

    @Test
    fun testClearAllPending() {
        val childTag = 100
        val parentTag = 200

        // Mark view as transitioning
        coordinator.markViewInTransition(
            tag = childTag,
            transitioning = true,
            view = null,
            onDetach = {}
        )

        val operation = AddViewOperation(
            childTag = childTag,
            parentTag = parentTag,
            index = 0,
            parent = FrameLayout(reactContext),
            child = View(reactContext)
        )

        coordinator.enqueueOperation(operation)

        // Verify queue exists
        assertThat(coordinator.shouldEnqueueOperation(childTag, parentTag))
            .isTrue()

        // Clear all pending
        coordinator.clearAllPending()

        // Queue should be cleared, and view should not be in transition
        assertThat(coordinator.shouldEnqueueOperation(childTag, parentTag))
            .isFalse()
    }
}
