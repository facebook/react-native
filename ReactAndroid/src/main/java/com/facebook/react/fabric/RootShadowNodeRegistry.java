/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import com.facebook.react.uimanager.ReactShadowNode;
import java.util.concurrent.ConcurrentHashMap;
import javax.annotation.concurrent.ThreadSafe;

/**
 * Simple container class to keep track of {@link ReactShadowNode}s that represents the Root
 * Shadow Nodes of a {@link FabricUIManager}.
 */
@ThreadSafe
public class RootShadowNodeRegistry {

  private final ConcurrentHashMap<Integer, ReactShadowNode> mTagsToRootNodes = new ConcurrentHashMap<>();

  /**
   * Registers the {@link ReactShadowNode} received as a parameter as a RootShadowNode.
   */
  public synchronized void registerNode(ReactShadowNode node) {
    mTagsToRootNodes.put(node.getReactTag(), node);
  }

  /**
   * Register the {@link ReactShadowNode} received as a parameter as a RootShadowNode, replacing
   * the previous RootShadowNode associated for the {@link ReactShadowNode#getReactTag()}
   */
  public void replaceNode(ReactShadowNode node) {
    mTagsToRootNodes.replace(node.getReactTag(), node);
  }

  public void removeNode(Integer tag) {
    mTagsToRootNodes.remove(tag);
  }

  public ReactShadowNode getNode(int tag) {
    return mTagsToRootNodes.get(tag);
  }

}
