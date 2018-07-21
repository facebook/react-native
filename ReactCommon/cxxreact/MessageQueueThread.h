// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

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
  // runOnQueueSync and quitSynchronous are dangerous.  They should only be
  // used for initialization and cleanup.
  virtual void runOnQueueSync(std::function<void()>&&) = 0;
  // Once quitSynchronous() returns, no further work should run on the queue.
  virtual void quitSynchronous() = 0;
};

}}
