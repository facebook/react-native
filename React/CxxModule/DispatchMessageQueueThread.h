/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

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
    dispatch_async(moduleData_.methodQueue, [func=std::move(func)] {
      func();
    });
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
