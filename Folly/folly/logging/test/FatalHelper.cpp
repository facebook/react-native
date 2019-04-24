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
#include <folly/init/Init.h>
#include <folly/logging/xlog.h>
#include <folly/portability/Stdlib.h>
#include <iostream>

DEFINE_string(
    category,
    "",
    "Crash with a message to this category instead of the default");
DEFINE_bool(crash, true, "Crash with a fatal log message.");
DEFINE_bool(
    check_debug,
    false,
    "Print whether this binary was built in debug mode "
    "and then exit successfully");

DEFINE_bool(fail_fatal_xlog_if, false, "Fail an XLOG_IF(FATAL) check.");
DEFINE_bool(fail_dfatal_xlog_if, false, "Fail an XLOG_IF(DFATAL) check.");
DEFINE_bool(fail_xcheck, false, "Fail an XCHECK() test.");
DEFINE_bool(
    fail_xcheck_nomsg,
    false,
    "Fail an XCHECK() test with no additional message.");
DEFINE_bool(fail_xdcheck, false, "Fail an XDCHECK() test.");

using folly::LogLevel;

namespace {
/**
 * Helper class to optionally log a fatal message during static initialization
 * or destruction.
 *
 * Since command line arguments have not been processed during static
 * initialization, we check an environment variable.
 */
class InitChecker {
 public:
  InitChecker() : value_{getenv("CRASH_DURING_INIT")} {
    if (value_ && strcmp(value_, "shutdown") != 0) {
      XLOG(FATAL) << "crashing during static initialization";
    }
  }
  ~InitChecker() {
    if (value_) {
      XLOG(FATAL) << "crashing during static destruction";
    }
  }

  const char* value_{nullptr};
};

static InitChecker initChecker;
} // namespace

namespace {
int runHelper() {
  if (!FLAGS_category.empty()) {
    folly::Logger logger{FLAGS_category};
    FB_LOG(logger, FATAL, "crashing to category ", FLAGS_category);
  }

  if (!FLAGS_crash) {
    return 0;
  }

  XLOG(FATAL) << "test program crashing!";
  // Even though this function is defined to return an integer, the compiler
  // should be able to detect that XLOG(FATAL) never returns.  It shouldn't
  // complain that we don't return an integer here.
}
} // namespace

std::string fbLogFatalCheck() {
  folly::Logger logger("some.category");
  FB_LOG(logger, FATAL) << "we always crash";
  // This function mostly exists to make sure the compiler does not warn
  // about a missing return statement here.
}

/*
 * This is a simple helper program to exercise the LOG(FATAL) functionality.
 */
int main(int argc, char* argv[]) {
  auto init = folly::Init(&argc, &argv);

  if (FLAGS_check_debug) {
    std::cout << "DEBUG=" << static_cast<int>(folly::kIsDebug) << "\n";
    return 0;
  }

  XLOG_IF(FATAL, FLAGS_fail_fatal_xlog_if) << "--fail_fatal_xlog_if specified!";
  XLOG_IF(DFATAL, FLAGS_fail_dfatal_xlog_if)
      << "--fail_dfatal_xlog_if specified!";
  XCHECK(!FLAGS_fail_xcheck) << ": --fail_xcheck specified!";
  XCHECK(!FLAGS_fail_xcheck_nomsg);
  XDCHECK(!FLAGS_fail_xdcheck) << ": --fail_xdcheck specified!";

  // Do most of the work in a separate helper function.
  //
  // The main reason for putting this in a helper function is to ensure that
  // the compiler does not warn about missing return statements on XLOG(FATAL)
  // code paths.  Unfortunately it appears like some compilers always suppress
  // this warning for main().
  return runHelper();
}
