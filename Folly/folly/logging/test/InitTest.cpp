/*
 * Copyright 2004-present Facebook, Inc.
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
#include <folly/logging/Init.h>

#include <folly/logging/LogConfigParser.h>
#include <folly/logging/LoggerDB.h>
#include <folly/logging/test/ConfigHelpers.h>
#include <folly/portability/GFlags.h>
#include <folly/portability/GTest.h>
#include <folly/test/TestUtils.h>

using folly::initLogging;
using folly::LoggerDB;
using folly::parseLogConfig;

namespace {
// A counter to help confirm that our getBaseLoggingConfigCalled() was invoked
// rather than the default implementation that folly exports as a weak symbol.
unsigned int getBaseLoggingConfigCalled;
} // namespace

namespace folly {

const char* getBaseLoggingConfig() {
  ++getBaseLoggingConfigCalled;
  return "folly=INFO; default:stream=stdout";
}

} // namespace folly

TEST(Init, checkConfig) {
  // Before we call initLogging(), the LoggerDB will have the default
  // configuration provided by initializeLoggerDB().
  auto initialConfig = folly::LoggerDB::get().getConfig();
  EXPECT_EQ(0, getBaseLoggingConfigCalled);
  EXPECT_EQ(
      parseLogConfig(".:=INFO:default; "
                     "default=stream:stream=stderr,async=false"),
      LoggerDB::get().getConfig());

  // Call initLogging()
  // Make sure it merges the supplied config argument with our custom
  // base configuration.
  initLogging(".=ERROR,folly.logging=DBG7");
  EXPECT_EQ(1, getBaseLoggingConfigCalled);
  EXPECT_EQ(
      parseLogConfig(".:=ERROR:default,folly=INFO:,folly.logging=DBG7:; "
                     "default=stream:stream=stdout,async=false"),
      LoggerDB::get().getConfig());

  // Test calling initLogging() with bad configuration strings, and
  // configured such that it should throw an exception on error rather than
  // exiting.
  //
  // Note that it is okay to call initLogging() multiple times (we already
  // called it successfully once above), but this isn't really something to
  // expect most callers to want to do.
  EXPECT_THROW_RE(
      initLogging(".=BOGUSLEVEL"),
      folly::LogConfigParseError,
      R"(invalid log level "BOGUSLEVEL")");
  EXPECT_THROW_RE(
      initLogging(".=ERR:undefined_handler"),
      std::invalid_argument,
      R"(unknown log handler "undefined_handler")");
}

// We use our custom main() to ensure that folly::initLogging() has
// not been called yet when we start running the tests.
int main(int argc, char** argv) {
  ::testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, /* remove_flags = */ true);

  return RUN_ALL_TESTS();
}
