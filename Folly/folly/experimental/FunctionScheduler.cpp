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

#include <folly/experimental/FunctionScheduler.h>

#include <random>

#include <folly/Conv.h>
#include <folly/Random.h>
#include <folly/String.h>
#include <folly/system/ThreadName.h>

using std::chrono::milliseconds;
using std::chrono::steady_clock;

namespace folly {

namespace {

struct ConsistentDelayFunctor {
  const milliseconds constInterval;

  explicit ConsistentDelayFunctor(milliseconds interval)
      : constInterval(interval) {
    if (interval < milliseconds::zero()) {
      throw std::invalid_argument(
          "FunctionScheduler: "
          "time interval must be non-negative");
    }
  }

  steady_clock::time_point operator()(
      steady_clock::time_point curNextRunTime,
      steady_clock::time_point curTime) const {
    auto intervalsPassed = (curTime - curNextRunTime) / constInterval;
    return (intervalsPassed + 1) * constInterval + curNextRunTime;
  }
};

struct ConstIntervalFunctor {
  const milliseconds constInterval;

  explicit ConstIntervalFunctor(milliseconds interval)
      : constInterval(interval) {
    if (interval < milliseconds::zero()) {
      throw std::invalid_argument(
          "FunctionScheduler: "
          "time interval must be non-negative");
    }
  }

  milliseconds operator()() const {
    return constInterval;
  }
};

struct PoissonDistributionFunctor {
  std::default_random_engine generator;
  std::poisson_distribution<int> poissonRandom;

  explicit PoissonDistributionFunctor(double meanPoissonMs)
      : poissonRandom(meanPoissonMs) {
    if (meanPoissonMs < 0.0) {
      throw std::invalid_argument(
          "FunctionScheduler: "
          "Poisson mean interval must be non-negative");
    }
  }

  milliseconds operator()() {
    return milliseconds(poissonRandom(generator));
  }
};

struct UniformDistributionFunctor {
  std::default_random_engine generator;
  std::uniform_int_distribution<milliseconds::rep> dist;

  UniformDistributionFunctor(milliseconds minInterval, milliseconds maxInterval)
      : generator(Random::rand32()),
        dist(minInterval.count(), maxInterval.count()) {
    if (minInterval > maxInterval) {
      throw std::invalid_argument(
          "FunctionScheduler: "
          "min time interval must be less or equal than max interval");
    }
    if (minInterval < milliseconds::zero()) {
      throw std::invalid_argument(
          "FunctionScheduler: "
          "time interval must be non-negative");
    }
  }

  milliseconds operator()() {
    return milliseconds(dist(generator));
  }
};

} // namespace

FunctionScheduler::FunctionScheduler() {}

FunctionScheduler::~FunctionScheduler() {
  // make sure to stop the thread (if running)
  shutdown();
}

void FunctionScheduler::addFunction(
    Function<void()>&& cb,
    milliseconds interval,
    StringPiece nameID,
    milliseconds startDelay) {
  addFunctionInternal(
      std::move(cb),
      ConstIntervalFunctor(interval),
      nameID.str(),
      to<std::string>(interval.count(), "ms"),
      startDelay,
      false /*runOnce*/);
}

void FunctionScheduler::addFunction(
    Function<void()>&& cb,
    milliseconds interval,
    const LatencyDistribution& latencyDistr,
    StringPiece nameID,
    milliseconds startDelay) {
  if (latencyDistr.isPoisson) {
    addFunctionInternal(
        std::move(cb),
        PoissonDistributionFunctor(latencyDistr.poissonMean),
        nameID.str(),
        to<std::string>(latencyDistr.poissonMean, "ms (Poisson mean)"),
        startDelay,
        false /*runOnce*/);
  } else {
    addFunction(std::move(cb), interval, nameID, startDelay);
  }
}

void FunctionScheduler::addFunctionOnce(
    Function<void()>&& cb,
    StringPiece nameID,
    milliseconds startDelay) {
  addFunctionInternal(
      std::move(cb),
      ConstIntervalFunctor(milliseconds::zero()),
      nameID.str(),
      "once",
      startDelay,
      true /*runOnce*/);
}

void FunctionScheduler::addFunctionUniformDistribution(
    Function<void()>&& cb,
    milliseconds minInterval,
    milliseconds maxInterval,
    StringPiece nameID,
    milliseconds startDelay) {
  addFunctionInternal(
      std::move(cb),
      UniformDistributionFunctor(minInterval, maxInterval),
      nameID.str(),
      to<std::string>(
          "[", minInterval.count(), " , ", maxInterval.count(), "] ms"),
      startDelay,
      false /*runOnce*/);
}

void FunctionScheduler::addFunctionConsistentDelay(
    Function<void()>&& cb,
    milliseconds interval,
    StringPiece nameID,
    milliseconds startDelay) {
  addFunctionInternal(
      std::move(cb),
      ConsistentDelayFunctor(interval),
      nameID.str(),
      to<std::string>(interval.count(), "ms"),
      startDelay,
      false /*runOnce*/);
}

void FunctionScheduler::addFunctionGenericDistribution(
    Function<void()>&& cb,
    IntervalDistributionFunc&& intervalFunc,
    const std::string& nameID,
    const std::string& intervalDescr,
    milliseconds startDelay) {
  addFunctionInternal(
      std::move(cb),
      std::move(intervalFunc),
      nameID,
      intervalDescr,
      startDelay,
      false /*runOnce*/);
}

void FunctionScheduler::addFunctionGenericNextRunTimeFunctor(
    Function<void()>&& cb,
    NextRunTimeFunc&& fn,
    const std::string& nameID,
    const std::string& intervalDescr,
    milliseconds startDelay) {
  addFunctionInternal(
      std::move(cb),
      std::move(fn),
      nameID,
      intervalDescr,
      startDelay,
      false /*runOnce*/);
}

template <typename RepeatFuncNextRunTimeFunc>
void FunctionScheduler::addFunctionToHeapChecked(
    Function<void()>&& cb,
    RepeatFuncNextRunTimeFunc&& fn,
    const std::string& nameID,
    const std::string& intervalDescr,
    milliseconds startDelay,
    bool runOnce) {
  if (!cb) {
    throw std::invalid_argument(
        "FunctionScheduler: Scheduled function must be set");
  }
  if (!fn) {
    throw std::invalid_argument(
        "FunctionScheduler: "
        "interval distribution or next run time function must be set");
  }
  if (startDelay < milliseconds::zero()) {
    throw std::invalid_argument(
        "FunctionScheduler: start delay must be non-negative");
  }

  std::unique_lock<std::mutex> l(mutex_);
  auto it = functionsMap_.find(nameID);
  // check if the nameID is unique
  if (it != functionsMap_.end() && it->second->isValid()) {
    throw std::invalid_argument(to<std::string>(
        "FunctionScheduler: a function named \"", nameID, "\" already exists"));
  }

  if (currentFunction_ && currentFunction_->name == nameID) {
    throw std::invalid_argument(to<std::string>(
        "FunctionScheduler: a function named \"", nameID, "\" already exists"));
  }

  addFunctionToHeap(
      l,
      std::make_unique<RepeatFunc>(
          std::move(cb),
          std::forward<RepeatFuncNextRunTimeFunc>(fn),
          nameID,
          intervalDescr,
          startDelay,
          runOnce));
}

void FunctionScheduler::addFunctionInternal(
    Function<void()>&& cb,
    NextRunTimeFunc&& fn,
    const std::string& nameID,
    const std::string& intervalDescr,
    milliseconds startDelay,
    bool runOnce) {
  return addFunctionToHeapChecked(
      std::move(cb), std::move(fn), nameID, intervalDescr, startDelay, runOnce);
}

void FunctionScheduler::addFunctionInternal(
    Function<void()>&& cb,
    IntervalDistributionFunc&& fn,
    const std::string& nameID,
    const std::string& intervalDescr,
    milliseconds startDelay,
    bool runOnce) {
  return addFunctionToHeapChecked(
      std::move(cb), std::move(fn), nameID, intervalDescr, startDelay, runOnce);
}

bool FunctionScheduler::cancelFunctionWithLock(
    std::unique_lock<std::mutex>& lock,
    StringPiece nameID) {
  CHECK_EQ(lock.owns_lock(), true);
  if (currentFunction_ && currentFunction_->name == nameID) {
    functionsMap_.erase(currentFunction_->name);
    // This function is currently being run. Clear currentFunction_
    // The running thread will see this and won't reschedule the function.
    currentFunction_ = nullptr;
    cancellingCurrentFunction_ = true;
    return true;
  }
  return false;
}

bool FunctionScheduler::cancelFunction(StringPiece nameID) {
  std::unique_lock<std::mutex> l(mutex_);
  if (cancelFunctionWithLock(l, nameID)) {
    return true;
  }
  auto it = functionsMap_.find(nameID);
  if (it != functionsMap_.end() && it->second->isValid()) {
    cancelFunction(l, it->second);
    return true;
  }

  return false;
}

bool FunctionScheduler::cancelFunctionAndWait(StringPiece nameID) {
  std::unique_lock<std::mutex> l(mutex_);

  if (cancelFunctionWithLock(l, nameID)) {
    runningCondvar_.wait(l, [this]() { return !cancellingCurrentFunction_; });
    return true;
  }

  auto it = functionsMap_.find(nameID);
  if (it != functionsMap_.end() && it->second->isValid()) {
    cancelFunction(l, it->second);
    return true;
  }
  return false;
}

void FunctionScheduler::cancelFunction(
    const std::unique_lock<std::mutex>& l,
    RepeatFunc* it) {
  // This function should only be called with mutex_ already locked.
  DCHECK(l.mutex() == &mutex_);
  DCHECK(l.owns_lock());
  functionsMap_.erase(it->name);
  it->cancel();
}

bool FunctionScheduler::cancelAllFunctionsWithLock(
    std::unique_lock<std::mutex>& lock) {
  CHECK_EQ(lock.owns_lock(), true);
  functions_.clear();
  functionsMap_.clear();
  if (currentFunction_) {
    cancellingCurrentFunction_ = true;
  }
  currentFunction_ = nullptr;
  return cancellingCurrentFunction_;
}

void FunctionScheduler::cancelAllFunctions() {
  std::unique_lock<std::mutex> l(mutex_);
  cancelAllFunctionsWithLock(l);
}

void FunctionScheduler::cancelAllFunctionsAndWait() {
  std::unique_lock<std::mutex> l(mutex_);
  if (cancelAllFunctionsWithLock(l)) {
    runningCondvar_.wait(l, [this]() { return !cancellingCurrentFunction_; });
  }
}

bool FunctionScheduler::resetFunctionTimer(StringPiece nameID) {
  std::unique_lock<std::mutex> l(mutex_);
  if (currentFunction_ && currentFunction_->name == nameID) {
    if (cancellingCurrentFunction_ || currentFunction_->runOnce) {
      return false;
    }
    currentFunction_->resetNextRunTime(steady_clock::now());
    return true;
  }

  // Since __adjust_heap() isn't a part of the standard API, there's no way to
  // fix the heap ordering if we adjust the key (nextRunTime) for the existing
  // RepeatFunc. Instead, we just cancel it and add an identical object.
  auto it = functionsMap_.find(nameID);
  if (it != functionsMap_.end() && it->second->isValid()) {
    if (running_) {
      it->second->resetNextRunTime(steady_clock::now());
      std::make_heap(functions_.begin(), functions_.end(), fnCmp_);
      runningCondvar_.notify_one();
    }
    return true;
  }
  return false;
}

bool FunctionScheduler::start() {
  std::unique_lock<std::mutex> l(mutex_);
  if (running_) {
    return false;
  }

  VLOG(1) << "Starting FunctionScheduler with " << functions_.size()
          << " functions.";
  auto now = steady_clock::now();
  // Reset the next run time. for all functions.
  // note: this is needed since one can shutdown() and start() again
  for (const auto& f : functions_) {
    f->resetNextRunTime(now);
    VLOG(1) << "   - func: " << (f->name.empty() ? "(anon)" : f->name.c_str())
            << ", period = " << f->intervalDescr
            << ", delay = " << f->startDelay.count() << "ms";
  }
  std::make_heap(functions_.begin(), functions_.end(), fnCmp_);

  thread_ = std::thread([&] { this->run(); });
  running_ = true;

  return true;
}

bool FunctionScheduler::shutdown() {
  {
    std::lock_guard<std::mutex> g(mutex_);
    if (!running_) {
      return false;
    }

    running_ = false;
    runningCondvar_.notify_one();
  }
  thread_.join();
  return true;
}

void FunctionScheduler::run() {
  std::unique_lock<std::mutex> lock(mutex_);

  if (!threadName_.empty()) {
    folly::setThreadName(threadName_);
  }

  while (running_) {
    // If we have nothing to run, wait until a function is added or until we
    // are stopped.
    if (functions_.empty()) {
      runningCondvar_.wait(lock);
      continue;
    }

    auto now = steady_clock::now();

    // Move the next function to run to the end of functions_
    std::pop_heap(functions_.begin(), functions_.end(), fnCmp_);

    // Check to see if the function was cancelled.
    // If so, just remove it and continue around the loop.
    if (!functions_.back()->isValid()) {
      functions_.pop_back();
      continue;
    }

    auto sleepTime = functions_.back()->getNextRunTime() - now;
    if (sleepTime < milliseconds::zero()) {
      // We need to run this function now
      runOneFunction(lock, now);
      runningCondvar_.notify_all();
    } else {
      // Re-add the function to the heap, and wait until we actually
      // need to run it.
      std::push_heap(functions_.begin(), functions_.end(), fnCmp_);
      runningCondvar_.wait_for(lock, sleepTime);
    }
  }
}

void FunctionScheduler::runOneFunction(
    std::unique_lock<std::mutex>& lock,
    steady_clock::time_point now) {
  DCHECK(lock.mutex() == &mutex_);
  DCHECK(lock.owns_lock());

  // The function to run will be at the end of functions_ already.
  //
  // Fully remove it from functions_ now.
  // We need to release mutex_ while we invoke this function, and we need to
  // maintain the heap property on functions_ while mutex_ is unlocked.
  auto func = std::move(functions_.back());
  functions_.pop_back();
  if (!func->cb) {
    VLOG(5) << func->name << "function has been canceled while waiting";
    return;
  }
  currentFunction_ = func.get();
  // Update the function's next run time.
  if (steady_) {
    // This allows scheduler to catch up
    func->setNextRunTimeSteady();
  } else {
    // Note that we set nextRunTime based on the current time where we started
    // the function call, rather than the time when the function finishes.
    // This ensures that we call the function once every time interval, as
    // opposed to waiting time interval seconds between calls.  (These can be
    // different if the function takes a significant amount of time to run.)
    func->setNextRunTimeStrict(now);
  }

  // Release the lock while we invoke the user's function
  lock.unlock();

  // Invoke the function
  try {
    VLOG(5) << "Now running " << func->name;
    func->cb();
  } catch (const std::exception& ex) {
    LOG(ERROR) << "Error running the scheduled function <" << func->name
               << ">: " << exceptionStr(ex);
  }

  // Re-acquire the lock
  lock.lock();

  if (!currentFunction_) {
    // The function was cancelled while we were running it.
    // We shouldn't reschedule it;
    cancellingCurrentFunction_ = false;
    return;
  }
  if (currentFunction_->runOnce) {
    // Don't reschedule if the function only needed to run once.
    functionsMap_.erase(currentFunction_->name);
    currentFunction_ = nullptr;
    return;
  }

  // Re-insert the function into our functions_ heap.
  // We only maintain the heap property while running_ is set.  (running_ may
  // have been cleared while we were invoking the user's function.)
  functions_.push_back(std::move(func));

  // Clear currentFunction_
  currentFunction_ = nullptr;

  if (running_) {
    std::push_heap(functions_.begin(), functions_.end(), fnCmp_);
  }
}

void FunctionScheduler::addFunctionToHeap(
    const std::unique_lock<std::mutex>& lock,
    std::unique_ptr<RepeatFunc> func) {
  // This function should only be called with mutex_ already locked.
  DCHECK(lock.mutex() == &mutex_);
  DCHECK(lock.owns_lock());

  functions_.push_back(std::move(func));
  functionsMap_[functions_.back()->name] = functions_.back().get();
  if (running_) {
    functions_.back()->resetNextRunTime(steady_clock::now());
    std::push_heap(functions_.begin(), functions_.end(), fnCmp_);
    // Signal the running thread to wake up and see if it needs to change
    // its current scheduling decision.
    runningCondvar_.notify_one();
  }
}

void FunctionScheduler::setThreadName(StringPiece threadName) {
  std::unique_lock<std::mutex> l(mutex_);
  threadName_ = threadName.str();
}

} // namespace folly
