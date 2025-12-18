/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting

import android.view.View
import androidx.annotation.VisibleForTesting
import com.facebook.common.logging.FLog
import com.facebook.infer.annotation.ThreadConfined
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.build.ReactBuildConfig
import java.util.LinkedList

/**
 * Coordinates pending view operations across Android view transitions.
 *
 * When Android starts a view transition (via ViewGroup.startViewTransition), views cannot be
 * immediately added or removed from the view hierarchy until the transition completes and the
 * view detaches. This coordinator manages a queue of pending operations and ensures they execute
 * in the correct order once transitions complete.
 *
 * Key responsibilities:
 * - Track which views are currently in transitions
 * - Queue operations that can't execute immediately
 * - Coordinate cross-parent dependencies (when a view needs to be added to multiple parents)
 * - Drain queues when views become ready
 */
@ThreadConfined(ThreadConfined.UI)
internal class ViewTransitionCoordinator {

  companion object {
    private const val TAG = "ViewTransitionCoordinator"
  }

  // Views currently in Android transitions (via ViewGroup.startViewTransition)
  private val viewsInTransition = mutableSetOf<Int>()

  // Per-parent queues of pending operations
  // Key: parent tag, Value: list of operations waiting to execute
  private val parentQueues = mutableMapOf<Int, MutableList<ViewOperation>>()

  // Key: child tag, Value: ordered list of parent tags waiting for this child
  private val childToParentOrder = mutableMapOf<Int, LinkedList<Int>>()

  /**
   * Mark a view as being in or out of an Android transition.
   */
  fun markViewInTransition(
    tag: Int,
    transitioning: Boolean,
    view: View?,
    onDetach: Runnable
  ) {
    UiThreadUtil.assertOnUiThread()

    if (transitioning) {
      if (viewsInTransition.contains(tag)) {
        return
      }

      viewsInTransition.add(tag)

      if (view != null) {
        // TODO: we re-create the listener every time for the same view; consider caching it by view
        val listener = object : View.OnAttachStateChangeListener {
          override fun onViewAttachedToWindow(v: View) {}

          override fun onViewDetachedFromWindow(v: View) {
            view.removeOnAttachStateChangeListener(this)
            // Looking at how endViewTransition is implemented, dispatchDetachedFromWindow
            // gets called _before_ the parent relation is removed, so we need to post this to the end of the frame:
            UiThreadUtil.runOnUiThread {
              viewsInTransition.remove(tag)
              onDetach.run()
            }
          }
        }
        view.addOnAttachStateChangeListener(listener)
      }
    } else {
      viewsInTransition.remove(tag)
      // NOTE: we don't remove the listener here, as "endViewTransition" may be called
      // before the view actually detaches. The listener will remove itself when the view detaches at some point.
    }
  }

  @JvmOverloads
  fun shouldEnqueueOperation(childTag: Int, parentTag: Int, checkTransitionStatus: Boolean = true): Boolean {
    if (childToParentOrder.containsKey(childTag)) {
      // If the child is queued on some parents we can be sure that the operation needs to be queued
      return true
    }

    // If parent has a queue, everything goes to the queue to maintain order
    if (parentQueues.containsKey(parentTag)) {
      return true
    }

    // If child is transitioning, we need to queue
    if (checkTransitionStatus && viewsInTransition.contains(childTag)) {
      return true
    }

    return false
  }

  fun enqueueOperation(operation: ViewOperation) {
    UiThreadUtil.assertOnUiThread()

    val parentTag = operation.parentTag
    val childTag = operation.childTag

    val queue = parentQueues.getOrPut(parentTag) { mutableListOf() }
    queue.add(operation)

    // Track cross-queue ordering for add operations
    val orderList = childToParentOrder.getOrPut(childTag) { LinkedList() }
    val lastItem = orderList.lastOrNull()
    if (lastItem != parentTag) {
      orderList.add(parentTag)
    }

    if (ReactBuildConfig.DEBUG) {
      FLog.d(
        TAG,
        "Enqueued operation: $operation"
      )
    }
  }

  private var drainingParentTag: Int? = null
  /**
   * Drain all pending operations for a specific child tag.
   * This is called when a child view becomes ready (e.g., transitions complete, view detaches).
   */
  fun drainOperationsForChild(childTag: Int, manager: SurfaceMountingManager) {
    UiThreadUtil.assertOnUiThread()

    var madeProgress: Boolean
    do {
      val parentOrderForChild = childToParentOrder[childTag]
      if (parentOrderForChild.isNullOrEmpty()) {
        break
      }

      val parentTag = parentOrderForChild.first
      val queue = parentQueues[parentTag]

      if (queue == null) {
        error("No queue for parentTag=$parentTag. This should not happen as childToParentOrder indicates there are pending operations. childToParentOrder=$childToParentOrder")
      }
      if (drainingParentTag == parentTag) {
        // we are already draining this parent (re-entrancy), avoid infinite loop
        break
      }
      drainingParentTag = parentTag

      madeProgress = drainQueue(parentTag, queue, manager)

      if (queue.isEmpty()) {
        parentQueues.remove(parentTag)
      }

    } while (madeProgress)

    drainingParentTag = null
  }

  private val executedChildIdsForParent = mutableMapOf<Int, MutableSet<Int>>()
  /**
   * Drain a single parent's queue, executing all ready operations.
   *
   * @return true if any progress was made (operations executed)
   */
  private fun drainQueue(
    parentTag: Int,
    queue: MutableList<ViewOperation>,
    manager: SurfaceMountingManager
  ): Boolean {
    var madeProgress = false

    val iterator = queue.iterator()
    while (iterator.hasNext()) {
      val operation = iterator.next()

      if (!operation.isReadyToExecute(this) || viewsInTransition.contains(operation.childTag)) {
        break
      }

      if (ReactBuildConfig.DEBUG) {
        FLog.d(
          TAG,
          "Executing $operation"
        )
      }

      iterator.remove() // remove before executing, as execution may re-enter draining

      val executedChildIds = executedChildIdsForParent.getOrPut(parentTag) { mutableSetOf() }
      executedChildIds.add(operation.childTag)

      operation.execute(manager)
      madeProgress = true
    }

    val executedChildIds = executedChildIdsForParent[parentTag]
    if (queue.isEmpty() && executedChildIds != null) {
      // we drained the whole queue for this parent, now we need to remove this parent from all executed child's order lists
      for (childId in executedChildIds) {
        val parentOrderForChild = childToParentOrder[childId]
        if (parentOrderForChild?.first != parentTag) {
          error("Internal error: operation parentTag $parentTag is not first in childToParentOrder for childTag $childId: $childToParentOrder")
        }
        parentOrderForChild.removeFirst()
        if (parentOrderForChild.isEmpty()) {
          childToParentOrder.remove(childId)
        }
      }
      executedChildIdsForParent.remove(parentTag)
    }

    return madeProgress
  }


  fun isFirstInLineForChild(childTag: Int, parentTag: Int): Boolean {
    val orderList = childToParentOrder[childTag]
    return orderList.isNullOrEmpty() || orderList.first == parentTag
  }

  fun clearAllPending() {
    parentQueues.clear()
    childToParentOrder.clear()
    viewsInTransition.clear()
  }

  @VisibleForTesting
  fun isEmpty(): Boolean {
    return parentQueues.isEmpty() && childToParentOrder.isEmpty() && viewsInTransition.isEmpty()
  }
}
