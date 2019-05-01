/*
 * Copyright 2013-present Facebook, Inc.
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

#include <folly/Exception.h>

#include <folly/experimental/TestUtil.h>
#include <folly/portability/GTest.h>

#include <cstdio>
#include <memory>

namespace folly {
namespace test {

#define EXPECT_SYSTEM_ERROR(statement, err, msg)                  \
  try {                                                           \
    statement;                                                    \
    ADD_FAILURE() << "Didn't throw";                              \
  } catch (const std::system_error& e) {                          \
    std::system_error expected(err, std::system_category(), msg); \
    EXPECT_STREQ(expected.what(), e.what());                      \
  } catch (...) {                                                 \
    ADD_FAILURE() << "Threw a different type";                    \
  }

TEST(ExceptionTest, Simple) {
  // Make sure errno isn't used when we don't want it to, set it to something
  // else than what we set when we call Explicit functions
  errno = ERANGE;
  EXPECT_SYSTEM_ERROR(throwSystemErrorExplicit(EIO, "hello"), EIO, "hello");
  errno = ERANGE;
  EXPECT_SYSTEM_ERROR(
      throwSystemErrorExplicit(EIO, "hello", " world"), EIO, "hello world");
  errno = ERANGE;
  EXPECT_SYSTEM_ERROR(
      throwSystemError("hello", " world"), ERANGE, "hello world");

  EXPECT_NO_THROW(checkPosixError(0, "hello", " world"));
  errno = ERANGE;
  EXPECT_SYSTEM_ERROR(
      checkPosixError(EIO, "hello", " world"), EIO, "hello world");

  EXPECT_NO_THROW(checkKernelError(0, "hello", " world"));
  EXPECT_NO_THROW(checkKernelError(EIO, "hello", " world"));
  errno = ERANGE;
  EXPECT_SYSTEM_ERROR(
      checkKernelError(-EIO, "hello", " world"), EIO, "hello world");

  EXPECT_NO_THROW(checkUnixError(0, "hello", " world"));
  EXPECT_NO_THROW(checkUnixError(1, "hello", " world"));
  errno = ERANGE;
  EXPECT_SYSTEM_ERROR(
      checkUnixError(-1, "hello", " world"), ERANGE, "hello world");

  EXPECT_NO_THROW(checkUnixErrorExplicit(0, EIO, "hello", " world"));
  EXPECT_NO_THROW(checkUnixErrorExplicit(1, EIO, "hello", " world"));
  errno = ERANGE;
  EXPECT_SYSTEM_ERROR(
      checkUnixErrorExplicit(-1, EIO, "hello", " world"), EIO, "hello world");

  TemporaryDirectory tmpdir;
  auto exnpath = tmpdir.path() / "ExceptionTest";
  auto fp = fopen(exnpath.string().c_str(), "w+b");
  ASSERT_TRUE(fp != nullptr);
  SCOPE_EXIT {
    fclose(fp);
  };

  EXPECT_NO_THROW(checkFopenError(fp, "hello", " world"));
  errno = ERANGE;
  EXPECT_SYSTEM_ERROR(
      checkFopenError(nullptr, "hello", " world"), ERANGE, "hello world");

  EXPECT_NO_THROW(checkFopenErrorExplicit(fp, EIO, "hello", " world"));
  errno = ERANGE;
  EXPECT_SYSTEM_ERROR(
      checkFopenErrorExplicit(nullptr, EIO, "hello", " world"),
      EIO,
      "hello world");
}

TEST(ExceptionTest, makeSystemError) {
  errno = ENOENT;
  auto ex = makeSystemErrorExplicit(EDEADLK, "stuck");
  EXPECT_EQ(EDEADLK, ex.code().value());
  EXPECT_EQ(std::system_category(), ex.code().category());
  EXPECT_TRUE(StringPiece{ex.what()}.contains("stuck"))
      << "what() string missing input message: " << ex.what();

  ex = makeSystemErrorExplicit(EDOM, 300, " is bigger than max=", 255);
  EXPECT_EQ(EDOM, ex.code().value());
  EXPECT_EQ(std::system_category(), ex.code().category());
  EXPECT_TRUE(StringPiece{ex.what()}.contains("300 is bigger than max=255"))
      << "what() string missing input message: " << ex.what();

  errno = EINVAL;
  ex = makeSystemError("bad argument ", 1234, ": bogus");
  EXPECT_EQ(EINVAL, ex.code().value());
  EXPECT_EQ(std::system_category(), ex.code().category());
  EXPECT_TRUE(StringPiece{ex.what()}.contains("bad argument 1234: bogus"))
      << "what() string missing input message: " << ex.what();

  errno = 0;
  ex = makeSystemError("unexpected success");
  EXPECT_EQ(0, ex.code().value());
  EXPECT_EQ(std::system_category(), ex.code().category());
  EXPECT_TRUE(StringPiece{ex.what()}.contains("unexpected success"))
      << "what() string missing input message: " << ex.what();
}

} // namespace test
} // namespace folly
