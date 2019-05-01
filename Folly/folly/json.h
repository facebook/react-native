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

/**
 *
 * Serialize and deserialize folly::dynamic values as JSON.
 *
 * Before you use this you should probably understand the basic
 * concepts in the JSON type system:
 *
 *    Value  : String | Bool | Null | Object | Array | Number
 *    String : UTF-8 sequence
 *    Object : (String, Value) pairs, with unique String keys
 *    Array  : ordered list of Values
 *    Null   : null
 *    Bool   : true | false
 *    Number : (representation unspecified)
 *
 * ... That's about it.  For more information see http://json.org or
 * look up RFC 4627.
 *
 * If your dynamic has anything illegal with regard to this type
 * system, the serializer will throw.
 *
 * @author Jordan DeLong <delong.j@fb.com>
 */

#pragma once

#include <iosfwd>
#include <string>

#include <folly/Function.h>
#include <folly/Range.h>
#include <folly/dynamic.h>

namespace folly {

//////////////////////////////////////////////////////////////////////

namespace json {

struct serialization_opts {
  explicit serialization_opts()
      : allow_non_string_keys(false),
        javascript_safe(false),
        pretty_formatting(false),
        encode_non_ascii(false),
        validate_utf8(false),
        allow_trailing_comma(false),
        sort_keys(false),
        skip_invalid_utf8(false),
        allow_nan_inf(false),
        double_mode(double_conversion::DoubleToStringConverter::SHORTEST),
        double_num_digits(0), // ignored when mode is SHORTEST
        double_fallback(false),
        parse_numbers_as_strings(false),
        recursion_limit(100),
        extra_ascii_to_escape_bitmap{{0, 0}} {}

  // If true, keys in an object can be non-strings.  (In strict
  // JSON, object keys must be strings.)  This is used by dynamic's
  // operator<<.
  bool allow_non_string_keys;

  /*
   * If true, refuse to serialize 64-bit numbers that cannot be
   * precisely represented by fit a double---instead, throws an
   * exception if the document contains this.
   */
  bool javascript_safe;

  // If true, the serialized json will contain space and newlines to
  // try to be minimally "pretty".
  bool pretty_formatting;

  // If true, non-ASCII utf8 characters would be encoded as \uXXXX:
  // - if the code point is in [U+0000..U+FFFF] => encode as a single \uXXXX
  // - if the code point is > U+FFFF => encode as 2 UTF-16 surrogate pairs.
  bool encode_non_ascii;

  // Check that strings are valid utf8
  bool validate_utf8;

  // Allow trailing comma in lists of values / items
  bool allow_trailing_comma;

  // Sort keys of all objects before printing out (potentially slow)
  // using dynamic::operator<.
  // Has no effect if sort_keys_by is set.
  bool sort_keys;

  // Sort keys of all objects before printing out (potentially slow)
  // using the provided less functor.
  Function<bool(dynamic const&, dynamic const&) const> sort_keys_by;

  // Replace invalid utf8 characters with U+FFFD and continue
  bool skip_invalid_utf8;

  // true to allow NaN or INF values
  bool allow_nan_inf;

  // Options for how to print floating point values.  See Conv.h
  // toAppend implementation for floating point for more info
  double_conversion::DoubleToStringConverter::DtoaMode double_mode;
  unsigned int double_num_digits;

  // Fallback to double when a value that looks like integer is too big to
  // fit in an int64_t. Can result in loss a of precision.
  bool double_fallback;

  // Do not parse numbers. Instead, store them as strings and leave the
  // conversion up to the user.
  bool parse_numbers_as_strings;

  // Recursion limit when parsing.
  unsigned int recursion_limit;

  // Bitmap representing ASCII characters to escape with unicode
  // representations. The least significant bit of the first in the pair is
  // ASCII value 0; the most significant bit of the second in the pair is ASCII
  // value 127. Some specific characters in this range are always escaped
  // regardless of the bitmask - namely characters less than 0x20, \, and ".
  std::array<uint64_t, 2> extra_ascii_to_escape_bitmap;
};

/*
 * Generates a bitmap with bits set for each of the ASCII characters provided
 * for use in the serialization_opts extra_ascii_to_escape_bitmap option. If any
 * characters are not valid ASCII, they are ignored.
 */
std::array<uint64_t, 2> buildExtraAsciiToEscapeBitmap(StringPiece chars);

/*
 * Main JSON serialization routine taking folly::dynamic parameters.
 * For the most common use cases there are simpler functions in the
 * main folly namespace below.
 */
std::string serialize(dynamic const&, serialization_opts const&);

/*
 * Escape a string so that it is legal to print it in JSON text and
 * append the result to out.
 */

void escapeString(
    StringPiece input,
    std::string& out,
    const serialization_opts& opts);

/*
 * Strip all C99-like comments (i.e. // and / * ... * /)
 */
std::string stripComments(StringPiece jsonC);

} // namespace json

//////////////////////////////////////////////////////////////////////

/*
 * Parse a json blob out of a range and produce a dynamic representing
 * it.
 */
dynamic parseJson(StringPiece, json::serialization_opts const&);
dynamic parseJson(StringPiece);

/*
 * Serialize a dynamic into a json string.
 */
std::string toJson(dynamic const&);

/*
 * Same as the above, except format the json with some minimal
 * indentation.
 */
std::string toPrettyJson(dynamic const&);

/*
 * Printer for GTest.
 * Uppercase name to fill GTest's API, which calls this method through ADL.
 */
void PrintTo(const dynamic&, std::ostream*);
//////////////////////////////////////////////////////////////////////

} // namespace folly
