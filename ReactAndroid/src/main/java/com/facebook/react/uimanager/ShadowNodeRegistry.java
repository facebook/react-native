/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import android.util.SparseArray;
import android.util.SparseBooleanArray;

/**
 * Simple container class to keep track of {@link ReactShadowNode}s associated with a particular
 * UIManagerModule instance.
 */
/*package*/ class ShadowNodeRegistry {

  private final SparseArray<ReactShadowNode> mTagsToCSSNodes;
  private final SparseBooleanArray mRootTags;

  public ShadowNodeRegistry() {
    mTagsToCSSNodes = new SparseArray<>();
    mRootTags = new SparseBooleanArray();
  }

  public void addRootNode(ReactShadowNode node) {
    int tag = node.getReactTag();
    mTagsToCSSNodes.put(tag, node);
    mRootTags.put(tag, true);
  }

  public void removeRootNode(int tag) {
    if (!mRootTags.get(tag)) {
      throw new IllegalViewOperationException(
          "View with tag " + tag + " is not registered as a root view");
    }

    mTagsToCSSNodes.remove(tag);
    mRootTags.delete(tag);
  }

  public void addNode(ReactShadowNode node) {
    mTagsToCSSNodes.put(node.getReactTag(), node);
  }

  public void removeNode(int tag) {
    if (mRootTags.get(tag)) {
      throw new IllegalViewOperationException(
          "Trying to remove root node " + tag + " without using removeRootNode!");
    }
    mTagsToCSSNodes.remove(tag);
  }

  public ReactShadowNode getNode(int tag) {
    return mTagsToCSSNodes.get(tag);
  }

  public boolean isRootNode(int tag) {
    return mRootTags.get(tag);
  }

  public int getRootNodeCount() {
    return mRootTags.size();
  }

  public int getRootTag(int index) {
    return mRootTags.keyAt(index);
  }
}
