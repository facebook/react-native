/*
 * Copyright 2017-present Facebook, Inc.
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

#include <exception>

#include <folly/CPortability.h>

namespace folly {

/**
 * Exception type that is thrown on invalid access of an empty `Poly` object.
 */
struct FOLLY_EXPORT BadPolyAccess : std::exception {
  BadPolyAccess() = default;
  char const* what() const noexcept override {
    return "BadPolyAccess";
  }
};

/**
 * Exception type that is thrown when attempting to extract from a `Poly` a
 * value of the wrong type.
 */
struct FOLLY_EXPORT BadPolyCast : std::bad_cast {
  BadPolyCast() = default;
  char const* what() const noexcept override {
    return "BadPolyCast";
  }
};

} // namespace folly
