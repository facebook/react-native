// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <string>
#include <cstdint>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook {
namespace react {
namespace unicode {
RN_EXPORT std::string utf16toUTF8(const uint16_t* utf16, size_t length) noexcept;
}
}
}
