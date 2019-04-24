/*
 * Copyright 2015-present Facebook, Inc.
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

#include <folly/ExceptionWrapper.h>
#include <folly/Range.h>
#include <folly/dynamic.h>

/**
 * Validation according to the draft v4 standard: http://json-schema.org/
 *
 * If your schema is invalid, then it won't validate anything. For example, if
 * you set "type": "invalid_type" in your schema, then it won't check for any
 * type, as if you had left that property out. If you want to make sure your
 * schema is valid, you can optionally validate it first according to the
 * metaschema.
 *
 * Limitations:
 * - We don't support fetching schemas via HTTP.
 * - We don't support remote $refs.
 * - We don't support $ref via id (only by path).
 * - We don't support UTF-8 for string lengths, i.e. we will count bytes for
 *   schemas that use minLength/maxLength.
 */

namespace folly {
namespace jsonschema {

/**
 * Interface for a schema validator.
 */
struct Validator {
  virtual ~Validator() = 0;

  /**
   * Check whether the given value passes the schema. Throws if it fails.
   */
  virtual void validate(const dynamic& value) const = 0;

  /**
   * Check whether the given value passes the schema. Returns an
   * exception_wrapper indicating success or what the failure was.
   */
  virtual exception_wrapper try_validate(const dynamic& value) const
      noexcept = 0;
};

/**
 * Make a validator that can be used to check various json. Thread-safe.
 */
std::unique_ptr<Validator> makeValidator(const dynamic& schema);

/**
 * Makes a validator for schemas. You should probably check your schema with
 * this before you use makeValidator().
 */
std::shared_ptr<Validator> makeSchemaValidator();
} // namespace jsonschema
} // namespace folly
