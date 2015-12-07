/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import java.util.ArrayDeque;

/**
 * Shadow node hierarchy by itself cannot display UI, it is only a representation of what UI should
 * be from JavaScript perspective. StateBuilder is a helper class that can walk the shadow node tree
 * and collect information that can then be passed to UI thread and applied to a hierarchy of Views
 * that Android finally can display.
 */
/* package */ final class StateBuilder {

  private final FlatUIViewOperationQueue mOperationsQueue;

  // DrawCommands
  private final ArrayDeque<DrawCommand> mDrawCommands = new ArrayDeque<>();
  private DrawCommand[] mPreviousDrawCommands = DrawCommand.EMPTY_ARRAY;
  private int mPreviousDrawCommandsIndex;

  /* package */ StateBuilder(FlatUIViewOperationQueue operationsQueue) {
    mOperationsQueue = operationsQueue;
  }

  /**
   * Given a root of the laid-out shadow node hierarchy, walks the tree and generates an array of
   * DrawCommands that will then mount in UI thread to a root FlatViewGroup so that it can draw.
   */
  /* package*/ void applyUpdates(FlatRootShadowNode node) {
    collectStateAndUpdateViewBounds(node, 0, 0);
  }

  /**
   * Adds a DrawCommand for current mountable node.
   */
  /* package */ void addDrawCommand(AbstractDrawCommand drawCommand) {
    if (mPreviousDrawCommandsIndex < mPreviousDrawCommands.length &&
        mPreviousDrawCommands[mPreviousDrawCommandsIndex] == drawCommand) {
      ++mPreviousDrawCommandsIndex;
    } else {
      mPreviousDrawCommandsIndex = mPreviousDrawCommands.length + 1;
    }

    mDrawCommands.addLast(drawCommand);
  }

  /**
   * Updates boundaries of a View that a give nodes maps to.
   */
  private void updateViewBounds(
      FlatRootShadowNode node,
      int tag,
      float leftInParent,
      float topInParent,
      float rightInParent,
      float bottomInParent) {
    int viewLeft = Math.round(leftInParent);
    int viewTop = Math.round(topInParent);
    int viewRight = Math.round(rightInParent);
    int viewBottom = Math.round(bottomInParent);

    if (node.getViewLeft() == viewLeft && node.getViewTop() == viewTop &&
        node.getViewRight() == viewRight && node.getViewBottom() == viewBottom) {
      // nothing changed.
      return;
    }

    // this will optionally measure and layout the View this node maps to.
    node.setViewBounds(viewLeft, viewTop, viewRight, viewBottom);
    mOperationsQueue.enqueueUpdateViewBounds(tag, viewLeft, viewTop, viewRight, viewBottom);
  }

  /**
   * Collects state (DrawCommands) for a given node that will mount to a View.
   */
  private void collectStateForMountableNode(
      FlatRootShadowNode node,
      int tag,
      float width,
      float height) {
    // save
    int d = mDrawCommands.size();
    DrawCommand[] previousDrawCommands = mPreviousDrawCommands;
    int previousDrawCommandsIndex = mPreviousDrawCommandsIndex;

    // reset
    mPreviousDrawCommands = node.getDrawCommands();
    mPreviousDrawCommandsIndex = 0;

    collectStateRecursively(node, 0, 0, width, height);

    if (mPreviousDrawCommandsIndex != mPreviousDrawCommands.length) {
      // DrawCommands changes, need to re-mount them and re-draw the View.
      DrawCommand[] drawCommands = extractDrawCommands(d);
      node.setDrawCommands(drawCommands);

      mOperationsQueue.enqueueUpdateMountState(tag, drawCommands);
    }

    // restore
    mPreviousDrawCommandsIndex = previousDrawCommandsIndex;
    mPreviousDrawCommands = previousDrawCommands;
  }

  /**
   * Returns all DrawCommands collectes so far starting from a given index.
   */
  private DrawCommand[] extractDrawCommands(int lowerBound) {
    int upperBound = mDrawCommands.size();
    int size = upperBound - lowerBound;
    if (size == 0) {
      // avoid allocating empty array
      return DrawCommand.EMPTY_ARRAY;
    }

    DrawCommand[] drawCommands = new DrawCommand[size];
    for (int i = 0; i < size; ++i) {
      drawCommands[i] = mDrawCommands.pollFirst();
    }

    return drawCommands;
  }

  /**
   * Recursively walks node tree from a given node and collects DrawCommands.
   */
  private void collectStateRecursively(
      FlatShadowNode node,
      float left,
      float top,
      float right,
      float bottom) {
    if (node.hasNewLayout()) {
      node.markLayoutSeen();
    }

    node.collectState(this, left, top, right, bottom);

    for (int i = 0, childCount = node.getChildCount(); i != childCount; ++i) {
      FlatShadowNode child = (FlatShadowNode) node.getChildAt(i);

      float childLeft = left + child.getLayoutX();
      float childTop = top + child.getLayoutY();
      float childRight = childLeft + child.getLayoutWidth();
      float childBottom = childTop + child.getLayoutHeight();
      collectStateRecursively(child, childLeft, childTop, childRight, childBottom);
    }
  }

  /**
   * Collects state and updates View boundaries for a given root node.
   */
  private void collectStateAndUpdateViewBounds(
      FlatRootShadowNode node,
      float parentLeft,
      float parentTop) {
    int tag = node.getReactTag();

    float width = node.getLayoutWidth();
    float height = node.getLayoutHeight();

    float left = parentLeft + node.getLayoutX();
    float top = parentTop + node.getLayoutY();
    float right = left + width;
    float bottom = top + height;

    collectStateForMountableNode(node, tag, width, height);

    updateViewBounds(node, tag, left, top, right, bottom);
  }
}
