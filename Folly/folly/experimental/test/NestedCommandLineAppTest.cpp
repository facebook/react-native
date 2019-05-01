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

#include <folly/experimental/NestedCommandLineApp.h>

#include <folly/Subprocess.h>
#include <folly/experimental/io/FsUtil.h>
#include <folly/portability/GTest.h>
#include <glog/logging.h>

namespace folly {
namespace test {

namespace {

std::string getHelperPath() {
  const auto basename = "nested_command_line_app_test_helper";
  auto path = fs::executable_path();
  path.remove_filename() /= basename;
  if (!fs::exists(path)) {
    path = path.parent_path().parent_path() / basename / basename;
  }
  return path.string();
}

std::string callHelper(
    std::initializer_list<std::string> args,
    int expectedExitCode = 0,
    int stdoutFd = -1) {
  static std::string helperPath = getHelperPath();

  std::vector<std::string> allArgs;
  allArgs.reserve(args.size() + 1);
  allArgs.push_back(helperPath);
  allArgs.insert(allArgs.end(), args.begin(), args.end());

  Subprocess::Options options;
  if (stdoutFd != -1) {
    options.stdoutFd(stdoutFd);
  } else {
    options.pipeStdout();
  }
  options.pipeStderr();

  Subprocess proc(allArgs, options);
  auto p = proc.communicate();
  EXPECT_EQ(expectedExitCode, proc.wait().exitStatus());

  return p.first;
}

} // namespace

TEST(ProgramOptionsTest, Errors) {
  callHelper({}, 1);
  callHelper({"--wtf", "foo"}, 1);
  callHelper({"qux"}, 1);
  callHelper({"--global-foo", "x", "foo"}, 1);
}

TEST(ProgramOptionsTest, Help) {
  // Not actually checking help output, just verifying that help doesn't fail
  callHelper({"--version"});
  callHelper({"--help"});
  callHelper({"--help", "foo"});
  callHelper({"--help", "bar"});
  callHelper({"--help", "--", "bar"});
  callHelper({"help"});
  callHelper({"help", "foo"});
  callHelper({"help", "bar"});

  // wrong command name
  callHelper({"--help", "qux"}, 1);
  callHelper({"help", "qux"}, 1);

  // anything after -- is parsed as arguments
  callHelper({"--", "help", "bar"}, 1);
}

TEST(ProgramOptionsTest, DevFull) {
  folly::File full("/dev/full", O_RDWR);
  callHelper({"--help"}, 1, full.fd());
}

TEST(ProgramOptionsTest, CutArguments) {
  // anything after -- is parsed as arguments
  EXPECT_EQ(
      "running foo\n"
      "foo global-foo 43\n"
      "foo local-foo 42\n"
      "foo arg b\n"
      "foo arg --local-foo\n"
      "foo arg 44\n"
      "foo arg a\n",
      callHelper(
          {"foo", "--global-foo", "43", "--", "b", "--local-foo", "44", "a"}));
}

TEST(ProgramOptionsTest, Success) {
  EXPECT_EQ(
      "running foo\n"
      "foo global-foo 42\n"
      "foo local-foo 42\n",
      callHelper({"foo"}));

  EXPECT_EQ(
      "running foo\n"
      "foo global-foo 43\n"
      "foo local-foo 44\n"
      "foo arg a\n"
      "foo arg b\n",
      callHelper({"--global-foo", "43", "foo", "--local-foo", "44", "a", "b"}));

  // Check that global flags can still be given after the command
  EXPECT_EQ(
      "running foo\n"
      "foo global-foo 43\n"
      "foo local-foo 44\n"
      "foo arg a\n"
      "foo arg b\n",
      callHelper({"foo", "--global-foo", "43", "--local-foo", "44", "a", "b"}));
}

TEST(ProgramOptionsTest, Aliases) {
  EXPECT_EQ(
      "running foo\n"
      "foo global-foo 43\n"
      "foo local-foo 44\n"
      "foo arg a\n"
      "foo arg b\n",
      callHelper({"--global-foo", "43", "bar", "--local-foo", "44", "a", "b"}));
}

TEST(ProgramOptionsTest, BuiltinCommand) {
  NestedCommandLineApp app;
  ASSERT_TRUE(app.isBuiltinCommand(NestedCommandLineApp::kHelpCommand.str()));
  ASSERT_TRUE(
      app.isBuiltinCommand(NestedCommandLineApp::kVersionCommand.str()));
  ASSERT_FALSE(app.isBuiltinCommand(
      NestedCommandLineApp::kHelpCommand.str() + "nonsense"));
}

} // namespace test
} // namespace folly
