// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include "MessageQueueThread.h"

#include <atomic>
#include <functional>
#include <chrono>
#include <mutex>
#include <thread>
#include <memory>

namespace facebook {
namespace react {

namespace detail {
template<bool clearOnWait>
class CVFlag {
 public:
  using time_point = std::chrono::steady_clock::time_point;
  void set() {
    std::lock_guard<std::mutex> lk(mtx_);
    flag_ = true;
    cv_.notify_one();
  }

  void wait() {
    std::unique_lock<std::mutex> lk(mtx_);
    cv_.wait(lk, [this] { return flag_; });
    if (clearOnWait) flag_ = false;
  }

  bool wait_until(time_point d) {
    std::unique_lock<std::mutex> lk(mtx_);
    bool res = cv_.wait_until(lk, d, [this] { return flag_; });
    if (clearOnWait && res) flag_ = false;
    return res;
  }

 private:
  bool flag_{false};
  std::condition_variable cv_;
  std::mutex mtx_;
};

using BinarySemaphore = CVFlag<true>;
using EventFlag = CVFlag<false>;
}

class CxxMessageQueue : public MessageQueueThread {
 public:
  CxxMessageQueue();
  virtual ~CxxMessageQueue() override;
  virtual void runOnQueue(std::function<void()>&&) override;
  void runOnQueueDelayed(std::function<void()>&&, uint64_t delayMs);
  // runOnQueueSync and quitSynchronous are dangerous.  They should only be
  // used for initialization and cleanup.
  virtual void runOnQueueSync(std::function<void()>&&) override;
  // Once quitSynchronous() returns, no further work should run on the queue.
  virtual void quitSynchronous() override;

  bool isOnQueue();

  // This returns a function that will actually run the runloop.
  // This runloop will return some time after quitSynchronous (or after this is destroyed).
  //
  // When running the runloop, it is important to ensure that no frames in the
  // current stack have a strong reference to the queue.
  //
  // Only one thread should run the runloop.
  static std::function<void()> getRunLoop(std::shared_ptr<CxxMessageQueue> mq);

  static std::weak_ptr<CxxMessageQueue> current();
 private:
  class QueueRunner;
  std::shared_ptr<QueueRunner> qr_;
};

}}
