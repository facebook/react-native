// Copyright 2012 the V8 project authors. All rights reserved.
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

#ifndef DOUBLE_CONVERSION_DOUBLE_CONVERSION_H_
#define DOUBLE_CONVERSION_DOUBLE_CONVERSION_H_

#include <double-conversion/utils.h>

namespace double_conversion {

class DoubleToStringConverter {
 public:
  // When calling ToFixed with a double > 10^kMaxFixedDigitsBeforePoint
  // or a requested_digits parameter > kMaxFixedDigitsAfterPoint then the
  // function returns false.
  static const int kMaxFixedDigitsBeforePoint = 60;
  static const int kMaxFixedDigitsAfterPoint = 60;

  // When calling ToExponential with a requested_digits
  // parameter > kMaxExponentialDigits then the function returns false.
  static const int kMaxExponentialDigits = 120;

  // When calling ToPrecision with a requested_digits
  // parameter < kMinPrecisionDigits or requested_digits > kMaxPrecisionDigits
  // then the function returns false.
  static const int kMinPrecisionDigits = 1;
  static const int kMaxPrecisionDigits = 120;

  enum Flags {
    NO_FLAGS = 0,
    EMIT_POSITIVE_EXPONENT_SIGN = 1,
    EMIT_TRAILING_DECIMAL_POINT = 2,
    EMIT_TRAILING_ZERO_AFTER_POINT = 4,
    UNIQUE_ZERO = 8
  };

  // Flags should be a bit-or combination of the possible Flags-enum.
  //  - NO_FLAGS: no special flags.
  //  - EMIT_POSITIVE_EXPONENT_SIGN: when the number is converted into exponent
  //    form, emits a '+' for positive exponents. Example: 1.2e+2.
  //  - EMIT_TRAILING_DECIMAL_POINT: when the input number is an integer and is
  //    converted into decimal format then a trailing decimal point is appended.
  //    Example: 2345.0 is converted to "2345.".
  //  - EMIT_TRAILING_ZERO_AFTER_POINT: in addition to a trailing decimal point
  //    emits a trailing '0'-character. This flag requires the
  //    EXMIT_TRAILING_DECIMAL_POINT flag.
  //    Example: 2345.0 is converted to "2345.0".
  //  - UNIQUE_ZERO: "-0.0" is converted to "0.0".
  //
  // Infinity symbol and nan_symbol provide the string representation for these
  // special values. If the string is NULL and the special value is encountered
  // then the conversion functions return false.
  //
  // The exponent_character is used in exponential representations. It is
  // usually 'e' or 'E'.
  //
  // When converting to the shortest representation the converter will
  // represent input numbers in decimal format if they are in the interval
  // [10^decimal_in_shortest_low; 10^decimal_in_shortest_high[
  //    (lower boundary included, greater boundary excluded).
  // Example: with decimal_in_shortest_low = -6 and
  //               decimal_in_shortest_high = 21:
  //   ToShortest(0.000001)  -> "0.000001"
  //   ToShortest(0.0000001) -> "1e-7"
  //   ToShortest(111111111111111111111.0)  -> "111111111111111110000"
  //   ToShortest(100000000000000000000.0)  -> "100000000000000000000"
  //   ToShortest(1111111111111111111111.0) -> "1.1111111111111111e+21"
  //
  // When converting to precision mode the converter may add
  // max_leading_padding_zeroes before returning the number in exponential
  // format.
  // Example with max_leading_padding_zeroes_in_precision_mode = 6.
  //   ToPrecision(0.0000012345, 2) -> "0.0000012"
  //   ToPrecision(0.00000012345, 2) -> "1.2e-7"
  // Similarily the converter may add up to
  // max_trailing_padding_zeroes_in_precision_mode in precision mode to avoid
  // returning an exponential representation. A zero added by the
  // EMIT_TRAILING_ZERO_AFTER_POINT flag is counted for this limit.
  // Examples for max_trailing_padding_zeroes_in_precision_mode = 1:
  //   ToPrecision(230.0, 2) -> "230"
  //   ToPrecision(230.0, 2) -> "230."  with EMIT_TRAILING_DECIMAL_POINT.
  //   ToPrecision(230.0, 2) -> "2.3e2" with EMIT_TRAILING_ZERO_AFTER_POINT.
  DoubleToStringConverter(int flags,
                          const char* infinity_symbol,
                          const char* nan_symbol,
                          char exponent_character,
                          int decimal_in_shortest_low,
                          int decimal_in_shortest_high,
                          int max_leading_padding_zeroes_in_precision_mode,
                          int max_trailing_padding_zeroes_in_precision_mode)
      : flags_(flags),
        infinity_symbol_(infinity_symbol),
        nan_symbol_(nan_symbol),
        exponent_character_(exponent_character),
        decimal_in_shortest_low_(decimal_in_shortest_low),
        decimal_in_shortest_high_(decimal_in_shortest_high),
        max_leading_padding_zeroes_in_precision_mode_(
            max_leading_padding_zeroes_in_precision_mode),
        max_trailing_padding_zeroes_in_precision_mode_(
            max_trailing_padding_zeroes_in_precision_mode) {
    // When 'trailing zero after the point' is set, then 'trailing point'
    // must be set too.
    ASSERT(((flags & EMIT_TRAILING_DECIMAL_POINT) != 0) ||
        !((flags & EMIT_TRAILING_ZERO_AFTER_POINT) != 0));
  }

  // Returns a converter following the EcmaScript specification.
  static const DoubleToStringConverter& EcmaScriptConverter();

  // Computes the shortest string of digits that correctly represent the input
  // number. Depending on decimal_in_shortest_low and decimal_in_shortest_high
  // (see constructor) it then either returns a decimal representation, or an
  // exponential representation.
  // Example with decimal_in_shortest_low = -6,
  //              decimal_in_shortest_high = 21,
  //              EMIT_POSITIVE_EXPONENT_SIGN activated, and
  //              EMIT_TRAILING_DECIMAL_POINT deactived:
  //   ToShortest(0.000001)  -> "0.000001"
  //   ToShortest(0.0000001) -> "1e-7"
  //   ToShortest(111111111111111111111.0)  -> "111111111111111110000"
  //   ToShortest(100000000000000000000.0)  -> "100000000000000000000"
  //   ToShortest(1111111111111111111111.0) -> "1.1111111111111111e+21"
  //
  // Note: the conversion may round the output if the returned string
  // is accurate enough to uniquely identify the input-number.
  // For example the most precise representation of the double 9e59 equals
  // "899999999999999918767229449717619953810131273674690656206848", but
  // the converter will return the shorter (but still correct) "9e59".
  //
  // Returns true if the conversion succeeds. The conversion always succeeds
  // except when the input value is special and no infinity_symbol or
  // nan_symbol has been given to the constructor.
  bool ToShortest(double value, StringBuilder* result_builder) const {
    return ToShortestIeeeNumber(value, result_builder, SHORTEST);
  }

  // Same as ToShortest, but for single-precision floats.
  bool ToShortestSingle(float value, StringBuilder* result_builder) const {
    return ToShortestIeeeNumber(value, result_builder, SHORTEST_SINGLE);
  }


  // Computes a decimal representation with a fixed number of digits after the
  // decimal point. The last emitted digit is rounded.
  //
  // Examples:
  //   ToFixed(3.12, 1) -> "3.1"
  //   ToFixed(3.1415, 3) -> "3.142"
  //   ToFixed(1234.56789, 4) -> "1234.5679"
  //   ToFixed(1.23, 5) -> "1.23000"
  //   ToFixed(0.1, 4) -> "0.1000"
  //   ToFixed(1e30, 2) -> "1000000000000000019884624838656.00"
  //   ToFixed(0.1, 30) -> "0.100000000000000005551115123126"
  //   ToFixed(0.1, 17) -> "0.10000000000000001"
  //
  // If requested_digits equals 0, then the tail of the result depends on
  // the EMIT_TRAILING_DECIMAL_POINT and EMIT_TRAILING_ZERO_AFTER_POINT.
  // Examples, for requested_digits == 0,
  //   let EMIT_TRAILING_DECIMAL_POINT and EMIT_TRAILING_ZERO_AFTER_POINT be
  //    - false and false: then 123.45 -> 123
  //                             0.678 -> 1
  //    - true and false: then 123.45 -> 123.
  //                            0.678 -> 1.
  //    - true and true: then 123.45 -> 123.0
  //                           0.678 -> 1.0
  //
  // Returns true if the conversion succeeds. The conversion always succeeds
  // except for the following cases:
  //   - the input value is special and no infinity_symbol or nan_symbol has
  //     been provided to the constructor,
  //   - 'value' > 10^kMaxFixedDigitsBeforePoint, or
  //   - 'requested_digits' > kMaxFixedDigitsAfterPoint.
  // The last two conditions imply that the result will never contain more than
  // 1 + kMaxFixedDigitsBeforePoint + 1 + kMaxFixedDigitsAfterPoint characters
  // (one additional character for the sign, and one for the decimal point).
  bool ToFixed(double value,
               int requested_digits,
               StringBuilder* result_builder) const;

  // Computes a representation in exponential format with requested_digits
  // after the decimal point. The last emitted digit is rounded.
  // If requested_digits equals -1, then the shortest exponential representation
  // is computed.
  //
  // Examples with EMIT_POSITIVE_EXPONENT_SIGN deactivated, and
  //               exponent_character set to 'e'.
  //   ToExponential(3.12, 1) -> "3.1e0"
  //   ToExponential(5.0, 3) -> "5.000e0"
  //   ToExponential(0.001, 2) -> "1.00e-3"
  //   ToExponential(3.1415, -1) -> "3.1415e0"
  //   ToExponential(3.1415, 4) -> "3.1415e0"
  //   ToExponential(3.1415, 3) -> "3.142e0"
  //   ToExponential(123456789000000, 3) -> "1.235e14"
  //   ToExponential(1000000000000000019884624838656.0, -1) -> "1e30"
  //   ToExponential(1000000000000000019884624838656.0, 32) ->
  //                     "1.00000000000000001988462483865600e30"
  //   ToExponential(1234, 0) -> "1e3"
  //
  // Returns true if the conversion succeeds. The conversion always succeeds
  // except for the following cases:
  //   - the input value is special and no infinity_symbol or nan_symbol has
  //     been provided to the constructor,
  //   - 'requested_digits' > kMaxExponentialDigits.
  // The last condition implies that the result will never contain more than
  // kMaxExponentialDigits + 8 characters (the sign, the digit before the
  // decimal point, the decimal point, the exponent character, the
  // exponent's sign, and at most 3 exponent digits).
  bool ToExponential(double value,
                     int requested_digits,
                     StringBuilder* result_builder) const;

  // Computes 'precision' leading digits of the given 'value' and returns them
  // either in exponential or decimal format, depending on
  // max_{leading|trailing}_padding_zeroes_in_precision_mode (given to the
  // constructor).
  // The last computed digit is rounded.
  //
  // Example with max_leading_padding_zeroes_in_precision_mode = 6.
  //   ToPrecision(0.0000012345, 2) -> "0.0000012"
  //   ToPrecision(0.00000012345, 2) -> "1.2e-7"
  // Similarily the converter may add up to
  // max_trailing_padding_zeroes_in_precision_mode in precision mode to avoid
  // returning an exponential representation. A zero added by the
  // EMIT_TRAILING_ZERO_AFTER_POINT flag is counted for this limit.
  // Examples for max_trailing_padding_zeroes_in_precision_mode = 1:
  //   ToPrecision(230.0, 2) -> "230"
  //   ToPrecision(230.0, 2) -> "230."  with EMIT_TRAILING_DECIMAL_POINT.
  //   ToPrecision(230.0, 2) -> "2.3e2" with EMIT_TRAILING_ZERO_AFTER_POINT.
  // Examples for max_trailing_padding_zeroes_in_precision_mode = 3, and no
  //    EMIT_TRAILING_ZERO_AFTER_POINT:
  //   ToPrecision(123450.0, 6) -> "123450"
  //   ToPrecision(123450.0, 5) -> "123450"
  //   ToPrecision(123450.0, 4) -> "123500"
  //   ToPrecision(123450.0, 3) -> "123000"
  //   ToPrecision(123450.0, 2) -> "1.2e5"
  //
  // Returns true if the conversion succeeds. The conversion always succeeds
  // except for the following cases:
  //   - the input value is special and no infinity_symbol or nan_symbol has
  //     been provided to the constructor,
  //   - precision < kMinPericisionDigits
  //   - precision > kMaxPrecisionDigits
  // The last condition implies that the result will never contain more than
  // kMaxPrecisionDigits + 7 characters (the sign, the decimal point, the
  // exponent character, the exponent's sign, and at most 3 exponent digits).
  bool ToPrecision(double value,
                   int precision,
                   StringBuilder* result_builder) const;

  enum DtoaMode {
    // Produce the shortest correct representation.
    // For example the output of 0.299999999999999988897 is (the less accurate
    // but correct) 0.3.
    SHORTEST,
    // Same as SHORTEST, but for single-precision floats.
    SHORTEST_SINGLE,
    // Produce a fixed number of digits after the decimal point.
    // For instance fixed(0.1, 4) becomes 0.1000
    // If the input number is big, the output will be big.
    FIXED,
    // Fixed number of digits (independent of the decimal point).
    PRECISION
  };

  // The maximal number of digits that are needed to emit a double in base 10.
  // A higher precision can be achieved by using more digits, but the shortest
  // accurate representation of any double will never use more digits than
  // kBase10MaximalLength.
  // Note that DoubleToAscii null-terminates its input. So the given buffer
  // should be at least kBase10MaximalLength + 1 characters long.
  static const int kBase10MaximalLength = 17;

  // Converts the given double 'v' to ascii. 'v' must not be NaN, +Infinity, or
  // -Infinity. In SHORTEST_SINGLE-mode this restriction also applies to 'v'
  // after it has been casted to a single-precision float. That is, in this
  // mode static_cast<float>(v) must not be NaN, +Infinity or -Infinity.
  //
  // The result should be interpreted as buffer * 10^(point-length).
  //
  // The output depends on the given mode:
  //  - SHORTEST: produce the least amount of digits for which the internal
  //   identity requirement is still satisfied. If the digits are printed
  //   (together with the correct exponent) then reading this number will give
  //   'v' again. The buffer will choose the representation that is closest to
  //   'v'. If there are two at the same distance, than the one farther away
  //   from 0 is chosen (halfway cases - ending with 5 - are rounded up).
  //   In this mode the 'requested_digits' parameter is ignored.
  //  - SHORTEST_SINGLE: same as SHORTEST but with single-precision.
  //  - FIXED: produces digits necessary to print a given number with
  //   'requested_digits' digits after the decimal point. The produced digits
  //   might be too short in which case the caller has to fill the remainder
  //   with '0's.
  //   Example: toFixed(0.001, 5) is allowed to return buffer="1", point=-2.
  //   Halfway cases are rounded towards +/-Infinity (away from 0). The call
  //   toFixed(0.15, 2) thus returns buffer="2", point=0.
  //   The returned buffer may contain digits that would be truncated from the
  //   shortest representation of the input.
  //  - PRECISION: produces 'requested_digits' where the first digit is not '0'.
  //   Even though the length of produced digits usually equals
  //   'requested_digits', the function is allowed to return fewer digits, in
  //   which case the caller has to fill the missing digits with '0's.
  //   Halfway cases are again rounded away from 0.
  // DoubleToAscii expects the given buffer to be big enough to hold all
  // digits and a terminating null-character. In SHORTEST-mode it expects a
  // buffer of at least kBase10MaximalLength + 1. In all other modes the
  // requested_digits parameter and the padding-zeroes limit the size of the
  // output. Don't forget the decimal point, the exponent character and the
  // terminating null-character when computing the maximal output size.
  // The given length is only used in debug mode to ensure the buffer is big
  // enough.
  static void DoubleToAscii(double v,
                            DtoaMode mode,
                            int requested_digits,
                            char* buffer,
                            int buffer_length,
                            bool* sign,
                            int* length,
                            int* point);

 private:
  // Implementation for ToShortest and ToShortestSingle.
  bool ToShortestIeeeNumber(double value,
                            StringBuilder* result_builder,
                            DtoaMode mode) const;

  // If the value is a special value (NaN or Infinity) constructs the
  // corresponding string using the configured infinity/nan-symbol.
  // If either of them is NULL or the value is not special then the
  // function returns false.
  bool HandleSpecialValues(double value, StringBuilder* result_builder) const;
  // Constructs an exponential representation (i.e. 1.234e56).
  // The given exponent assumes a decimal point after the first decimal digit.
  void CreateExponentialRepresentation(const char* decimal_digits,
                                       int length,
                                       int exponent,
                                       StringBuilder* result_builder) const;
  // Creates a decimal representation (i.e 1234.5678).
  void CreateDecimalRepresentation(const char* decimal_digits,
                                   int length,
                                   int decimal_point,
                                   int digits_after_point,
                                   StringBuilder* result_builder) const;

  const int flags_;
  const char* const infinity_symbol_;
  const char* const nan_symbol_;
  const char exponent_character_;
  const int decimal_in_shortest_low_;
  const int decimal_in_shortest_high_;
  const int max_leading_padding_zeroes_in_precision_mode_;
  const int max_trailing_padding_zeroes_in_precision_mode_;

  DC_DISALLOW_IMPLICIT_CONSTRUCTORS(DoubleToStringConverter);
};


class StringToDoubleConverter {
 public:
  // Enumeration for allowing octals and ignoring junk when converting
  // strings to numbers.
  enum Flags {
    NO_FLAGS = 0,
    ALLOW_HEX = 1,
    ALLOW_OCTALS = 2,
    ALLOW_TRAILING_JUNK = 4,
    ALLOW_LEADING_SPACES = 8,
    ALLOW_TRAILING_SPACES = 16,
    ALLOW_SPACES_AFTER_SIGN = 32,
    ALLOW_CASE_INSENSIBILITY = 64,
  };

  // Flags should be a bit-or combination of the possible Flags-enum.
  //  - NO_FLAGS: no special flags.
  //  - ALLOW_HEX: recognizes the prefix "0x". Hex numbers may only be integers.
  //      Ex: StringToDouble("0x1234") -> 4660.0
  //          In StringToDouble("0x1234.56") the characters ".56" are trailing
  //          junk. The result of the call is hence dependent on
  //          the ALLOW_TRAILING_JUNK flag and/or the junk value.
  //      With this flag "0x" is a junk-string. Even with ALLOW_TRAILING_JUNK,
  //      the string will not be parsed as "0" followed by junk.
  //
  //  - ALLOW_OCTALS: recognizes the prefix "0" for octals:
  //      If a sequence of octal digits starts with '0', then the number is
  //      read as octal integer. Octal numbers may only be integers.
  //      Ex: StringToDouble("01234") -> 668.0
  //          StringToDouble("012349") -> 12349.0  // Not a sequence of octal
  //                                               // digits.
  //          In StringToDouble("01234.56") the characters ".56" are trailing
  //          junk. The result of the call is hence dependent on
  //          the ALLOW_TRAILING_JUNK flag and/or the junk value.
  //          In StringToDouble("01234e56") the characters "e56" are trailing
  //          junk, too.
  //  - ALLOW_TRAILING_JUNK: ignore trailing characters that are not part of
  //      a double literal.
  //  - ALLOW_LEADING_SPACES: skip over leading whitespace, including spaces,
  //                          new-lines, and tabs.
  //  - ALLOW_TRAILING_SPACES: ignore trailing whitespace.
  //  - ALLOW_SPACES_AFTER_SIGN: ignore whitespace after the sign.
  //       Ex: StringToDouble("-   123.2") -> -123.2.
  //           StringToDouble("+   123.2") -> 123.2
  //  - ALLOW_CASE_INSENSIBILITY: ignore case of characters for special values:
  //      infinity and nan.
  //
  // empty_string_value is returned when an empty string is given as input.
  // If ALLOW_LEADING_SPACES or ALLOW_TRAILING_SPACES are set, then a string
  // containing only spaces is converted to the 'empty_string_value', too.
  //
  // junk_string_value is returned when
  //  a) ALLOW_TRAILING_JUNK is not set, and a junk character (a character not
  //     part of a double-literal) is found.
  //  b) ALLOW_TRAILING_JUNK is set, but the string does not start with a
  //     double literal.
  //
  // infinity_symbol and nan_symbol are strings that are used to detect
  // inputs that represent infinity and NaN. They can be null, in which case
  // they are ignored.
  // The conversion routine first reads any possible signs. Then it compares the
  // following character of the input-string with the first character of
  // the infinity, and nan-symbol. If either matches, the function assumes, that
  // a match has been found, and expects the following input characters to match
  // the remaining characters of the special-value symbol.
  // This means that the following restrictions apply to special-value symbols:
  //  - they must not start with signs ('+', or '-'),
  //  - they must not have the same first character.
  //  - they must not start with digits.
  //
  // Examples:
  //  flags = ALLOW_HEX | ALLOW_TRAILING_JUNK,
  //  empty_string_value = 0.0,
  //  junk_string_value = NaN,
  //  infinity_symbol = "infinity",
  //  nan_symbol = "nan":
  //    StringToDouble("0x1234") -> 4660.0.
  //    StringToDouble("0x1234K") -> 4660.0.
  //    StringToDouble("") -> 0.0  // empty_string_value.
  //    StringToDouble(" ") -> NaN  // junk_string_value.
  //    StringToDouble(" 1") -> NaN  // junk_string_value.
  //    StringToDouble("0x") -> NaN  // junk_string_value.
  //    StringToDouble("-123.45") -> -123.45.
  //    StringToDouble("--123.45") -> NaN  // junk_string_value.
  //    StringToDouble("123e45") -> 123e45.
  //    StringToDouble("123E45") -> 123e45.
  //    StringToDouble("123e+45") -> 123e45.
  //    StringToDouble("123E-45") -> 123e-45.
  //    StringToDouble("123e") -> 123.0  // trailing junk ignored.
  //    StringToDouble("123e-") -> 123.0  // trailing junk ignored.
  //    StringToDouble("+NaN") -> NaN  // NaN string literal.
  //    StringToDouble("-infinity") -> -inf.  // infinity literal.
  //    StringToDouble("Infinity") -> NaN  // junk_string_value.
  //
  //  flags = ALLOW_OCTAL | ALLOW_LEADING_SPACES,
  //  empty_string_value = 0.0,
  //  junk_string_value = NaN,
  //  infinity_symbol = NULL,
  //  nan_symbol = NULL:
  //    StringToDouble("0x1234") -> NaN  // junk_string_value.
  //    StringToDouble("01234") -> 668.0.
  //    StringToDouble("") -> 0.0  // empty_string_value.
  //    StringToDouble(" ") -> 0.0  // empty_string_value.
  //    StringToDouble(" 1") -> 1.0
  //    StringToDouble("0x") -> NaN  // junk_string_value.
  //    StringToDouble("0123e45") -> NaN  // junk_string_value.
  //    StringToDouble("01239E45") -> 1239e45.
  //    StringToDouble("-infinity") -> NaN  // junk_string_value.
  //    StringToDouble("NaN") -> NaN  // junk_string_value.
  StringToDoubleConverter(int flags,
                          double empty_string_value,
                          double junk_string_value,
                          const char* infinity_symbol,
                          const char* nan_symbol)
      : flags_(flags),
        empty_string_value_(empty_string_value),
        junk_string_value_(junk_string_value),
        infinity_symbol_(infinity_symbol),
        nan_symbol_(nan_symbol) {
  }

  // Performs the conversion.
  // The output parameter 'processed_characters_count' is set to the number
  // of characters that have been processed to read the number.
  // Spaces than are processed with ALLOW_{LEADING|TRAILING}_SPACES are included
  // in the 'processed_characters_count'. Trailing junk is never included.
  double StringToDouble(const char* buffer,
                        int length,
                        int* processed_characters_count) const;

  // Same as StringToDouble above but for 16 bit characters.
  double StringToDouble(const uc16* buffer,
                        int length,
                        int* processed_characters_count) const;

  // Same as StringToDouble but reads a float.
  // Note that this is not equivalent to static_cast<float>(StringToDouble(...))
  // due to potential double-rounding.
  float StringToFloat(const char* buffer,
                      int length,
                      int* processed_characters_count) const;

  // Same as StringToFloat above but for 16 bit characters.
  float StringToFloat(const uc16* buffer,
                      int length,
                      int* processed_characters_count) const;

 private:
  const int flags_;
  const double empty_string_value_;
  const double junk_string_value_;
  const char* const infinity_symbol_;
  const char* const nan_symbol_;

  template <class Iterator>
  double StringToIeee(Iterator start_pointer,
                      int length,
                      bool read_as_double,
                      int* processed_characters_count) const;

  DC_DISALLOW_IMPLICIT_CONSTRUCTORS(StringToDoubleConverter);
};

}  // namespace double_conversion

#endif  // DOUBLE_CONVERSION_DOUBLE_CONVERSION_H_
