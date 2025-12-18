/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting

import android.view.View
import android.view.ViewGroup
import com.facebook.infer.annotation.ThreadConfined

/**
 * These ViewOperations are used by [ViewTransitionCoordinator] when a view is marked
 * as in transition: https://developer.android.com/reference/android/view/ViewGroup#startViewTransition(android.view.View)
 */
internal interface ViewOperation {
    val childTag: Int
    val parentTag: Int
    val index: Int?

    /**
     * Check if this operation is ready to execute.
     * An operation is ready when:
     * 1. The child view is not attached to any parent (for add operations)
     * 2. This operation is first in line for the child (determined by coordinator)
     */
    fun isReadyToExecute(coordinator: ViewTransitionCoordinator): Boolean

    /**
     * Execute the operation. This is called by the coordinator when the operation
     * becomes ready to execute.
     */
    fun execute(manager: SurfaceMountingManager)
}

@ThreadConfined(ThreadConfined.UI)
internal data class AddViewOperation(
    override val childTag: Int,
    override val parentTag: Int,
    override val index: Int,
    val parent: ViewGroup,
    val child: View
) : ViewOperation {

    override fun isReadyToExecute(coordinator: ViewTransitionCoordinator): Boolean {
        if (child.parent != null) {
            // The child is still attached to a parent, so we can't add it yet
            return false
        }

        return coordinator.isFirstInLineForChild(childTag, parentTag)
    }

    override fun execute(manager: SurfaceMountingManager) {
        manager.executeAddViewOperation(this)
    }

    override fun toString(): String {
        return "AddViewOperation(parent=$parentTag, child=$childTag, index=$index)"
    }
}


@ThreadConfined(ThreadConfined.UI)
internal data class RemoveViewOperation(
    override val childTag: Int,
    override val parentTag: Int,
    override val index: Int,
    val parentView: ViewGroup
) : ViewOperation {

    override fun isReadyToExecute(coordinator: ViewTransitionCoordinator): Boolean {
        // Remove operations are always ready - we just need to maintain order
        // within the queue for the parent
        return coordinator.isFirstInLineForChild(childTag, parentTag)
    }

    override fun execute(manager: SurfaceMountingManager) {
        manager.executeRemoveViewOperation(this)
    }

    override fun toString(): String {
        return "RemoveViewOperation(parent=$parentTag, child=$childTag, index=$index)"
    }
}

/** Delete operations don't have a parent view, so we use a hardcoded value */
public const val DELETE_VIEW_PARENT_TAG: Int = -1337

@ThreadConfined(ThreadConfined.UI)
internal data class DeleteViewOperation(
  override val childTag: Int,
  override val parentTag: Int,
  override val index: Int?
) : ViewOperation {
  constructor(reactTag: Int) : this(reactTag, DELETE_VIEW_PARENT_TAG, null)

  override fun isReadyToExecute(coordinator: ViewTransitionCoordinator): Boolean {
    // Remove operations are always ready - we just need to maintain order
    // within the queue for the parent
    return coordinator.isFirstInLineForChild(childTag, parentTag)
  }

  override fun execute(manager: SurfaceMountingManager) {
    manager.executeDeleteViewOperation(this)
  }

  override fun toString(): String {
    return "DeleteViewOperation(child=$childTag)"
  }
}
