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

#pragma once

#include <folly/Function.h>
#include <folly/Range.h>
#include <folly/hash/Hash.h>
#include <chrono>
#include <condition_variable>
#include <mutex>
#include <thread>
#include <unordered_map>
#include <vector>

namespace folly {

/**
 * Schedules any number of functions to run at various intervals. E.g.,
 *
 *   FunctionScheduler fs;
 *
 *   fs.addFunction([&] { LOG(INFO) << "tick..."; }, seconds(1), "ticker");
 *   fs.addFunction(std::bind(&TestClass::doStuff, this), minutes(5), "stuff");
 *   fs.start();
 *   ........
 *   fs.cancelFunction("ticker");
 *   fs.addFunction([&] { LOG(INFO) << "tock..."; }, minutes(3), "tocker");
 *   ........
 *   fs.shutdown();
 *
 *
 * Note: the class uses only one thread - if you want to use more than one
 *       thread, either use multiple FunctionScheduler objects, or check out
 *       ThreadedRepeatingFunctionRunner.h for a much simpler contract of
 *       "run each function periodically in its own thread".
 *
 * start() schedules the functions, while shutdown() terminates further
 * scheduling.
 */
class FunctionScheduler {
 public:
  FunctionScheduler();
  ~FunctionScheduler();

  /**
   * By default steady is false, meaning schedules may lag behind overtime.
   * This could be due to long running tasks or time drift because of randomness
   * in thread wakeup time.
   * By setting steady to true, FunctionScheduler will attempt to catch up.
   * i.e. more like a cronjob
   *
   * NOTE: it's only safe to set this before calling start()
   */
  void setSteady(bool steady) {
    steady_ = steady;
  }

  /*
   * Parameters to control the function interval.
   *
   * If isPoisson is true, then use std::poisson_distribution to pick the
   * interval between each invocation of the function.
   *
   * If isPoisson os false, then always use fixed the interval specified to
   * addFunction().
   */
  struct LatencyDistribution {
    bool isPoisson;
    double poissonMean;

    LatencyDistribution(bool poisson, double mean)
        : isPoisson(poisson), poissonMean(mean) {}
  };

  /**
   * Adds a new function to the FunctionScheduler.
   *
   * Functions will not be run until start() is called.  When start() is
   * called, each function will be run after its specified startDelay.
   * Functions may also be added after start() has been called, in which case
   * startDelay is still honored.
   *
   * Throws an exception on error.  In particular, each function must have a
   * unique name--two functions cannot be added with the same name.
   */
  void addFunction(
      Function<void()>&& cb,
      std::chrono::milliseconds interval,
      StringPiece nameID = StringPiece(),
      std::chrono::milliseconds startDelay = std::chrono::milliseconds(0));

  /*
   * Add a new function to the FunctionScheduler with a specified
   * LatencyDistribution
   */
  void addFunction(
      Function<void()>&& cb,
      std::chrono::milliseconds interval,
      const LatencyDistribution& latencyDistr,
      StringPiece nameID = StringPiece(),
      std::chrono::milliseconds startDelay = std::chrono::milliseconds(0));

  /**
   * Adds a new function to the FunctionScheduler to run only once.
   */
  void addFunctionOnce(
      Function<void()>&& cb,
      StringPiece nameID = StringPiece(),
      std::chrono::milliseconds startDelay = std::chrono::milliseconds(0));

  /**
   * Add a new function to the FunctionScheduler with the time
   * interval being distributed uniformly within the given interval
   * [minInterval, maxInterval].
   */
  void addFunctionUniformDistribution(
      Function<void()>&& cb,
      std::chrono::milliseconds minInterval,
      std::chrono::milliseconds maxInterval,
      StringPiece nameID,
      std::chrono::milliseconds startDelay);

  /**
   * Add a new function to the FunctionScheduler whose start times are attempted
   * to be scheduled so that they are congruent modulo the interval.
   * Note: The scheduling of the next run time happens right before the function
   * invocation, so the first time a function takes more time than the interval,
   * it will be reinvoked immediately.
   */
  void addFunctionConsistentDelay(
      Function<void()>&& cb,
      std::chrono::milliseconds interval,
      StringPiece nameID = StringPiece(),
      std::chrono::milliseconds startDelay = std::chrono::milliseconds(0));

  /**
   * A type alias for function that is called to determine the time
   * interval for the next scheduled run.
   */
  using IntervalDistributionFunc = Function<std::chrono::milliseconds()>;
  /**
   * A type alias for function that returns the next run time, given the current
   * run time and the current start time.
   */
  using NextRunTimeFunc = Function<std::chrono::steady_clock::time_point(
      std::chrono::steady_clock::time_point,
      std::chrono::steady_clock::time_point)>;

  /**
   * Add a new function to the FunctionScheduler. The scheduling interval
   * is determined by the interval distribution functor, which is called
   * every time the next function execution is scheduled. This allows
   * for supporting custom interval distribution algorithms in addition
   * to built in constant interval; and Poisson and jitter distributions
   * (@see FunctionScheduler::addFunction and
   * @see FunctionScheduler::addFunctionJitterInterval).
   */
  void addFunctionGenericDistribution(
      Function<void()>&& cb,
      IntervalDistributionFunc&& intervalFunc,
      const std::string& nameID,
      const std::string& intervalDescr,
      std::chrono::milliseconds startDelay);

  /**
   * Like addFunctionGenericDistribution, adds a new function to the
   * FunctionScheduler, but the next run time is determined directly by the
   * given functor, rather than by adding an interval.
   */
  void addFunctionGenericNextRunTimeFunctor(
      Function<void()>&& cb,
      NextRunTimeFunc&& fn,
      const std::string& nameID,
      const std::string& intervalDescr,
      std::chrono::milliseconds startDelay);

  /**
   * Cancels the function with the specified name, so it will no longer be run.
   *
   * Returns false if no function exists with the specified name.
   */
  bool cancelFunction(StringPiece nameID);
  bool cancelFunctionAndWait(StringPiece nameID);

  /**
   * All functions registered will be canceled.
   */
  void cancelAllFunctions();
  void cancelAllFunctionsAndWait();

  /**
   * Resets the specified function's timer.
   * When resetFunctionTimer is called, the specified function's timer will
   * be reset with the same parameters it was passed initially, including
   * its startDelay. If the startDelay was 0, the function will be invoked
   * immediately.
   *
   * Returns false if no function exists with the specified name.
   */
  bool resetFunctionTimer(StringPiece nameID);

  /**
   * Starts the scheduler.
   *
   * Returns false if the scheduler was already running.
   */
  bool start();

  /**
   * Stops the FunctionScheduler.
   *
   * It may be restarted later by calling start() again.
   * Returns false if the scheduler was not running.
   */
  bool shutdown();

  /**
   * Set the name of the worker thread.
   */
  void setThreadName(StringPiece threadName);

 private:
  struct RepeatFunc {
    Function<void()> cb;
    NextRunTimeFunc nextRunTimeFunc;
    std::chrono::steady_clock::time_point nextRunTime;
    std::string name;
    std::chrono::milliseconds startDelay;
    std::string intervalDescr;
    bool runOnce;

    RepeatFunc(
        Function<void()>&& cback,
        IntervalDistributionFunc&& intervalFn,
        const std::string& nameID,
        const std::string& intervalDistDescription,
        std::chrono::milliseconds delay,
        bool once)
        : RepeatFunc(
              std::move(cback),
              getNextRunTimeFunc(std::move(intervalFn)),
              nameID,
              intervalDistDescription,
              delay,
              once) {}

    RepeatFunc(
        Function<void()>&& cback,
        NextRunTimeFunc&& nextRunTimeFn,
        const std::string& nameID,
        const std::string& intervalDistDescription,
        std::chrono::milliseconds delay,
        bool once)
        : cb(std::move(cback)),
          nextRunTimeFunc(std::move(nextRunTimeFn)),
          nextRunTime(),
          name(nameID),
          startDelay(delay),
          intervalDescr(intervalDistDescription),
          runOnce(once) {}

    static NextRunTimeFunc getNextRunTimeFunc(
        IntervalDistributionFunc&& intervalFn) {
      return [intervalFn = std::move(intervalFn)](
                 std::chrono::steady_clock::time_point /* curNextRunTime */,
                 std::chrono::steady_clock::time_point curTime) mutable {
        return curTime + intervalFn();
      };
    }

    std::chrono::steady_clock::time_point getNextRunTime() const {
      return nextRunTime;
    }
    void setNextRunTimeStrict(std::chrono::steady_clock::time_point curTime) {
      nextRunTime = nextRunTimeFunc(nextRunTime, curTime);
    }
    void setNextRunTimeSteady() {
      nextRunTime = nextRunTimeFunc(nextRunTime, nextRunTime);
    }
    void resetNextRunTime(std::chrono::steady_clock::time_point curTime) {
      nextRunTime = curTime + startDelay;
    }
    void cancel() {
      // Simply reset cb to an empty function.
      cb = {};
    }
    bool isValid() const {
      return bool(cb);
    }
  };

  struct RunTimeOrder {
    bool operator()(
        const std::unique_ptr<RepeatFunc>& f1,
        const std::unique_ptr<RepeatFunc>& f2) const {
      return f1->getNextRunTime() > f2->getNextRunTime();
    }
  };

  typedef std::vector<std::unique_ptr<RepeatFunc>> FunctionHeap;
  typedef std::unordered_map<StringPiece, RepeatFunc*, Hash> FunctionMap;

  void run();
  void runOneFunction(
      std::unique_lock<std::mutex>& lock,
      std::chrono::steady_clock::time_point now);
  void cancelFunction(const std::unique_lock<std::mutex>& lock, RepeatFunc* it);
  void addFunctionToHeap(
      const std::unique_lock<std::mutex>& lock,
      std::unique_ptr<RepeatFunc> func);

  template <typename RepeatFuncNextRunTimeFunc>
  void addFunctionToHeapChecked(
      Function<void()>&& cb,
      RepeatFuncNextRunTimeFunc&& fn,
      const std::string& nameID,
      const std::string& intervalDescr,
      std::chrono::milliseconds startDelay,
      bool runOnce);

  void addFunctionInternal(
      Function<void()>&& cb,
      NextRunTimeFunc&& fn,
      const std::string& nameID,
      const std::string& intervalDescr,
      std::chrono::milliseconds startDelay,
      bool runOnce);
  void addFunctionInternal(
      Function<void()>&& cb,
      IntervalDistributionFunc&& fn,
      const std::string& nameID,
      const std::string& intervalDescr,
      std::chrono::milliseconds startDelay,
      bool runOnce);

  // Return true if the current function is being canceled
  bool cancelAllFunctionsWithLock(std::unique_lock<std::mutex>& lock);
  bool cancelFunctionWithLock(
      std::unique_lock<std::mutex>& lock,
      StringPiece nameID);

  std::thread thread_;

  // Mutex to protect our member variables.
  std::mutex mutex_;
  bool running_{false};

  // The functions to run.
  // This is a heap, ordered by next run time.
  FunctionHeap functions_;
  FunctionMap functionsMap_;
  RunTimeOrder fnCmp_;

  // The function currently being invoked by the running thread.
  // This is null when the running thread is idle
  RepeatFunc* currentFunction_{nullptr};

  // Condition variable that is signalled whenever a new function is added
  // or when the FunctionScheduler is stopped.
  std::condition_variable runningCondvar_;

  std::string threadName_;
  bool steady_{false};
  bool cancellingCurrentFunction_{false};
};

} // namespace folly
