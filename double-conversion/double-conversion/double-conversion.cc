// Copyright 2010 the V8 project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of Google Inc. nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

#include <climits>
#include <locale>
#include <cmath>

#include <double-conversion/double-conversion.h>

#include <double-conversion/bignum-dtoa.h>
#include <double-conversion/fast-dtoa.h>
#include <double-conversion/fixed-dtoa.h>
#include <double-conversion/ieee.h>
#include <double-conversion/strtod.h>
#include <double-conversion/utils.h>

namespace double_conversion {

const DoubleToStringConverter& DoubleToStringConverter::EcmaScriptConverter() {
  int flags = UNIQUE_ZERO | EMIT_POSITIVE_EXPONENT_SIGN;
  static DoubleToStringConverter converter(flags,
                                           "Infinity",
                                           "NaN",
                                           'e',
                                           -6, 21,
                                           6, 0);
  return converter;
}


bool DoubleToStringConverter::HandleSpecialValues(
    double value,
    StringBuilder* result_builder) const {
  Double double_inspect(value);
  if (double_inspect.IsInfinite()) {
    if (infinity_symbol_ == NULL) return false;
    if (value < 0) {
      result_builder->AddCharacter('-');
    }
    result_builder->AddString(infinity_symbol_);
    return true;
  }
  if (double_inspect.IsNan()) {
    if (nan_symbol_ == NULL) return false;
    result_builder->AddString(nan_symbol_);
    return true;
  }
  return false;
}


void DoubleToStringConverter::CreateExponentialRepresentation(
    const char* decimal_digits,
    int length,
    int exponent,
    StringBuilder* result_builder) const {
  ASSERT(length != 0);
  result_builder->AddCharacter(decimal_digits[0]);
  if (length != 1) {
    result_builder->AddCharacter('.');
    result_builder->AddSubstring(&decimal_digits[1], length-1);
  }
  result_builder->AddCharacter(exponent_character_);
  if (exponent < 0) {
    result_builder->AddCharacter('-');
    exponent = -exponent;
  } else {
    if ((flags_ & EMIT_POSITIVE_EXPONENT_SIGN) != 0) {
      result_builder->AddCharacter('+');
    }
  }
  if (exponent == 0) {
    result_builder->AddCharacter('0');
    return;
  }
  ASSERT(exponent < 1e4);
  const int kMaxExponentLength = 5;
  char buffer[kMaxExponentLength + 1];
  buffer[kMaxExponentLength] = '\0';
  int first_char_pos = kMaxExponentLength;
  while (exponent > 0) {
    buffer[--first_char_pos] = '0' + (exponent % 10);
    exponent /= 10;
  }
  result_builder->AddSubstring(&buffer[first_char_pos],
                               kMaxExponentLength - first_char_pos);
}


void DoubleToStringConverter::CreateDecimalRepresentation(
    const char* decimal_digits,
    int length,
    int decimal_point,
    int digits_after_point,
    StringBuilder* result_builder) const {
  // Create a representation that is padded with zeros if needed.
  if (decimal_point <= 0) {
      // "0.00000decimal_rep" or "0.000decimal_rep00".
    result_builder->AddCharacter('0');
    if (digits_after_point > 0) {
      result_builder->AddCharacter('.');
      result_builder->AddPadding('0', -decimal_point);
      ASSERT(length <= digits_after_point - (-decimal_point));
      result_builder->AddSubstring(decimal_digits, length);
      int remaining_digits = digits_after_point - (-decimal_point) - length;
      result_builder->AddPadding('0', remaining_digits);
    }
  } else if (decimal_point >= length) {
    // "decimal_rep0000.00000" or "decimal_rep.0000".
    result_builder->AddSubstring(decimal_digits, length);
    result_builder->AddPadding('0', decimal_point - length);
    if (digits_after_point > 0) {
      result_builder->AddCharacter('.');
      result_builder->AddPadding('0', digits_after_point);
    }
  } else {
    // "decima.l_rep000".
    ASSERT(digits_after_point > 0);
    result_builder->AddSubstring(decimal_digits, decimal_point);
    result_builder->AddCharacter('.');
    ASSERT(length - decimal_point <= digits_after_point);
    result_builder->AddSubstring(&decimal_digits[decimal_point],
                                 length - decimal_point);
    int remaining_digits = digits_after_point - (length - decimal_point);
    result_builder->AddPadding('0', remaining_digits);
  }
  if (digits_after_point == 0) {
    if ((flags_ & EMIT_TRAILING_DECIMAL_POINT) != 0) {
      result_builder->AddCharacter('.');
    }
    if ((flags_ & EMIT_TRAILING_ZERO_AFTER_POINT) != 0) {
      result_builder->AddCharacter('0');
    }
  }
}


bool DoubleToStringConverter::ToShortestIeeeNumber(
    double value,
    StringBuilder* result_builder,
    DoubleToStringConverter::DtoaMode mode) const {
  ASSERT(mode == SHORTEST || mode == SHORTEST_SINGLE);
  if (Double(value).IsSpecial()) {
    return HandleSpecialValues(value, result_builder);
  }

  int decimal_point;
  bool sign;
  const int kDecimalRepCapacity = kBase10MaximalLength + 1;
  char decimal_rep[kDecimalRepCapacity];
  int decimal_rep_length;

  DoubleToAscii(value, mode, 0, decimal_rep, kDecimalRepCapacity,
                &sign, &decimal_rep_length, &decimal_point);

  bool unique_zero = (flags_ & UNIQUE_ZERO) != 0;
  if (sign && (value != 0.0 || !unique_zero)) {
    result_builder->AddCharacter('-');
  }

  int exponent = decimal_point - 1;
  if ((decimal_in_shortest_low_ <= exponent) &&
      (exponent < decimal_in_shortest_high_)) {
    CreateDecimalRepresentation(decimal_rep, decimal_rep_length,
                                decimal_point,
                                Max(0, decimal_rep_length - decimal_point),
                                result_builder);
  } else {
    CreateExponentialRepresentation(decimal_rep, decimal_rep_length, exponent,
                                    result_builder);
  }
  return true;
}


bool DoubleToStringConverter::ToFixed(double value,
                                      int requested_digits,
                                      StringBuilder* result_builder) const {
  ASSERT(kMaxFixedDigitsBeforePoint == 60);
  const double kFirstNonFixed = 1e60;

  if (Double(value).IsSpecial()) {
    return HandleSpecialValues(value, result_builder);
  }

  if (requested_digits > kMaxFixedDigitsAfterPoint) return false;
  if (value >= kFirstNonFixed || value <= -kFirstNonFixed) return false;

  // Find a sufficiently precise decimal representation of n.
  int decimal_point;
  bool sign;
  // Add space for the '\0' byte.
  const int kDecimalRepCapacity =
      kMaxFixedDigitsBeforePoint + kMaxFixedDigitsAfterPoint + 1;
  char decimal_rep[kDecimalRepCapacity];
  int decimal_rep_length;
  DoubleToAscii(value, FIXED, requested_digits,
                decimal_rep, kDecimalRepCapacity,
                &sign, &decimal_rep_length, &decimal_point);

  bool unique_zero = ((flags_ & UNIQUE_ZERO) != 0);
  if (sign && (value != 0.0 || !unique_zero)) {
    result_builder->AddCharacter('-');
  }

  CreateDecimalRepresentation(decimal_rep, decimal_rep_length, decimal_point,
                              requested_digits, result_builder);
  return true;
}


bool DoubleToStringConverter::ToExponential(
    double value,
    int requested_digits,
    StringBuilder* result_builder) const {
  if (Double(value).IsSpecial()) {
    return HandleSpecialValues(value, result_builder);
  }

  if (requested_digits < -1) return false;
  if (requested_digits > kMaxExponentialDigits) return false;

  int decimal_point;
  bool sign;
  // Add space for digit before the decimal point and the '\0' character.
  const int kDecimalRepCapacity = kMaxExponentialDigits + 2;
  ASSERT(kDecimalRepCapacity > kBase10MaximalLength);
  char decimal_rep[kDecimalRepCapacity];
  int decimal_rep_length;

  if (requested_digits == -1) {
    DoubleToAscii(value, SHORTEST, 0,
                  decimal_rep, kDecimalRepCapacity,
                  &sign, &decimal_rep_length, &decimal_point);
  } else {
    DoubleToAscii(value, PRECISION, requested_digits + 1,
                  decimal_rep, kDecimalRepCapacity,
                  &sign, &decimal_rep_length, &decimal_point);
    ASSERT(decimal_rep_length <= requested_digits + 1);

    for (int i = decimal_rep_length; i < requested_digits + 1; ++i) {
      decimal_rep[i] = '0';
    }
    decimal_rep_length = requested_digits + 1;
  }

  bool unique_zero = ((flags_ & UNIQUE_ZERO) != 0);
  if (sign && (value != 0.0 || !unique_zero)) {
    result_builder->AddCharacter('-');
  }

  int exponent = decimal_point - 1;
  CreateExponentialRepresentation(decimal_rep,
                                  decimal_rep_length,
                                  exponent,
                                  result_builder);
  return true;
}


bool DoubleToStringConverter::ToPrecision(double value,
                                          int precision,
                                          StringBuilder* result_builder) const {
  if (Double(value).IsSpecial()) {
    return HandleSpecialValues(value, result_builder);
  }

  if (precision < kMinPrecisionDigits || precision > kMaxPrecisionDigits) {
    return false;
  }

  // Find a sufficiently precise decimal representation of n.
  int decimal_point;
  bool sign;
  // Add one for the terminating null character.
  const int kDecimalRepCapacity = kMaxPrecisionDigits + 1;
  char decimal_rep[kDecimalRepCapacity];
  int decimal_rep_length;

  DoubleToAscii(value, PRECISION, precision,
                decimal_rep, kDecimalRepCapacity,
                &sign, &decimal_rep_length, &decimal_point);
  ASSERT(decimal_rep_length <= precision);

  bool unique_zero = ((flags_ & UNIQUE_ZERO) != 0);
  if (sign && (value != 0.0 || !unique_zero)) {
    result_builder->AddCharacter('-');
  }

  // The exponent if we print the number as x.xxeyyy. That is with the
  // decimal point after the first digit.
  int exponent = decimal_point - 1;

  int extra_zero = ((flags_ & EMIT_TRAILING_ZERO_AFTER_POINT) != 0) ? 1 : 0;
  if ((-decimal_point + 1 > max_leading_padding_zeroes_in_precision_mode_) ||
      (decimal_point - precision + extra_zero >
       max_trailing_padding_zeroes_in_precision_mode_)) {
    // Fill buffer to contain 'precision' digits.
    // Usually the buffer is already at the correct length, but 'DoubleToAscii'
    // is allowed to return less characters.
    for (int i = decimal_rep_length; i < precision; ++i) {
      decimal_rep[i] = '0';
    }

    CreateExponentialRepresentation(decimal_rep,
                                    precision,
                                    exponent,
                                    result_builder);
  } else {
    CreateDecimalRepresentation(decimal_rep, decimal_rep_length, decimal_point,
                                Max(0, precision - decimal_point),
                                result_builder);
  }
  return true;
}


static BignumDtoaMode DtoaToBignumDtoaMode(
    DoubleToStringConverter::DtoaMode dtoa_mode) {
  switch (dtoa_mode) {
    case DoubleToStringConverter::SHORTEST:  return BIGNUM_DTOA_SHORTEST;
    case DoubleToStringConverter::SHORTEST_SINGLE:
        return BIGNUM_DTOA_SHORTEST_SINGLE;
    case DoubleToStringConverter::FIXED:     return BIGNUM_DTOA_FIXED;
    case DoubleToStringConverter::PRECISION: return BIGNUM_DTOA_PRECISION;
    default:
      UNREACHABLE();
  }
}


void DoubleToStringConverter::DoubleToAscii(double v,
                                            DtoaMode mode,
                                            int requested_digits,
                                            char* buffer,
                                            int buffer_length,
                                            bool* sign,
                                            int* length,
                                            int* point) {
  Vector<char> vector(buffer, buffer_length);
  ASSERT(!Double(v).IsSpecial());
  ASSERT(mode == SHORTEST || mode == SHORTEST_SINGLE || requested_digits >= 0);

  if (Double(v).Sign() < 0) {
    *sign = true;
    v = -v;
  } else {
    *sign = false;
  }

  if (mode == PRECISION && requested_digits == 0) {
    vector[0] = '\0';
    *length = 0;
    return;
  }

  if (v == 0) {
    vector[0] = '0';
    vector[1] = '\0';
    *length = 1;
    *point = 1;
    return;
  }

  bool fast_worked;
  switch (mode) {
    case SHORTEST:
      fast_worked = FastDtoa(v, FAST_DTOA_SHORTEST, 0, vector, length, point);
      break;
    case SHORTEST_SINGLE:
      fast_worked = FastDtoa(v, FAST_DTOA_SHORTEST_SINGLE, 0,
                             vector, length, point);
      break;
    case FIXED:
      fast_worked = FastFixedDtoa(v, requested_digits, vector, length, point);
      break;
    case PRECISION:
      fast_worked = FastDtoa(v, FAST_DTOA_PRECISION, requested_digits,
                             vector, length, point);
      break;
    default:
      fast_worked = false;
      UNREACHABLE();
  }
  if (fast_worked) return;

  // If the fast dtoa didn't succeed use the slower bignum version.
  BignumDtoaMode bignum_mode = DtoaToBignumDtoaMode(mode);
  BignumDtoa(v, bignum_mode, requested_digits, vector, length, point);
  vector[*length] = '\0';
}


namespace {

inline char ToLower(char ch) {
  static const std::ctype<char>& cType =
      std::use_facet<std::ctype<char> >(std::locale::classic());
  return cType.tolower(ch);
}

inline char Pass(char ch) {
  return ch;
}

template <class Iterator, class Converter>
static inline bool ConsumeSubStringImpl(Iterator* current,
                                        Iterator end,
                                        const char* substring,
                                        Converter converter) {
  ASSERT(converter(**current) == *substring);
  for (substring++; *substring != '\0'; substring++) {
    ++*current;
    if (*current == end || converter(**current) != *substring) {
      return false;
    }
  }
  ++*current;
  return true;
}

// Consumes the given substring from the iterator.
// Returns false, if the substring does not match.
template <class Iterator>
static bool ConsumeSubString(Iterator* current,
                             Iterator end,
                             const char* substring,
                             bool allow_case_insensibility) {
  if (allow_case_insensibility) {
    return ConsumeSubStringImpl(current, end, substring, ToLower);
  } else {
    return ConsumeSubStringImpl(current, end, substring, Pass);
  }
}

// Consumes first character of the str is equal to ch
inline bool ConsumeFirstCharacter(char ch,
                                         const char* str,
                                         bool case_insensibility) {
  return case_insensibility ? ToLower(ch) == str[0] : ch == str[0];
}
}  // namespace

// Maximum number of significant digits in decimal representation.
// The longest possible double in decimal representation is
// (2^53 - 1) * 2 ^ -1074 that is (2 ^ 53 - 1) * 5 ^ 1074 / 10 ^ 1074
// (768 digits). If we parse a number whose first digits are equal to a
// mean of 2 adjacent doubles (that could have up to 769 digits) the result
// must be rounded to the bigger one unless the tail consists of zeros, so
// we don't need to preserve all the digits.
const int kMaxSignificantDigits = 772;


static const char kWhitespaceTable7[] = { 32, 13, 10, 9, 11, 12 };
static const int kWhitespaceTable7Length = ARRAY_SIZE(kWhitespaceTable7);


static const uc16 kWhitespaceTable16[] = {
  160, 8232, 8233, 5760, 6158, 8192, 8193, 8194, 8195,
  8196, 8197, 8198, 8199, 8200, 8201, 8202, 8239, 8287, 12288, 65279
};
static const int kWhitespaceTable16Length = ARRAY_SIZE(kWhitespaceTable16);


static bool isWhitespace(int x) {
  if (x < 128) {
    for (int i = 0; i < kWhitespaceTable7Length; i++) {
      if (kWhitespaceTable7[i] == x) return true;
    }
  } else {
    for (int i = 0; i < kWhitespaceTable16Length; i++) {
      if (kWhitespaceTable16[i] == x) return true;
    }
  }
  return false;
}


// Returns true if a nonspace found and false if the end has reached.
template <class Iterator>
static inline bool AdvanceToNonspace(Iterator* current, Iterator end) {
  while (*current != end) {
    if (!isWhitespace(**current)) return true;
    ++*current;
  }
  return false;
}


static bool isDigit(int x, int radix) {
  return (x >= '0' && x <= '9' && x < '0' + radix)
      || (radix > 10 && x >= 'a' && x < 'a' + radix - 10)
      || (radix > 10 && x >= 'A' && x < 'A' + radix - 10);
}


static double SignedZero(bool sign) {
  return sign ? -0.0 : 0.0;
}


// Returns true if 'c' is a decimal digit that is valid for the given radix.
//
// The function is small and could be inlined, but VS2012 emitted a warning
// because it constant-propagated the radix and concluded that the last
// condition was always true. By moving it into a separate function the
// compiler wouldn't warn anymore.
#if _MSC_VER
#pragma optimize("",off)
static bool IsDecimalDigitForRadix(int c, int radix) {
  return '0' <= c && c <= '9' && (c - '0') < radix;
}
#pragma optimize("",on)
#else
static bool inline IsDecimalDigitForRadix(int c, int radix) {
	return '0' <= c && c <= '9' && (c - '0') < radix;
}
#endif
// Returns true if 'c' is a character digit that is valid for the given radix.
// The 'a_character' should be 'a' or 'A'.
//
// The function is small and could be inlined, but VS2012 emitted a warning
// because it constant-propagated the radix and concluded that the first
// condition was always false. By moving it into a separate function the
// compiler wouldn't warn anymore.
static bool IsCharacterDigitForRadix(int c, int radix, char a_character) {
  return radix > 10 && c >= a_character && c < a_character + radix - 10;
}


// Parsing integers with radix 2, 4, 8, 16, 32. Assumes current != end.
template <int radix_log_2, class Iterator>
static double RadixStringToIeee(Iterator* current,
                                Iterator end,
                                bool sign,
                                bool allow_trailing_junk,
                                double junk_string_value,
                                bool read_as_double,
                                bool* result_is_junk) {
  ASSERT(*current != end);

  const int kDoubleSize = Double::kSignificandSize;
  const int kSingleSize = Single::kSignificandSize;
  const int kSignificandSize = read_as_double? kDoubleSize: kSingleSize;

  *result_is_junk = true;

  // Skip leading 0s.
  while (**current == '0') {
    ++(*current);
    if (*current == end) {
      *result_is_junk = false;
      return SignedZero(sign);
    }
  }

  int64_t number = 0;
  int exponent = 0;
  const int radix = (1 << radix_log_2);

  do {
    int digit;
    if (IsDecimalDigitForRadix(**current, radix)) {
      digit = static_cast<char>(**current) - '0';
    } else if (IsCharacterDigitForRadix(**current, radix, 'a')) {
      digit = static_cast<char>(**current) - 'a' + 10;
    } else if (IsCharacterDigitForRadix(**current, radix, 'A')) {
      digit = static_cast<char>(**current) - 'A' + 10;
    } else {
      if (allow_trailing_junk || !AdvanceToNonspace(current, end)) {
        break;
      } else {
        return junk_string_value;
      }
    }

    number = number * radix + digit;
    int overflow = static_cast<int>(number >> kSignificandSize);
    if (overflow != 0) {
      // Overflow occurred. Need to determine which direction to round the
      // result.
      int overflow_bits_count = 1;
      while (overflow > 1) {
        overflow_bits_count++;
        overflow >>= 1;
      }

      int dropped_bits_mask = ((1 << overflow_bits_count) - 1);
      int dropped_bits = static_cast<int>(number) & dropped_bits_mask;
      number >>= overflow_bits_count;
      exponent = overflow_bits_count;

      bool zero_tail = true;
      for (;;) {
        ++(*current);
        if (*current == end || !isDigit(**current, radix)) break;
        zero_tail = zero_tail && **current == '0';
        exponent += radix_log_2;
      }

      if (!allow_trailing_junk && AdvanceToNonspace(current, end)) {
        return junk_string_value;
      }

      int middle_value = (1 << (overflow_bits_count - 1));
      if (dropped_bits > middle_value) {
        number++;  // Rounding up.
      } else if (dropped_bits == middle_value) {
        // Rounding to even to consistency with decimals: half-way case rounds
        // up if significant part is odd and down otherwise.
        if ((number & 1) != 0 || !zero_tail) {
          number++;  // Rounding up.
        }
      }

      // Rounding up may cause overflow.
      if ((number & ((int64_t)1 << kSignificandSize)) != 0) {
        exponent++;
        number >>= 1;
      }
      break;
    }
    ++(*current);
  } while (*current != end);

  ASSERT(number < ((int64_t)1 << kSignificandSize));
  ASSERT(static_cast<int64_t>(static_cast<double>(number)) == number);

  *result_is_junk = false;

  if (exponent == 0) {
    if (sign) {
      if (number == 0) return -0.0;
      number = -number;
    }
    return static_cast<double>(number);
  }

  ASSERT(number != 0);
  return Double(DiyFp(number, exponent)).value();
}

template <class Iterator>
double StringToDoubleConverter::StringToIeee(
    Iterator input,
    int length,
    bool read_as_double,
    int* processed_characters_count) const {
  Iterator current = input;
  Iterator end = input + length;

  *processed_characters_count = 0;

  const bool allow_trailing_junk = (flags_ & ALLOW_TRAILING_JUNK) != 0;
  const bool allow_leading_spaces = (flags_ & ALLOW_LEADING_SPACES) != 0;
  const bool allow_trailing_spaces = (flags_ & ALLOW_TRAILING_SPACES) != 0;
  const bool allow_spaces_after_sign = (flags_ & ALLOW_SPACES_AFTER_SIGN) != 0;
  const bool allow_case_insensibility = (flags_ & ALLOW_CASE_INSENSIBILITY) != 0;


  // To make sure that iterator dereferencing is valid the following
  // convention is used:
  // 1. Each '++current' statement is followed by check for equality to 'end'.
  // 2. If AdvanceToNonspace returned false then current == end.
  // 3. If 'current' becomes equal to 'end' the function returns or goes to
  // 'parsing_done'.
  // 4. 'current' is not dereferenced after the 'parsing_done' label.
  // 5. Code before 'parsing_done' may rely on 'current != end'.
  if (current == end) return empty_string_value_;

  if (allow_leading_spaces || allow_trailing_spaces) {
    if (!AdvanceToNonspace(&current, end)) {
      *processed_characters_count = static_cast<int>(current - input);
      return empty_string_value_;
    }
    if (!allow_leading_spaces && (input != current)) {
      // No leading spaces allowed, but AdvanceToNonspace moved forward.
      return junk_string_value_;
    }
  }

  // The longest form of simplified number is: "-<significant digits>.1eXXX\0".
  const int kBufferSize = kMaxSignificantDigits + 10;
  char buffer[kBufferSize];  // NOLINT: size is known at compile time.
  int buffer_pos = 0;

  // Exponent will be adjusted if insignificant digits of the integer part
  // or insignificant leading zeros of the fractional part are dropped.
  int exponent = 0;
  int significant_digits = 0;
  int insignificant_digits = 0;
  bool nonzero_digit_dropped = false;

  bool sign = false;

  if (*current == '+' || *current == '-') {
    sign = (*current == '-');
    ++current;
    Iterator next_non_space = current;
    // Skip following spaces (if allowed).
    if (!AdvanceToNonspace(&next_non_space, end)) return junk_string_value_;
    if (!allow_spaces_after_sign && (current != next_non_space)) {
      return junk_string_value_;
    }
    current = next_non_space;
  }

  if (infinity_symbol_ != NULL) {
    if (ConsumeFirstCharacter(*current, infinity_symbol_, allow_case_insensibility)) {
      if (!ConsumeSubString(&current, end, infinity_symbol_, allow_case_insensibility)) {
        return junk_string_value_;
      }

      if (!(allow_trailing_spaces || allow_trailing_junk) && (current != end)) {
        return junk_string_value_;
      }
      if (!allow_trailing_junk && AdvanceToNonspace(&current, end)) {
        return junk_string_value_;
      }

      ASSERT(buffer_pos == 0);
      *processed_characters_count = static_cast<int>(current - input);
      return sign ? -Double::Infinity() : Double::Infinity();
    }
  }

  if (nan_symbol_ != NULL) {
    if (ConsumeFirstCharacter(*current, nan_symbol_, allow_case_insensibility)) {
      if (!ConsumeSubString(&current, end, nan_symbol_, allow_case_insensibility)) {
        return junk_string_value_;
      }

      if (!(allow_trailing_spaces || allow_trailing_junk) && (current != end)) {
        return junk_string_value_;
      }
      if (!allow_trailing_junk && AdvanceToNonspace(&current, end)) {
        return junk_string_value_;
      }

      ASSERT(buffer_pos == 0);
      *processed_characters_count = static_cast<int>(current - input);
      return sign ? -Double::NaN() : Double::NaN();
    }
  }

  bool leading_zero = false;
  if (*current == '0') {
    ++current;
    if (current == end) {
      *processed_characters_count = static_cast<int>(current - input);
      return SignedZero(sign);
    }

    leading_zero = true;

    // It could be hexadecimal value.
    if ((flags_ & ALLOW_HEX) && (*current == 'x' || *current == 'X')) {
      ++current;
      if (current == end || !isDigit(*current, 16)) {
        return junk_string_value_;  // "0x".
      }

      bool result_is_junk;
      double result = RadixStringToIeee<4>(&current,
                                           end,
                                           sign,
                                           allow_trailing_junk,
                                           junk_string_value_,
                                           read_as_double,
                                           &result_is_junk);
      if (!result_is_junk) {
        if (allow_trailing_spaces) AdvanceToNonspace(&current, end);
        *processed_characters_count = static_cast<int>(current - input);
      }
      return result;
    }

    // Ignore leading zeros in the integer part.
    while (*current == '0') {
      ++current;
      if (current == end) {
        *processed_characters_count = static_cast<int>(current - input);
        return SignedZero(sign);
      }
    }
  }

  bool octal = leading_zero && (flags_ & ALLOW_OCTALS) != 0;

  // Copy significant digits of the integer part (if any) to the buffer.
  while (*current >= '0' && *current <= '9') {
    if (significant_digits < kMaxSignificantDigits) {
      ASSERT(buffer_pos < kBufferSize);
      buffer[buffer_pos++] = static_cast<char>(*current);
      significant_digits++;
      // Will later check if it's an octal in the buffer.
    } else {
      insignificant_digits++;  // Move the digit into the exponential part.
      nonzero_digit_dropped = nonzero_digit_dropped || *current != '0';
    }
    octal = octal && *current < '8';
    ++current;
    if (current == end) goto parsing_done;
  }

  if (significant_digits == 0) {
    octal = false;
  }

  if (*current == '.') {
    if (octal && !allow_trailing_junk) return junk_string_value_;
    if (octal) goto parsing_done;

    ++current;
    if (current == end) {
      if (significant_digits == 0 && !leading_zero) {
        return junk_string_value_;
      } else {
        goto parsing_done;
      }
    }

    if (significant_digits == 0) {
      // octal = false;
      // Integer part consists of 0 or is absent. Significant digits start after
      // leading zeros (if any).
      while (*current == '0') {
        ++current;
        if (current == end) {
          *processed_characters_count = static_cast<int>(current - input);
          return SignedZero(sign);
        }
        exponent--;  // Move this 0 into the exponent.
      }
    }

    // There is a fractional part.
    // We don't emit a '.', but adjust the exponent instead.
    while (*current >= '0' && *current <= '9') {
      if (significant_digits < kMaxSignificantDigits) {
        ASSERT(buffer_pos < kBufferSize);
        buffer[buffer_pos++] = static_cast<char>(*current);
        significant_digits++;
        exponent--;
      } else {
        // Ignore insignificant digits in the fractional part.
        nonzero_digit_dropped = nonzero_digit_dropped || *current != '0';
      }
      ++current;
      if (current == end) goto parsing_done;
    }
  }

  if (!leading_zero && exponent == 0 && significant_digits == 0) {
    // If leading_zeros is true then the string contains zeros.
    // If exponent < 0 then string was [+-]\.0*...
    // If significant_digits != 0 the string is not equal to 0.
    // Otherwise there are no digits in the string.
    return junk_string_value_;
  }

  // Parse exponential part.
  if (*current == 'e' || *current == 'E') {
    if (octal && !allow_trailing_junk) return junk_string_value_;
    if (octal) goto parsing_done;
    ++current;
    if (current == end) {
      if (allow_trailing_junk) {
        goto parsing_done;
      } else {
        return junk_string_value_;
      }
    }
    char exponen_sign = '+';
    if (*current == '+' || *current == '-') {
      exponen_sign = static_cast<char>(*current);
      ++current;
      if (current == end) {
        if (allow_trailing_junk) {
          goto parsing_done;
        } else {
          return junk_string_value_;
        }
      }
    }

    if (current == end || *current < '0' || *current > '9') {
      if (allow_trailing_junk) {
        goto parsing_done;
      } else {
        return junk_string_value_;
      }
    }

    const int max_exponent = INT_MAX / 2;
    ASSERT(-max_exponent / 2 <= exponent && exponent <= max_exponent / 2);
    int num = 0;
    do {
      // Check overflow.
      int digit = *current - '0';
      if (num >= max_exponent / 10
          && !(num == max_exponent / 10 && digit <= max_exponent % 10)) {
        num = max_exponent;
      } else {
        num = num * 10 + digit;
      }
      ++current;
    } while (current != end && *current >= '0' && *current <= '9');

    exponent += (exponen_sign == '-' ? -num : num);
  }

  if (!(allow_trailing_spaces || allow_trailing_junk) && (current != end)) {
    return junk_string_value_;
  }
  if (!allow_trailing_junk && AdvanceToNonspace(&current, end)) {
    return junk_string_value_;
  }
  if (allow_trailing_spaces) {
    AdvanceToNonspace(&current, end);
  }

  parsing_done:
  exponent += insignificant_digits;

  if (octal) {
    double result;
    bool result_is_junk;
    char* start = buffer;
    result = RadixStringToIeee<3>(&start,
                                  buffer + buffer_pos,
                                  sign,
                                  allow_trailing_junk,
                                  junk_string_value_,
                                  read_as_double,
                                  &result_is_junk);
    ASSERT(!result_is_junk);
    *processed_characters_count = static_cast<int>(current - input);
    return result;
  }

  if (nonzero_digit_dropped) {
    buffer[buffer_pos++] = '1';
    exponent--;
  }

  ASSERT(buffer_pos < kBufferSize);
  buffer[buffer_pos] = '\0';

  double converted;
  if (read_as_double) {
    converted = Strtod(Vector<const char>(buffer, buffer_pos), exponent);
  } else {
    converted = Strtof(Vector<const char>(buffer, buffer_pos), exponent);
  }
  *processed_characters_count = static_cast<int>(current - input);
  return sign? -converted: converted;
}


double StringToDoubleConverter::StringToDouble(
    const char* buffer,
    int length,
    int* processed_characters_count) const {
  return StringToIeee(buffer, length, true, processed_characters_count);
}


double StringToDoubleConverter::StringToDouble(
    const uc16* buffer,
    int length,
    int* processed_characters_count) const {
  return StringToIeee(buffer, length, true, processed_characters_count);
}


float StringToDoubleConverter::StringToFloat(
    const char* buffer,
    int length,
    int* processed_characters_count) const {
  return static_cast<float>(StringToIeee(buffer, length, false,
                                         processed_characters_count));
}


float StringToDoubleConverter::StringToFloat(
    const uc16* buffer,
    int length,
    int* processed_characters_count) const {
  return static_cast<float>(StringToIeee(buffer, length, false,
                                         processed_characters_count));
}

}  // namespace double_conversion
