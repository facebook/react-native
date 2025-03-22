/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/dynamic.h>
#include <folly/json.h>
#include <folly/json_pointer.h>
#include <gmock/gmock.h>

#include "FollyDynamicMatchers.h"

namespace facebook::folly_dynamic_matchers_utils {

std::string as_string(std::string value) {
  return value;
}
std::string as_string(folly::dynamic value) {
  return value.asString();
}

std::string explain_error(
    folly::dynamic::json_pointer_resolution_error<const folly::dynamic> error) {
  using err_code = folly::dynamic::json_pointer_resolution_error_code;

  switch (error.error_code) {
    case err_code::key_not_found:
      return "key not found";
    case err_code::index_out_of_bounds:
      return "index out of bounds";
    case err_code::append_requested:
      return "append requested";
    case err_code::index_not_numeric:
      return "array index is not numeric";
    case err_code::index_has_leading_zero:
      return "leading zero not allowed when indexing arrays";
    case err_code::element_not_object_or_array:
      return "element is neither an object nor an array";
    case err_code::json_pointer_out_of_bounds:
      return "JSON pointer out of bounds";
    case err_code::other:
      return "unknown error";
    default:
      assert(false && "unhandled error code");
      return "<unhandled error code>";
  }
}
} // namespace facebook::folly_dynamic_matchers_utils
