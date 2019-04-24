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

#include <folly/experimental/ProgramOptions.h>

#include <folly/FileUtil.h>
#include <folly/Subprocess.h>
#include <folly/experimental/io/FsUtil.h>
#include <folly/portability/GTest.h>
#include <glog/logging.h>

namespace folly {
namespace test {

namespace {

std::string getHelperPath() {
  const auto basename = "program_options_test_helper";
  auto path = fs::executable_path();
  path.remove_filename() /= basename;
  if (!fs::exists(path)) {
    path = path.parent_path().parent_path() / basename / basename;
  }
  return path.string();
}

std::string callHelper(
    ProgramOptionsStyle style,
    std::initializer_list<std::string> args) {
  static std::string helperPath = getHelperPath();

  std::vector<std::string> allArgs;
  allArgs.reserve(args.size() + 1);
  allArgs.push_back(helperPath);
  allArgs.insert(allArgs.end(), args.begin(), args.end());

  std::vector<std::string> env;
  switch (style) {
    case ProgramOptionsStyle::GNU:
      env.push_back("PROGRAM_OPTIONS_TEST_STYLE=GNU");
      break;
    case ProgramOptionsStyle::GFLAGS:
      env.push_back("PROGRAM_OPTIONS_TEST_STYLE=GFLAGS");
      break;
  }

  Subprocess proc(allArgs, Subprocess::Options().pipeStdout(), nullptr, &env);
  auto p = proc.communicate();
  EXPECT_EQ(0, proc.wait().exitStatus());

  return p.first;
}

} // namespace

// name value

TEST(ProgramOptionsTest, GFlagsStyleDefaultValues) {
  EXPECT_EQ(
      "flag_bool_true 1\n"
      "flag_bool_false 0\n"
      "flag_int 42\n"
      "flag_string foo\n",
      callHelper(ProgramOptionsStyle::GFLAGS, {}));
}

TEST(ProgramOptionsTest, GFlagsStyleFlagsSet) {
  EXPECT_EQ(
      "flag_bool_true 1\n"
      "flag_bool_false 1\n"
      "flag_int 43\n"
      "flag_string bar\n",
      callHelper(
          ProgramOptionsStyle::GFLAGS,
          {
              "--flag_bool_true",
              "--flag_bool_false",
              "--flag_int",
              "43",
              "--flag_string",
              "bar",
          }));
}

TEST(ProgramOptionsTest, GFlagsStyleBoolFlagsNegation) {
  EXPECT_EQ(
      "flag_bool_true 0\n"
      "flag_bool_false 0\n"
      "flag_int 42\n"
      "flag_string foo\n",
      callHelper(
          ProgramOptionsStyle::GFLAGS,
          {
              "--noflag_bool_true",
              "--noflag_bool_false",
          }));
}

TEST(ProgramOptionsTest, GNUStyleDefaultValues) {
  EXPECT_EQ(
      "flag-bool-true 1\n"
      "flag-bool-false 0\n"
      "flag-int 42\n"
      "flag-string foo\n",
      callHelper(ProgramOptionsStyle::GNU, {}));
}

TEST(ProgramOptionsTest, GNUStyleFlagsSet) {
  EXPECT_EQ(
      "flag-bool-true 1\n"
      "flag-bool-false 1\n"
      "flag-int 43\n"
      "flag-string bar\n",
      callHelper(
          ProgramOptionsStyle::GNU,
          {
              "--flag-bool-true",
              "--flag-bool-false",
              "--flag-int",
              "43",
              "--flag-string",
              "bar",
          }));
}

TEST(ProgramOptionsTest, GNUStyleBoolFlagsNegation) {
  EXPECT_EQ(
      "flag-bool-true 0\n"
      "flag-bool-false 0\n"
      "flag-int 42\n"
      "flag-string foo\n",
      callHelper(
          ProgramOptionsStyle::GNU,
          {
              "--no-flag-bool-true",
              "--no-flag-bool-false",
          }));
}

TEST(ProgramOptionsTest, GNUStyleSubCommand) {
  EXPECT_EQ(
      "flag-bool-true 1\n"
      "flag-bool-false 1\n"
      "flag-int 43\n"
      "flag-string foo\n"
      "command hello\n"
      "arg --wtf\n"
      "arg 100\n"
      "arg -x\n"
      "arg -xy\n",
      callHelper(
          ProgramOptionsStyle::GNU,
          {
              "--flag-bool-false",
              "hello",
              "--wtf",
              "--flag-int",
              "43",
              "100",
              "-x",
              "-xy",
          }));
}

TEST(ProgramOptionsTest, GNUStyleSubCommandUnrecognizedOptionFirst) {
  EXPECT_EQ(
      "flag-bool-true 1\n"
      "flag-bool-false 1\n"
      "flag-int 43\n"
      "flag-string foo\n"
      "arg --wtf\n"
      "arg hello\n"
      "arg 100\n"
      "arg -x\n"
      "arg -xy\n",
      callHelper(
          ProgramOptionsStyle::GNU,
          {
              "--flag-bool-false",
              "--wtf",
              "hello",
              "--flag-int",
              "43",
              "100",
              "-x",
              "-xy",
          }));
}

} // namespace test
} // namespace folly
