/*
 * Copyright 2016-present Facebook, Inc.
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

#include <folly/lang/UncaughtExceptions.h>
#include <folly/Conv.h>
#include <folly/portability/GTest.h>
#include <glog/logging.h>

/*
 * Test helper class, when goes out of scope it validaes that
 * folly::uncaught_exceptions() returns the specified
 * value.
 */
class Validator {
 public:
  Validator(int expectedCount, const std::string& msg)
      : expectedCount_(expectedCount), msg_(msg) {}

  // Automatic validation during destruction.
  ~Validator() {
    validate();
  }

  // Invoke to validate explicitly.
  void validate() {
    LOG(INFO) << msg_ << ", expected " << expectedCount_ << ", is "
              << folly::uncaught_exceptions();
    EXPECT_EQ(expectedCount_, folly::uncaught_exceptions()) << msg_;
  }

 private:
  const int32_t expectedCount_;
  const std::string msg_;
};

TEST(UncaughtExceptions, no_exception) {
  Validator validator(0, "no_exception");
}

TEST(UncaughtExceptions, no_uncaught_exception) {
  Validator validator(0, "no_uncaught_exception");
  try {
    throw std::runtime_error("exception");
  } catch (const std::runtime_error& e) {
    validator.validate();
  }
}

TEST(UncaughtExceptions, one_uncaught_exception) {
  try {
    Validator validator(1, "one_uncaught_exception");
    throw std::runtime_error("exception");
  } catch (const std::runtime_error& e) {
  }
}

TEST(UncaughtExceptions, catch_rethrow) {
  try {
    Validator validatorOuter(1, "catch_rethrow_outer");
    try {
      Validator validatorInner(1, "catch_rethrow_inner");
      throw std::runtime_error("exception");
    } catch (const std::runtime_error& e) {
      EXPECT_EQ(0, folly::uncaught_exceptions());
      Validator validatorRethrow(1, "catch_rethrow");
      throw;
    }
  } catch (const std::runtime_error& e) {
    EXPECT_EQ(0, folly::uncaught_exceptions());
  }
}

[[noreturn]] void throwingFunction() {
  Validator validator(1, "one_uncaught_exception_in_function");
  throw std::runtime_error("exception");
}

TEST(UncaughtExceptions, one_uncaught_exception_in_function) {
  EXPECT_THROW({ throwingFunction(); }, std::runtime_error);
}

/*
 * Test helper class. Generates N wrapped classes/objects.
 * The destructor N of the most outer class creates the N-1
 * object, and N - 1 object destructor creating the N-2 object,
 * and so on. Each destructor throws an exception after creating
 * the inner object on the stack, thus the number of exceptions
 * accumulates while the stack is unwinding. It's used to test
 * the folly::uncaught_exceptions() with value >= 2.
 */
template <size_t N, size_t I = N>
struct ThrowInDestructor {
  using InnerThrowInDestructor = ThrowInDestructor<N, I - 1>;
  ThrowInDestructor() {}

  ~ThrowInDestructor() {
    try {
      InnerThrowInDestructor stackObjectThrowingOnUnwind;
      (void)stackObjectThrowingOnUnwind;
      Validator validator(
          N - I + 1, "validating in " + folly::to<std::string>(I));
      LOG(INFO) << "throwing in ~ThrowInDestructor " << I;
      throw std::logic_error("inner");
    } catch (const std::logic_error& e) {
      LOG(INFO) << "catching in ~ThrowInDestructor " << I << " expecting "
                << N - I << ", it is " << folly::uncaught_exceptions();
      EXPECT_EQ(N - I, folly::uncaught_exceptions());
    }
  }
};

/*
 * Terminate recursion
 */
template <size_t N>
struct ThrowInDestructor<N, 0> {
  ThrowInDestructor() = default;
  ~ThrowInDestructor() = default;
};

TEST(UncaughtExceptions, two_uncaught_exceptions) {
  ThrowInDestructor<2> twoUncaughtExceptions;
}

TEST(UncaughtExceptions, ten_uncaught_exceptions) {
  ThrowInDestructor<10> twoUncaughtExceptions;
}

struct ThrowingConstructor {
  [[noreturn]] ThrowingConstructor() noexcept(false) {
    throw std::runtime_error("exception");
  }
};

struct InheritsThrowingConstructor : public Validator,
                                     public ThrowingConstructor {
  InheritsThrowingConstructor() try
      : Validator(1, "one_exception_in_ctor_initializer_expression"),
        ThrowingConstructor() {
  } catch (...) {
    // This is being re-thrown once the catch block ends, so I guess
    // it's similar to a catch/throw; (re-throw) behavior and thus the value
    // is 0.
    EXPECT_EQ(0, folly::uncaught_exceptions());
  }
};

TEST(UncaughtExceptions, one_exception_in_ctor_initializer_expression) {
  EXPECT_THROW(
      { InheritsThrowingConstructor inheritsThrowingConstructor; },
      std::runtime_error);
}
