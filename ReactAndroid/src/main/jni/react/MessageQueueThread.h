// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <condition_variable>
#include <functional>
#include <mutex>

namespace facebook {
namespace react {

class MessageQueueThread {
 public:
  virtual ~MessageQueueThread() {}
  virtual void runOnQueue(std::function<void()>&&) = 0;
  virtual bool isOnThread() = 0;
  // quitSynchronous() should synchronously ensure that no further tasks will run on the queue.
  virtual void quitSynchronous() = 0;

  void runOnQueueSync(std::function<void()>&& runnable) {
    std::mutex signalMutex;
    std::condition_variable signalCv;
    bool runnableComplete = false;

    runOnQueue([&] () mutable {
      std::lock_guard<std::mutex> lock(signalMutex);

      runnable();
      runnableComplete = true;

      signalCv.notify_one();
    });

    std::unique_lock<std::mutex> lock(signalMutex);
    signalCv.wait(lock, [&runnableComplete] { return runnableComplete; });
  }
};

}}
