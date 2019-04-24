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

#include <folly/futures/Future.h>

#include <folly/futures/exercises/Koan.h>

using folly::Future;
using folly::makeFuture;

#if 0 // compilation cursor

TEST(Values, canonicalForm) {
  // The canonical way to make a Future from an immediate value is with the
  // Future constructor.
  Future<int> answer(__);
  EXPECT_EQ(42, answer.get());
}

TEST(Values, typeDeduction) {
  // If you use makeFuture, the compiler will deduce the type.
  auto answer = makeFuture(__);
  EXPECT_EQ(42, answer.get());
}

TEST(Values, exceptionNeedsType) {
  // To create a Future holding an exception, you must
  // use makeFuture with the type
  std::runtime_error err("Don't Panic");
  auto question = __(err);
  // not
  //auto question = makeFuture(err);
  EXPECT_THROW(question.get(), std::runtime_error);
}

TEST(Values, typeConversion) {
  // Sometimes it's cleaner to give the type and let the compiler do implicit
  // type conversion
  __ answer(42);
  // not
  //auto answer = makeFuture((double)42);
  EXPECT_EQ(__, answer.get());
}

using folly::Try;

TEST(Values, tryInside) {
  // Futures hold either a Value or Exception. This is accomplished under the
  // covers with Try
  Try<int> t = makeFuture(42).__();
  EXPECT_TRUE(t.hasValue());
  EXPECT_EQ(42, t.value());

  t = Future<int>(std::runtime_error("Don't Panic")).__();
  EXPECT_TRUE(t.hasException());
  EXPECT_THROW(t.value(), std::runtime_error);
}

#endif
