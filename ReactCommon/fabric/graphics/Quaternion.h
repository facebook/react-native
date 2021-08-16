/*
 * Portions Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/graphics/Float.h>
#include <array>
#include <cmath>

// The following is a modified, stripped-down version of the Quaternion class
// by Frank Astier. Copyright notice below.
// The original has many, many more features, and has been stripped down
// to support the exact data-structures and use-cases we need for React Native.

/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Frank Astier
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

namespace facebook {
namespace react {

template <typename T = Float>
class Quaternion {
 public:
  /**
   * Copy constructor.
   */
  Quaternion(const Quaternion<T> &y) : a_(y.a_), b_(y.b_), c_(y.c_), d_(y.d_) {}

  Quaternion(T a, T b, T c, T d) : a_(a), b_(b), c_(c), d_(d) {}

  static Quaternion<T> fromRotationMatrix(std::array<T, 16> const &rm) {
    T t = rm[0 * 4 + 0] + rm[1 * 4 + 1] + rm[2 * 4 + 2];
    if (t > 0) {
      T s = (T)0.5 / std::sqrt(t + 1);
      return {(T)0.25 / s,
              (rm[2 * 4 + 1] - rm[1 * 4 + 2]) * s,
              (rm[0 * 4 + 2] - rm[2 * 4 + 0]) * s,
              (rm[1 * 4 + 0] - rm[0 * 4 + 1]) * s};
    } else if (rm[0 * 4 + 0] > rm[1 * 4 + 1] && rm[0 * 4 + 0] > rm[2 * 4 + 2]) {
      T s = (T)2.0 *
          std::sqrt(
                1.0 + rm[0 * 4 + 0] - rm[1 * 4 + 1] - rm[2 * 4 + 2]); // S=4*qx
      return {(rm[2 * 4 + 1] - rm[1 * 4 + 2]) / s,
              (T)0.25 * s,
              (rm[0 * 4 + 1] + rm[1 * 4 + 0]) / s,
              (rm[0 * 4 + 2] + rm[2 * 4 + 0]) / s};
    } else if (rm[1 * 4 + 1] > rm[2 * 4 + 2]) {
      T s = (T)2.0 *
          std::sqrt(
                1.0 + rm[1 * 4 + 1] - rm[0 * 4 + 0] - rm[2 * 4 + 2]); // S=4*qy
      return {(rm[0 * 4 + 2] - rm[2 * 4 + 0]) / s,
              (rm[0 * 4 + 1] + rm[1 * 4 + 0]) / s,
              (T)0.25 * s,
              (rm[1 * 4 + 2] + rm[2 * 4 + 1]) / s};
    } else {
      T s = (T)2.0 *
          std::sqrt(
                1.0 + rm[2 * 4 + 2] - rm[0 * 4 + 0] - rm[1 * 4 + 1]); // S=4*qz
      return {(rm[1 * 4 + 0] - rm[0 * 4 + 1]) / s,
              (rm[0 * 4 + 2] + rm[2 * 4 + 0]) / s,
              (rm[1 * 4 + 2] + rm[2 * 4 + 1]) / s,
              (T)0.25 * s};
    }
  }

  /**
   * Returns a 3D, 4x4 rotation matrix.
   * This is the "homogeneous" expression to convert to a rotation matrix,
   * which works even when the Quaternion is not a unit Quaternion.
   */
  inline std::array<T, 16> toRotationMatrix4x4() {
    T a2 = a_ * a_, b2 = b_ * b_, c2 = c_ * c_, d2 = d_ * d_;
    T ab = a_ * b_, ac = a_ * c_, ad = a_ * d_;
    T bc = b_ * c_, bd = b_ * d_;
    T cd = c_ * d_;
    return {a2 + b2 - c2 - d2,
            2 * (bc - ad),
            2 * (bd + ac),
            0,
            2 * (bc + ad),
            a2 - b2 + c2 - d2,
            2 * (cd - ab),
            0,
            2 * (bd - ac),
            2 * (cd + ab),
            a2 - b2 - c2 + d2,
            0,
            0,
            0,
            0,
            1};
  }

  inline Quaternion<T> normalize() const {
    assert(abs() > 0); // or this is not normalizable
    T factor = abs();
    return *this / (factor != 0 ? factor : 1);
  }

  inline T dot(const Quaternion<T> &other) {
    return a_ * other.a_ + b_ * other.b_ + c_ * other.c_ + d_ * other.d_;
  }

  /**
   * The square of the norm of the Quaternion.
   * (The square is sometimes useful, and it avoids paying for a sqrt).
   */
  inline T norm_squared() const {
    return a_ * a_ + b_ * b_ + c_ * c_ + d_ * d_;
  }

  /**
   * The norm of the Quaternion (the l2 norm).
   */
  inline T abs() const {
    return std::sqrt(norm_squared());
  }

  inline Quaternion<T> operator/=(T y) {
    a_ /= y;
    b_ /= y;
    c_ /= y;
    d_ /= y;
    return *this;
  }

  inline Quaternion<T> operator*=(T y) {
    a_ *= y;
    b_ *= y;
    c_ *= y;
    d_ *= y;
    return *this;
  }

  inline Quaternion<T> operator+=(Quaternion<T> const &other) {
    a_ += other.a_;
    b_ += other.b_;
    c_ += other.c_;
    d_ += other.d_;
    return *this;
  }

  inline Quaternion<T> operator-=(Quaternion<T> const &other) {
    a_ -= other.a_;
    b_ -= other.b_;
    c_ -= other.c_;
    d_ -= other.d_;
    return *this;
  }

 private:
  T a_; // AKA w, qw
  T b_; // AKA x, qx
  T c_; // AKA y, qy
  T d_; // AKA z, qz
};

template <typename T = Float>
inline Quaternion<T> operator/(Quaternion<T> const &lhs, T rhs) {
  return Quaternion<T>(lhs) /= rhs;
}

template <typename T = Float>
inline Quaternion<T> operator*(Quaternion<T> const &lhs, T rhs) {
  return Quaternion<T>(lhs) *= rhs;
}

template <typename T = Float>
inline Quaternion<T> operator+(
    Quaternion<T> const &lhs,
    Quaternion<T> const &rhs) {
  return Quaternion<T>(lhs) += rhs;
}

template <typename T = Float>
inline Quaternion<T> operator-(
    Quaternion<T> const &lhs,
    Quaternion<T> const &rhs) {
  return Quaternion<T>(lhs) -= rhs;
}

} // namespace react
} // namespace facebook
