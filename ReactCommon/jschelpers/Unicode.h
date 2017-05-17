// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <string>
#include <cstdint>

namespace facebook {
namespace react {
namespace unicode {
__attribute__((visibility("default"))) std::string utf16toUTF8(const uint16_t* utf16, size_t length) noexcept;
}
}
}
