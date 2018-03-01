/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <React/RCTLog.h>
#include <cxxreact/MessageQueueThread.h>

namespace facebook {
namespace react {

// RCTNativeModule arranges for native methods to be invoked on a queue which
// is not the JS thread.  C++ modules don't use RCTNativeModule, so this little
// adapter does the work.

class DispatchMessageQueueThread : public MessageQueueThread {
public:
  DispatchMessageQueueThread(RCTModuleData *moduleData)
    : moduleData_(moduleData) {}

  void runOnQueue(std::function<void()>&& func) override {
    dispatch_queue_t queue = moduleData_.methodQueue;
    dispatch_block_t block = [func=std::move(func)] { func(); };
    RCTAssert(block != nullptr, @"Invalid block generated in call to %@", moduleData_);
    if (queue && block) {
      dispatch_async(queue, block);
    }
  }
  void runOnQueueSync(std::function<void()>&& func) override {
    LOG(FATAL) << "Unsupported operation";
  }
  void quitSynchronous() override {
    LOG(FATAL) << "Unsupported operation";
  }

private:
  RCTModuleData *moduleData_;
};

} }
