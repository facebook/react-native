// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <array>

#include <folly/Hash.h>
#include <react/graphics/Float.h>
#include <react/graphics/Geometry.h>

namespace facebook {
namespace react {

/*
 * Defines transform matrix to apply affine transformations.
 */
struct Transform {
  std::array<Float, 16> matrix{
      {1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1}};

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
};

/*
 * Applies tranformation to the given point.
 */
Point operator*(Point const &point, Transform const &transform);

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
