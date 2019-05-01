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
#include <folly/logging/LogLevel.h>
#include <folly/Conv.h>
#include <folly/Random.h>
#include <folly/portability/GTest.h>

using namespace folly;

TEST(LogLevel, fromString) {
  EXPECT_EQ(LogLevel::UNINITIALIZED, stringToLogLevel("uninitialized"));
  EXPECT_EQ(LogLevel::UNINITIALIZED, stringToLogLevel("UnInitialized"));
  EXPECT_EQ(
      LogLevel::UNINITIALIZED, stringToLogLevel("LogLevel::UNINITIALIZED"));

  EXPECT_EQ(LogLevel::NONE, stringToLogLevel("none"));
  EXPECT_EQ(LogLevel::NONE, stringToLogLevel("NONE"));
  EXPECT_EQ(LogLevel::NONE, stringToLogLevel("NoNe"));
  EXPECT_EQ(LogLevel::NONE, stringToLogLevel("LogLevel::none"));

  EXPECT_EQ(LogLevel::DBG, stringToLogLevel("debug"));
  EXPECT_EQ(LogLevel::DBG, stringToLogLevel("dEBug"));
  EXPECT_EQ(LogLevel::DBG, stringToLogLevel("Dbg"));
  EXPECT_EQ(LogLevel::DBG, stringToLogLevel("loglevel::dEBug"));
  EXPECT_EQ(LogLevel::DBG, stringToLogLevel("loglevel::DBG"));

  EXPECT_EQ(LogLevel::INFO, stringToLogLevel("info"));
  EXPECT_EQ(LogLevel::INFO, stringToLogLevel("INFO"));
  EXPECT_EQ(LogLevel::INFO, stringToLogLevel("loglevel(INFO)"));

  EXPECT_EQ(LogLevel::WARN, stringToLogLevel("warn"));
  EXPECT_EQ(LogLevel::WARN, stringToLogLevel("WARN"));
  EXPECT_EQ(LogLevel::WARN, stringToLogLevel("warning"));

  EXPECT_EQ(LogLevel::ERR, stringToLogLevel("err"));
  EXPECT_EQ(LogLevel::ERR, stringToLogLevel("eRr"));
  EXPECT_EQ(LogLevel::ERR, stringToLogLevel("error"));
  EXPECT_EQ(LogLevel::ERR, stringToLogLevel("ERR"));
  EXPECT_EQ(LogLevel::ERR, stringToLogLevel("ERROR"));

  EXPECT_EQ(LogLevel::CRITICAL, stringToLogLevel("critical"));
  EXPECT_EQ(LogLevel::CRITICAL, stringToLogLevel("CRITICAL"));

  EXPECT_EQ(LogLevel::DFATAL, stringToLogLevel("dfatal"));
  EXPECT_EQ(LogLevel::DFATAL, stringToLogLevel("DFatal"));
  EXPECT_EQ(LogLevel::DFATAL, stringToLogLevel("DFATAL"));

  EXPECT_EQ(LogLevel::FATAL, stringToLogLevel("fatal"));
  EXPECT_EQ(LogLevel::FATAL, stringToLogLevel("FaTaL"));
  EXPECT_EQ(LogLevel::FATAL, stringToLogLevel("FATAL"));

  EXPECT_EQ(LogLevel::MAX_LEVEL, stringToLogLevel("max"));
  EXPECT_EQ(LogLevel::MAX_LEVEL, stringToLogLevel("Max_Level"));
  EXPECT_EQ(LogLevel::MAX_LEVEL, stringToLogLevel("LogLevel::MAX"));
  EXPECT_EQ(LogLevel::MAX_LEVEL, stringToLogLevel("LogLevel::MAX_LEVEL"));

  EXPECT_EQ(LogLevel::DBG0, stringToLogLevel("dbg0"));
  EXPECT_EQ(LogLevel::DBG5, stringToLogLevel("dbg5"));
  EXPECT_EQ(LogLevel::DBG5, stringToLogLevel("DBG5"));
  EXPECT_EQ(LogLevel::DBG9, stringToLogLevel("DBG9"));
  EXPECT_EQ(LogLevel::DBG + 1, stringToLogLevel("DBG998"));
  EXPECT_EQ(LogLevel::DBG, stringToLogLevel("DBG999"));
  EXPECT_EQ(LogLevel::DBG, stringToLogLevel("1000"));
  EXPECT_EQ(LogLevel::DBG, stringToLogLevel("LogLevel(1000)"));

  EXPECT_EQ(LogLevel::INFO0, stringToLogLevel("info0"));
  EXPECT_EQ(LogLevel::INFO5, stringToLogLevel("INFO5"));
  EXPECT_EQ(LogLevel::INFO5, stringToLogLevel("INFO5"));
  EXPECT_EQ(LogLevel::INFO9, stringToLogLevel("info9"));
  EXPECT_EQ(LogLevel::INFO + 1, stringToLogLevel("Info998"));
  EXPECT_EQ(LogLevel::INFO, stringToLogLevel("INFO999"));
  EXPECT_EQ(LogLevel::INFO, stringToLogLevel("2000"));
  EXPECT_EQ(LogLevel::INFO6, stringToLogLevel("LogLevel(2993)"));

  EXPECT_THROW(stringToLogLevel("foobar"), std::range_error);
  EXPECT_THROW(stringToLogLevel("dbgx"), std::range_error);
  EXPECT_THROW(stringToLogLevel("dbgxyz"), std::range_error);
  EXPECT_THROW(stringToLogLevel("dbg-1"), std::range_error);
  EXPECT_THROW(stringToLogLevel("dbg12345"), std::range_error);
  EXPECT_THROW(stringToLogLevel("900z"), std::range_error);
}

TEST(LogLevel, toString) {
  EXPECT_EQ("UNINITIALIZED", logLevelToString(LogLevel::UNINITIALIZED));
  EXPECT_EQ("NONE", logLevelToString(LogLevel::NONE));
  EXPECT_EQ("INFO", logLevelToString(LogLevel::INFO));
  EXPECT_EQ("WARN", logLevelToString(LogLevel::WARN));
  EXPECT_EQ("WARN", logLevelToString(LogLevel::WARNING));
  EXPECT_EQ("DEBUG", logLevelToString(LogLevel::DBG));
  EXPECT_EQ("ERR", logLevelToString(LogLevel::ERR));
  EXPECT_EQ("CRITICAL", logLevelToString(LogLevel::CRITICAL));
  EXPECT_EQ("DFATAL", logLevelToString(LogLevel::DFATAL));
  EXPECT_EQ("FATAL", logLevelToString(LogLevel::FATAL));
  EXPECT_EQ("FATAL", logLevelToString(LogLevel::MAX_LEVEL));

  EXPECT_EQ("DBG0", logLevelToString(LogLevel::DBG0));
  EXPECT_EQ("DBG2", logLevelToString(LogLevel::DBG2));
  EXPECT_EQ("DBG5", logLevelToString(LogLevel::DBG5));
  EXPECT_EQ("DBG9", logLevelToString(LogLevel::DBG9));
  EXPECT_EQ("DBG96", logLevelToString(static_cast<LogLevel>(1903)));
  EXPECT_EQ("DBG64", logLevelToString(LogLevel::DBG4 - 60));

  EXPECT_EQ("INFO0", logLevelToString(LogLevel::INFO0));
  EXPECT_EQ("INFO2", logLevelToString(LogLevel::INFO2));
  EXPECT_EQ("INFO5", logLevelToString(LogLevel::INFO5));
  EXPECT_EQ("INFO9", logLevelToString(LogLevel::INFO9));
  EXPECT_EQ("INFO86", logLevelToString(static_cast<LogLevel>(2913)));
  EXPECT_EQ("INFO57", logLevelToString(LogLevel::INFO7 - 50));

  EXPECT_EQ("LogLevel(123)", logLevelToString(static_cast<LogLevel>(123)));
}

TEST(LogLevel, toStringAndBack) {
  // Check that stringToLogLevel(logLevelToString()) is the identity function
  auto checkLevel = [](LogLevel level) {
    auto stringForm = logLevelToString(level);
    auto outputLevel = stringToLogLevel(stringForm);
    EXPECT_EQ(level, outputLevel)
        << "error converting " << level << " (" << static_cast<uint32_t>(level)
        << ") to string and back.  String is " << stringForm;
  };

  // Check all of the named levels
  checkLevel(LogLevel::UNINITIALIZED);
  checkLevel(LogLevel::NONE);
  checkLevel(LogLevel::DBG);
  checkLevel(LogLevel::DBG0);
  checkLevel(LogLevel::DBG1);
  checkLevel(LogLevel::DBG2);
  checkLevel(LogLevel::DBG3);
  checkLevel(LogLevel::DBG4);
  checkLevel(LogLevel::DBG5);
  checkLevel(LogLevel::DBG6);
  checkLevel(LogLevel::DBG7);
  checkLevel(LogLevel::DBG8);
  checkLevel(LogLevel::DBG9);
  checkLevel(LogLevel::INFO);
  checkLevel(LogLevel::WARN);
  checkLevel(LogLevel::WARNING);
  checkLevel(LogLevel::ERR);
  checkLevel(LogLevel::CRITICAL);
  checkLevel(LogLevel::DFATAL);
  checkLevel(LogLevel::FATAL);

  // Try with some random integer values
  for (uint32_t numIters = 0; numIters < 10000; ++numIters) {
    auto levelValue =
        folly::Random::rand32(static_cast<uint32_t>(LogLevel::MAX_LEVEL));
    checkLevel(static_cast<LogLevel>(levelValue));
  }
}
