/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.animated;

import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.UIImplementation;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nullable;

/**
 * Animated node that represents view properties. There is a special handling logic implemented for
 * the nodes of this type in {@link NativeAnimatedNodesManager} that is responsible for extracting
 * a map of updated properties, which can be then passed down to the view.
 */
/*package*/ class PropsAnimatedNode extends AnimatedNode {

  /*package*/ int mConnectedViewTag = -1;

  private final NativeAnimatedNodesManager mNativeAnimatedNodesManager;
  private final Map<String, Integer> mPropMapping;

  PropsAnimatedNode(ReadableMap config, NativeAnimatedNodesManager nativeAnimatedNodesManager) {
    ReadableMap props = config.getMap("props");
    ReadableMapKeySetIterator iter = props.keySetIterator();
    mPropMapping = new HashMap<>();
    while (iter.hasNextKey()) {
      String propKey = iter.nextKey();
      int nodeIndex = props.getInt(propKey);
      mPropMapping.put(propKey, nodeIndex);
    }
    mNativeAnimatedNodesManager = nativeAnimatedNodesManager;
  }

  public final void updateView(UIImplementation uiImplementation) {
    if (mConnectedViewTag == -1) {
      throw new IllegalStateException("Node has not been attached to a view");
    }
    JavaOnlyMap propsMap = new JavaOnlyMap();
    for (Map.Entry<String, Integer> entry : mPropMapping.entrySet()) {
      @Nullable AnimatedNode node = mNativeAnimatedNodesManager.getNodeById(entry.getValue());
      if (node == null) {
        throw new IllegalArgumentException("Mapped property node does not exists");
      } else if (node instanceof StyleAnimatedNode) {
        ((StyleAnimatedNode) node).collectViewUpdates(propsMap);
      } else if (node instanceof ValueAnimatedNode) {
        propsMap.putDouble(entry.getKey(), ((ValueAnimatedNode) node).getValue());
      } else {
        throw new IllegalArgumentException("Unsupported type of node used in property node " +
            node.getClass());
      }
    }
    // TODO: Reuse propsMap and stylesDiffMap objects - note that in subsequent animation steps
    // for a given node most of the time we will be creating the same set of props (just with
    // different values). We can take advantage on that and optimize the way we allocate property
    // maps (we also know that updating view props doesn't retain a reference to the styles object).
    uiImplementation.synchronouslyUpdateViewOnUIThread(
      mConnectedViewTag,
      new ReactStylesDiffMap(propsMap));
  }
}
