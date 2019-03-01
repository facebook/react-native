/*
 * Copyright 2017 Facebook, Inc.
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
#include <algorithm>
#include <atomic>
#include <cassert>
#include <random>

#include <folly/Random.h>
#include <folly/experimental/FunctionScheduler.h>
#include <folly/portability/GTest.h>

#if defined(__linux__)
#include <dlfcn.h>
#endif

using namespace folly;
using std::chrono::milliseconds;

namespace {

/*
 * Helper functions for controlling how long this test takes.
 *
 * Using larger intervals here will make the tests less flaky when run on
 * heavily loaded systems.  However, this will also make the tests take longer
 * to run.
 */
static const auto timeFactor = std::chrono::milliseconds(100);
std::chrono::milliseconds testInterval(int n) { return n * timeFactor; }
int getTicksWithinRange(int n, int min, int max) {
  assert(min <= max);
  n = std::max(min, n);
  n = std::min(max, n);
  return n;
}
void delay(int n) {
  std::chrono::microseconds usec(n * timeFactor);
  usleep(usec.count());
}

} // unnamed namespace

TEST(FunctionScheduler, StartAndShutdown) {
  FunctionScheduler fs;
  EXPECT_TRUE(fs.start());
  EXPECT_FALSE(fs.start());
  EXPECT_TRUE(fs.shutdown());
  EXPECT_FALSE(fs.shutdown());
  // start again
  EXPECT_TRUE(fs.start());
  EXPECT_FALSE(fs.start());
  EXPECT_TRUE(fs.shutdown());
  EXPECT_FALSE(fs.shutdown());
}

TEST(FunctionScheduler, SimpleAdd) {
  int total = 0;
  FunctionScheduler fs;
  fs.addFunction([&] { total += 2; }, testInterval(2), "add2");
  fs.start();
  delay(1);
  EXPECT_EQ(2, total);
  fs.shutdown();
  delay(2);
  EXPECT_EQ(2, total);
}

TEST(FunctionScheduler, AddCancel) {
  int total = 0;
  FunctionScheduler fs;
  fs.addFunction([&] { total += 2; }, testInterval(2), "add2");
  fs.start();
  delay(1);
  EXPECT_EQ(2, total);
  delay(2);
  EXPECT_EQ(4, total);
  EXPECT_TRUE(fs.cancelFunction("add2"));
  EXPECT_FALSE(fs.cancelFunction("NO SUCH FUNC"));
  delay(2);
  EXPECT_EQ(4, total);
  fs.addFunction([&] { total += 1; }, testInterval(2), "add2");
  delay(1);
  EXPECT_EQ(5, total);
  delay(2);
  EXPECT_EQ(6, total);
  fs.shutdown();
}

TEST(FunctionScheduler, AddCancel2) {
  int total = 0;
  FunctionScheduler fs;

  // Test adds and cancels while the scheduler is stopped
  EXPECT_FALSE(fs.cancelFunction("add2"));
  fs.addFunction([&] { total += 1; }, testInterval(2), "add2");
  EXPECT_TRUE(fs.cancelFunction("add2"));
  EXPECT_FALSE(fs.cancelFunction("add2"));
  fs.addFunction([&] { total += 2; }, testInterval(2), "add2");
  fs.addFunction([&] { total += 3; }, testInterval(3), "add3");

  EXPECT_EQ(0, total);
  fs.start();
  delay(1);
  EXPECT_EQ(5, total);

  // Cancel add2 while the scheduler is running
  EXPECT_TRUE(fs.cancelFunction("add2"));
  EXPECT_FALSE(fs.cancelFunction("add2"));
  EXPECT_FALSE(fs.cancelFunction("bogus"));

  delay(3);
  EXPECT_EQ(8, total);
  EXPECT_TRUE(fs.cancelFunction("add3"));

  // Test a function that cancels itself
  int selfCancelCount = 0;
  fs.addFunction(
      [&] {
        ++selfCancelCount;
        if (selfCancelCount > 2) {
          fs.cancelFunction("selfCancel");
        }
      },
      testInterval(1), "selfCancel", testInterval(1));
  delay(4);
  EXPECT_EQ(3, selfCancelCount);
  EXPECT_FALSE(fs.cancelFunction("selfCancel"));

  // Test a function that schedules another function
  int adderCount = 0;
  int fn2Count = 0;
  auto fn2 = [&] { ++fn2Count; };
  auto fnAdder = [&] {
    ++adderCount;
    if (adderCount == 2) {
      fs.addFunction(fn2, testInterval(3), "fn2", testInterval(2));
    }
  };
  fs.addFunction(fnAdder, testInterval(4), "adder");
  // t0: adder fires
  delay(1); // t1
  EXPECT_EQ(1, adderCount);
  EXPECT_EQ(0, fn2Count);
  // t4: adder fires, schedules fn2
  delay(4); // t5
  EXPECT_EQ(2, adderCount);
  EXPECT_EQ(0, fn2Count);
  // t6: fn2 fires
  delay(2); // t7
  EXPECT_EQ(2, adderCount);
  EXPECT_EQ(1, fn2Count);
  // t8: adder fires
  // t9: fn2 fires
  delay(3); // t10
  EXPECT_EQ(3, adderCount);
  EXPECT_EQ(2, fn2Count);
  EXPECT_TRUE(fs.cancelFunction("fn2"));
  EXPECT_TRUE(fs.cancelFunction("adder"));
  delay(5); // t10
  EXPECT_EQ(3, adderCount);
  EXPECT_EQ(2, fn2Count);

  EXPECT_EQ(8, total);
  EXPECT_EQ(3, selfCancelCount);
}

TEST(FunctionScheduler, AddMultiple) {
  int total = 0;
  FunctionScheduler fs;
  fs.addFunction([&] { total += 2; }, testInterval(2), "add2");
  fs.addFunction([&] { total += 3; }, testInterval(3), "add3");
  EXPECT_THROW(fs.addFunction([&] { total += 2; }, testInterval(2), "add2"),
               std::invalid_argument); // function name already exists

  fs.start();
  delay(1);
  EXPECT_EQ(5, total);
  delay(4);
  EXPECT_EQ(12, total);
  EXPECT_TRUE(fs.cancelFunction("add2"));
  delay(2);
  EXPECT_EQ(15, total);
  fs.shutdown();
  delay(3);
  EXPECT_EQ(15, total);
  fs.shutdown();
}

TEST(FunctionScheduler, AddAfterStart) {
  int total = 0;
  FunctionScheduler fs;
  fs.addFunction([&] { total += 2; }, testInterval(2), "add2");
  fs.addFunction([&] { total += 3; }, testInterval(2), "add3");
  fs.start();
  delay(3);
  EXPECT_EQ(10, total);
  fs.addFunction([&] { total += 2; }, testInterval(3), "add22");
  delay(2);
  EXPECT_EQ(17, total);
}

TEST(FunctionScheduler, ShutdownStart) {
  int total = 0;
  FunctionScheduler fs;
  fs.addFunction([&] { total += 2; }, testInterval(2), "add2");
  fs.start();
  delay(1);
  fs.shutdown();
  fs.start();
  delay(1);
  EXPECT_EQ(4, total);
  EXPECT_FALSE(fs.cancelFunction("add3")); // non existing
  delay(2);
  EXPECT_EQ(6, total);
}

TEST(FunctionScheduler, ResetFunc) {
  int total = 0;
  FunctionScheduler fs;
  fs.addFunction([&] { total += 2; }, testInterval(3), "add2");
  fs.addFunction([&] { total += 3; }, testInterval(3), "add3");
  fs.start();
  delay(1);
  EXPECT_EQ(5, total);
  EXPECT_FALSE(fs.resetFunctionTimer("NON_EXISTING"));
  EXPECT_TRUE(fs.resetFunctionTimer("add2"));
  delay(1);
  // t2: after the reset, add2 should have been invoked immediately
  EXPECT_EQ(7, total);
  usleep(150000);
  // t3.5: add3 should have been invoked. add2 should not
  EXPECT_EQ(10, total);
  delay(1);
  // t4.5: add2 should have been invoked once more (it was reset at t1)
  EXPECT_EQ(12, total);
}

TEST(FunctionScheduler, AddInvalid) {
  int total = 0;
  FunctionScheduler fs;
  // interval may not be negative
  EXPECT_THROW(fs.addFunction([&] { total += 2; }, testInterval(-1), "add2"),
               std::invalid_argument);

  EXPECT_FALSE(fs.cancelFunction("addNoFunc"));
}

TEST(FunctionScheduler, NoFunctions) {
  FunctionScheduler fs;
  EXPECT_TRUE(fs.start());
  fs.shutdown();
  FunctionScheduler fs2;
  fs2.shutdown();
}

TEST(FunctionScheduler, AddWhileRunning) {
  int total = 0;
  FunctionScheduler fs;
  fs.start();
  delay(1);
  fs.addFunction([&] { total += 2; }, testInterval(2), "add2");
  // The function should be invoked nearly immediately when we add it
  // and the FunctionScheduler is already running
  usleep(50000);
  EXPECT_EQ(2, total);
  delay(2);
  EXPECT_EQ(4, total);
}

TEST(FunctionScheduler, NoShutdown) {
  int total = 0;
  {
    FunctionScheduler fs;
    fs.addFunction([&] { total += 2; }, testInterval(1), "add2");
    fs.start();
    usleep(50000);
    EXPECT_EQ(2, total);
  }
  // Destroyed the FunctionScheduler without calling shutdown.
  // Everything should have been cleaned up, and the function will no longer
  // get called.
  delay(2);
  EXPECT_EQ(2, total);
}

TEST(FunctionScheduler, StartDelay) {
  int total = 0;
  FunctionScheduler fs;
  fs.addFunction([&] { total += 2; }, testInterval(2), "add2",
                 testInterval(2));
  fs.addFunction([&] { total += 3; }, testInterval(3), "add3",
                 testInterval(2));
  EXPECT_THROW(fs.addFunction([&] { total += 2; }, testInterval(3),
                              "addX", testInterval(-1)),
               std::invalid_argument);
  fs.start();
  delay(1); // t1
  EXPECT_EQ(0, total);
  // t2 : add2 total=2
  // t2 : add3 total=5
  delay(2); // t3
  EXPECT_EQ(5, total);
  // t4 : add2: total=7
  // t5 : add3: total=10
  // t6 : add2: total=12
  delay(4); // t7
  EXPECT_EQ(12, total);
  fs.cancelFunction("add2");
  // t8 : add3: total=15
  delay(2); // t9
  EXPECT_EQ(15, total);
  fs.shutdown();
  delay(3);
  EXPECT_EQ(15, total);
  fs.shutdown();
}

TEST(FunctionScheduler, NoSteadyCatchup) {
  std::atomic<int> ticks(0);
  FunctionScheduler fs;
  // fs.setSteady(false); is the default
  fs.addFunction([&ticks] {
                   if (++ticks == 2) {
                     std::this_thread::sleep_for(
                         std::chrono::milliseconds(200));
                   }
                 },
                 milliseconds(5));
  fs.start();
  std::this_thread::sleep_for(std::chrono::milliseconds(500));

  // no steady catch up means we'd tick once for 200ms, then remaining
  // 300ms / 5 = 60 times
  EXPECT_LE(ticks.load(), 61);
}

TEST(FunctionScheduler, SteadyCatchup) {
  std::atomic<int> ticks(0);
  FunctionScheduler fs;
  fs.setSteady(true);
  fs.addFunction([&ticks] {
                   if (++ticks == 2) {
                     std::this_thread::sleep_for(
                         std::chrono::milliseconds(200));
                   }
                 },
                 milliseconds(5));
  fs.start();

  std::this_thread::sleep_for(std::chrono::milliseconds(500));

  // tick every 5ms. Despite tick == 2 is slow, later ticks should be fast
  // enough to catch back up to schedule
  EXPECT_NEAR(100, ticks.load(), 10);
}

TEST(FunctionScheduler, UniformDistribution) {
  int total = 0;
  const int kTicks = 2;
  std::chrono::milliseconds minInterval =
      testInterval(kTicks) - (timeFactor / 5);
  std::chrono::milliseconds maxInterval =
      testInterval(kTicks) + (timeFactor / 5);
  FunctionScheduler fs;
  fs.addFunctionUniformDistribution([&] { total += 2; },
                                    minInterval,
                                    maxInterval,
                                    "UniformDistribution",
                                    std::chrono::milliseconds(0));
  fs.start();
  delay(1);
  EXPECT_EQ(2, total);
  delay(kTicks);
  EXPECT_EQ(4, total);
  delay(kTicks);
  EXPECT_EQ(6, total);
  fs.shutdown();
  delay(2);
  EXPECT_EQ(6, total);
}

TEST(FunctionScheduler, ExponentialBackoff) {
  int total = 0;
  int expectedInterval = 0;
  int nextInterval = 2;
  FunctionScheduler fs;
  fs.addFunctionGenericDistribution(
      [&] { total += 2; },
      [&expectedInterval, nextInterval]() mutable {
        expectedInterval = nextInterval;
        nextInterval *= nextInterval;
        return testInterval(expectedInterval);
      },
      "ExponentialBackoff",
      "2^n * 100ms",
      std::chrono::milliseconds(0));
  fs.start();
  delay(1);
  EXPECT_EQ(2, total);
  delay(expectedInterval);
  EXPECT_EQ(4, total);
  delay(expectedInterval);
  EXPECT_EQ(6, total);
  fs.shutdown();
  delay(2);
  EXPECT_EQ(6, total);
}

TEST(FunctionScheduler, GammaIntervalDistribution) {
  int total = 0;
  int expectedInterval = 0;
  FunctionScheduler fs;
  std::default_random_engine generator(folly::Random::rand32());
  // The alpha and beta arguments are selected, somewhat randomly, to be 2.0.
  // These values do not matter much in this test, as we are not testing the
  // std::gamma_distribution itself...
  std::gamma_distribution<double> gamma(2.0, 2.0);
  fs.addFunctionGenericDistribution(
      [&] { total += 2; },
      [&expectedInterval, generator, gamma]() mutable {
        expectedInterval =
            getTicksWithinRange(static_cast<int>(gamma(generator)), 2, 10);
        return testInterval(expectedInterval);
      },
      "GammaDistribution",
      "gamma(2.0,2.0)*100ms",
      std::chrono::milliseconds(0));
  fs.start();
  delay(1);
  EXPECT_EQ(2, total);
  delay(expectedInterval);
  EXPECT_EQ(4, total);
  delay(expectedInterval);
  EXPECT_EQ(6, total);
  fs.shutdown();
  delay(2);
  EXPECT_EQ(6, total);
}

TEST(FunctionScheduler, AddWithRunOnce) {
  int total = 0;
  FunctionScheduler fs;
  fs.addFunctionOnce([&] { total += 2; }, "add2");
  fs.start();
  delay(1);
  EXPECT_EQ(2, total);
  delay(2);
  EXPECT_EQ(2, total);

  fs.addFunctionOnce([&] { total += 2; }, "add2");
  delay(1);
  EXPECT_EQ(4, total);
  delay(2);
  EXPECT_EQ(4, total);

  fs.shutdown();
}

TEST(FunctionScheduler, cancelFunctionAndWait) {
  int total = 0;
  FunctionScheduler fs;
  fs.addFunction(
      [&] {
        delay(5);
        total += 2;
      },
      testInterval(100),
      "add2");

  fs.start();
  delay(1);
  EXPECT_EQ(0, total); // add2 is still sleeping

  EXPECT_TRUE(fs.cancelFunctionAndWait("add2"));
  EXPECT_EQ(2, total); // add2 should have completed

  EXPECT_FALSE(fs.cancelFunction("add2")); // add2 has been canceled
  fs.shutdown();
}

#if defined(__linux__)
namespace {
/**
 * A helper class that forces our pthread_create() wrapper to fail when
 * an PThreadCreateFailure object exists.
 */
class PThreadCreateFailure {
 public:
  PThreadCreateFailure() {
    ++forceFailure_;
  }
  ~PThreadCreateFailure() {
    --forceFailure_;
  }

  static bool shouldFail() {
    return forceFailure_ > 0;
  }

 private:
  static std::atomic<int> forceFailure_;
};

std::atomic<int> PThreadCreateFailure::forceFailure_{0};
} // unnamed namespce

// Replace the system pthread_create() function with our own stub, so we can
// trigger failures in the StartThrows() test.
extern "C" int pthread_create(
    pthread_t* thread,
    const pthread_attr_t* attr,
    void* (*start_routine)(void*),
    void* arg) {
  static const auto realFunction = reinterpret_cast<decltype(&pthread_create)>(
      dlsym(RTLD_NEXT, "pthread_create"));
  // For sanity, make sure we didn't find ourself,
  // since that would cause infinite recursion.
  CHECK_NE(realFunction, pthread_create);

  if (PThreadCreateFailure::shouldFail()) {
    errno = EINVAL;
    return -1;
  }
  return realFunction(thread, attr, start_routine, arg);
}

TEST(FunctionScheduler, StartThrows) {
  FunctionScheduler fs;
  PThreadCreateFailure fail;
  EXPECT_ANY_THROW(fs.start());
  EXPECT_NO_THROW(fs.shutdown());
}
#endif

TEST(FunctionScheduler, cancelAllFunctionsAndWait) {
  int total = 0;
  FunctionScheduler fs;

  fs.addFunction(
      [&] {
        delay(5);
        total += 2;
      },
      testInterval(100),
      "add2");

  fs.start();
  delay(1);
  EXPECT_EQ(0, total); // add2 is still sleeping

  fs.cancelAllFunctionsAndWait();
  EXPECT_EQ(2, total);

  EXPECT_FALSE(fs.cancelFunction("add2")); // add2 has been canceled
  fs.shutdown();
}
