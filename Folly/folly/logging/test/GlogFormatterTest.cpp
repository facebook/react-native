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
#include <cstdlib>

#include <folly/init/Init.h>
#include <folly/logging/GlogStyleFormatter.h>
#include <folly/logging/LogMessage.h>
#include <folly/logging/Logger.h>
#include <folly/logging/LoggerDB.h>
#include <folly/portability/GTest.h>
#include <folly/portability/Stdlib.h>

using namespace folly;

namespace {
/**
 * Helper function to format a LogMessage using the GlogStyleFormatter.
 *
 * formatMsg() accepts the timestamp as a plain integer simply to reduce the
 * verbosity of the test code.
 *
 * Note that in this test's main() function we set the timezone to "UTC"
 * so that the logged time values will be consistent regardless of the actual
 * local time on this host.
 */
std::string formatMsg(
    LogLevel level,
    StringPiece msg,
    StringPiece filename,
    unsigned int lineNumber,
    StringPiece functionName,
    // Default timestamp: 2017-04-17 13:45:56.123456 UTC
    uint64_t timestampNS = 1492436756123456789ULL) {
  LoggerDB db{LoggerDB::TESTING};
  auto* category = db.getCategory("test");
  GlogStyleFormatter formatter;

  std::chrono::system_clock::time_point logTimePoint{
      std::chrono::duration_cast<std::chrono::system_clock::duration>(
          std::chrono::nanoseconds{timestampNS})};
  LogMessage logMessage{category,
                        level,
                        logTimePoint,
                        filename,
                        lineNumber,
                        functionName,
                        msg.str()};

  return formatter.formatMessage(logMessage, category);
}
} // namespace

TEST(GlogFormatter, log) {
  auto tid = getOSThreadID();

  // Test a very simple single-line log message
  auto expected = folly::sformat(
      "W0417 13:45:56.123456 {:5d} myfile.cpp:1234] hello world\n", tid);
  EXPECT_EQ(
      expected,
      formatMsg(
          LogLevel::WARN, "hello world", "myfile.cpp", 1234, "testFunction"));
}

TEST(GlogFormatter, filename) {
  auto tid = getOSThreadID();

  // Make sure only the file basename gets logged
  auto expected = folly::sformat(
      "W0417 13:45:56.123456 {:5d} myfile.cpp:1234] hello world\n", tid);
  EXPECT_EQ(
      expected,
      formatMsg(
          LogLevel::WARN,
          "hello world",
          "src/test/logging/code/myfile.cpp",
          1234,
          "testFunction"));

  // Log a message with a very long file name.
  expected = folly::sformat(
      "W0417 13:45:56.123456 {:5d} "
      "this_is_a_really_long_file_name_that_will_probably_exceed_"
      "our_buffer_allocation_guess.cpp:123456789] oh noes\n",
      tid);
  EXPECT_EQ(
      expected,
      formatMsg(
          LogLevel::WARN,
          "oh noes",
          "this_is_a_really_long_file_name_that_will_probably_exceed_"
          "our_buffer_allocation_guess.cpp",
          123456789,
          "testFunction"));
}

TEST(GlogFormatter, multiline) {
  auto tid = getOSThreadID();
  std::map<std::string, std::string> formatMap{
      {"tid", folly::to<std::string>(tid)}};

  // Log a multi-line message
  auto expected = folly::svformat(
      "V0417 13:45:56.123456 {tid:>5s} rodent.cpp:777] Eeek, a mouse!\n"
      "V0417 13:45:56.123456 {tid:>5s} rodent.cpp:777]    .   .\n"
      "V0417 13:45:56.123456 {tid:>5s} rodent.cpp:777]   ( ).( )\n"
      "V0417 13:45:56.123456 {tid:>5s} rodent.cpp:777]    (o o) .-._.'\n"
      "V0417 13:45:56.123456 {tid:>5s} rodent.cpp:777]   (  -  )\n"
      "V0417 13:45:56.123456 {tid:>5s} rodent.cpp:777]    mm mm\n"
      "V0417 13:45:56.123456 {tid:>5s} rodent.cpp:777] \n"
      "V0417 13:45:56.123456 {tid:>5s} rodent.cpp:777] =============\n",
      formatMap);
  EXPECT_EQ(
      expected,
      formatMsg(
          LogLevel::DBG9,
          "Eeek, a mouse!\n"
          "   .   .\n"
          "  ( ).( )\n"
          "   (o o) .-._.'\n"
          "  (  -  )\n"
          "   mm mm\n"
          "\n"
          "=============",
          "src/rodent.cpp",
          777,
          "testFunction"));
}

TEST(GlogFormatter, singleNewline) {
  auto tid = getOSThreadID();
  std::map<std::string, std::string> formatMap{
      {"tid", folly::to<std::string>(tid)}};

  // Logging a single newline is basically two empty strings.
  auto expected = folly::svformat(
      "V0417 13:45:56.123456 {tid:>5s} foo.txt:123] \n"
      "V0417 13:45:56.123456 {tid:>5s} foo.txt:123] \n",
      formatMap);
  EXPECT_EQ(
      expected,
      formatMsg(LogLevel::DBG9, "\n", "foo.txt", 123, "testFunction"));
}

TEST(GlogFormatter, unprintableChars) {
  auto tid = getOSThreadID();

  // Unprintable characters should be backslash escaped, as should backslashes.
  auto expected = folly::sformat(
      "E0417 13:45:56.123456 {:5d} escapes.cpp:97] foo\\x07bar\\x1btest\n",
      tid);
  EXPECT_EQ(
      expected,
      formatMsg(
          LogLevel::ERR,
          "foo\abar\x1btest",
          "escapes.cpp",
          97,
          "testFunction"));
  expected = folly::sformat(
      "I0417 13:45:56.123456 {:5d} escapes.cpp:98] foo\\\\bar\"test\n", tid);
  EXPECT_EQ(
      expected,
      formatMsg(
          LogLevel::INFO, "foo\\bar\"test", "escapes.cpp", 98, "testFunction"));
  expected = folly::sformat(
      "C0417 13:45:56.123456 {:5d} escapes.cpp:99] nul\\x00byte\n", tid);
  EXPECT_EQ(
      expected,
      formatMsg(
          LogLevel::CRITICAL,
          std::string("nul\0byte", 8),
          "escapes.cpp",
          99,
          "testFunction"));
}

int main(int argc, char* argv[]) {
  testing::InitGoogleTest(&argc, argv);
  folly::init(&argc, &argv);

  // Some of our tests check timestamps emitted by the formatter.
  // Set the timezone to a consistent value so that the tests are not
  // affected by the local time of the user running the test.
  //
  // UTC is the only timezone that we can really rely on to work consistently.
  // This will work even in the absence of a proper tzdata installation on the
  // local system.
  setenv("TZ", "UTC", 1);

  return RUN_ALL_TESTS();
}
