/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <folly/json.h>
#include <string>
#include <string_view>

namespace facebook::react::jsinspector_modern {

namespace cdp {
using RequestId = long long;

/**
 * An incoming CDP request that has been parsed into a more usable form.
 */
struct PreparsedRequest {
 public:
  /**
   * The ID of the request.
   */
  RequestId id;

  /**
   * The name of the method being invoked.
   */
  std::string method;

  /**
   * The parameters passed to the method, if any.
   */
  folly::dynamic params;

  /**
   * Equality operator, useful for unit tests
   */
  inline bool operator==(const PreparsedRequest& rhs) const {
    return id == rhs.id && method == rhs.method && params == rhs.params;
  }

  std::string toJson() const;
};

/**
 * Parse a JSON-encoded CDP request into its constituent parts.
 * \throws ParseError If the input cannot be parsed.
 * \throws TypeError If the input does not conform to the expected format.
 */
PreparsedRequest preparse(std::string_view message);

/**
 * A type error that may be thrown while preparsing a request, or while
 * accessing dynamic params on a request.
 */
using TypeError = folly::TypeError;

/**
 * A parse error that may be thrown while preparsing a request.
 */
using ParseError = folly::json::parse_error;
} // namespace cdp

} // namespace facebook::react::jsinspector_modern
