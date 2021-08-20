/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Transform.h"

#include <react/graphics/Quaternion.h>
#include <cmath>

#include <glog/logging.h>

namespace facebook {
namespace react {

#ifdef RN_DEBUG_STRING_CONVERTIBLE
void Transform::print(Transform const &t, std::string prefix) {
  LOG(ERROR) << prefix << "[ " << t.matrix[0] << " " << t.matrix[1] << " "
             << t.matrix[2] << " " << t.matrix[3] << " ]";
  LOG(ERROR) << prefix << "[ " << t.matrix[4] << " " << t.matrix[5] << " "
             << t.matrix[6] << " " << t.matrix[7] << " ]";
  LOG(ERROR) << prefix << "[ " << t.matrix[8] << " " << t.matrix[9] << " "
             << t.matrix[10] << " " << t.matrix[11] << " ]";
  LOG(ERROR) << prefix << "[ " << t.matrix[12] << " " << t.matrix[13] << " "
             << t.matrix[14] << " " << t.matrix[15] << " ]";
}
#endif

Transform Transform::Identity() {
  return {};
}

Transform Transform::Perspective(Float perspective) {
  auto transform = Transform{};
  transform.matrix[11] = -1 / perspective;
  return transform;
}

Transform Transform::Scale(Float factorX, Float factorY, Float factorZ) {
  auto transform = Transform{};
  transform.matrix[0] = factorX;
  transform.matrix[5] = factorY;
  transform.matrix[10] = factorZ;
  return transform;
}

Transform Transform::Translate(Float x, Float y, Float z) {
  auto transform = Transform{};
  transform.matrix[12] = x;
  transform.matrix[13] = y;
  transform.matrix[14] = z;
  return transform;
}

Transform Transform::Skew(Float x, Float y) {
  auto transform = Transform{};
  transform.matrix[4] = std::tan(x);
  transform.matrix[1] = std::tan(y);
  return transform;
}

Transform Transform::RotateX(Float radians) {
  auto transform = Transform{};
  transform.matrix[5] = std::cos(radians);
  transform.matrix[6] = std::sin(radians);
  transform.matrix[9] = -std::sin(radians);
  transform.matrix[10] = std::cos(radians);
  return transform;
}

Transform Transform::RotateY(Float radians) {
  auto transform = Transform{};
  transform.matrix[0] = std::cos(radians);
  transform.matrix[2] = -std::sin(radians);
  transform.matrix[8] = std::sin(radians);
  transform.matrix[10] = std::cos(radians);
  return transform;
}

Transform Transform::RotateZ(Float radians) {
  auto transform = Transform{};
  transform.matrix[0] = std::cos(radians);
  transform.matrix[1] = std::sin(radians);
  transform.matrix[4] = -std::sin(radians);
  transform.matrix[5] = std::cos(radians);
  return transform;
}

Transform Transform::Rotate(Float x, Float y, Float z) {
  auto transform = Transform{};
  if (x != 0) {
    transform = transform * Transform::RotateX(x);
  }
  if (y != 0) {
    transform = transform * Transform::RotateY(y);
  }
  if (z != 0) {
    transform = transform * Transform::RotateZ(z);
  }
  return transform;
}

Transform::SRT Transform::ExtractSRT(Transform const &t) {
  // First we need to extract translation, rotation, and scale from both
  // matrices, in that order. Matrices must be in this form: [a b c d] [e f g h]
  // [i j k l]
  // [0 0 0 1]
  // We also assume that all scale factors are non-negative.
  // TODO T68587989: If ViewProps retains the underlying transform props instead
  // of just the matrix version of transforms, then we can use those properties
  // directly instead of decomposing properties from a matrix which will always
  // be lossy. Because of these assumptions, animations involving negative
  // scale/rotation and anything involving skews will not look great.
  //  assert(
  //      t.matrix[12] == 0 && t.matrix[13] == 0 && t.matrix[14] == 0 &&
  //      t.matrix[15] == 1 && "Last row of matrix must be [0,0,0,1]");

  // lhs:
  // Translation: extract the values from the rightmost column
  Float translationX = t.matrix[3];
  Float translationY = t.matrix[7];
  Float translationZ = t.matrix[11];

  // Scale: the length of the first three column vectors
  // TODO: do we need to do anything special for negative scale factors?
  // the last element is a uniform scale factor
  Float scaleX = t.matrix[15] *
      sqrt(pow(t.matrix[0], 2) + pow(t.matrix[4], 2) +
           pow(t.matrix[8], 2)); // sqrt(a^2 + e^2 + i^2)
  Float scaleY = t.matrix[15] *
      sqrt(pow(t.matrix[1], 2) + pow(t.matrix[5], 2) +
           pow(t.matrix[9], 2)); // sqrt(b^2 + f^2 + j^2)
  Float scaleZ = t.matrix[15] *
      sqrt(pow(t.matrix[2], 2) + pow(t.matrix[6], 2) +
           pow(t.matrix[10], 2)); // sqrt(c^2 + g^2 + k^2)

  Float rScaleFactorX = scaleX == 0 ? 1 : scaleX;
  Float rScaleFactorY = scaleY == 0 ? 1 : scaleY;
  Float rScaleFactorZ = scaleZ == 0 ? 1 : scaleZ;

  // Construct a rotation matrix and convert that to quaternions
  auto rotationMatrix = std::array<Float, 16>{t.matrix[0] / rScaleFactorX,
                                              t.matrix[1] / rScaleFactorY,
                                              t.matrix[2] / rScaleFactorZ,
                                              0,
                                              t.matrix[4] / rScaleFactorX,
                                              t.matrix[5] / rScaleFactorY,
                                              t.matrix[6] / rScaleFactorZ,
                                              0,
                                              t.matrix[8] / rScaleFactorX,
                                              t.matrix[9] / rScaleFactorY,
                                              t.matrix[10] / rScaleFactorZ,
                                              0,
                                              0,
                                              0,
                                              0,
                                              1};

  Quaternion<Float> q =
      Quaternion<Float>::fromRotationMatrix(rotationMatrix).normalize();

  return Transform::SRT{
      translationX, translationY, translationZ, scaleX, scaleY, scaleZ, q};
}

Transform Transform::Interpolate(
    float animationProgress,
    Transform const &lhs,
    Transform const &rhs) {
  // Extract SRT for both sides
  // This is extracted in the form: X,Y,Z coordinates for translations; X,Y,Z
  // coordinates for scale; and a quaternion for rotation.
  auto lhsSRT = ExtractSRT(lhs);
  auto rhsSRT = ExtractSRT(rhs);

  // Interpolate translation and scale terms linearly (LERP)
  Float translateX =
      (lhsSRT.translationX +
       (rhsSRT.translationX - lhsSRT.translationX) * animationProgress);
  Float translateY =
      (lhsSRT.translationY +
       (rhsSRT.translationY - lhsSRT.translationY) * animationProgress);
  Float translateZ =
      (lhsSRT.translationZ +
       (rhsSRT.translationZ - lhsSRT.translationZ) * animationProgress);
  Float scaleX =
      (lhsSRT.scaleX + (rhsSRT.scaleX - lhsSRT.scaleX) * animationProgress);
  Float scaleY =
      (lhsSRT.scaleY + (rhsSRT.scaleY - lhsSRT.scaleY) * animationProgress);
  Float scaleZ =
      (lhsSRT.scaleZ + (rhsSRT.scaleZ - lhsSRT.scaleZ) * animationProgress);

  // Use the quaternion vectors to produce an interpolated rotation via SLERP
  // dot: cos of the angle between the two quaternion vectors
  Quaternion<Float> q1 = lhsSRT.rotation;
  Quaternion<Float> q2 = rhsSRT.rotation;
  Float dot = q1.dot(q2);
  // Clamp dot between -1 and 1
  dot = (dot < -1 ? -1 : (dot > 1 ? 1 : dot));
  // There are two ways of performing an identical slerp: q1 and -q1.
  // If the dot-product is negative, we can multiply q1 by -1 and our animation
  // will take the "short way" around instead of the "long way".
  if (dot < 0) {
    q1 = q1 * (Float)-1;
    dot = dot * -1;
  }
  // Interpolated angle
  Float theta = acosf(dot) * animationProgress;

  Transform rotation = Transform::Identity();

  // Compute orthonormal basis
  Quaternion<Float> orthonormalBasis = (q2 - q1 * dot);

  if (orthonormalBasis.abs() > 0) {
    Quaternion<Float> orthonormalBasisNormalized = orthonormalBasis.normalize();

    // Compute orthonormal basis
    // Final quaternion result - slerp!
    Quaternion<Float> resultingRotationVec =
        (q1 * (Float)cos(theta) +
         orthonormalBasisNormalized * (Float)sin(theta))
            .normalize();

    // Convert quaternion to matrix
    rotation.matrix = resultingRotationVec.toRotationMatrix4x4();
  }

  // Compose matrices and return
  return (Scale(scaleX, scaleY, scaleZ) * rotation) *
      Translate(translateX, translateY, translateZ);
}

bool Transform::operator==(Transform const &rhs) const {
  for (auto i = 0; i < 16; i++) {
    if (matrix[i] != rhs.matrix[i]) {
      return false;
    }
  }
  return true;
}

bool Transform::operator!=(Transform const &rhs) const {
  return !(*this == rhs);
}

Transform Transform::operator*(Transform const &rhs) const {
  if (*this == Transform::Identity()) {
    return rhs;
  }

  const auto &lhs = *this;
  auto result = Transform{};

  auto lhs00 = lhs.matrix[0], lhs01 = lhs.matrix[1], lhs02 = lhs.matrix[2],
       lhs03 = lhs.matrix[3], lhs10 = lhs.matrix[4], lhs11 = lhs.matrix[5],
       lhs12 = lhs.matrix[6], lhs13 = lhs.matrix[7], lhs20 = lhs.matrix[8],
       lhs21 = lhs.matrix[9], lhs22 = lhs.matrix[10], lhs23 = lhs.matrix[11],
       lhs30 = lhs.matrix[12], lhs31 = lhs.matrix[13], lhs32 = lhs.matrix[14],
       lhs33 = lhs.matrix[15];

  auto rhs0 = rhs.matrix[0], rhs1 = rhs.matrix[1], rhs2 = rhs.matrix[2],
       rhs3 = rhs.matrix[3];
  result.matrix[0] = rhs0 * lhs00 + rhs1 * lhs10 + rhs2 * lhs20 + rhs3 * lhs30;
  result.matrix[1] = rhs0 * lhs01 + rhs1 * lhs11 + rhs2 * lhs21 + rhs3 * lhs31;
  result.matrix[2] = rhs0 * lhs02 + rhs1 * lhs12 + rhs2 * lhs22 + rhs3 * lhs32;
  result.matrix[3] = rhs0 * lhs03 + rhs1 * lhs13 + rhs2 * lhs23 + rhs3 * lhs33;

  rhs0 = rhs.matrix[4];
  rhs1 = rhs.matrix[5];
  rhs2 = rhs.matrix[6];
  rhs3 = rhs.matrix[7];
  result.matrix[4] = rhs0 * lhs00 + rhs1 * lhs10 + rhs2 * lhs20 + rhs3 * lhs30;
  result.matrix[5] = rhs0 * lhs01 + rhs1 * lhs11 + rhs2 * lhs21 + rhs3 * lhs31;
  result.matrix[6] = rhs0 * lhs02 + rhs1 * lhs12 + rhs2 * lhs22 + rhs3 * lhs32;
  result.matrix[7] = rhs0 * lhs03 + rhs1 * lhs13 + rhs2 * lhs23 + rhs3 * lhs33;

  rhs0 = rhs.matrix[8];
  rhs1 = rhs.matrix[9];
  rhs2 = rhs.matrix[10];
  rhs3 = rhs.matrix[11];
  result.matrix[8] = rhs0 * lhs00 + rhs1 * lhs10 + rhs2 * lhs20 + rhs3 * lhs30;
  result.matrix[9] = rhs0 * lhs01 + rhs1 * lhs11 + rhs2 * lhs21 + rhs3 * lhs31;
  result.matrix[10] = rhs0 * lhs02 + rhs1 * lhs12 + rhs2 * lhs22 + rhs3 * lhs32;
  result.matrix[11] = rhs0 * lhs03 + rhs1 * lhs13 + rhs2 * lhs23 + rhs3 * lhs33;

  rhs0 = rhs.matrix[12];
  rhs1 = rhs.matrix[13];
  rhs2 = rhs.matrix[14];
  rhs3 = rhs.matrix[15];
  result.matrix[12] = rhs0 * lhs00 + rhs1 * lhs10 + rhs2 * lhs20 + rhs3 * lhs30;
  result.matrix[13] = rhs0 * lhs01 + rhs1 * lhs11 + rhs2 * lhs21 + rhs3 * lhs31;
  result.matrix[14] = rhs0 * lhs02 + rhs1 * lhs12 + rhs2 * lhs22 + rhs3 * lhs32;
  result.matrix[15] = rhs0 * lhs03 + rhs1 * lhs13 + rhs2 * lhs23 + rhs3 * lhs33;

  return result;
}

Float &Transform::at(int i, int j) {
  return matrix[(i * 4) + j];
}

Float const &Transform::at(int i, int j) const {
  return matrix[(i * 4) + j];
}

Point operator*(Point const &point, Transform const &transform) {
  if (transform == Transform::Identity()) {
    return point;
  }

  auto result = transform * Vector{point.x, point.y, 0, 1};

  return {result.x, result.y};
}

Rect operator*(Rect const &rect, Transform const &transform) {
  auto centre = rect.getCenter();

  auto a = Point{rect.origin.x, rect.origin.y} - centre;
  auto b = Point{rect.getMaxX(), rect.origin.y} - centre;
  auto c = Point{rect.getMaxX(), rect.getMaxY()} - centre;
  auto d = Point{rect.origin.x, rect.getMaxY()} - centre;

  auto vectorA = transform * Vector{a.x, a.y, 0, 1};
  auto vectorB = transform * Vector{b.x, b.y, 0, 1};
  auto vectorC = transform * Vector{c.x, c.y, 0, 1};
  auto vectorD = transform * Vector{d.x, d.y, 0, 1};

  Point transformedA{vectorA.x + centre.x, vectorA.y + centre.y};
  Point transformedB{vectorB.x + centre.x, vectorB.y + centre.y};
  Point transformedC{vectorC.x + centre.x, vectorC.y + centre.y};
  Point transformedD{vectorD.x + centre.x, vectorD.y + centre.y};

  return Rect::boundingRect(
      transformedA, transformedB, transformedC, transformedD);
}

Vector operator*(Transform const &transform, Vector const &vector) {
  return {
      vector.x * transform.at(0, 0) + vector.y * transform.at(1, 0) +
          vector.z * transform.at(2, 0) + vector.w * transform.at(3, 0),
      vector.x * transform.at(0, 1) + vector.y * transform.at(1, 1) +
          vector.z * transform.at(2, 1) + vector.w * transform.at(3, 1),
      vector.x * transform.at(0, 2) + vector.y * transform.at(1, 2) +
          vector.z * transform.at(2, 2) + vector.w * transform.at(3, 2),
      vector.x * transform.at(0, 3) + vector.y * transform.at(1, 3) +
          vector.z * transform.at(2, 3) + vector.w * transform.at(3, 3),
  };
}

Size operator*(Size const &size, Transform const &transform) {
  if (transform == Transform::Identity()) {
    return size;
  }

  auto result = Size{};
  result.width = transform.at(0, 0) * size.width;
  result.height = transform.at(1, 1) * size.height;

  return result;
}

} // namespace react
} // namespace facebook
