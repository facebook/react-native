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
#include <folly/Conv.h>
#include <array>

namespace folly {
namespace detail {

namespace {

/**
 * Finds the first non-digit in a string. The number of digits
 * searched depends on the precision of the Tgt integral. Assumes the
 * string starts with NO whitespace and NO sign.
 *
 * The semantics of the routine is:
 *   for (;; ++b) {
 *     if (b >= e || !isdigit(*b)) return b;
 *   }
 *
 *  Complete unrolling marks bottom-line (i.e. entire conversion)
 *  improvements of 20%.
 */
inline const char* findFirstNonDigit(const char* b, const char* e) {
  for (; b < e; ++b) {
    auto const c = static_cast<unsigned>(*b) - '0';
    if (c >= 10) {
      break;
    }
  }
  return b;
}

// Maximum value of number when represented as a string
template <class T>
struct MaxString {
  static const char* const value;
};

template <>
const char* const MaxString<uint8_t>::value = "255";
template <>
const char* const MaxString<uint16_t>::value = "65535";
template <>
const char* const MaxString<uint32_t>::value = "4294967295";
#if __SIZEOF_LONG__ == 4
template <>
const char* const MaxString<unsigned long>::value = "4294967295";
#else
template <>
const char* const MaxString<unsigned long>::value = "18446744073709551615";
#endif
static_assert(
    sizeof(unsigned long) >= 4,
    "Wrong value for MaxString<unsigned long>::value,"
    " please update.");
template <>
const char* const MaxString<unsigned long long>::value = "18446744073709551615";
static_assert(
    sizeof(unsigned long long) >= 8,
    "Wrong value for MaxString<unsigned long long>::value"
    ", please update.");

#if FOLLY_HAVE_INT128_T
template <>
const char* const MaxString<__uint128_t>::value =
    "340282366920938463463374607431768211455";
#endif

/*
 * Lookup tables that converts from a decimal character value to an integral
 * binary value, shifted by a decimal "shift" multiplier.
 * For all character values in the range '0'..'9', the table at those
 * index locations returns the actual decimal value shifted by the multiplier.
 * For all other values, the lookup table returns an invalid OOR value.
 */
// Out-of-range flag value, larger than the largest value that can fit in
// four decimal bytes (9999), but four of these added up together should
// still not overflow uint16_t.
constexpr int32_t OOR = 10000;

alignas(16) constexpr uint16_t shift1[] = {
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 0-9
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, //  10
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, //  20
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, //  30
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, 0,   1, //  40
    2,   3,   4,   5,   6,   7,   8,   9,   OOR, OOR,
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, //  60
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, //  70
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, //  80
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, //  90
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 100
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 110
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 120
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 130
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 140
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 150
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 160
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 170
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 180
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 190
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 200
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 210
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 220
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 230
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 240
    OOR, OOR, OOR, OOR, OOR, OOR // 250
};

alignas(16) constexpr uint16_t shift10[] = {
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 0-9
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, //  10
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, //  20
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, //  30
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, 0,   10, //  40
    20,  30,  40,  50,  60,  70,  80,  90,  OOR, OOR,
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, //  60
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, //  70
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, //  80
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, //  90
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 100
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 110
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 120
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 130
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 140
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 150
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 160
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 170
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 180
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 190
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 200
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 210
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 220
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 230
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 240
    OOR, OOR, OOR, OOR, OOR, OOR // 250
};

alignas(16) constexpr uint16_t shift100[] = {
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 0-9
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, //  10
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, //  20
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, //  30
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, 0,   100, //  40
    200, 300, 400, 500, 600, 700, 800, 900, OOR, OOR,
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, //  60
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, //  70
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, //  80
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, //  90
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 100
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 110
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 120
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 130
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 140
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 150
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 160
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 170
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 180
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 190
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 200
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 210
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 220
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 230
    OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, OOR, // 240
    OOR, OOR, OOR, OOR, OOR, OOR // 250
};

alignas(16) constexpr uint16_t shift1000[] = {
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, // 0-9
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, //  10
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, //  20
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, //  30
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  0,   1000, //  40
    2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, OOR, OOR,
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, //  60
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, //  70
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, //  80
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, //  90
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, // 100
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, // 110
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, // 120
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, // 130
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, // 140
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, // 150
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, // 160
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, // 170
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, // 180
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, // 190
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, // 200
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, // 210
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, // 220
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, // 230
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR,  OOR, OOR, // 240
    OOR,  OOR,  OOR,  OOR,  OOR,  OOR // 250
};

struct ErrorString {
  const char* string;
  bool quote;
};

// Keep this in sync with ConversionCode in Conv.h
constexpr const std::array<
    ErrorString,
    static_cast<std::size_t>(ConversionCode::NUM_ERROR_CODES)>
    kErrorStrings{{
        {"Success", true},
        {"Empty input string", true},
        {"No digits found in input string", true},
        {"Integer overflow when parsing bool (must be 0 or 1)", true},
        {"Invalid value for bool", true},
        {"Non-digit character found", true},
        {"Invalid leading character", true},
        {"Overflow during conversion", true},
        {"Negative overflow during conversion", true},
        {"Unable to convert string to floating point value", true},
        {"Non-whitespace character found after end of conversion", true},
        {"Overflow during arithmetic conversion", false},
        {"Negative overflow during arithmetic conversion", false},
        {"Loss of precision during arithmetic conversion", false},
    }};

// Check if ASCII is really ASCII
using IsAscii =
    bool_constant<'A' == 65 && 'Z' == 90 && 'a' == 97 && 'z' == 122>;

// The code in this file that uses tolower() really only cares about
// 7-bit ASCII characters, so we can take a nice shortcut here.
inline char tolower_ascii(char in) {
  return IsAscii::value ? in | 0x20 : char(std::tolower(in));
}

inline bool bool_str_cmp(const char** b, size_t len, const char* value) {
  // Can't use strncasecmp, since we want to ensure that the full value matches
  const char* p = *b;
  const char* e = *b + len;
  const char* v = value;
  while (*v != '\0') {
    if (p == e || tolower_ascii(*p) != *v) { // value is already lowercase
      return false;
    }
    ++p;
    ++v;
  }

  *b = p;
  return true;
}

} // namespace

Expected<bool, ConversionCode> str_to_bool(StringPiece* src) noexcept {
  auto b = src->begin(), e = src->end();
  for (;; ++b) {
    if (b >= e) {
      return makeUnexpected(ConversionCode::EMPTY_INPUT_STRING);
    }
    if (!std::isspace(*b)) {
      break;
    }
  }

  bool result;
  size_t len = size_t(e - b);
  switch (*b) {
    case '0':
    case '1': {
      result = false;
      for (; b < e && isdigit(*b); ++b) {
        if (result || (*b != '0' && *b != '1')) {
          return makeUnexpected(ConversionCode::BOOL_OVERFLOW);
        }
        result = (*b == '1');
      }
      break;
    }
    case 'y':
    case 'Y':
      result = true;
      if (!bool_str_cmp(&b, len, "yes")) {
        ++b; // accept the single 'y' character
      }
      break;
    case 'n':
    case 'N':
      result = false;
      if (!bool_str_cmp(&b, len, "no")) {
        ++b;
      }
      break;
    case 't':
    case 'T':
      result = true;
      if (!bool_str_cmp(&b, len, "true")) {
        ++b;
      }
      break;
    case 'f':
    case 'F':
      result = false;
      if (!bool_str_cmp(&b, len, "false")) {
        ++b;
      }
      break;
    case 'o':
    case 'O':
      if (bool_str_cmp(&b, len, "on")) {
        result = true;
      } else if (bool_str_cmp(&b, len, "off")) {
        result = false;
      } else {
        return makeUnexpected(ConversionCode::BOOL_INVALID_VALUE);
      }
      break;
    default:
      return makeUnexpected(ConversionCode::BOOL_INVALID_VALUE);
  }

  src->assign(b, e);

  return result;
}

/**
 * StringPiece to double, with progress information. Alters the
 * StringPiece parameter to munch the already-parsed characters.
 */
template <class Tgt>
Expected<Tgt, ConversionCode> str_to_floating(StringPiece* src) noexcept {
  using namespace double_conversion;
  static StringToDoubleConverter conv(
      StringToDoubleConverter::ALLOW_TRAILING_JUNK |
          StringToDoubleConverter::ALLOW_LEADING_SPACES,
      0.0,
      // return this for junk input string
      std::numeric_limits<double>::quiet_NaN(),
      nullptr,
      nullptr);

  if (src->empty()) {
    return makeUnexpected(ConversionCode::EMPTY_INPUT_STRING);
  }

  int length;
  auto result = conv.StringToDouble(
      src->data(),
      static_cast<int>(src->size()),
      &length); // processed char count

  if (!std::isnan(result)) {
    // If we get here with length = 0, the input string is empty.
    // If we get here with result = 0.0, it's either because the string
    // contained only whitespace, or because we had an actual zero value
    // (with potential trailing junk). If it was only whitespace, we
    // want to raise an error; length will point past the last character
    // that was processed, so we need to check if that character was
    // whitespace or not.
    if (length == 0 ||
        (result == 0.0 && std::isspace((*src)[size_t(length) - 1]))) {
      return makeUnexpected(ConversionCode::EMPTY_INPUT_STRING);
    }
    if (length >= 2) {
      const char* suffix = src->data() + length - 1;
      // double_conversion doesn't update length correctly when there is an
      // incomplete exponent specifier. Converting "12e-f-g" shouldn't consume
      // any more than "12", but it will consume "12e-".

      // "123-" should only parse "123"
      if (*suffix == '-' || *suffix == '+') {
        --suffix;
        --length;
      }
      // "12e-f-g" or "12euro" should only parse "12"
      if (*suffix == 'e' || *suffix == 'E') {
        --length;
      }
    }
    src->advance(size_t(length));
    return Tgt(result);
  }

  auto* e = src->end();
  auto* b =
      std::find_if_not(src->begin(), e, [](char c) { return std::isspace(c); });

  // There must be non-whitespace, otherwise we would have caught this above
  assert(b < e);
  size_t size = size_t(e - b);

  bool negative = false;
  if (*b == '-') {
    negative = true;
    ++b;
    --size;
  }

  result = 0.0;

  switch (tolower_ascii(*b)) {
    case 'i':
      if (size >= 3 && tolower_ascii(b[1]) == 'n' &&
          tolower_ascii(b[2]) == 'f') {
        if (size >= 8 && tolower_ascii(b[3]) == 'i' &&
            tolower_ascii(b[4]) == 'n' && tolower_ascii(b[5]) == 'i' &&
            tolower_ascii(b[6]) == 't' && tolower_ascii(b[7]) == 'y') {
          b += 8;
        } else {
          b += 3;
        }
        result = std::numeric_limits<Tgt>::infinity();
      }
      break;

    case 'n':
      if (size >= 3 && tolower_ascii(b[1]) == 'a' &&
          tolower_ascii(b[2]) == 'n') {
        b += 3;
        result = std::numeric_limits<Tgt>::quiet_NaN();
      }
      break;

    default:
      break;
  }

  if (result == 0.0) {
    // All bets are off
    return makeUnexpected(ConversionCode::STRING_TO_FLOAT_ERROR);
  }

  if (negative) {
    result = -result;
  }

  src->assign(b, e);

  return Tgt(result);
}

template Expected<float, ConversionCode> str_to_floating<float>(
    StringPiece* src) noexcept;
template Expected<double, ConversionCode> str_to_floating<double>(
    StringPiece* src) noexcept;

/**
 * This class takes care of additional processing needed for signed values,
 * like leading sign character and overflow checks.
 */
template <typename T, bool IsSigned = std::is_signed<T>::value>
class SignedValueHandler;

template <typename T>
class SignedValueHandler<T, true> {
 public:
  ConversionCode init(const char*& b) {
    negative_ = false;
    if (!std::isdigit(*b)) {
      if (*b == '-') {
        negative_ = true;
      } else if (UNLIKELY(*b != '+')) {
        return ConversionCode::INVALID_LEADING_CHAR;
      }
      ++b;
    }
    return ConversionCode::SUCCESS;
  }

  ConversionCode overflow() {
    return negative_ ? ConversionCode::NEGATIVE_OVERFLOW
                     : ConversionCode::POSITIVE_OVERFLOW;
  }

  template <typename U>
  Expected<T, ConversionCode> finalize(U value) {
    T rv;
    if (negative_) {
      rv = T(-value);
      if (UNLIKELY(rv > 0)) {
        return makeUnexpected(ConversionCode::NEGATIVE_OVERFLOW);
      }
    } else {
      rv = T(value);
      if (UNLIKELY(rv < 0)) {
        return makeUnexpected(ConversionCode::POSITIVE_OVERFLOW);
      }
    }
    return rv;
  }

 private:
  bool negative_;
};

// For unsigned types, we don't need any extra processing
template <typename T>
class SignedValueHandler<T, false> {
 public:
  ConversionCode init(const char*&) {
    return ConversionCode::SUCCESS;
  }

  ConversionCode overflow() {
    return ConversionCode::POSITIVE_OVERFLOW;
  }

  Expected<T, ConversionCode> finalize(T value) {
    return value;
  }
};

/**
 * String represented as a pair of pointers to char to signed/unsigned
 * integrals. Assumes NO whitespace before or after, and also that the
 * string is composed entirely of digits (and an optional sign only for
 * signed types). String may be empty, in which case digits_to returns
 * an appropriate error.
 */
template <class Tgt>
inline Expected<Tgt, ConversionCode> digits_to(
    const char* b,
    const char* const e) noexcept {
  using UT = typename std::make_unsigned<Tgt>::type;
  assert(b <= e);

  SignedValueHandler<Tgt> sgn;

  auto err = sgn.init(b);
  if (UNLIKELY(err != ConversionCode::SUCCESS)) {
    return makeUnexpected(err);
  }

  size_t size = size_t(e - b);

  /* Although the string is entirely made of digits, we still need to
   * check for overflow.
   */
  if (size > std::numeric_limits<UT>::digits10) {
    // Leading zeros?
    if (b < e && *b == '0') {
      for (++b;; ++b) {
        if (b == e) {
          return Tgt(0); // just zeros, e.g. "0000"
        }
        if (*b != '0') {
          size = size_t(e - b);
          break;
        }
      }
    }
    if (size > std::numeric_limits<UT>::digits10 &&
        (size != std::numeric_limits<UT>::digits10 + 1 ||
         strncmp(b, MaxString<UT>::value, size) > 0)) {
      return makeUnexpected(sgn.overflow());
    }
  }

  // Here we know that the number won't overflow when
  // converted. Proceed without checks.

  UT result = 0;

  for (; e - b >= 4; b += 4) {
    result *= static_cast<UT>(10000);
    const int32_t r0 = shift1000[static_cast<size_t>(b[0])];
    const int32_t r1 = shift100[static_cast<size_t>(b[1])];
    const int32_t r2 = shift10[static_cast<size_t>(b[2])];
    const int32_t r3 = shift1[static_cast<size_t>(b[3])];
    const auto sum = r0 + r1 + r2 + r3;
    if (sum >= OOR) {
      goto outOfRange;
    }
    result += UT(sum);
  }

  switch (e - b) {
    case 3: {
      const int32_t r0 = shift100[static_cast<size_t>(b[0])];
      const int32_t r1 = shift10[static_cast<size_t>(b[1])];
      const int32_t r2 = shift1[static_cast<size_t>(b[2])];
      const auto sum = r0 + r1 + r2;
      if (sum >= OOR) {
        goto outOfRange;
      }
      result = UT(1000 * result + sum);
      break;
    }
    case 2: {
      const int32_t r0 = shift10[static_cast<size_t>(b[0])];
      const int32_t r1 = shift1[static_cast<size_t>(b[1])];
      const auto sum = r0 + r1;
      if (sum >= OOR) {
        goto outOfRange;
      }
      result = UT(100 * result + sum);
      break;
    }
    case 1: {
      const int32_t sum = shift1[static_cast<size_t>(b[0])];
      if (sum >= OOR) {
        goto outOfRange;
      }
      result = UT(10 * result + sum);
      break;
    }
    default:
      assert(b == e);
      if (size == 0) {
        return makeUnexpected(ConversionCode::NO_DIGITS);
      }
      break;
  }

  return sgn.finalize(result);

outOfRange:
  return makeUnexpected(ConversionCode::NON_DIGIT_CHAR);
}

template Expected<char, ConversionCode> digits_to<char>(
    const char*,
    const char*) noexcept;
template Expected<signed char, ConversionCode> digits_to<signed char>(
    const char*,
    const char*) noexcept;
template Expected<unsigned char, ConversionCode> digits_to<unsigned char>(
    const char*,
    const char*) noexcept;

template Expected<short, ConversionCode> digits_to<short>(
    const char*,
    const char*) noexcept;
template Expected<unsigned short, ConversionCode> digits_to<unsigned short>(
    const char*,
    const char*) noexcept;

template Expected<int, ConversionCode> digits_to<int>(
    const char*,
    const char*) noexcept;
template Expected<unsigned int, ConversionCode> digits_to<unsigned int>(
    const char*,
    const char*) noexcept;

template Expected<long, ConversionCode> digits_to<long>(
    const char*,
    const char*) noexcept;
template Expected<unsigned long, ConversionCode> digits_to<unsigned long>(
    const char*,
    const char*) noexcept;

template Expected<long long, ConversionCode> digits_to<long long>(
    const char*,
    const char*) noexcept;
template Expected<unsigned long long, ConversionCode>
digits_to<unsigned long long>(const char*, const char*) noexcept;

#if FOLLY_HAVE_INT128_T
template Expected<__int128, ConversionCode> digits_to<__int128>(
    const char*,
    const char*) noexcept;
template Expected<unsigned __int128, ConversionCode>
digits_to<unsigned __int128>(const char*, const char*) noexcept;
#endif

/**
 * StringPiece to integrals, with progress information. Alters the
 * StringPiece parameter to munch the already-parsed characters.
 */
template <class Tgt>
Expected<Tgt, ConversionCode> str_to_integral(StringPiece* src) noexcept {
  using UT = typename std::make_unsigned<Tgt>::type;

  auto b = src->data(), past = src->data() + src->size();

  for (;; ++b) {
    if (UNLIKELY(b >= past)) {
      return makeUnexpected(ConversionCode::EMPTY_INPUT_STRING);
    }
    if (!std::isspace(*b)) {
      break;
    }
  }

  SignedValueHandler<Tgt> sgn;
  auto err = sgn.init(b);

  if (UNLIKELY(err != ConversionCode::SUCCESS)) {
    return makeUnexpected(err);
  }
  if (std::is_signed<Tgt>::value && UNLIKELY(b >= past)) {
    return makeUnexpected(ConversionCode::NO_DIGITS);
  }
  if (UNLIKELY(!isdigit(*b))) {
    return makeUnexpected(ConversionCode::NON_DIGIT_CHAR);
  }

  auto m = findFirstNonDigit(b + 1, past);

  auto tmp = digits_to<UT>(b, m);

  if (UNLIKELY(!tmp.hasValue())) {
    return makeUnexpected(
        tmp.error() == ConversionCode::POSITIVE_OVERFLOW ? sgn.overflow()
                                                         : tmp.error());
  }

  auto res = sgn.finalize(tmp.value());

  if (res.hasValue()) {
    src->advance(size_t(m - src->data()));
  }

  return res;
}

template Expected<char, ConversionCode> str_to_integral<char>(
    StringPiece* src) noexcept;
template Expected<signed char, ConversionCode> str_to_integral<signed char>(
    StringPiece* src) noexcept;
template Expected<unsigned char, ConversionCode> str_to_integral<unsigned char>(
    StringPiece* src) noexcept;

template Expected<short, ConversionCode> str_to_integral<short>(
    StringPiece* src) noexcept;
template Expected<unsigned short, ConversionCode>
str_to_integral<unsigned short>(StringPiece* src) noexcept;

template Expected<int, ConversionCode> str_to_integral<int>(
    StringPiece* src) noexcept;
template Expected<unsigned int, ConversionCode> str_to_integral<unsigned int>(
    StringPiece* src) noexcept;

template Expected<long, ConversionCode> str_to_integral<long>(
    StringPiece* src) noexcept;
template Expected<unsigned long, ConversionCode> str_to_integral<unsigned long>(
    StringPiece* src) noexcept;

template Expected<long long, ConversionCode> str_to_integral<long long>(
    StringPiece* src) noexcept;
template Expected<unsigned long long, ConversionCode>
str_to_integral<unsigned long long>(StringPiece* src) noexcept;

#if FOLLY_HAVE_INT128_T
template Expected<__int128, ConversionCode> str_to_integral<__int128>(
    StringPiece* src) noexcept;
template Expected<unsigned __int128, ConversionCode>
str_to_integral<unsigned __int128>(StringPiece* src) noexcept;
#endif

} // namespace detail

ConversionError makeConversionError(ConversionCode code, StringPiece input) {
  using namespace detail;
  static_assert(
      std::is_unsigned<std::underlying_type<ConversionCode>::type>::value,
      "ConversionCode should be unsigned");
  assert((std::size_t)code < kErrorStrings.size());
  const ErrorString& err = kErrorStrings[(std::size_t)code];
  if (code == ConversionCode::EMPTY_INPUT_STRING && input.empty()) {
    return {err.string, code};
  }
  std::string tmp(err.string);
  tmp.append(": ");
  if (err.quote) {
    tmp.append(1, '"');
  }
  if (input.size() > 0) {
    tmp.append(input.data(), input.size());
  }
  if (err.quote) {
    tmp.append(1, '"');
  }
  return {tmp, code};
}

} // namespace folly
