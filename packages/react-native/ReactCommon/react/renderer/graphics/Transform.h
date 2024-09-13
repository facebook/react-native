/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <array>
#include <vector>

#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/Point.h>
#include <react/renderer/graphics/RectangleEdges.h>
#include <react/renderer/graphics/Size.h>
#include <react/renderer/graphics/ValueUnit.h>
#include <react/renderer/graphics/Vector.h>
#include <react/utils/hash_combine.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#endif

namespace facebook::react {

inline bool isZero(Float n) {
  // We use this ternary expression instead of abs, fabsf, etc, because
  // Float can be double or float depending on compilation target.
  return (n < 0 ? n * (-1) : n) < 0.00001;
}

/**
 * Defines operations used to construct a transform matrix.
 * An "Arbitrary" operation means that the transform was seeded with some
 * arbitrary initial result.
 */
enum class TransformOperationType {
  Arbitrary,
  Identity,
  Perspective,
  Scale,
  Translate,
  Rotate,
  Skew
};

struct TransformOperation {
  TransformOperationType type;
  ValueUnit x;
  ValueUnit y;
  ValueUnit z;
  bool operator==(const TransformOperation& other) const = default;
};

struct TransformOrigin {
  std::array<ValueUnit, 2> xy;
  float z = 0.0f;

  bool operator==(const TransformOrigin& other) const {
    return xy[0] == other.xy[0] && xy[1] == other.xy[1] && z == other.z;
  }
  bool operator!=(const TransformOrigin& other) const {
    return !(*this == other);
  }
  bool isSet() const {
    return xy[0].value != 0.0f || xy[0].unit != UnitType::Undefined ||
        xy[1].value != 0.0f || xy[1].unit != UnitType::Undefined || z != 0.0f;
  }

#ifdef ANDROID

  /**
   * Convert to folly::dynamic.
   */
  operator folly::dynamic() const {
    return folly::dynamic::array(xy[0].value, xy[1].value, z);
  }

#endif
};

/*
 * Defines transform matrix to apply affine transformations.
 */
struct Transform {
  std::vector<TransformOperation> operations{};

  std::array<Float, 16> matrix{
      {1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1}};

  /**
   * For debugging only. Prints out the matrix.
   */
#if RN_DEBUG_STRING_CONVERTIBLE
  static void print(const Transform& t, std::string prefix);
#endif

  /*
   * Given a TransformOperation, return the proper transform.
   */
  static Transform FromTransformOperation(
      TransformOperation transformOperation,
      const Size& size);
  static TransformOperation DefaultTransformOperation(
      TransformOperationType type);

  /*
   * Returns the identity transform (`[1 0 0 0; 0 1 0 0; 0 0 1 0; 0 0 0 1]`).
   */
  static Transform Identity();

  /*
   * Returns the vertival inversion transform (`[1 0 0 0; 0 -1 0 0; 0 0 1 0; 0 0
   * 0 1]`).
   */
  static Transform VerticalInversion();

  /*
   * Returns the horizontal inversion transform (`[-1 0 0 0; 0 1 0 0; 0 0 1 0; 0
   * 0 0 1]`).
   */
  static Transform HorizontalInversion();

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
  static Transform RotateX(Float radians);
  static Transform RotateY(Float radians);
  static Transform RotateZ(Float radians);
  static Transform Rotate(Float angleX, Float angleY, Float angleZ);

  /**
   * Perform an interpolation between lhs and rhs, given progress.
   * This first decomposes the matrices into translation, scale, and rotation,
   * performs slerp between the two rotations, and a linear interpolation
   * of scale and translation.
   *
   * @param animationProgress of the animation
   * @param lhs start of the interpolation
   * @param rhs end of the interpolation
   * @return the Transformation
   */
  static Transform Interpolate(
      Float animationProgress,
      const Transform& lhs,
      const Transform& rhs,
      const Size& size);

  static bool isVerticalInversion(const Transform& transform);
  static bool isHorizontalInversion(const Transform& transform);

  /*
   * Equality operators.
   */
  bool operator==(const Transform& rhs) const;
  bool operator!=(const Transform& rhs) const;

  /*
   * Matrix subscript.
   */
  Float& at(int i, int j);
  const Float& at(int i, int j) const;

  /*
   * Concatenates (multiplies) transform matrices.
   */
  Transform operator*(const Transform& rhs) const;

  Rect applyWithCenter(const Rect& rect, const Point& center) const;

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
 * Applies transformation to the given point.
 */
Point operator*(const Point& point, const Transform& transform);

/*
 * Applies transformation to the given size.
 */
Size operator*(const Size& size, const Transform& transform);

/*
 * Applies transformation to the given rect.
 * ONLY SUPPORTS scale and translation transformation.
 */
Rect operator*(const Rect& rect, const Transform& transform);

/*
 * Applies transformation to the given EdgeInsets.
 * ONLY SUPPORTS scale transformation.
 */
EdgeInsets operator*(const EdgeInsets& edgeInsets, const Transform& transform);

Vector operator*(const Transform& transform, const Vector& vector);

} // namespace facebook::react

namespace std {

template <>
struct hash<facebook::react::Transform> {
  size_t operator()(const facebook::react::Transform& transform) const {
    return facebook::react::hash_combine(
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
