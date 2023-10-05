/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <cxxreact/MessageQueueThread.h>
#import <hermes/Public/CrashManager.h>
#import <jsi/jsi.h>
#import <react/runtime/JSEngineInstance.h>
#import <react/runtime/hermes/HermesInstance.h>

namespace facebook {
namespace react {
using CrashManagerProvider =
    std::function<std::shared_ptr<::hermes::vm::CrashManager>()>;

// ObjC++ wrapper for HermesInstance.cpp
class RCTHermesInstance : public JSEngineInstance {
 public:
  RCTHermesInstance();
  RCTHermesInstance(
      std::shared_ptr<const ReactNativeConfig> reactNativeConfig,
      CrashManagerProvider crashManagerProvider);

  std::unique_ptr<jsi::Runtime> createJSRuntime(
      std::shared_ptr<MessageQueueThread> msgQueueThread) noexcept override;

  ~RCTHermesInstance(){};

 private:
  std::shared_ptr<const ReactNativeConfig> _reactNativeConfig;
  CrashManagerProvider _crashManagerProvider;
  std::unique_ptr<HermesInstance> _hermesInstance;
};
} // namespace react
} // namespace facebook
