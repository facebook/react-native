/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

#include <react/core/RawPropsPrimitives.h>

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
  explicit operator std::string() const;

  /*
   * Renders compound prop name to given buffer and put the resulting length
   * into `length`.
   */
  void render(char *buffer, RawPropsPropNameLength *length) const;
};

bool operator==(RawPropsKey const &lhs, RawPropsKey const &rhs);
bool operator!=(RawPropsKey const &lhs, RawPropsKey const &rhs);

} // namespace react
} // namespace facebook
