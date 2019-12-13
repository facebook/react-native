/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.util.ArrayList;
import java.util.List;

/** Base class for all Animated.js library node types that can be created on the "native" side. */
/*package*/ abstract class AnimatedNode {

  public static final int INITIAL_BFS_COLOR = 0;

  private static final int DEFAULT_ANIMATED_NODE_CHILD_COUNT = 1;

  /*package*/ @Nullable List<AnimatedNode> mChildren; /* lazy-initialized when a child is added */
  /*package*/ int mActiveIncomingNodes = 0;
  /*package*/ int mBFSColor = INITIAL_BFS_COLOR;
  /*package*/ int mTag = -1;

  public final void addChild(AnimatedNode child) {
    if (mChildren == null) {
      mChildren = new ArrayList<>(DEFAULT_ANIMATED_NODE_CHILD_COUNT);
    }
    Assertions.assertNotNull(mChildren).add(child);
    child.onAttachedToNode(this);
  }

  public final void removeChild(AnimatedNode child) {
    if (mChildren == null) {
      return;
    }
    child.onDetachedFromNode(this);
    mChildren.remove(child);
  }

  /**
   * Subclasses may want to override this method in order to store a reference to the parent of a
   * given node that can then be used to calculate current node's value in {@link #update}. In that
   * case it is important to also override {@link #onDetachedFromNode} to clear that reference once
   * current node gets detached.
   */
  public void onAttachedToNode(AnimatedNode parent) {}

  /** See {@link #onAttachedToNode} */
  public void onDetachedFromNode(AnimatedNode parent) {}

  /**
   * This method will be run on each node at most once every repetition of the animation loop. It
   * will be executed on a node only when all the node's parent has already been updated. Therefore
   * it can be used to calculate node's value.
   */
  public void update() {}

  /**
   *
   * Method used by StyleAnimatedNode and PropAnimatedNode to build property maps
   */
  protected static void addProp(WritableMap propMap, String key, Object value) {
    if (value == null) {
      propMap.putNull(key);
    } else if (value instanceof Double) {
      propMap.putDouble(key, (Double) value);
    } else if (value instanceof Integer) {
      propMap.putInt(key, (int) value);
    } else if (value instanceof Number) {
      propMap.putDouble(key, ((Number) value).doubleValue());
    } else if (value instanceof Boolean) {
      propMap.putBoolean(key, (Boolean) value);
    } else if (value instanceof String) {
      propMap.putString(key, (String) value);
    } else if (value instanceof WritableArray) {
      propMap.putArray(key, (WritableArray)value);
    } else if (value instanceof WritableMap) {
      propMap.putMap(key, (WritableMap)value);
    } else {
      throw new IllegalStateException("Unknown type of animated value");
    }
  }
}
