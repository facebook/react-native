/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef RCT_FIT_RM_OLD_RUNTIME

#include <functional>
#include <memory>

#import <React/RCTDefines.h>
#import <React/RCTJavaScriptExecutor.h>
#import <cxxreact/JSExecutor.h>

namespace facebook::react {

class RCTObjcExecutorFactory : public JSExecutorFactory {
 public:
  RCTObjcExecutorFactory(
      id<RCTJavaScriptExecutor> jse,
      RCTJavaScriptCompleteBlock errorBlock);
  std::unique_ptr<JSExecutor> createJSExecutor(
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue) override;

 private:
  id<RCTJavaScriptExecutor> m_jse;
  RCTJavaScriptCompleteBlock m_errorBlock;
};

} // namespace facebook::react

#endif // RCT_FIT_RM_OLD_RUNTIME
