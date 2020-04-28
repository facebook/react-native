/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.animated;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.UIManager;
import java.util.HashMap;
import java.util.Map;

/**
 * Animated node that represents view properties. There is a special handling logic implemented for
 * the nodes of this type in {@link NativeAnimatedNodesManager} that is responsible for extracting a
 * map of updated properties, which can be then passed down to the view.
 */
/*package*/ class PropsAnimatedNode extends AnimatedNode {

  private int mConnectedViewTag = -1;
  private final NativeAnimatedNodesManager mNativeAnimatedNodesManager;
  private final UIManager mUIManager;
  private final Map<String, Integer> mPropNodeMapping;
  private final JavaOnlyMap mPropMap;

  PropsAnimatedNode(
      ReadableMap config,
      NativeAnimatedNodesManager nativeAnimatedNodesManager,
      UIManager uiManager) {
    ReadableMap props = config.getMap("props");
    ReadableMapKeySetIterator iter = props.keySetIterator();
    mPropNodeMapping = new HashMap<>();
    while (iter.hasNextKey()) {
      String propKey = iter.nextKey();
      int nodeIndex = props.getInt(propKey);
      mPropNodeMapping.put(propKey, nodeIndex);
    }
    mPropMap = new JavaOnlyMap();
    mNativeAnimatedNodesManager = nativeAnimatedNodesManager;
    mUIManager = uiManager;
  }

  public void connectToView(int viewTag) {
    if (mConnectedViewTag != -1) {
      throw new JSApplicationIllegalArgumentException(
          "Animated node " + mTag + " is " + "already attached to a view");
    }
    mConnectedViewTag = viewTag;
  }

  public void disconnectFromView(int viewTag) {
    if (mConnectedViewTag != viewTag) {
      throw new JSApplicationIllegalArgumentException(
          "Attempting to disconnect view that has "
              + "not been connected with the given animated node");
    }

    mConnectedViewTag = -1;
  }

  public void restoreDefaultValues() {
    ReadableMapKeySetIterator it = mPropMap.keySetIterator();
    while (it.hasNextKey()) {
      mPropMap.putNull(it.nextKey());
    }

    mUIManager.synchronouslyUpdateViewOnUIThread(mConnectedViewTag, mPropMap);
  }

  public final void updateView() {
    if (mConnectedViewTag == -1) {
      return;
    }
    for (Map.Entry<String, Integer> entry : mPropNodeMapping.entrySet()) {
      @Nullable AnimatedNode node = mNativeAnimatedNodesManager.getNodeById(entry.getValue());
      if (node == null) {
        throw new IllegalArgumentException("Mapped property node does not exists");
      } else if (node instanceof StyleAnimatedNode) {
        ((StyleAnimatedNode) node).collectViewUpdates(mPropMap);
      } else if (node instanceof ValueAnimatedNode) {
        Object animatedObject = ((ValueAnimatedNode) node).getAnimatedObject();
        if (animatedObject instanceof String) {
          mPropMap.putString(entry.getKey(), (String) animatedObject);
        } else {
          mPropMap.putDouble(entry.getKey(), ((ValueAnimatedNode) node).getValue());
        }
      } else {
        throw new IllegalArgumentException(
            "Unsupported type of node used in property node " + node.getClass());
      }
    }

    mUIManager.synchronouslyUpdateViewOnUIThread(mConnectedViewTag, mPropMap);
  }
}
