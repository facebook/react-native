/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "RCTMessageQueue.h"

namespace facebook {
namespace react {

RCTMessageQueue::RCTMessageQueue(const std::string &name) {
  m_queue = dispatch_queue_create(name.c_str(), NULL);
}

void RCTMessageQueue::runOnQueue(std::function<void()>&& func) {
  if (m_shutdown) {
    return;
  }
  dispatch_async(m_queue, ^{
    if (!m_shutdown) {
      func();
    }
  });
}

void RCTMessageQueue::runOnQueueSync(std::function<void()>&& func) {
  if (m_shutdown) {
    return;
  }
  dispatch_sync(m_queue, ^{
    if (!m_shutdown) {
      func();
    }
  });
}

void RCTMessageQueue::quitSynchronous() {
  m_shutdown = true;
  dispatch_sync(m_queue, ^{});
}

}
}
