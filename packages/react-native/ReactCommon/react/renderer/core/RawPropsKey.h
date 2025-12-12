/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

#include <react/renderer/core/RawPropsPrimitives.h>

namespace facebook::react {

/*
 * Represent a prop name stored as three `char const *` fragments.
 */
class RawPropsKey final {
 public:
  const char *prefix{};
  const char *name{};
  const char *suffix{};

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

bool operator==(const RawPropsKey &lhs, const RawPropsKey &rhs) noexcept;
bool operator!=(const RawPropsKey &lhs, const RawPropsKey &rhs) noexcept;

} // namespace facebook::react
