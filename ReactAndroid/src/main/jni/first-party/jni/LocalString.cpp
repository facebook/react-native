/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <jni/LocalString.h>
#include <jni/Environment.h>
#include <fb/assert.h>

#include <vector>

namespace facebook {
namespace jni {

namespace {

const uint16_t kUtf8OneByteBoundary       = 0x80;
const uint16_t kUtf8TwoBytesBoundary      = 0x800;
const uint16_t kUtf16HighSubLowBoundary   = 0xD800;
const uint16_t kUtf16HighSubHighBoundary  = 0xDC00;
const uint16_t kUtf16LowSubHighBoundary   = 0xE000;

inline void encode3ByteUTF8(char32_t code, uint8_t* out) {
  FBASSERTMSGF((code & 0xffff0000) == 0, "3 byte utf-8 encodings only valid for up to 16 bits");

  out[0] = 0xE0 | (code >> 12);
  out[1] = 0x80 | ((code >> 6) & 0x3F);
  out[2] = 0x80 | (code & 0x3F);
}

inline char32_t decode3ByteUTF8(const uint8_t* in) {
  return (((in[0] & 0x0f) << 12) |
          ((in[1] & 0x3f) << 6) |
          ( in[2] & 0x3f));
}

inline void encode4ByteUTF8(char32_t code, std::string& out, size_t offset) {
  FBASSERTMSGF((code & 0xfff80000) == 0, "4 byte utf-8 encodings only valid for up to 21 bits");

  out[offset] =     (char) (0xF0 | (code >> 18));
  out[offset + 1] = (char) (0x80 | ((code >> 12) & 0x3F));
  out[offset + 2] = (char) (0x80 | ((code >> 6) & 0x3F));
  out[offset + 3] = (char) (0x80 | (code & 0x3F));
}

template <typename T>
inline bool isFourByteUTF8Encoding(const T* utf8) {
  return ((*utf8 & 0xF8) == 0xF0);
}

}

namespace detail {

size_t modifiedLength(const std::string& str) {
  // Scan for supplementary characters
  size_t j = 0;
  for (size_t i = 0; i < str.size(); ) {
    if (str[i] == 0) {
      i += 1;
      j += 2;
    } else if (i + 4 > str.size() ||
               !isFourByteUTF8Encoding(&(str[i]))) {
      // See the code in utf8ToModifiedUTF8 for what's happening here.
      i += 1;
      j += 1;
    } else {
      i += 4;
      j += 6;
    }
  }

  return j;
}

// returns modified utf8 length; *length is set to strlen(str)
size_t modifiedLength(const uint8_t* str, size_t* length) {
  // NUL-terminated: Scan for length and supplementary characters
  size_t i = 0;
  size_t j = 0;
  while (str[i] != 0) {
    if (str[i + 1] == 0 ||
        str[i + 2] == 0 ||
        str[i + 3] == 0 ||
        !isFourByteUTF8Encoding(&(str[i]))) {
      i += 1;
      j += 1;
    } else {
      i += 4;
      j += 6;
    }
  }

  *length = i;
  return j;
}

void utf8ToModifiedUTF8(const uint8_t* utf8, size_t len, uint8_t* modified, size_t modifiedBufLen)
{
  size_t j = 0;
  for (size_t i = 0; i < len; ) {
    FBASSERTMSGF(j < modifiedBufLen, "output buffer is too short");
    if (utf8[i] == 0) {
      FBASSERTMSGF(j + 1 < modifiedBufLen, "output buffer is too short");
      modified[j] = 0xc0;
      modified[j + 1] = 0x80;
      i += 1;
      j += 2;
      continue;
    }

    if (i + 4 > len ||
        !isFourByteUTF8Encoding(utf8 + i)) {
      // If the input is too short for this to be a four-byte
      // encoding, or it isn't one for real, just copy it on through.
      modified[j] = utf8[i];
      i++;
      j++;
      continue;
    }

    // Convert 4 bytes of input to 2 * 3 bytes of output
    char32_t code = (((utf8[i]     & 0x07) << 18) |
                     ((utf8[i + 1] & 0x3f) << 12) |
                     ((utf8[i + 2] & 0x3f) << 6) |
                     ( utf8[i + 3] & 0x3f));
    char32_t first;
    char32_t second;

    if (code > 0x10ffff) {
      // These could be valid utf-8, but cannot be represented as modified UTF-8, due to the 20-bit
      // limit on that representation.  Encode two replacement characters, so the expected output
      // length lines up.
      const char32_t kUnicodeReplacementChar = 0xfffd;
      first = kUnicodeReplacementChar;
      second = kUnicodeReplacementChar;
    } else {
      // split into surrogate pair
      first = ((code - 0x010000) >> 10) | 0xd800;
      second = ((code - 0x010000) & 0x3ff) | 0xdc00;
    }

    // encode each as a 3 byte surrogate value
    FBASSERTMSGF(j + 5 < modifiedBufLen, "output buffer is too short");
    encode3ByteUTF8(first, modified + j);
    encode3ByteUTF8(second, modified + j + 3);
    i += 4;
    j += 6;
  }

  FBASSERTMSGF(j < modifiedBufLen, "output buffer is too short");
  modified[j++] = '\0';
}

std::string modifiedUTF8ToUTF8(const uint8_t* modified, size_t len) {
  // Converting from modified utf8 to utf8 will always shrink, so this will always be sufficient
  std::string utf8(len, 0);
  size_t j = 0;
  for (size_t i = 0; i < len; ) {
    // surrogate pair: 1101 10xx  xxxx xxxx  1101 11xx  xxxx xxxx
    // encoded pair: 1110 1101  1010 xxxx  10xx xxxx  1110 1101  1011 xxxx  10xx xxxx

    if (len >= i + 6 &&
        modified[i] == 0xed &&
        (modified[i + 1] & 0xf0) == 0xa0 &&
        modified[i + 3] == 0xed &&
        (modified[i + 4] & 0xf0) == 0xb0) {
      // Valid surrogate pair
      char32_t pair1 = decode3ByteUTF8(modified + i);
      char32_t pair2 = decode3ByteUTF8(modified + i + 3);
      char32_t ch = 0x10000 + (((pair1 & 0x3ff) << 10) |
                               ( pair2 & 0x3ff));
      encode4ByteUTF8(ch, utf8, j);
      i += 6;
      j += 4;
      continue;
    } else if (len >= i + 2 &&
               modified[i] == 0xc0 &&
               modified[i + 1] == 0x80) {
      utf8[j] = 0;
      i += 2;
      j += 1;
      continue;
    }

    // copy one byte.  This might be a one, two, or three-byte encoding.  It might be an invalid
    // encoding of some sort, but garbage in garbage out is ok.

    utf8[j] = (char) modified[i];
    i++;
    j++;
  }

  utf8.resize(j);

  return utf8;
}

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

std::string utf16toUTF8(const uint16_t* utf16String, size_t utf16StringLen) {
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

}

LocalString::LocalString(const std::string& str)
{
  size_t modlen = detail::modifiedLength(str);
  if (modlen == str.size()) {
    // no supplementary characters, build jstring from input buffer
    m_string = Environment::current()->NewStringUTF(str.data());
    return;
  }
  auto modified = std::vector<char>(modlen + 1); // allocate extra byte for \0
  detail::utf8ToModifiedUTF8(
    reinterpret_cast<const uint8_t*>(str.data()), str.size(),
    reinterpret_cast<uint8_t*>(modified.data()), modified.size());
  m_string = Environment::current()->NewStringUTF(modified.data());
}

LocalString::LocalString(const char* str)
{
  size_t len;
  size_t modlen = detail::modifiedLength(reinterpret_cast<const uint8_t*>(str), &len);
  if (modlen == len) {
    // no supplementary characters, build jstring from input buffer
    m_string = Environment::current()->NewStringUTF(str);
    return;
  }
  auto modified = std::vector<char>(modlen + 1); // allocate extra byte for \0
  detail::utf8ToModifiedUTF8(
    reinterpret_cast<const uint8_t*>(str), len,
    reinterpret_cast<uint8_t*>(modified.data()), modified.size());
  m_string = Environment::current()->NewStringUTF(modified.data());
}

LocalString::~LocalString() {
  Environment::current()->DeleteLocalRef(m_string);
}

std::string fromJString(JNIEnv* env, jstring str) {
  auto utf16String = JStringUtf16Extractor(env, str);
  auto length = env->GetStringLength(str);
  return detail::utf16toUTF8(utf16String, length);
}

} }
