/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import androidx.annotation.Nullable;
import androidx.core.graphics.ColorUtils;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Animated node that corresponds to {@code AnimatedInterpolation} from AnimatedImplementation.js.
 *
 * <p>Currently only a linear interpolation is supported on an input range of an arbitrary size.
 */
/*package*/ class InterpolationAnimatedNode extends ValueAnimatedNode {

  public static final String EXTRAPOLATE_TYPE_IDENTITY = "identity";
  public static final String EXTRAPOLATE_TYPE_CLAMP = "clamp";
  public static final String EXTRAPOLATE_TYPE_EXTEND = "extend";

  private static final Pattern sNumericPattern =
      Pattern.compile("[+-]?(\\d+\\.?\\d*|\\.\\d+)([eE][+-]?\\d+)?");

  private static final String COLOR_OUTPUT_TYPE = "color";

  private static double[] fromDoubleArray(ReadableArray ary) {
    double[] res = new double[ary.size()];
    for (int i = 0; i < res.length; i++) {
      res[i] = ary.getDouble(i);
    }
    return res;
  }

  private static int[] fromIntArray(ReadableArray ary) {
    int[] res = new int[ary.size()];
    for (int i = 0; i < res.length; i++) {
      res[i] = ary.getInt(i);
    }
    return res;
  }

  private static double[][] fromStringPattern(ReadableArray array) {
    int size = array.size();
    double[][] outputRange = new double[size][];

    // Match the first pattern into a List, since we don't know its length yet
    Matcher m = sNumericPattern.matcher(array.getString(0));
    List<Double> firstOutputRange = new ArrayList<>();
    while (m.find()) {
      firstOutputRange.add(Double.parseDouble(m.group()));
    }
    double[] firstOutputRangeArr = new double[firstOutputRange.size()];
    for (int i = 0; i < firstOutputRange.size(); i++) {
      firstOutputRangeArr[i] = firstOutputRange.get(i).doubleValue();
    }
    outputRange[0] = firstOutputRangeArr;

    for (int i = 1; i < size; i++) {
      double[] outputArr = new double[firstOutputRangeArr.length];

      int j = 0;
      m = sNumericPattern.matcher(array.getString(i));
      while (m.find() && j < firstOutputRangeArr.length) {
        outputArr[j++] = Double.parseDouble(m.group());
      }
      outputRange[i] = outputArr;
    }

    return outputRange;
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

    if (outputMin == outputMax) {
      return outputMin;
    }

    if (inputMin == inputMax) {
      if (value <= inputMin) {
        return outputMin;
      }
      return outputMax;
    }

    return outputMin + (outputMax - outputMin) * (result - inputMin) / (inputMax - inputMin);
  }

  /*package*/ static double interpolate(
      double value,
      double[] inputRange,
      double[] outputRange,
      String extrapolateLeft,
      String extrapolateRight) {
    int rangeIndex = findRangeIndex(value, inputRange);
    return interpolate(
        value,
        inputRange[rangeIndex],
        inputRange[rangeIndex + 1],
        outputRange[rangeIndex],
        outputRange[rangeIndex + 1],
        extrapolateLeft,
        extrapolateRight);
  }

  /*package*/ static int interpolateColor(double value, double[] inputRange, int[] outputRange) {
    int rangeIndex = findRangeIndex(value, inputRange);
    int outputMin = outputRange[rangeIndex];
    int outputMax = outputRange[rangeIndex + 1];
    if (outputMin == outputMax) {
      return outputMin;
    }

    double inputMin = inputRange[rangeIndex];
    double inputMax = inputRange[rangeIndex + 1];
    if (inputMin == inputMax) {
      if (value <= inputMin) {
        return outputMin;
      }
      return outputMax;
    }

    double ratio = (value - inputMin) / (inputMax - inputMin);
    return ColorUtils.blendARGB(outputMin, outputMax, (float) ratio);
  }

  /*package*/ static String interpolateString(
      String pattern,
      double value,
      double[] inputRange,
      double[][] outputRange,
      String extrapolateLeft,
      String extrapolateRight) {
    int rangeIndex = findRangeIndex(value, inputRange);
    StringBuffer sb = new StringBuffer(pattern.length());

    Matcher m = sNumericPattern.matcher(pattern);
    int i = 0;
    while (m.find() && i < outputRange[rangeIndex].length) {
      double val =
          interpolate(
              value,
              inputRange[rangeIndex],
              inputRange[rangeIndex + 1],
              outputRange[rangeIndex][i],
              outputRange[rangeIndex + 1][i],
              extrapolateLeft,
              extrapolateRight);
      int intVal = (int) val;
      m.appendReplacement(sb, intVal != val ? Double.toString(val) : Integer.toString(intVal));
      i++;
    }
    m.appendTail(sb);
    return sb.toString();
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

  private enum OutputType {
    Number,
    Color,
    String,
  }

  private final double mInputRange[];
  private final Object mOutputRange;
  private final OutputType mOutputType;
  private final @Nullable String mPattern;
  private final String mExtrapolateLeft;
  private final String mExtrapolateRight;
  private @Nullable ValueAnimatedNode mParent;
  private Object mObjectValue;

  public InterpolationAnimatedNode(ReadableMap config) {
    mInputRange = fromDoubleArray(config.getArray("inputRange"));
    ReadableArray output = config.getArray("outputRange");

    if (COLOR_OUTPUT_TYPE.equals(config.getString("outputType"))) {
      mOutputType = OutputType.Color;
      mOutputRange = fromIntArray(output);
      mPattern = null;
    } else if (output.getType(0) == ReadableType.String) {
      mOutputType = OutputType.String;
      mOutputRange = fromStringPattern(output);
      mPattern = output.getString(0);
    } else {
      mOutputType = OutputType.Number;
      mOutputRange = fromDoubleArray(output);
      mPattern = null;
    }

    mExtrapolateLeft = config.getString("extrapolateLeft");
    mExtrapolateRight = config.getString("extrapolateRight");
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
      // The graph is in the middle of being created, just skip this unattached node.
      return;
    }

    double value = mParent.getValue();
    switch (mOutputType) {
      case Number:
        mValue =
            interpolate(
                value, mInputRange, (double[]) mOutputRange, mExtrapolateLeft, mExtrapolateRight);
        break;
      case Color:
        mObjectValue = Integer.valueOf(interpolateColor(value, mInputRange, (int[]) mOutputRange));
        break;
      case String:
        mObjectValue =
            interpolateString(
                mPattern,
                value,
                mInputRange,
                (double[][]) mOutputRange,
                mExtrapolateLeft,
                mExtrapolateRight);
        break;
    }
  }

  @Override
  public Object getAnimatedObject() {
    return mObjectValue;
  }

  @Override
  public String prettyPrint() {
    return "InterpolationAnimatedNode[" + mTag + "] super: " + super.prettyPrint();
  }
}
