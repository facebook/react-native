/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.common.ReactConstants;

/**
 * Class providing helper methods for converting transformation list (as accepted by 'transform'
 * view property) into a transformation matrix.
 */
public class TransformHelper {

  private static ThreadLocal<double[]> sHelperMatrix =
      new ThreadLocal<double[]>() {
        @Override
        protected double[] initialValue() {
          return new double[16];
        }
      };

  private static double convertToRadians(ReadableMap transformMap, String key) {
    double value;
    boolean inRadians = true;
    if (transformMap.getType(key) == ReadableType.String) {
      String stringValue = transformMap.getString(key);
      if (stringValue.endsWith("rad")) {
        stringValue = stringValue.substring(0, stringValue.length() - 3);
      } else if (stringValue.endsWith("deg")) {
        inRadians = false;
        stringValue = stringValue.substring(0, stringValue.length() - 3);
      }
      value = Float.parseFloat(stringValue);
    } else {
      value = transformMap.getDouble(key);
    }
    return inRadians ? value : MatrixMathHelper.degreesToRadians(value);
  }

  public static void processTransform(ReadableArray transforms, double[] result) {
    processTransform(transforms, result, 0, 0, null);
  }

  public static void processTransform(
      ReadableArray transforms,
      double[] result,
      float viewWidth,
      float viewHeight,
      ReadableArray transformOrigin) {
    double[] helperMatrix = sHelperMatrix.get();
    MatrixMathHelper.resetIdentityMatrix(result);
    float[] offsets = getTranslateForTransformOrigin(viewWidth, viewHeight, transformOrigin);

    if (offsets != null) {
      MatrixMathHelper.resetIdentityMatrix(helperMatrix);
      MatrixMathHelper.applyTranslate3D(helperMatrix, offsets[0], offsets[1], offsets[2]);
      MatrixMathHelper.multiplyInto(result, result, helperMatrix);
    }
    // If the transforms array is actually just the matrix itself,
    // copy that directly. This is for Fabric LayoutAnimations support.
    // All of the stuff this Java helper does is already done in C++ in Fabric, so we
    // can just use that matrix directly.
    if (transforms.size() == 16 && transforms.getType(0) == ReadableType.Number) {
      MatrixMathHelper.resetIdentityMatrix(helperMatrix);
      for (int i = 0; i < transforms.size(); i++) {
        helperMatrix[i] = transforms.getDouble(i);
      }
      MatrixMathHelper.multiplyInto(result, result, helperMatrix);
    } else {
      for (int transformIdx = 0, size = transforms.size(); transformIdx < size; transformIdx++) {
        ReadableMap transform = transforms.getMap(transformIdx);
        String transformType = transform.keySetIterator().nextKey();

        MatrixMathHelper.resetIdentityMatrix(helperMatrix);
        if ("matrix".equals(transformType)) {
          ReadableArray matrix = transform.getArray(transformType);
          for (int i = 0; i < 16; i++) {
            helperMatrix[i] = matrix.getDouble(i);
          }
        } else if ("perspective".equals(transformType)) {
          MatrixMathHelper.applyPerspective(helperMatrix, transform.getDouble(transformType));
        } else if ("rotateX".equals(transformType)) {
          MatrixMathHelper.applyRotateX(helperMatrix, convertToRadians(transform, transformType));
        } else if ("rotateY".equals(transformType)) {
          MatrixMathHelper.applyRotateY(helperMatrix, convertToRadians(transform, transformType));
        } else if ("rotate".equals(transformType) || "rotateZ".equals(transformType)) {
          MatrixMathHelper.applyRotateZ(helperMatrix, convertToRadians(transform, transformType));
        } else if ("scale".equals(transformType)) {
          double scale = transform.getDouble(transformType);
          MatrixMathHelper.applyScaleX(helperMatrix, scale);
          MatrixMathHelper.applyScaleY(helperMatrix, scale);
        } else if ("scaleX".equals(transformType)) {
          MatrixMathHelper.applyScaleX(helperMatrix, transform.getDouble(transformType));
        } else if ("scaleY".equals(transformType)) {
          MatrixMathHelper.applyScaleY(helperMatrix, transform.getDouble(transformType));
        } else if ("translate".equals(transformType)) {
          ReadableArray value = transform.getArray(transformType);
          double x = value.getDouble(0);
          double y = value.getDouble(1);
          double z = value.size() > 2 ? value.getDouble(2) : 0d;
          MatrixMathHelper.applyTranslate3D(helperMatrix, x, y, z);
        } else if ("translateX".equals(transformType)) {
          MatrixMathHelper.applyTranslate2D(helperMatrix, transform.getDouble(transformType), 0d);
        } else if ("translateY".equals(transformType)) {
          MatrixMathHelper.applyTranslate2D(helperMatrix, 0d, transform.getDouble(transformType));
        } else if ("skewX".equals(transformType)) {
          MatrixMathHelper.applySkewX(helperMatrix, convertToRadians(transform, transformType));
        } else if ("skewY".equals(transformType)) {
          MatrixMathHelper.applySkewY(helperMatrix, convertToRadians(transform, transformType));
        } else {
          FLog.w(ReactConstants.TAG, "Unsupported transform type: " + transformType);
        }

        MatrixMathHelper.multiplyInto(result, result, helperMatrix);
      }
    }

    if (offsets != null) {
      MatrixMathHelper.resetIdentityMatrix(helperMatrix);
      MatrixMathHelper.applyTranslate3D(helperMatrix, -offsets[0], -offsets[1], -offsets[2]);
      MatrixMathHelper.multiplyInto(result, result, helperMatrix);
    }
  }

  private static float[] getTranslateForTransformOrigin(
      float viewWidth, float viewHeight, ReadableArray transformOrigin) {
    if (transformOrigin == null || (viewHeight == 0 && viewWidth == 0)) {
      return null;
    }
    float viewCenterX = viewWidth / 2;
    float viewCenterY = viewHeight / 2;

    float[] origin = {viewCenterX, viewCenterY, 0.0f};

    for (int i = 0; i < transformOrigin.size() && i < 3; i++) {
      switch (transformOrigin.getType(i)) {
        case Number:
          origin[i] = (float) transformOrigin.getDouble(i);
          break;
        case String:
          {
            String part = transformOrigin.getString(i);
            if (part.endsWith("%")) {
              float val = Float.parseFloat(part.substring(0, part.length() - 1));
              origin[i] = (i == 0 ? viewWidth : viewHeight) * val / 100.0f;
            }
            break;
          }
      }
    }

    float newTranslateX = -viewCenterX + origin[0];
    float newTranslateY = -viewCenterY + origin[1];
    float newTranslateZ = origin[2];

    return new float[] {newTranslateX, newTranslateY, newTranslateZ};
  }
}
