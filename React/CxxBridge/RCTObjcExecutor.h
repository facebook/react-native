/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <functional>
#include <memory>

#import <React/RCTDefines.h>
#import <React/RCTJavaScriptExecutor.h>
#include <cxxreact/Executor.h>

namespace facebook {
namespace react {

class RCTObjcExecutorFactory : public JSExecutorFactory {
public:
  RCTObjcExecutorFactory(id<RCTJavaScriptExecutor> jse, RCTJavaScriptCompleteBlock errorBlock);
  std::unique_ptr<JSExecutor> createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue) override;

private:
  id<RCTJavaScriptExecutor> m_jse;
  RCTJavaScriptCompleteBlock m_errorBlock;
};

}
}
