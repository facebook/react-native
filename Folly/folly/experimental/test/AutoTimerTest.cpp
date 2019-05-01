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

#include <folly/experimental/AutoTimer.h>

#include <folly/portability/GTest.h>

using namespace folly;
using namespace std;

struct StubLogger {
  void operator()(StringPiece msg, std::chrono::duration<double> sec) {
    m = msg.str();
    t = sec.count();
  }
  static std::string m;
  static double t;
};

std::string StubLogger::m = "";
double StubLogger::t = 0;

struct StubClock {
  typedef std::chrono::seconds duration;

  static std::chrono::time_point<StubClock> now() {
    return std::chrono::time_point<StubClock>(std::chrono::duration<int>(t));
  }
  static int t;
};

int StubClock::t = 0;

TEST(TestAutoTimer, HandleBasicClosure) {
  auto logger = [](StringPiece mesg, auto sec) {
    return StubLogger()(mesg, sec);
  };
  StubClock::t = 1;
  // Here decltype is needed. But since most users are expected to use this
  // method with the default clock, template specification won't be needed even
  // when they use a closure. See test case HandleRealTimerClosure
  auto timer = makeAutoTimer<decltype(logger), StubClock>(
      "", std::chrono::duration<double>::zero(), std::move(logger));
  StubClock::t = 3;
  timer.log("foo");
  ASSERT_EQ("foo", StubLogger::m);
  ASSERT_EQ(2, StubLogger::t);
  timer.logFormat("bar {}", 5e-2);
  ASSERT_EQ("bar 0.05", StubLogger::m);
  ASSERT_EQ(0, StubLogger::t);
}

TEST(TestAutoTimer, HandleBasic) {
  StubClock::t = 1;
  AutoTimer<StubLogger, StubClock> timer;
  StubClock::t = 3;
  timer.log("foo");
  ASSERT_EQ("foo", StubLogger::m);
  ASSERT_EQ(2, StubLogger::t);
  timer.logFormat("bar {}", 5e-2);
  ASSERT_EQ("bar 0.05", StubLogger::m);
  ASSERT_EQ(0, StubLogger::t);
}

TEST(TestAutoTimer, HandleLogOnDestruct) {
  {
    StubClock::t = 0;
    AutoTimer<StubLogger, StubClock> timer("message");
    StubClock::t = 3;
    timer.log("foo");
    EXPECT_EQ("foo", StubLogger::m);
    EXPECT_EQ(3, StubLogger::t);
    StubClock::t = 5;
  }
  ASSERT_EQ("message", StubLogger::m);
  ASSERT_EQ(2, StubLogger::t);
}

TEST(TestAutoTimer, HandleRealTimerClosure) {
  auto t = makeAutoTimer(
      "Third message on destruction",
      std::chrono::duration<double>::zero(),
      [](StringPiece mesg, auto sec) {
        GoogleLogger<GoogleLoggerStyle::PRETTY>()(mesg, sec);
      });
  t.log("First message");
  t.log("Second message");
}

TEST(TestAutoTimer, HandleRealTimer) {
  AutoTimer<> t("Third message on destruction");
  t.log("First message");
  t.log("Second message");
}

TEST(TestAutoTimer, HandleMinLogTime) {
  StubClock::t = 1;
  AutoTimer<StubLogger, StubClock> timer("", std::chrono::duration<double>(3));
  StubClock::t = 3;
  // only 2 "seconds" have passed, so this shouldn't log
  StubLogger::t = 0;
  ASSERT_EQ(std::chrono::duration<double>(2), timer.log("foo"));
  ASSERT_EQ(std::chrono::duration<double>::zero().count(), StubLogger::t);
}

TEST(TestAutoTimer, MovedObjectDestructionDoesntLog) {
  const std::vector<std::string> expectedMsgs = {
      "BEFORE_MOVE", "AFTER_MOVE", "END"};
  int32_t current = 0;
  SCOPE_EXIT {
    EXPECT_EQ(3, current);
  };

  auto timer = [&expectedMsgs, &current] {
    auto oldTimer = folly::makeAutoTimer(
        "END",
        std::chrono::duration<double>::zero(),
        [&expectedMsgs, &current](
            StringPiece msg, const std::chrono::duration<double>&) {
          EXPECT_EQ(expectedMsgs.at(current), msg);
          current++;
        });
    oldTimer.log("BEFORE_MOVE");
    auto newTimer = std::move(oldTimer); // force the move-ctor
    return newTimer;
  }();
  timer.log("AFTER_MOVE");
}
