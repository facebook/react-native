/*
 * Copyright 2018-present Facebook, Inc.
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

#include <folly/Range.h>
#include <folly/dynamic.h>

namespace folly {

/**
 * Compares two JSON strings and returns whether they represent the
 * same document (thus ignoring things like object ordering or
 * multiple representations of the same number).
 *
 * This is implemented by deserializing both strings into dynamic, so
 * it is not efficient and it is meant to only be used in tests.
 *
 * It will throw an exception if any of the inputs is invalid.
 */
bool compareJson(StringPiece json1, StringPiece json2);

/**
 * Like compareJson, but allows for the given tolerance when comparing
 * numbers.
 *
 * Note that in the dynamic flavor of JSON 64-bit integers are a
 * supported type. If the values to be compared are both integers,
 * tolerance is not applied (it may not be possible to represent them
 * as double without loss of precision).
 *
 * When comparing objects exact key match is required, including if
 * keys are doubles (again a dynamic extension).
 */
bool compareJsonWithTolerance(
    StringPiece json1,
    StringPiece json2,
    double tolerance);

/**
 * Like compareJsonWithTolerance, but operates directly on the
 * dynamics.
 */
bool compareDynamicWithTolerance(
    const dynamic& obj1,
    const dynamic& obj2,
    double tolerance);

} // namespace folly

/**
 * GTest helpers. Note that to use them you'll need to include the
 * gtest headers yourself.
 */
#define FOLLY_EXPECT_JSON_EQ(json1, json2) \
  EXPECT_PRED2(::folly::compareJson, json1, json2)

#define FOLLY_EXPECT_JSON_NEAR(json1, json2, tolerance) \
  EXPECT_PRED3(::folly::compareJsonWithTolerance, json1, json2, tolerance)
