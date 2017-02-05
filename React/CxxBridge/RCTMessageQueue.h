/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <string>

#include <cxxreact/MessageQueueThread.h>
#include <dispatch/dispatch.h>

namespace facebook {
namespace react {

class RCTMessageQueue : public MessageQueueThread {
 public:
  explicit RCTMessageQueue(const std::string &name);
  void runOnQueue(std::function<void()>&&) override;
  void runOnQueueSync(std::function<void()>&&) override;
  void quitSynchronous() override;

 private:
  dispatch_queue_t m_queue;
  std::atomic_bool m_shutdown;
};

}
}
