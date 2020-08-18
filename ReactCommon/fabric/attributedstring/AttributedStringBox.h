/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <react/attributedstring/AttributedString.h>

namespace facebook {
namespace react {

/*
 * Represents an object storing a shared `AttributedString` or a shared pointer
 * to some opaque platform-specific object that can be used as an attributed
 * string. The class serves two main purposes:
 *  - Represent type-erased attributed string entity (which can be
 * platform-specific or platform-independent);
 *  - Represent a container that can be copied with constant complexity.
 */
class AttributedStringBox final {
 public:
  enum class Mode { Value, OpaquePointer };

  /*
   * Default constructor constructs an empty string.
   */
  AttributedStringBox();

  /*
   * Custom explicit constructors.
   */
  explicit AttributedStringBox(AttributedString const &value);
  explicit AttributedStringBox(std::shared_ptr<void> const &opaquePointer);

  /*
   * Movable, Copyable, Assignable.
   */
  AttributedStringBox(AttributedStringBox const &other) = default;
  AttributedStringBox(AttributedStringBox &&other) noexcept = default;
  AttributedStringBox &operator=(AttributedStringBox const &other) = default;
  AttributedStringBox &operator=(AttributedStringBox &&other) = default;

  /*
   * Getters.
   */
  Mode getMode() const;
  AttributedString const &getValue() const;
  std::shared_ptr<void> getOpaquePointer() const;

 private:
  Mode mode_;
  std::shared_ptr<AttributedString const> value_;
  std::shared_ptr<void> opaquePointer_;
};

} // namespace react
} // namespace facebook
