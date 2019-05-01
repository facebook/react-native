/*
 * Copyright 2011-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <folly/Unicode.h>
#include <folly/Conv.h>

namespace folly {

//////////////////////////////////////////////////////////////////////

std::string codePointToUtf8(char32_t cp) {
  std::string result;

  // Based on description from http://en.wikipedia.org/wiki/UTF-8.

  if (cp <= 0x7f) {
    result.resize(1);
    result[0] = static_cast<char>(cp);
  } else if (cp <= 0x7FF) {
    result.resize(2);
    result[1] = static_cast<char>(0x80 | (0x3f & cp));
    result[0] = static_cast<char>(0xC0 | (cp >> 6));
  } else if (cp <= 0xFFFF) {
    result.resize(3);
    result[2] = static_cast<char>(0x80 | (0x3f & cp));
    result[1] = (0x80 | static_cast<char>((0x3f & (cp >> 6))));
    result[0] = (0xE0 | static_cast<char>(cp >> 12));
  } else if (cp <= 0x10FFFF) {
    result.resize(4);
    result[3] = static_cast<char>(0x80 | (0x3f & cp));
    result[2] = static_cast<char>(0x80 | (0x3f & (cp >> 6)));
    result[1] = static_cast<char>(0x80 | (0x3f & (cp >> 12)));
    result[0] = static_cast<char>(0xF0 | (cp >> 18));
  }

  return result;
}

char32_t utf8ToCodePoint(
    const unsigned char*& p,
    const unsigned char* const e,
    bool skipOnError) {
  /* The following encodings are valid, except for the 5 and 6 byte
   * combinations:
   * 0xxxxxxx
   * 110xxxxx 10xxxxxx
   * 1110xxxx 10xxxxxx 10xxxxxx
   * 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
   * 111110xx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
   * 1111110x 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
   */

  const auto skip = [&] {
    ++p;
    return U'\ufffd';
  };

  if (p >= e) {
    if (skipOnError) {
      return skip();
    }
    throw std::runtime_error("folly::utf8ToCodePoint empty/invalid string");
  }

  unsigned char fst = *p;
  if (!(fst & 0x80)) {
    // trivial case
    return *p++;
  }

  static const uint32_t bitMask[] = {
      (1 << 7) - 1,
      (1 << 11) - 1,
      (1 << 16) - 1,
      (1 << 21) - 1,
  };

  // upper control bits are masked out later
  uint32_t d = fst;

  if ((fst & 0xC0) != 0xC0) {
    if (skipOnError) {
      return skip();
    }
    throw std::runtime_error(
        to<std::string>("folly::utf8ToCodePoint i=0 d=", d));
  }

  fst <<= 1;

  for (unsigned int i = 1; i != 4 && p + i < e; ++i) {
    const unsigned char tmp = p[i];

    if ((tmp & 0xC0) != 0x80) {
      if (skipOnError) {
        return skip();
      }
      throw std::runtime_error(to<std::string>(
          "folly::utf8ToCodePoint i=", i, " tmp=", (uint32_t)tmp));
    }

    d = (d << 6) | (tmp & 0x3F);
    fst <<= 1;

    if (!(fst & 0x80)) {
      d &= bitMask[i];

      // overlong, could have been encoded with i bytes
      if ((d & ~bitMask[i - 1]) == 0) {
        if (skipOnError) {
          return skip();
        }
        throw std::runtime_error(
            to<std::string>("folly::utf8ToCodePoint i=", i, " d=", d));
      }

      // check for surrogates only needed for 3 bytes
      if (i == 2) {
        if ((d >= 0xD800 && d <= 0xDFFF) || d > 0x10FFFF) {
          if (skipOnError) {
            return skip();
          }
          throw std::runtime_error(
              to<std::string>("folly::utf8ToCodePoint i=", i, " d=", d));
        }
      }

      p += i + 1;
      return d;
    }
  }

  if (skipOnError) {
    return skip();
  }
  throw std::runtime_error("folly::utf8ToCodePoint encoding length maxed out");
}

//////////////////////////////////////////////////////////////////////

} // namespace folly
