/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RawPropsKey.h"

#include <cassert>
#include <cstring>

#include <react/debug/react_native_assert.h>
#include <react/renderer/core/RawPropsPrimitives.h>

namespace facebook {
namespace react {

void RawPropsKey::render(char *buffer, RawPropsPropNameLength *length)
    const noexcept {
  *length = 0;

  // Prefix
  if (prefix) {
    auto prefixLength =
        static_cast<RawPropsPropNameLength>(std::strlen(prefix));
    std::memcpy(buffer, prefix, prefixLength);
    *length = prefixLength;
  }

  // Name
  auto nameLength = static_cast<RawPropsPropNameLength>(std::strlen(name));
  std::memcpy(buffer + *length, name, nameLength);
  *length += nameLength;

  // Suffix
  if (suffix) {
    auto suffixLength =
        static_cast<RawPropsPropNameLength>(std::strlen(suffix));
    std::memcpy(buffer + *length, suffix, suffixLength);
    *length += suffixLength;
  }
  react_native_assert(*length < kPropNameLengthHardCap);
}

RawPropsKey::operator std::string() const noexcept {
  char buffer[kPropNameLengthHardCap];
  RawPropsPropNameLength length = 0;
  render(buffer, &length);
  react_native_assert(length < kPropNameLengthHardCap);
  return std::string{buffer, length};
}

static bool areFieldsEqual(char const *lhs, char const *rhs) {
  if (lhs == nullptr || rhs == nullptr) {
    return lhs == rhs;
  }
  return std::string(lhs) == std::string(rhs);
}

bool operator==(RawPropsKey const &lhs, RawPropsKey const &rhs) noexcept {
  // Note: We check the name first.
  return areFieldsEqual(lhs.name, rhs.name) &&
      areFieldsEqual(lhs.prefix, rhs.prefix) &&
      areFieldsEqual(lhs.suffix, rhs.suffix);
}

bool operator!=(RawPropsKey const &lhs, RawPropsKey const &rhs) noexcept {
  return !(lhs == rhs);
}

} // namespace react
} // namespace facebook
