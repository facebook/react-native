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

#include <iostream>

#include <glog/logging.h>

#include <folly/Conv.h>
#include <folly/experimental/ProgramOptions.h>

DEFINE_bool(flag_bool_true, true, "Bool with true default value");
DEFINE_bool(flag_bool_false, false, "Bool with false default value");
DEFINE_int32(flag_int, 42, "Integer flag");
DEFINE_string(flag_string, "foo", "String flag");

namespace po = ::boost::program_options;

namespace {
template <class T>
void print(const po::variables_map& vm, const std::string& name) {
  auto& v = vm[name];
  printf("%s %s\n", name.c_str(), folly::to<std::string>(v.as<T>()).c_str());
}
} // namespace

int main(int argc, char* argv[]) {
  po::options_description desc;
  auto styleEnv = getenv("PROGRAM_OPTIONS_TEST_STYLE");

  CHECK(styleEnv) << "PROGRAM_OPTIONS_TEST_STYLE is required";
  bool gnuStyle = !strcmp(styleEnv, "GNU");
  CHECK(gnuStyle || !strcmp(styleEnv, "GFLAGS"))
      << "Invalid value for PROGRAM_OPTIONS_TEST_STYLE";

  // clang-format off
  desc.add(getGFlags(
      gnuStyle ? folly::ProgramOptionsStyle::GNU :
      folly::ProgramOptionsStyle::GFLAGS));
  desc.add_options()
    ("help,h", "help");
  // clang-format on

  po::variables_map vm;
  auto result = folly::parseNestedCommandLine(argc, argv, desc);
  po::store(result.options, vm);
  po::notify(vm);

  if (vm.count("help")) {
    std::cout << desc;
    return 1;
  }

  print<bool>(vm, gnuStyle ? "flag-bool-true" : "flag_bool_true");
  print<bool>(vm, gnuStyle ? "flag-bool-false" : "flag_bool_false");
  print<int32_t>(vm, gnuStyle ? "flag-int" : "flag_int");
  print<std::string>(vm, gnuStyle ? "flag-string" : "flag_string");

  if (result.command) {
    printf("command %s\n", result.command->c_str());
  }

  for (auto& arg : result.rest) {
    printf("arg %s\n", arg.c_str());
  }

  return 0;
}
