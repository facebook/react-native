package com.facebook.react.animated;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import javax.annotation.Nullable;

/**
 * Animated node that corresponds to {@code AnimatedInterpolation} from AnimatedImplementation.js.
 *
 * Currently only a linear interpolation is supported on an input range of an arbitrary size.
 */
/*package*/ class InterpolationAnimatedNode extends ValueAnimatedNode {

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
      double outputMax) {
    return outputMin + (outputMax - outputMin) *
      (value - inputMin) / (inputMax - inputMin);
  }

  /*package*/ static double interpolate(double value, double[] inputRange, double[] outputRange) {
    int rangeIndex = findRangeIndex(value, inputRange);
    return interpolate(
      value,
      inputRange[rangeIndex],
      inputRange[rangeIndex + 1],
      outputRange[rangeIndex],
      outputRange[rangeIndex + 1]);
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

  private final double mInputRange[];
  private final double mOutputRange[];
  private @Nullable ValueAnimatedNode mParent;

  public InterpolationAnimatedNode(ReadableMap config) {
    mInputRange = fromDoubleArray(config.getArray("inputRange"));
    mOutputRange = fromDoubleArray(config.getArray("outputRange"));
  }

  @Override
  public void onAttachedToNode(AnimatedNode parent) {
    if (mParent != null) {
      throw new IllegalStateException("Parent already attached");
    }
    if (!(parent instanceof ValueAnimatedNode)) {
      throw new IllegalArgumentException("Parent is of an invalid type");
    }
    mParent = (ValueAnimatedNode) parent;
  }

  @Override
  public void onDetachedFromNode(AnimatedNode parent) {
    if (parent != mParent) {
      throw new IllegalArgumentException("Invalid parent node provided");
    }
    mParent = null;
  }

  @Override
  public void update() {
    if (mParent == null) {
      throw new IllegalStateException("Trying to update interpolation node that has not been " +
        "attached to the parent");
    }
    mValue = interpolate(mParent.mValue, mInputRange, mOutputRange);
  }
}
