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

#include <folly/lang/Exception.h>

#include <algorithm>
#include <cstring>
#include <string>

#include <folly/Portability.h>
#include <folly/portability/GTest.h>

template <typename Ex>
static std::string type_pretty_name() {
  auto const name = __PRETTY_FUNCTION__;
  auto const size = std::strlen(name);
  auto const eq = std::find(name, name + size, '=');
  auto const sc = std::find(name, name + size, ';');
  auto const br = std::find(name, name + size, ']');
  auto const bpos = name + size - eq >= 2 ? eq + 2 : name + size;
  auto const epos = std::min(sc, br);
  return epos < bpos ? "" : std::string(bpos, epos - bpos);
}

template <typename Ex>
static std::string message_for_terminate_with(std::string const& what) {
  auto const name = type_pretty_name<Ex>();
  auto const prefix =
      std::string("terminate called after throwing an instance of ");
  // clang-format off
  return
      folly::kIsGlibcxx ? prefix + "'" + name + "'\\s+what\\(\\):\\s+" + what :
      folly::kIsLibcpp ? prefix + name + ": " + what :
      "" /* empty regex matches anything */;
  // clang-format on
}

static std::string message_for_terminate() {
  // clang-format off
  return
      folly::kIsGlibcxx ? "terminate called without an active exception" :
      folly::kIsLibcpp ? "terminating" :
      "" /* empty regex matches anything */;
  // clang-format on
}

class MyException : public std::exception {
 private:
  char const* what_;

 public:
  explicit MyException(char const* const what) : MyException(what, 0) {}
  MyException(char const* const what, std::size_t const strip)
      : what_(what + strip) {}

  char const* what() const noexcept override {
    return what_;
  }
};

class ExceptionTest : public testing::Test {};

TEST_F(ExceptionTest, throw_exception_direct) {
  try {
    folly::throw_exception<MyException>("hello world");
    ADD_FAILURE();
  } catch (MyException const& ex) {
    EXPECT_STREQ("hello world", ex.what());
  }
}

TEST_F(ExceptionTest, throw_exception_variadic) {
  try {
    folly::throw_exception<MyException>("hello world", 6);
    ADD_FAILURE();
  } catch (MyException const& ex) {
    EXPECT_STREQ("world", ex.what());
  }
}

TEST_F(ExceptionTest, terminate_with_direct) {
  EXPECT_DEATH(
      folly::terminate_with<MyException>("hello world"),
      message_for_terminate_with<MyException>("hello world"));
}

TEST_F(ExceptionTest, terminate_with_variadic) {
  EXPECT_DEATH(
      folly::terminate_with<MyException>("hello world", 6),
      message_for_terminate_with<MyException>("world"));
}

TEST_F(ExceptionTest, invoke_noreturn_cold) {
  EXPECT_THROW(
      folly::invoke_noreturn_cold([] { throw std::runtime_error("bad"); }),
      std::runtime_error);
  EXPECT_DEATH(folly::invoke_noreturn_cold([] {}), message_for_terminate());
}
