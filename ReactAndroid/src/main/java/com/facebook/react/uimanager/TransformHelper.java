/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;

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
    double[] helperMatrix = sHelperMatrix.get();
    MatrixMathHelper.resetIdentityMatrix(result);

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
        throw new JSApplicationIllegalArgumentException(
            "Unsupported transform type: " + transformType);
      }

      MatrixMathHelper.multiplyInto(result, result, helperMatrix);
    }
  }
}
