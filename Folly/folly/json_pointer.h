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

#pragma once

#include <string>
#include <vector>

#include <folly/Expected.h>
#include <folly/Range.h>

namespace folly {

/*
 * json_pointer
 *
 * As described in RFC 6901 "JSON Pointer".
 *
 * Implements parsing. Traversal using the pointer over data structures must be
 * implemented separately.
 */
class json_pointer {
 public:
  enum class parse_error {
    invalid_first_character,
    invalid_escape_sequence,
  };

  class parse_exception : public std::runtime_error {
    using std::runtime_error::runtime_error;
  };

  json_pointer() = default;
  ~json_pointer() = default;

  /*
   * Parse string into vector of unescaped tokens.
   * Non-throwing and throwing versions.
   */
  static Expected<json_pointer, parse_error> try_parse(StringPiece const str);

  static json_pointer parse(StringPiece const str);

  /*
   * Return true if this pointer is proper to prefix to another pointer
   */
  bool is_prefix_of(json_pointer const& other) const noexcept;

  /*
   * Get access to the parsed tokens for applications that want to traverse
   * the pointer.
   */
  std::vector<std::string> const& tokens() const;

  friend bool operator==(json_pointer const& lhs, json_pointer const& rhs) {
    return lhs.tokens_ == rhs.tokens_;
  }

  friend bool operator!=(json_pointer const& lhs, json_pointer const& rhs) {
    return lhs.tokens_ != rhs.tokens_;
  }

 private:
  explicit json_pointer(std::vector<std::string>) noexcept;

  /*
   * Unescape the specified escape sequences, returns false if incorrect
   */
  static bool unescape(std::string&);

  std::vector<std::string> tokens_;
};

} // namespace folly
