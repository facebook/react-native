// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <functional>

namespace facebook {
namespace react {

class MessageQueueThread {
 public:
  virtual ~MessageQueueThread() {}
  virtual void runOnQueue(std::function<void()>&&) = 0;
  virtual bool isOnThread() = 0;
  // quitSynchronous() should synchronously ensure that no further tasks will run on the queue.
  virtual void quitSynchronous() = 0;
};

}}
