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

#include <folly/Expected.h>
#include <folly/Optional.h>
#include <folly/dynamic.h>
#include <folly/json_pointer.h>

namespace folly {

/*
 * json_patch
 *
 * As described in RFC 6902 "JSON Patch".
 *
 * Implements parsing. Application over data structures must be
 * implemented separately.
 */
class json_patch {
 public:
  enum class parse_error_code : uint8_t {
    undefined,
    invalid_shape,
    missing_op,
    unknown_op,
    malformed_op,
    missing_path_attr,
    malformed_path_attr,
    missing_from_attr,
    malformed_from_attr,
    missing_value_attr,
    overlapping_pointers,
  };

  /*
   * If parsing JSON patch object fails we return err code along with
   * pointer to part of JSON document that we could not parse
   */
  struct parse_error {
    // one of the above error codes
    parse_error_code error_code{parse_error_code::undefined};
    // pointer to object that caused the error
    dynamic const* obj{};
  };

  enum class patch_operation_code : uint8_t {
    invalid = 0,
    test,
    remove,
    add,
    replace,
    move,
    copy,
  };

  /*
   * Single JSON patch operation. Argument may vary based on op type
   */
  struct patch_operation {
    patch_operation_code op_code{patch_operation_code::invalid};
    json_pointer path;
    Optional<json_pointer> from;
    Optional<dynamic> value;
    friend bool operator==(
        patch_operation const& lhs,
        patch_operation const& rhs) {
      return lhs.op_code == rhs.op_code && lhs.path == rhs.path &&
          lhs.from == rhs.from && lhs.value == rhs.value;
    }
    friend bool operator!=(
        patch_operation const& lhs,
        patch_operation const& rhs) {
      return !(lhs == rhs);
    }
  };

  json_patch() = default;
  ~json_patch() = default;

  static folly::Expected<json_patch, parse_error> try_parse(
      dynamic const& obj) noexcept;

  std::vector<patch_operation> const& ops() const;

 private:
  std::vector<patch_operation> ops_;
};

} // namespace folly
