/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RawPropsKey.h"

#include <array>
#include <cassert>
#include <cstring>

#include <react/renderer/core/RawPropsPrimitives.h>

namespace facebook::react {

void RawPropsKey::render(char* buffer, RawPropsPropNameLength* length)
    const noexcept {
  *length = 0;

  constexpr size_t maxLength = kPropNameLengthHardCap - 1;

  auto appendSegment = [&](const char* segment) {
    auto copyLen = std::min(std::strlen(segment), maxLength - *length);
    std::memcpy(buffer + *length, segment, copyLen);
    *length += static_cast<RawPropsPropNameLength>(copyLen);
  };

  if (prefix != nullptr) {
    appendSegment(prefix);
  }

  appendSegment(name);

  if (suffix != nullptr) {
    appendSegment(suffix);
  }
}

RawPropsKey::operator std::string() const noexcept {
  auto buffer = std::array<char, kPropNameLengthHardCap>();
  RawPropsPropNameLength length = 0;
  render(buffer.data(), &length);
  return std::string{buffer.data(), length};
}

static bool areFieldsEqual(const char* lhs, const char* rhs) {
  if (lhs == nullptr || rhs == nullptr) {
    return lhs == rhs;
  }
  return lhs == rhs || strcmp(lhs, rhs) == 0;
}

bool operator==(const RawPropsKey& lhs, const RawPropsKey& rhs) noexcept {
  // Note: We check the name first.
  return areFieldsEqual(lhs.name, rhs.name) &&
      areFieldsEqual(lhs.prefix, rhs.prefix) &&
      areFieldsEqual(lhs.suffix, rhs.suffix);
}

} // namespace facebook::react
