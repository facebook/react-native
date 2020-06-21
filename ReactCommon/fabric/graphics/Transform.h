/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <array>

#include <folly/Hash.h>
#include <react/graphics/Float.h>
#include <react/graphics/Geometry.h>
#include <react/graphics/Quaternion.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#endif

namespace facebook {
namespace react {

struct ScaleRotationTranslation {
  Float translationX;
  Float translationY;
  Float translationZ;
  Float scaleX;
  Float scaleY;
  Float scaleZ;
  Quaternion<Float> rotation;
};

/*
 * Defines transform matrix to apply affine transformations.
 */
struct Transform {
  using SRT = ScaleRotationTranslation;

  std::array<Float, 16> matrix{
      {1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1}};

  /**
   * For debugging only. Prints out the matrix.
   */
#ifdef RN_DEBUG_STRING_CONVERTIBLE
  static void print(Transform const &t, std::string prefix);
#endif

  /*
   * Returns the identity transform (`[1 0 0 0; 0 1 0 0; 0 0 1 0; 0 0 0 1]`).
   */
  static Transform Identity();

  /*
   * Returns a Perspective transform.
   */
  static Transform Perspective(Float perspective);

  /*
   * Returns a Scale transform.
   */
  static Transform Scale(Float factorX, Float factorY, Float factorZ);

  /*
   * Returns a Translate transform.
   */
  static Transform Translate(Float x, Float y, Float z);

  /*
   * Returns a Skew transform.
   */
  static Transform Skew(Float x, Float y);

  /*
   * Returns a transform that rotates by `angle` radians along the given axis.
   */
  static Transform RotateX(Float angle);
  static Transform RotateY(Float angle);
  static Transform RotateZ(Float angle);
  static Transform Rotate(Float angleX, Float angleY, Float angleZ);

  /**
   * Extract SRT (scale, rotation, transformation) from a Transform matrix.
   *
   * CAVEATS:
   *   1. The input matrix must not have Skew applied.
   *   2. Scaling factors must be non-negative. Scaling by a negative factor is
   *      equivalent to a rotation, and though it is possible to detect if 1 or
   *      3 of the scale signs are flipped (but not two), it is not possible
   *      to detect WHICH of the scales are flipped. Thus, any animation
   *      that involves a negative scale factor will not crash but will
   *      interpolate over nonsensical values.
   *   3. Another caveat is that if the animation interpolates TO a 90º
   *      rotation in the X, Y, or Z axis, the View will appear to suddenly
   * explode in size. Interpolating THROUGH 90º is fine as long as you don't end
   * up at 90º or close to it (89.99). The same is true for 0±90 and 360n+90,
   * etc.
   */
  static SRT ExtractSRT(Transform const &transform);

  /**
   * Perform an interpolation between lhs and rhs, given progress.
   * This first decomposes the matrices into translation, scale, and rotation,
   * performs slerp between the two rotations, and a linear interpolation
   * of scale and translation.
   *
   * @param progress
   * @param lhs
   * @param rhs
   * @return
   */
  static Transform Interpolate(
      float animationProgress,
      Transform const &lhs,
      Transform const &rhs);

  /*
   * Equality operators.
   */
  bool operator==(Transform const &rhs) const;
  bool operator!=(Transform const &rhs) const;

  /*
   * Matrix subscript.
   */
  Float &at(int x, int y);
  Float const &at(int x, int y) const;

  /*
   * Concatenates (multiplies) transform matrices.
   */
  Transform operator*(Transform const &rhs) const;

  /**
   * Convert to folly::dynamic.
   */
#ifdef ANDROID
  operator folly::dynamic() const {
    return folly::dynamic::array(
        matrix[0],
        matrix[1],
        matrix[2],
        matrix[3],
        matrix[4],
        matrix[5],
        matrix[6],
        matrix[7],
        matrix[8],
        matrix[9],
        matrix[10],
        matrix[11],
        matrix[12],
        matrix[13],
        matrix[14],
        matrix[15]);
  }
#endif
};

/*
 * Applies tranformation to the given point.
 */
Point operator*(Point const &point, Transform const &transform);

/*
 * Applies tranformation to the given size.
 */
Size operator*(Size const &size, Transform const &transform);

/*
 * Applies tranformation to the given rect.
 * ONLY SUPPORTS scale and translation transformation.
 */
Rect operator*(Rect const &rect, Transform const &transform);

Vector operator*(Transform const &transform, Vector const &vector);

} // namespace react
} // namespace facebook

namespace std {

template <>
struct hash<facebook::react::Transform> {
  size_t operator()(const facebook::react::Transform &transform) const {
    return folly::hash::hash_combine(
        0,
        transform.matrix[0],
        transform.matrix[1],
        transform.matrix[2],
        transform.matrix[3],
        transform.matrix[4],
        transform.matrix[5],
        transform.matrix[6],
        transform.matrix[7],
        transform.matrix[8],
        transform.matrix[9],
        transform.matrix[10],
        transform.matrix[11],
        transform.matrix[12],
        transform.matrix[13],
        transform.matrix[14],
        transform.matrix[15]);
  }
};

} // namespace std
