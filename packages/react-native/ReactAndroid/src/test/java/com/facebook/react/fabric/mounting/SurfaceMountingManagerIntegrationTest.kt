/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting

import android.app.Activity
import android.os.Looper
import android.view.ViewGroup
import androidx.core.view.doOnDetach
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.ReactTestHelper.createMockCatalystInstance
import com.facebook.react.fabric.mounting.MountingManager.MountItemExecutor
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.touch.JSResponderHandler
import com.facebook.react.uimanager.RootViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.react.views.view.ReactViewManager
import com.facebook.testutils.shadows.ShadowArguments
import com.facebook.testutils.shadows.ShadowNativeArray
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowNativeMap
import com.facebook.testutils.shadows.ShadowReadableNativeArray
import com.facebook.testutils.shadows.ShadowReadableNativeMap
import com.facebook.testutils.shadows.ShadowSoLoader
import com.facebook.testutils.shadows.ShadowWritableNativeArray
import com.facebook.testutils.shadows.ShadowWritableNativeMap
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowLog
import java.util.concurrent.CountDownLatch

@RunWith(RobolectricTestRunner::class)
@Config(
  shadows = [
    ShadowArguments::class,
    ShadowSoLoader::class,
    ShadowNativeLoader::class,
    ShadowNativeArray::class,
    ShadowNativeMap::class,
    ShadowWritableNativeMap::class,
    ShadowWritableNativeArray::class,
    ShadowReadableNativeMap::class,
    ShadowReadableNativeArray::class,
  ]
)
class SurfaceMountingManagerIntegrationTest {

  private lateinit var surfaceMountingManager: SurfaceMountingManager
  private lateinit var reactContext: BridgeReactContext
  private lateinit var themedReactContext: ThemedReactContext
  private lateinit var viewManagerRegistry: ViewManagerRegistry
  private lateinit var rootViewManager: RootViewManager
  private lateinit var mountItemExecutor: MountItemExecutor
  private val surfaceId = 1
  private lateinit var activity: Activity

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    reactContext = BridgeReactContext(RuntimeEnvironment.getApplication())
    reactContext.initializeWithInstance(createMockCatalystInstance())
    themedReactContext = ThemedReactContext(reactContext, reactContext, null, -1)

    val viewManagers = listOf<ViewManager<*, *>>(ReactViewManager())
    viewManagerRegistry = ViewManagerRegistry(viewManagers)
    rootViewManager = RootViewManager()
    mountItemExecutor = MountItemExecutor { }

    surfaceMountingManager = SurfaceMountingManager(
      surfaceId,
      JSResponderHandler(),
      viewManagerRegistry,
      rootViewManager,
      mountItemExecutor,
      themedReactContext
    )

    val controller = Robolectric.buildActivity(Activity::class.java)
    controller.setup() // Moves the activity to the "resumed" state
    activity = controller.get()

    ShadowLog.stream = System.out
  }

  @Test
  fun testAddViewAt_immediateExecution_whenNoTransition() {
    val parentTag = 100
    val childTag = 200

    val parentView = createView(parentTag)
    val childView = createView(childTag)

    // Verify parent starts empty
    assertThat(parentView.childCount).isEqualTo(0)

    // Add child to parent (should execute immediately since no transition)
    surfaceMountingManager.addViewAt(parentTag, childTag, 0)

    // Verify child was added immediately
    assertThat(parentView.childCount).isEqualTo(1)
    assertThat(parentView.getChildAt(0)).isEqualTo(childView)
  }

  @Test
  fun testRemoveViewAt_queuesOperation_whenParentHasQueuedOperations() {
    val parentTag = 100
    val childTag = 200

    val parentView = createView(parentTag)
    val childView = createView(childTag)

    activity.setContentView(parentView)

    // Add child to parent first
    surfaceMountingManager.addViewAt(parentTag, childTag, 0)
    assertThat(parentView.childCount).isEqualTo(1)
    assertThat(childView.isAttachedToWindow).isTrue()

    // Mark child as in transition
    parentView.startViewTransition(childView)
    surfaceMountingManager.markViewInTransition(childTag, true)

    val latch = CountDownLatch(1)
    childView.doOnDetach {
      latch.countDown()
    }

    // Remove child (should queue since child is in transition)
    surfaceMountingManager.removeViewAt(childTag, parentTag, 0)

    // Confusing part: the child has been removed from the parent BUT the child still has its mParent set
    assertThat(parentView.childCount).isEqualTo(0)
    assertThat(childView.parent).isEqualTo(parentView)

    // Mark child as not transitioning (should drain operations)
    parentView.endViewTransition(childView)
    surfaceMountingManager.markViewInTransition(childTag, false)

    assertThat(latch.await(1, java.util.concurrent.TimeUnit.SECONDS)).isTrue()
    Shadows.shadowOf(Looper.getMainLooper()).idle()

    assertThat(parentView.childCount).isEqualTo(0)
    assertThat(childView.parent).isNull()
  }

  @Test
  fun testAddViewAt_maintainsParentOrderForSameChild() {
    val parent = 10
    val parent1Tag = 100
    val parent2Tag = 200
    val childTag = 300

    val parentView = createView(parent)
    val parent1View = createView(parent1Tag)
    val parent2View = createView(parent2Tag)
    val childView = createView(childTag)

    activity.setContentView(parentView)

    surfaceMountingManager.addViewAt(parent, parent1Tag, 0)
    surfaceMountingManager.addViewAt(parent, parent2Tag, 1)

    // Add child to parent one
    surfaceMountingManager.addViewAt(parent1Tag, childTag, 0)

    // Mark child as in transition
    parent1View.startViewTransition(childView)
    surfaceMountingManager.markViewInTransition(childTag, true)

    val latch = CountDownLatch(1)
    childView.doOnDetach {
        latch.countDown()
    }

    // Queue remove from parent1, then add to parent2
    surfaceMountingManager.removeViewAt(childTag, parent1Tag, 0)
    surfaceMountingManager.addViewAt(parent2Tag, childTag, 0)

    assertThat(parent1View.childCount).isEqualTo(0)
    assertThat(childView.parent).isEqualTo(parent1View)
    assertThat(parent2View.childCount).isEqualTo(0)

    // Mark child as not transitioning (should drain operations)
    surfaceMountingManager.markViewInTransition(childTag, false)
    parent1View.endViewTransition(childView)

    // Wait for doOnDetach to fire, but don't run the shadow looper inside it …
    assertThat(latch.await(1, java.util.concurrent.TimeUnit.SECONDS)).isTrue()
    // … otherwise ViewTransitionCoordinator's code would run its UIThreadUtil.runOnUiThread
    // during dispatchDetachedFromWindow, which is before the parent fields are cleared.
    // So run the looper after the detach here:
    Shadows.shadowOf(Looper.getMainLooper()).idle()

    // Verify child ends up in parent2 (the last operation)
    // Operations should execute: add to parent1, then remove from parent1 and add to parent2
    assertThat(parent1View.childCount).isEqualTo(0)
    assertThat(parent2View.childCount).isEqualTo(1)
    assertThat(parent2View.getChildAt(0)).isEqualTo(childView)
    assertThat(childView.parent).isEqualTo(parent2View)
  }

  @Test
  fun testRemoveAndDelete_shouldFullyDrain() {
    // 1. Parent A has remove operations for child1 and child2
    // 2. Both children also have delete operations queued
    // 3. Parent A's queue drains completely (both removes execute)
    // 4. Only child2 (last operation) gets to drain and clean up
    // 5. Child1 is stuck with parent A in its childToParentOrder
    // 6. Child1's delete operation can never execute because it's not "first in line"

    val parentTag = 300
    val child1Tag = 100
    val child2Tag = 200

    val parentView = createView(parentTag)
    val childView1 = createView(child1Tag)
    val childView2 = createView(child2Tag)

    activity.setContentView(parentView)

    surfaceMountingManager.addViewAt(parentTag, child1Tag, 0)
    surfaceMountingManager.addViewAt(parentTag, child2Tag, 1)
    assertThat(parentView.childCount).isEqualTo(2)
    assertThat(childView1.isAttachedToWindow).isTrue()
    assertThat(childView2.isAttachedToWindow).isTrue()

    parentView.startViewTransition(childView1)
    parentView.startViewTransition(childView2)
    surfaceMountingManager.markViewInTransition(child1Tag, true)
    surfaceMountingManager.markViewInTransition(child2Tag, true)

    val latch = CountDownLatch(2)
    childView1.doOnDetach {
      latch.countDown()
    }
    childView2.doOnDetach {
      latch.countDown()
    }

    // Queue remove operations for both children, important: reverse order
    surfaceMountingManager.removeViewAt(child2Tag, parentTag, 1)
    surfaceMountingManager.removeViewAt(child1Tag, parentTag, 0)

    // Queue delete operations for both children
    surfaceMountingManager.deleteView(child1Tag)
    surfaceMountingManager.deleteView(child2Tag)

    // At this point:
    // - parentQueues[300] = [Remove(child1), Remove(child2)]
    // - parentQueues[-1337] = [Delete(child1), Delete(child2)]
    // - childToParentOrder[100] = [300, -1337]
    // - childToParentOrder[200] = [300, -1337]

    // Verify operations are queued
    assertThat(parentView.childCount).isEqualTo(0)
    assertThat(childView1.parent).isEqualTo(parentView)
    assertThat(childView2.parent).isEqualTo(parentView)

    // Mark children as not transitioning, triggering drains
    // This will cause parent 300 to drain completely
    surfaceMountingManager.markViewInTransition(child1Tag, false)
    surfaceMountingManager.markViewInTransition(child2Tag, false)
    parentView.endViewTransition(childView1)
    parentView.endViewTransition(childView2)

    assertThat(latch.await(1, java.util.concurrent.TimeUnit.SECONDS)).isTrue()
    Shadows.shadowOf(Looper.getMainLooper()).idle()

    // Both removes should have executed
    assertThat(parentView.childCount).isEqualTo(0)
    assertThat(childView1.parent).isNull()
    assertThat(childView2.parent).isNull()

    // Both deletes should eventually execute
    assertThatThrownBy {
      surfaceMountingManager.getView(child1Tag)
    }

    assertThatThrownBy {
      surfaceMountingManager.getView(child2Tag)
    }

    val coordinator = getCoordinator()
    assertThat(coordinator.isEmpty()).isTrue()
  }

  @Test
  fun testRemoveAndReparent_shouldNotDeadlock() {
    // Scenario: Remove from parent A, then add to parent B

    val parentATag = 100
    val parentBTag = 200
    val child1Tag = 300
    val child2Tag = 400

    val parentAView = createView(parentATag)
    val parentBView = createView(parentBTag)
    val childView1 = createView(child1Tag)
    val childView2 = createView(child2Tag)

    activity.setContentView(parentAView)

    // Add both children to parent A
    surfaceMountingManager.addViewAt(parentATag, child1Tag, 0)
    surfaceMountingManager.addViewAt(parentATag, child2Tag, 1)
    assertThat(parentAView.childCount).isEqualTo(2)

    // Mark children as in transition
    parentAView.startViewTransition(childView1)
    parentAView.startViewTransition(childView2)
    surfaceMountingManager.markViewInTransition(child1Tag, true)
    surfaceMountingManager.markViewInTransition(child2Tag, true)

    val latch = CountDownLatch(2)
    childView1.doOnDetach {
      latch.countDown()
    }
    childView2.doOnDetach {
      latch.countDown()
    }

    // Remove from parent A
    surfaceMountingManager.removeViewAt(child2Tag, parentATag, 1)
    surfaceMountingManager.removeViewAt(child1Tag, parentATag, 0)

    // Reparent to parent B
    surfaceMountingManager.addViewAt(parentBTag, child1Tag, 0)
    surfaceMountingManager.addViewAt(parentBTag, child2Tag, 1)

    // At this point:
    // - childToParentOrder[child1] = [parentA, parentB]
    // - childToParentOrder[child2] = [parentA, parentB]

    assertThat(parentAView.childCount).isEqualTo(0)
    assertThat(childView1.parent).isEqualTo(parentAView)
    assertThat(childView2.parent).isEqualTo(parentAView)
    assertThat(parentBView.childCount).isEqualTo(0)

    // Mark children as not transitioning
    surfaceMountingManager.markViewInTransition(child1Tag, false)
    surfaceMountingManager.markViewInTransition(child2Tag, false)
    parentAView.endViewTransition(childView1)
    parentAView.endViewTransition(childView2)

    assertThat(latch.await(1, java.util.concurrent.TimeUnit.SECONDS)).isTrue()
    Shadows.shadowOf(Looper.getMainLooper()).idle()

    // Both removes should execute
    assertThat(parentAView.childCount).isEqualTo(0)

    // Both adds should execute (deadlock would prevent this)
    assertThat(parentBView.childCount).isEqualTo(2)
    assertThat(parentBView.getChildAt(0)).isEqualTo(childView1)
    assertThat(parentBView.getChildAt(1)).isEqualTo(childView2)

    // Verify coordinator is fully clean
    val coordinator = getCoordinator()
    assertThat(coordinator.isEmpty()).isTrue()
  }

  @Test
  fun testMultipleReparenting_shouldNotDeadlock() {
    // Bug scenario: Reparent through multiple parents A -> B -> C
    // When parent A drains, only child2 cleans up, leaving child1 deadlocked

    val parentATag = 100
    val parentBTag = 200
    val parentCTag = 300
    val child1Tag = 400
    val child2Tag = 500

    val parentAView = createView(parentATag)
    val parentBView = createView(parentBTag)
    val parentCView = createView(parentCTag)
    val childView1 = createView(child1Tag)
    val childView2 = createView(child2Tag)

    activity.setContentView(parentAView)

    // Add both children to parent A
    surfaceMountingManager.addViewAt(parentATag, child1Tag, 0)
    surfaceMountingManager.addViewAt(parentATag, child2Tag, 1)
    assertThat(parentAView.childCount).isEqualTo(2)

    // Mark children as in transition
    parentAView.startViewTransition(childView1)
    parentAView.startViewTransition(childView2)
    surfaceMountingManager.markViewInTransition(child1Tag, true)
    surfaceMountingManager.markViewInTransition(child2Tag, true)

    val latch = CountDownLatch(2)
    childView1.doOnDetach {
      latch.countDown()
    }
    childView2.doOnDetach {
      latch.countDown()
    }

    // Reparent A -> B
    surfaceMountingManager.removeViewAt(child2Tag, parentATag, 1)
    surfaceMountingManager.removeViewAt(child1Tag, parentATag, 0)
    surfaceMountingManager.addViewAt(parentBTag, child1Tag, 0)
    surfaceMountingManager.addViewAt(parentBTag, child2Tag, 1)

    // Reparent B -> C
    surfaceMountingManager.removeViewAt(child2Tag, parentBTag, 1)
    surfaceMountingManager.removeViewAt(child1Tag, parentBTag, 0)
    surfaceMountingManager.addViewAt(parentCTag, child1Tag, 0)
    surfaceMountingManager.addViewAt(parentCTag, child2Tag, 1)

    // At this point:
    // - childToParentOrder[child1] = [A, B, C]
    // - childToParentOrder[child2] = [A, B, C]

    // Mark children as not transitioning
    surfaceMountingManager.markViewInTransition(child1Tag, false)
    surfaceMountingManager.markViewInTransition(child2Tag, false)
    parentAView.endViewTransition(childView1)
    parentAView.endViewTransition(childView2)

    assertThat(latch.await(1, java.util.concurrent.TimeUnit.SECONDS)).isTrue()
    Shadows.shadowOf(Looper.getMainLooper()).idle()

    // All operations should execute
    assertThat(parentAView.childCount).isEqualTo(0)
    assertThat(parentBView.childCount).isEqualTo(0)
    assertThat(parentCView.childCount).isEqualTo(2)
    assertThat(parentCView.getChildAt(0)).isEqualTo(childView1)
    assertThat(parentCView.getChildAt(1)).isEqualTo(childView2)

    val coordinator = getCoordinator()
    assertThat(coordinator.isEmpty()).isTrue()
  }

  @Test
  fun testPartialDrainThenFullDrain_shouldCleanupAllChildren() {
    // If a queue partially drains (some ops execute, then blocks on one),
    // then later fully drains, all children should be cleaned up from childToParentOrder!
    //
    // Scenario:
    // 1. Queue: [Remove(child1), Remove(child2), Remove(child3), Remove(child4)]
    // 2. First drain: child1, child2 execute, then blocks on child3 (still in transition)
    // 3. Second drain: child3, child4 execute (queue fully drained)
    // 4. Only child3 and child4 get cleaned up from childToParentOrder
    // 5. child1 and child2 are left with stale parent reference

    val parentATag = 100
    val parentBTag = 200
    val child1Tag = 300
    val child2Tag = 400
    val child3Tag = 500
    val child4Tag = 600

    val parentAView = createView(parentATag)
    val parentBView = createView(parentBTag)
    val childView1 = createView(child1Tag)
    val childView2 = createView(child2Tag)
    val childView3 = createView(child3Tag)
    val childView4 = createView(child4Tag)

    activity.setContentView(parentAView)

    // Add all children to parent A
    surfaceMountingManager.addViewAt(parentATag, child1Tag, 0)
    surfaceMountingManager.addViewAt(parentATag, child2Tag, 1)
    surfaceMountingManager.addViewAt(parentATag, child3Tag, 2)
    surfaceMountingManager.addViewAt(parentATag, child4Tag, 3)
    assertThat(parentAView.childCount).isEqualTo(4)

    // Mark all children as in transition
    parentAView.startViewTransition(childView1)
    parentAView.startViewTransition(childView2)
    parentAView.startViewTransition(childView3)
    parentAView.startViewTransition(childView4)
    surfaceMountingManager.markViewInTransition(child1Tag, true)
    surfaceMountingManager.markViewInTransition(child2Tag, true)
    surfaceMountingManager.markViewInTransition(child3Tag, true)
    surfaceMountingManager.markViewInTransition(child4Tag, true)

    val latchA = CountDownLatch(2)
    childView1.doOnDetach {
      latchA.countDown()
    }
    childView2.doOnDetach {
      latchA.countDown()
    }
    val latchB = CountDownLatch(2)
    childView3.doOnDetach {
      latchB.countDown()
    }
    childView4.doOnDetach {
      latchB.countDown()
    }

    // Queue removes from parent A
    surfaceMountingManager.removeViewAt(child4Tag, parentATag, 3)
    surfaceMountingManager.removeViewAt(child3Tag, parentATag, 2)
    surfaceMountingManager.removeViewAt(child2Tag, parentATag, 1)
    surfaceMountingManager.removeViewAt(child1Tag, parentATag, 0)

    // Queue adds to parent B (this is where we'll detect the bug)
    surfaceMountingManager.addViewAt(parentBTag, child1Tag, 0)
    surfaceMountingManager.addViewAt(parentBTag, child2Tag, 1)
    surfaceMountingManager.addViewAt(parentBTag, child3Tag, 2)
    surfaceMountingManager.addViewAt(parentBTag, child4Tag, 3)

    // At this point:
    // - parentQueues[parentA] = [Remove(child4), Remove(child3), Remove(child2), Remove(child1)]
    // - parentQueues[parentB] = [Add(child1), Add(child2), Add(child3), Add(child4)]
    // - childToParentOrder[child1] = [parentA, parentB]
    // - childToParentOrder[child2] = [parentA, parentB]
    // - childToParentOrder[child3] = [parentA, parentB]
    // - childToParentOrder[child4] = [parentA, parentB]

    // First partial drain: Mark child4 and child3 as ready
    // This will execute Remove(child4) and Remove(child3), then block on Remove(child2)
    surfaceMountingManager.markViewInTransition(child4Tag, false)
    surfaceMountingManager.markViewInTransition(child3Tag, false)
    parentAView.endViewTransition(childView4)
    parentAView.endViewTransition(childView3)

    // Partial drain happened: child1 and child2 removed, but child3 blocks the queue
    // Bug: child1 and child2 are NOT cleaned up from childToParentOrder yet
    assertThat(latchB.await(1, java.util.concurrent.TimeUnit.SECONDS)).isTrue()
    Shadows.shadowOf(Looper.getMainLooper()).idle()

    // Second full drain: Mark child2 and child1 as ready
    // This will execute Remove(child2) and Remove(child1), fully draining parent A's queue
    surfaceMountingManager.markViewInTransition(child2Tag, false)
    surfaceMountingManager.markViewInTransition(child1Tag, false)
    parentAView.endViewTransition(childView2)
    parentAView.endViewTransition(childView1)

    assertThat(latchA.await(1, java.util.concurrent.TimeUnit.SECONDS)).isTrue()
    Shadows.shadowOf(Looper.getMainLooper()).idle()

    // Parent A should be fully drained
    assertThat(parentAView.childCount).isEqualTo(0)

    // Now all adds to parent B should execute
    // Bug: If child1 and child2 still have [parentA, parentB] in childToParentOrder,
    // their Add operations to parent B will be blocked (not "first in line")
    assertThat(parentBView.childCount).isEqualTo(4)
    assertThat(parentBView.getChildAt(0)).isEqualTo(childView1)
    assertThat(parentBView.getChildAt(1)).isEqualTo(childView2)
    assertThat(parentBView.getChildAt(2)).isEqualTo(childView3)
    assertThat(parentBView.getChildAt(3)).isEqualTo(childView4)

    // Verify coordinator is fully clean
    val coordinator = getCoordinator()
    assertThat(coordinator.isEmpty()).isTrue()
  }

  private fun createView(tag: Int): ViewGroup {
    val viewType = "RCTView"
    val props = Arguments.createMap()
    val stateWrapper = null
    val eventEmitter = null

    surfaceMountingManager.createView(
      viewType,
      tag,
      props,
      stateWrapper,
      eventEmitter,
      true,
    )

    return surfaceMountingManager.getView(tag) as ViewGroup
  }

  @Test
  fun testViewNotMarkedButWithParent_worksAsWell() {
    val parent1Id = 100
    val parent2Id = 200
    val childId = 300

    val parent1View = createView(parent1Id)
    val parent2View = createView(parent2Id)
    val childView = createView(childId)

    activity.setContentView(parent1View)

    surfaceMountingManager.addViewAt(parent1Id, childId, 0)
    assertThat(parent1View.childCount).isEqualTo(1)

    // Manual transaction, not using markViewInTransition
    parent1View.startViewTransition(childView)
    parent1View.removeView(childView)

    // Now try adding to new parent, this should be queued
    assertThat(childView.parent).isNotNull()
    surfaceMountingManager.addViewAt(parent2Id, childId, 0)

    val latch = CountDownLatch(1)
    childView.doOnDetach {
      latch.countDown()
    }

    parent1View.endViewTransition(childView)
    assertThat(latch.await(1, java.util.concurrent.TimeUnit.SECONDS)).isTrue()
    Shadows.shadowOf(Looper.getMainLooper()).idle()

    assertThat(parent1View.childCount).isEqualTo(0)
    assertThat(parent2View.childCount).isEqualTo(1)
    assertThat(parent2View.getChildAt(0)).isEqualTo(childView)
  }

  private fun getCoordinator(): ViewTransitionCoordinator {
    val coordinatorField = SurfaceMountingManager::class.java.getDeclaredField("mViewTransitionCoordinator")
    coordinatorField.isAccessible = true
    return coordinatorField.get(surfaceMountingManager) as ViewTransitionCoordinator
  }
}
