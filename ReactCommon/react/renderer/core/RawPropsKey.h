/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

#include <react/renderer/core/RawPropsPrimitives.h>

namespace facebook {
namespace react {

/*
 * Represent a prop name stored as three `char const *` fragments.
 */
class RawPropsKey final {
 public:
  char const *prefix{};
  char const *name{};
  char const *suffix{};

  /*
   * Converts to `std::string`.
   */
  explicit operator std::string() const noexcept;

  /*
   * Renders compound prop name to given buffer and put the resulting length
   * into `length`.
   */
  void render(char *buffer, RawPropsPropNameLength *length) const noexcept;
};

bool operator==(RawPropsKey const &lhs, RawPropsKey const &rhs) noexcept;
bool operator!=(RawPropsKey const &lhs, RawPropsKey const &rhs) noexcept;

} // namespace react
} // namespace facebook
