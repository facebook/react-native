// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "Unicode.h"

namespace facebook {
namespace react {
namespace unicode {
namespace {

// TODO(12827176): Don't duplicate this code here and fbjni.

const uint16_t kUtf8OneByteBoundary       = 0x80;
const uint16_t kUtf8TwoBytesBoundary      = 0x800;
const uint16_t kUtf16HighSubLowBoundary   = 0xD800;
const uint16_t kUtf16HighSubHighBoundary  = 0xDC00;
const uint16_t kUtf16LowSubHighBoundary   = 0xE000;

// Calculate how many bytes are needed to convert an UTF16 string into UTF8
// UTF16 string
size_t utf16toUTF8Length(const uint16_t* utf16String, size_t utf16StringLen) {
  if (!utf16String || utf16StringLen == 0) {
    return 0;
  }

  uint32_t utf8StringLen = 0;
  auto utf16StringEnd = utf16String + utf16StringLen;
  auto idx16 = utf16String;
  while (idx16 < utf16StringEnd) {
    auto ch = *idx16++;
    if (ch < kUtf8OneByteBoundary) {
      utf8StringLen++;
    } else if (ch < kUtf8TwoBytesBoundary) {
      utf8StringLen += 2;
    } else if (
        (ch >= kUtf16HighSubLowBoundary) && (ch < kUtf16HighSubHighBoundary) &&
        (idx16 < utf16StringEnd) &&
        (*idx16 >= kUtf16HighSubHighBoundary) && (*idx16 < kUtf16LowSubHighBoundary)) {
      utf8StringLen += 4;
      idx16++;
    } else {
      utf8StringLen += 3;
    }
  }

  return utf8StringLen;
}

} // namespace

std::string utf16toUTF8(const uint16_t* utf16String, size_t utf16StringLen) noexcept {
  if (!utf16String || utf16StringLen <= 0) {
    return "";
  }

  std::string utf8String(utf16toUTF8Length(utf16String, utf16StringLen), '\0');
  auto idx8 = utf8String.begin();
  auto idx16 = utf16String;
  auto utf16StringEnd = utf16String + utf16StringLen;
  while (idx16 < utf16StringEnd) {
    auto ch = *idx16++;
    if (ch < kUtf8OneByteBoundary) {
      *idx8++ = (ch & 0x7F);
    } else if (ch < kUtf8TwoBytesBoundary) {
      *idx8++ = 0b11000000 | (ch >> 6);
      *idx8++ = 0b10000000 | (ch & 0x3F);
    } else if (
        (ch >= kUtf16HighSubLowBoundary) && (ch < kUtf16HighSubHighBoundary) &&
        (idx16 < utf16StringEnd) &&
        (*idx16 >= kUtf16HighSubHighBoundary) && (*idx16 < kUtf16LowSubHighBoundary)) {
      auto ch2 = *idx16++;
      uint8_t trunc_byte = (((ch >> 6) & 0x0F) + 1);
      *idx8++ = 0b11110000 | (trunc_byte >> 2);
      *idx8++ = 0b10000000 | ((trunc_byte & 0x03) << 4) | ((ch >> 2) & 0x0F);
      *idx8++ = 0b10000000 | ((ch & 0x03) << 4) | ((ch2 >> 6) & 0x0F);
      *idx8++ = 0b10000000 | (ch2 & 0x3F);
    } else {
      *idx8++ = 0b11100000 | (ch >> 12);
      *idx8++ = 0b10000000 | ((ch >> 6) & 0x3F);
      *idx8++ = 0b10000000 | (ch & 0x3F);
    }
  }

  return utf8String;
}

} // namespace unicode
} // namespace react
} // namespace facebook
