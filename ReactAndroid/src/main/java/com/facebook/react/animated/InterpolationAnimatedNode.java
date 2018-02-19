/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.animated;

import com.facebook.react.bridge.JSApplicationCausedNativeException;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import javax.annotation.Nullable;

/**
 * Animated node that corresponds to {@code AnimatedInterpolation} from AnimatedImplementation.js.
 *
 * Currently only a linear interpolation is supported on an input range of an arbitrary size.
 */
/*package*/ class InterpolationAnimatedNode extends ValueAnimatedNode {

  public static final String EXTRAPOLATE_TYPE_IDENTITY = "identity";
  public static final String EXTRAPOLATE_TYPE_CLAMP = "clamp";
  public static final String EXTRAPOLATE_TYPE_EXTEND = "extend";

  private static int[] fromIntArray(ReadableArray ary) {
    int[] res = new int[ary.size()];
    for (int i = 0; i < res.length; i++) {
      res[i] = ary.getInt(i);
    }
    return res;
  }

  private static double[] fromDoubleArray(ReadableArray ary) {
    double[] res = new double[ary.size()];
    for (int i = 0; i < res.length; i++) {
      res[i] = ary.getDouble(i);
    }
    return res;
  }

  private static double interpolate(
      double value,
      double inputMin,
      double inputMax,
      double outputMin,
      double outputMax,
      String extrapolateLeft,
      String extrapolateRight) {
    double result = value;

    // Extrapolate
    if (result < inputMin) {
      switch (extrapolateLeft) {
        case EXTRAPOLATE_TYPE_IDENTITY:
          return result;
        case EXTRAPOLATE_TYPE_CLAMP:
          result = inputMin;
          break;
        case EXTRAPOLATE_TYPE_EXTEND:
          break;
        default:
          throw new JSApplicationIllegalArgumentException(
            "Invalid extrapolation type " + extrapolateLeft + "for left extrapolation");
      }
    }

    if (result > inputMax) {
      switch (extrapolateRight) {
        case EXTRAPOLATE_TYPE_IDENTITY:
          return result;
        case EXTRAPOLATE_TYPE_CLAMP:
          result = inputMax;
          break;
        case EXTRAPOLATE_TYPE_EXTEND:
          break;
        default:
          throw new JSApplicationIllegalArgumentException(
            "Invalid extrapolation type " + extrapolateRight + "for right extrapolation");
      }
    }

    return outputMin + (outputMax - outputMin) *
      (result - inputMin) / (inputMax - inputMin);
  }

  private static ValueAnimatedNode getValueAnimatedNode(
          NativeAnimatedNodesManager nativeAnimatedNodesManager,
          int tag) {
    AnimatedNode node = nativeAnimatedNodesManager.getNodeById(tag);
    Boolean invalid = node == null || !(node instanceof ValueAnimatedNode);
    if (invalid) {
      String error = "Illegal node ID set in outputRange of Animated.interpolate node";
      throw new JSApplicationCausedNativeException(error);
    }
    return (ValueAnimatedNode) node;
  }

  /*package*/ static double interpolate(
          NativeAnimatedNodesManager nativeAnimatedNodesManager,
          double value,
          double[] inputRange,
          int[] outputRangeNodeTags,
          String extrapolateLeft,
          String extrapolateRight) {
    int rangeIndex = findRangeIndex(value, inputRange);
    double inputStart = inputRange[rangeIndex];
    double inputEnd = inputRange[rangeIndex + 1];
    double outputStart = InterpolationAnimatedNode.getValueAnimatedNode(
            nativeAnimatedNodesManager,
            outputRangeNodeTags[rangeIndex]).getValue();
    double outputEnd = InterpolationAnimatedNode.getValueAnimatedNode(
            nativeAnimatedNodesManager,
            outputRangeNodeTags[rangeIndex + 1]).getValue();
    return InterpolationAnimatedNode.interpolate(
            value,
            inputStart,
            inputEnd,
            outputStart,
            outputEnd,
            extrapolateLeft,
            extrapolateRight
    );
  }

  private static int findRangeIndex(double value, double[] ranges) {
    int index;
    for (index = 1; index < ranges.length - 1; index++) {
      if (ranges[index] >= value) {
        break;
      }
    }
    return index - 1;
  }

  private final NativeAnimatedNodesManager mNativeAnimatedNodesManager;
  private @Nullable ValueAnimatedNode mParent;
  private final double mInputRange[];
  private final int mOutputRangeNodeTags[];
  private final String mExtrapolateLeft;
  private final String mExtrapolateRight;

  public InterpolationAnimatedNode(
          ReadableMap config,
          NativeAnimatedNodesManager nativeAnimatedNodesManager) {
    mNativeAnimatedNodesManager = nativeAnimatedNodesManager;
    mParent = (ValueAnimatedNode) nativeAnimatedNodesManager.getNodeById(config.getInt("parent"));
    mInputRange = fromDoubleArray(config.getArray("inputRange"));
    mOutputRangeNodeTags = fromIntArray(config.getArray("outputRange"));
    mExtrapolateLeft = config.getString("extrapolateLeft");
    mExtrapolateRight = config.getString("extrapolateRight");
  }

  @Override
  public void update() {
    if (mParent == null) {
      // The graph is in the middle of being created, just skip this
      // unattached node.
      return;
    }
    mValue = interpolate(
            mNativeAnimatedNodesManager,
            mParent.getValue(),
            mInputRange,
            mOutputRangeNodeTags,
            mExtrapolateLeft,
            mExtrapolateRight
    );
  }
}
