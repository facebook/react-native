/*
 * Copyright 2012-present Facebook, Inc.
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

#include <folly/Format.h>

#include <folly/ConstexprMath.h>
#include <folly/CppAttributes.h>
#include <folly/container/Array.h>

#include <double-conversion/double-conversion.h>

namespace folly {
namespace detail {

//  ctor for items in the align table
struct format_table_align_make_item {
  static constexpr std::size_t size = 256;
  constexpr FormatArg::Align operator()(std::size_t index) const {
    // clang-format off
    return
        index == '<' ? FormatArg::Align::LEFT:
        index == '>' ? FormatArg::Align::RIGHT :
        index == '=' ? FormatArg::Align::PAD_AFTER_SIGN :
        index == '^' ? FormatArg::Align::CENTER :
        FormatArg::Align::INVALID;
    // clang-format on
  }
};

//  ctor for items in the conv tables for representing parts of nonnegative
//  integers into ascii digits of length Size, over a given base Base
template <std::size_t Base, std::size_t Size, bool Upper = false>
struct format_table_conv_make_item {
  static_assert(Base <= 36, "Base is unrepresentable");
  struct make_item {
    std::size_t index{};
    constexpr explicit make_item(std::size_t index_) : index(index_) {} // gcc49
    constexpr char alpha(std::size_t ord) const {
      return ord < 10 ? '0' + ord : (Upper ? 'A' : 'a') + (ord - 10);
    }
    constexpr char operator()(std::size_t offset) const {
      return alpha(index / constexpr_pow(Base, Size - offset - 1) % Base);
    }
  };
  constexpr std::array<char, Size> operator()(std::size_t index) const {
    return make_array_with<Size>(make_item{index});
  }
};

//  ctor for items in the sign table
struct format_table_sign_make_item {
  static constexpr std::size_t size = 256;
  constexpr FormatArg::Sign operator()(std::size_t index) const {
    // clang-format off
    return
        index == '+' ? FormatArg::Sign::PLUS_OR_MINUS :
        index == '-' ? FormatArg::Sign::MINUS :
        index == ' ' ? FormatArg::Sign::SPACE_OR_MINUS :
        FormatArg::Sign::INVALID;
    // clang-format on
  }
};

//  the tables
FOLLY_STORAGE_CONSTEXPR auto formatAlignTable =
    make_array_with<256>(format_table_align_make_item{});
FOLLY_STORAGE_CONSTEXPR auto formatSignTable =
    make_array_with<256>(format_table_sign_make_item{});
FOLLY_STORAGE_CONSTEXPR decltype(formatHexLower) formatHexLower =
    make_array_with<256>(format_table_conv_make_item<16, 2, false>{});
FOLLY_STORAGE_CONSTEXPR decltype(formatHexUpper) formatHexUpper =
    make_array_with<256>(format_table_conv_make_item<16, 2, true>{});
FOLLY_STORAGE_CONSTEXPR decltype(formatOctal) formatOctal =
    make_array_with<512>(format_table_conv_make_item<8, 3>{});
FOLLY_STORAGE_CONSTEXPR decltype(formatBinary) formatBinary =
    make_array_with<256>(format_table_conv_make_item<2, 8>{});

} // namespace detail

using namespace folly::detail;

void FormatValue<double>::formatHelper(
    fbstring& piece,
    int& prefixLen,
    FormatArg& arg) const {
  using ::double_conversion::DoubleToStringConverter;
  using ::double_conversion::StringBuilder;

  arg.validate(FormatArg::Type::FLOAT);

  if (arg.presentation == FormatArg::kDefaultPresentation) {
    arg.presentation = 'g';
  }

  const char* infinitySymbol = isupper(arg.presentation) ? "INF" : "inf";
  const char* nanSymbol = isupper(arg.presentation) ? "NAN" : "nan";
  char exponentSymbol = isupper(arg.presentation) ? 'E' : 'e';

  if (arg.precision == FormatArg::kDefaultPrecision) {
    arg.precision = 6;
  }

  // 2+: for null terminator and optional sign shenanigans.
  constexpr int bufLen = 2 +
      constexpr_max(2 + DoubleToStringConverter::kMaxFixedDigitsBeforePoint +
                        DoubleToStringConverter::kMaxFixedDigitsAfterPoint,
                    constexpr_max(
                        8 + DoubleToStringConverter::kMaxExponentialDigits,
                        7 + DoubleToStringConverter::kMaxPrecisionDigits));
  char buf[bufLen];
  StringBuilder builder(buf + 1, bufLen - 1);

  char plusSign;
  switch (arg.sign) {
    case FormatArg::Sign::PLUS_OR_MINUS:
      plusSign = '+';
      break;
    case FormatArg::Sign::SPACE_OR_MINUS:
      plusSign = ' ';
      break;
    default:
      plusSign = '\0';
      break;
  };

  auto flags = DoubleToStringConverter::EMIT_POSITIVE_EXPONENT_SIGN |
      (arg.trailingDot ? DoubleToStringConverter::EMIT_TRAILING_DECIMAL_POINT
                       : 0);

  double val = val_;
  switch (arg.presentation) {
    case '%':
      val *= 100;
      FOLLY_FALLTHROUGH;
    case 'f':
    case 'F': {
      if (arg.precision > DoubleToStringConverter::kMaxFixedDigitsAfterPoint) {
        arg.precision = DoubleToStringConverter::kMaxFixedDigitsAfterPoint;
      }
      DoubleToStringConverter conv(
          flags,
          infinitySymbol,
          nanSymbol,
          exponentSymbol,
          -4,
          arg.precision,
          0,
          0);
      arg.enforce(
          conv.ToFixed(val, arg.precision, &builder),
          "fixed double conversion failed");
      break;
    }
    case 'e':
    case 'E': {
      if (arg.precision > DoubleToStringConverter::kMaxExponentialDigits) {
        arg.precision = DoubleToStringConverter::kMaxExponentialDigits;
      }

      DoubleToStringConverter conv(
          flags,
          infinitySymbol,
          nanSymbol,
          exponentSymbol,
          -4,
          arg.precision,
          0,
          0);
      arg.enforce(conv.ToExponential(val, arg.precision, &builder));
      break;
    }
    case 'n': // should be locale-aware, but isn't
    case 'g':
    case 'G': {
      if (arg.precision < DoubleToStringConverter::kMinPrecisionDigits) {
        arg.precision = DoubleToStringConverter::kMinPrecisionDigits;
      } else if (arg.precision > DoubleToStringConverter::kMaxPrecisionDigits) {
        arg.precision = DoubleToStringConverter::kMaxPrecisionDigits;
      }
      DoubleToStringConverter conv(
          flags,
          infinitySymbol,
          nanSymbol,
          exponentSymbol,
          -4,
          arg.precision,
          0,
          0);
      arg.enforce(conv.ToShortest(val, &builder));
      break;
    }
    default:
      arg.error("invalid specifier '", arg.presentation, "'");
  }

  int len = builder.position();
  builder.Finalize();
  DCHECK_GT(len, 0);

  // Add '+' or ' ' sign if needed
  char* p = buf + 1;
  // anything that's neither negative nor nan
  prefixLen = 0;
  if (plusSign && (*p != '-' && *p != 'n' && *p != 'N')) {
    *--p = plusSign;
    ++len;
    prefixLen = 1;
  } else if (*p == '-') {
    prefixLen = 1;
  }

  piece = fbstring(p, size_t(len));
}

void FormatArg::initSlow() {
  auto b = fullArgString.begin();
  auto end = fullArgString.end();

  // Parse key
  auto p = static_cast<const char*>(memchr(b, ':', size_t(end - b)));
  if (!p) {
    key_ = StringPiece(b, end);
    return;
  }
  key_ = StringPiece(b, p);

  if (*p == ':') {
    // parse format spec
    if (++p == end) {
      return;
    }

    // fill/align, or just align
    Align a;
    if (p + 1 != end &&
        (a = formatAlignTable[static_cast<unsigned char>(p[1])]) !=
            Align::INVALID) {
      fill = *p;
      align = a;
      p += 2;
      if (p == end) {
        return;
      }
    } else if (
        (a = formatAlignTable[static_cast<unsigned char>(*p)]) !=
        Align::INVALID) {
      align = a;
      if (++p == end) {
        return;
      }
    }

    Sign s;
    unsigned char uSign = static_cast<unsigned char>(*p);
    if ((s = formatSignTable[uSign]) != Sign::INVALID) {
      sign = s;
      if (++p == end) {
        return;
      }
    }

    if (*p == '#') {
      basePrefix = true;
      if (++p == end) {
        return;
      }
    }

    if (*p == '0') {
      enforce(align == Align::DEFAULT, "alignment specified twice");
      fill = '0';
      align = Align::PAD_AFTER_SIGN;
      if (++p == end) {
        return;
      }
    }

    auto readInt = [&] {
      auto const c = p;
      do {
        ++p;
      } while (p != end && *p >= '0' && *p <= '9');
      return to<int>(StringPiece(c, p));
    };

    if (*p == '*') {
      width = kDynamicWidth;
      ++p;

      if (p == end) {
        return;
      }

      if (*p >= '0' && *p <= '9') {
        widthIndex = readInt();
      }

      if (p == end) {
        return;
      }
    } else if (*p >= '0' && *p <= '9') {
      width = readInt();

      if (p == end) {
        return;
      }
    }

    if (*p == ',') {
      thousandsSeparator = true;
      if (++p == end) {
        return;
      }
    }

    if (*p == '.') {
      auto d = ++p;
      while (p != end && *p >= '0' && *p <= '9') {
        ++p;
      }
      if (p != d) {
        precision = to<int>(StringPiece(d, p));
        if (p != end && *p == '.') {
          trailingDot = true;
          ++p;
        }
      } else {
        trailingDot = true;
      }

      if (p == end) {
        return;
      }
    }

    presentation = *p;
    if (++p == end) {
      return;
    }
  }

  error("extra characters in format string");
}

void FormatArg::validate(Type type) const {
  enforce(keyEmpty(), "index not allowed");
  switch (type) {
    case Type::INTEGER:
      enforce(
          precision == kDefaultPrecision, "precision not allowed on integers");
      break;
    case Type::FLOAT:
      enforce(
          !basePrefix, "base prefix ('#') specifier only allowed on integers");
      enforce(
          !thousandsSeparator,
          "thousands separator (',') only allowed on integers");
      break;
    case Type::OTHER:
      enforce(
          align != Align::PAD_AFTER_SIGN,
          "'='alignment only allowed on numbers");
      enforce(sign == Sign::DEFAULT, "sign specifier only allowed on numbers");
      enforce(
          !basePrefix, "base prefix ('#') specifier only allowed on integers");
      enforce(
          !thousandsSeparator,
          "thousands separator (',') only allowed on integers");
      break;
  }
}

namespace detail {
void insertThousandsGroupingUnsafe(char* start_buffer, char** end_buffer) {
  uint32_t remaining_digits = uint32_t(*end_buffer - start_buffer);
  uint32_t separator_size = (remaining_digits - 1) / 3;
  uint32_t result_size = remaining_digits + separator_size;
  *end_buffer = *end_buffer + separator_size;

  // get the end of the new string with the separators
  uint32_t buffer_write_index = result_size - 1;
  uint32_t buffer_read_index = remaining_digits - 1;
  start_buffer[buffer_write_index + 1] = 0;

  bool done = false;
  uint32_t next_group_size = 3;

  while (!done) {
    uint32_t current_group_size = std::max<uint32_t>(
        1, std::min<uint32_t>(remaining_digits, next_group_size));

    // write out the current group's digits to the buffer index
    for (uint32_t i = 0; i < current_group_size; i++) {
      start_buffer[buffer_write_index--] = start_buffer[buffer_read_index--];
    }

    // if not finished, write the separator before the next group
    if (buffer_write_index < buffer_write_index + 1) {
      start_buffer[buffer_write_index--] = ',';
    } else {
      done = true;
    }

    remaining_digits -= current_group_size;
  }
}
} // namespace detail

FormatKeyNotFoundException::FormatKeyNotFoundException(StringPiece key)
    : std::out_of_range(kMessagePrefix.str() + key.str()) {}

constexpr StringPiece const FormatKeyNotFoundException::kMessagePrefix;

} // namespace folly
