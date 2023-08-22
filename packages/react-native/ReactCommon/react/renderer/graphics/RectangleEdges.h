/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <tuple>

#include <folly/Hash.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/Rect.h>

namespace facebook {
namespace react {

/*
 * Generic data structure describes some values associated with *edges*
 * of a rectangle.
 */
template <typename T>
struct RectangleEdges {
  T left{};
  T top{};
  T right{};
  T bottom{};

  bool operator==(RectangleEdges<T> const &rhs) const noexcept {
    return std::tie(this->left, this->top, this->right, this->bottom) ==
        std::tie(rhs.left, rhs.top, rhs.right, rhs.bottom);
  }

  bool operator!=(RectangleEdges<T> const &rhs) const noexcept {
    return !(*this == rhs);
  }

  bool isUniform() const noexcept {
    return left == top && left == right && left == bottom;
  }

  static RectangleEdges<T> const ZERO;
};

template <typename T>
RectangleEdges<T> const RectangleEdges<T>::ZERO = {};

template <typename T>
RectangleEdges<T> operator+(
    RectangleEdges<T> const &lhs,
    RectangleEdges<T> const &rhs) noexcept {
  return RectangleEdges<T>{
      lhs.left + rhs.left,
      lhs.top + rhs.top,
      lhs.right + rhs.right,
      lhs.bottom + rhs.bottom};
}

template <typename T>
RectangleEdges<T> operator-(
    RectangleEdges<T> const &lhs,
    RectangleEdges<T> const &rhs) noexcept {
  return RectangleEdges<T>{
      lhs.left - rhs.left,
      lhs.top - rhs.top,
      lhs.right - rhs.right,
      lhs.bottom - rhs.bottom};
}

/*
 * EdgeInsets
 */
using EdgeInsets = RectangleEdges<Float>;

/*
 * Adjusts a rectangle by the given edge insets.
 */
inline Rect insetBy(Rect const &rect, EdgeInsets const &insets) noexcept {
  return Rect{
      {rect.origin.x + insets.left, rect.origin.y + insets.top},
      {rect.size.width - insets.left - insets.right,
       rect.size.height - insets.top - insets.bottom}};
}

/*
 * Adjusts a rectangle by the given edge outsets.
 */
inline Rect outsetBy(Rect const &rect, EdgeInsets const &outsets) noexcept {
  return Rect{
      {rect.origin.x - outsets.left, rect.origin.y - outsets.top},
      {rect.size.width + outsets.left + outsets.right,
       rect.size.height + outsets.top + outsets.bottom}};
}

} // namespace react
} // namespace facebook

namespace std {

template <typename T>
struct hash<facebook::react::RectangleEdges<T>> {
  size_t operator()(
      facebook::react::RectangleEdges<T> const &edges) const noexcept {
    return folly::hash::hash_combine(
        0, edges.left, edges.right, edges.top, edges.bottom);
  }
};

} // namespace std
