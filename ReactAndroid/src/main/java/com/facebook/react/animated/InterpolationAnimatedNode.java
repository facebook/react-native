/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.animated;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import java.util.ArrayList;
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

  private static final String fpRegex = "[+-]?(\\d+\\.?\\d*|\\.\\d+)([eE][+-]?\\d+)?";
  private static final Pattern fpPattern = Pattern.compile(fpRegex);

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
  private String mPattern;
  private double mOutputs[][];
  private final boolean mHasStringOutput;
  private final Matcher mSOutputMatcher;
  private final String mExtrapolateLeft;
  private final String mExtrapolateRight;
  private @Nullable ValueAnimatedNode mParent;
  private boolean mShouldRound;
  private int mNumVals;

  public InterpolationAnimatedNode(ReadableMap config) {
    mInputRange = fromDoubleArray(config.getArray("inputRange"));
    ReadableArray output = config.getArray("outputRange");
    mHasStringOutput = output.getType(0) == ReadableType.String;
    if (mHasStringOutput) {
      /*
       * Supports string shapes by extracting numbers so new values can be computed,
       * and recombines those values into new strings of the same shape.  Supports
       * things like:
       *
       *   rgba(123, 42, 99, 0.36) // colors
       *   -45deg                  // values with units
       */
      int size = output.size();
      mOutputRange = new double[size];
      mPattern = output.getString(0);
      mShouldRound = mPattern.startsWith("rgb");
      mSOutputMatcher = fpPattern.matcher(mPattern);
      ArrayList<ArrayList<Double>> mOutputRanges = new ArrayList<>();
      for (int i = 0; i < size; i++) {
        String val = output.getString(i);
        Matcher m = fpPattern.matcher(val);
        ArrayList<Double> outputRange = new ArrayList<>();
        mOutputRanges.add(outputRange);
        while (m.find()) {
          Double parsed = Double.parseDouble(m.group());
          outputRange.add(parsed);
        }
        mOutputRange[i] = outputRange.get(0);
      }

      // ['rgba(0, 100, 200, 0)', 'rgba(50, 150, 250, 0.5)']
      // ->
      // [
      //   [0, 50],
      //   [100, 150],
      //   [200, 250],
      //   [0, 0.5],
      // ]
      mNumVals = mOutputRanges.get(0).size();
      mOutputs = new double[mNumVals][];
      for (int j = 0; j < mNumVals; j++) {
        double[] arr = new double[size];
        mOutputs[j] = arr;
        for (int i = 0; i < size; i++) {
          arr[i] = mOutputRanges.get(i).get(j);
        }
      }
    } else {
      mOutputRange = fromDoubleArray(output);
      mSOutputMatcher = null;
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
      // The graph is in the middle of being created, just skip this
      // unattached node.
      return;
    }
    double value = mParent.getValue();
    mValue = interpolate(value, mInputRange, mOutputRange, mExtrapolateLeft, mExtrapolateRight);
    if (mHasStringOutput) {
      // 'rgba(0, 100, 200, 0)'
      // ->
      // 'rgba(${interpolations[0](input)}, ${interpolations[1](input)}, ...'
      if (mNumVals > 1) {
        StringBuffer sb = new StringBuffer(mPattern.length());
        int i = 0;
        mSOutputMatcher.reset();
        while (mSOutputMatcher.find()) {
          double val =
              interpolate(value, mInputRange, mOutputs[i++], mExtrapolateLeft, mExtrapolateRight);
          if (mShouldRound) {
            // rgba requires that the r,g,b are integers.... so we want to round them, but we *dont*
            // want to
            // round the opacity (4th column).
            boolean isAlpha = i == 4;
            int rounded = (int) Math.round(isAlpha ? val * 1000 : val);
            String num =
                isAlpha ? Double.toString((double) rounded / 1000) : Integer.toString(rounded);
            mSOutputMatcher.appendReplacement(sb, num);
          } else {
            int intVal = (int) val;
            String num = intVal != val ? Double.toString(val) : Integer.toString(intVal);
            mSOutputMatcher.appendReplacement(sb, num);
          }
        }
        mSOutputMatcher.appendTail(sb);
        mAnimatedObject = sb.toString();
      } else {
        mAnimatedObject = mSOutputMatcher.replaceFirst(String.valueOf(mValue));
      }
    }
  }
}
