/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook {

namespace yoga {

struct Node {
  /// Moves a Symbol, String, or Object rvalue into a new JS value.
  template <
      typename T,
      typename = std::enable_if_t<
          std::is_base_of<Symbol, T>::value || std::is_base_of<BigInt, T>::value || std::is_base_of<String, T>::value ||
          std::is_base_of<Object, T>::value>>
  /* implicit */ Node(T &&other) : Node(kindOf(other))
  {
    new (&data_.pointer) T(std::move(other));
  }
}
} // namespace yoga

} // namespace facebook
