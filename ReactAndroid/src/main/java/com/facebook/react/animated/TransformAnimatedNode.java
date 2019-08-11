/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.animated;

import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import java.util.ArrayList;
import java.util.List;

/**
 * Native counterpart of transform animated node (see AnimatedTransform class in
 * AnimatedImplementation.js)
 */
/* package */ class TransformAnimatedNode extends AnimatedNode {

  private class TransformConfig {
    public String mProperty;
  }

  private class AnimatedTransformConfig extends TransformConfig {
    public int mNodeTag;
  }

  private class StaticTransformConfig extends TransformConfig {
    public double mValue;
  }

  private final NativeAnimatedNodesManager mNativeAnimatedNodesManager;
  private final List<TransformConfig> mTransformConfigs;

  TransformAnimatedNode(ReadableMap config, NativeAnimatedNodesManager nativeAnimatedNodesManager) {
    ReadableArray transforms = config.getArray("transforms");
    mTransformConfigs = new ArrayList<>(transforms.size());
    for (int i = 0; i < transforms.size(); i++) {
      ReadableMap transformConfigMap = transforms.getMap(i);
      String property = transformConfigMap.getString("property");
      String type = transformConfigMap.getString("type");
      if (type.equals("animated")) {
        AnimatedTransformConfig transformConfig = new AnimatedTransformConfig();
        transformConfig.mProperty = property;
        transformConfig.mNodeTag = transformConfigMap.getInt("nodeTag");
        mTransformConfigs.add(transformConfig);
      } else {
        StaticTransformConfig transformConfig = new StaticTransformConfig();
        transformConfig.mProperty = property;
        transformConfig.mValue = transformConfigMap.getDouble("value");
        mTransformConfigs.add(transformConfig);
      }
    }
    mNativeAnimatedNodesManager = nativeAnimatedNodesManager;
  }

  public void collectViewUpdates(JavaOnlyMap propsMap) {
    List<JavaOnlyMap> transforms = new ArrayList<>(mTransformConfigs.size());

    for (TransformConfig transformConfig : mTransformConfigs) {
      double value;
      if (transformConfig instanceof AnimatedTransformConfig) {
        int nodeTag = ((AnimatedTransformConfig) transformConfig).mNodeTag;
        AnimatedNode node = mNativeAnimatedNodesManager.getNodeById(nodeTag);
        if (node == null) {
          throw new IllegalArgumentException("Mapped style node does not exists");
        } else if (node instanceof ValueAnimatedNode) {
          value = ((ValueAnimatedNode) node).getValue();
        } else {
          throw new IllegalArgumentException(
              "Unsupported type of node used as a transform child " + "node " + node.getClass());
        }
      } else {
        value = ((StaticTransformConfig) transformConfig).mValue;
      }

      transforms.add(JavaOnlyMap.of(transformConfig.mProperty, value));
    }

    propsMap.putArray("transform", JavaOnlyArray.from(transforms));
  }
}
