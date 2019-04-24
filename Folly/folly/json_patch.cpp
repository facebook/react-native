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

#include <folly/json_patch.h>

namespace {
using folly::StringPiece;
// JSON patch operation names
constexpr StringPiece kOperationTest = "test";
constexpr StringPiece kOperationRemove = "remove";
constexpr StringPiece kOperationAdd = "add";
constexpr StringPiece kOperationReplace = "replace";
constexpr StringPiece kOperationMove = "move";
constexpr StringPiece kOperationCopy = "copy";
// field tags in JSON patch
constexpr StringPiece kOpTag = "op";
constexpr StringPiece kValueTag = "value";
constexpr StringPiece kPathTag = "path";
constexpr StringPiece kFromTag = "from";
} // namespace

namespace folly {

// static
Expected<json_patch, json_patch::parse_error> json_patch::try_parse(
    dynamic const& obj) noexcept {
  using err_code = parse_error_code;

  json_patch patch;
  if (!obj.isArray()) {
    return makeUnexpected(parse_error{err_code::invalid_shape, &obj});
  }
  for (auto const& elem : obj) {
    if (!elem.isObject()) {
      return makeUnexpected(parse_error{err_code::invalid_shape, &elem});
    }
    auto const* op_ptr = elem.get_ptr(kOpTag);
    if (!op_ptr) {
      return makeUnexpected(parse_error{err_code::missing_op, &elem});
    }
    if (!op_ptr->isString()) {
      return makeUnexpected(parse_error{err_code::malformed_op, &elem});
    }
    auto const op_str = op_ptr->asString();
    patch_operation op;

    // extract 'from' attribute
    {
      auto const* from_ptr = elem.get_ptr(kFromTag);
      if (from_ptr) {
        if (!from_ptr->isString()) {
          return makeUnexpected(parse_error{err_code::invalid_shape, &elem});
        }
        auto json_ptr = json_pointer::try_parse(from_ptr->asString());
        if (!json_ptr.hasValue()) {
          return makeUnexpected(
              parse_error{err_code::malformed_from_attr, &elem});
        }
        op.from = json_ptr.value();
      }
    }

    // extract 'path' attribute
    {
      auto const* path_ptr = elem.get_ptr(kPathTag);
      if (!path_ptr) {
        return makeUnexpected(parse_error{err_code::missing_path_attr, &elem});
      }
      if (!path_ptr->isString()) {
        return makeUnexpected(
            parse_error{err_code::malformed_path_attr, &elem});
      }
      auto const json_ptr = json_pointer::try_parse(path_ptr->asString());
      if (!json_ptr.hasValue()) {
        return makeUnexpected(
            parse_error{err_code::malformed_path_attr, &elem});
      }
      op.path = json_ptr.value();
    }

    // extract 'value' attribute
    {
      auto const* val_ptr = elem.get_ptr(kValueTag);
      if (val_ptr) {
        op.value = *val_ptr;
      }
    }

    // check mandatory attributes - different per operation
    // NOTE: per RFC, the surplus attributes (e.g. 'from' with 'add')
    // should be simply ignored

    using op_code = patch_operation_code;

    if (op_str == kOperationTest) {
      if (!op.value) {
        return makeUnexpected(parse_error{err_code::missing_value_attr, &elem});
      }
      op.op_code = op_code::test;
    } else if (op_str == kOperationRemove) {
      op.op_code = op_code::remove;
    } else if (op_str == kOperationAdd) {
      if (!op.value) {
        return makeUnexpected(parse_error{err_code::missing_value_attr, &elem});
      }
      op.op_code = op_code::add;
    } else if (op_str == kOperationReplace) {
      if (!op.value) {
        return makeUnexpected(parse_error{err_code::missing_value_attr, &elem});
      }
      op.op_code = op_code::replace;
    } else if (op_str == kOperationMove) {
      if (!op.from) {
        return makeUnexpected(parse_error{err_code::missing_from_attr, &elem});
      }
      // is from a proper prefix to path?
      if (op.from->is_prefix_of(op.path)) {
        return makeUnexpected(
            parse_error{err_code::overlapping_pointers, &elem});
      }
      op.op_code = op_code::move;
    } else if (op_str == kOperationCopy) {
      if (!op.from) {
        return makeUnexpected(parse_error{err_code::missing_from_attr, &elem});
      }
      op.op_code = op_code::copy;
    }

    if (op.op_code != op_code::invalid) {
      patch.ops_.emplace_back(std::move(op));
    } else {
      return makeUnexpected(parse_error{err_code::unknown_op, &elem});
    }
  }
  return patch;
}

std::vector<json_patch::patch_operation> const& json_patch::ops() const {
  return ops_;
}

} // namespace folly
