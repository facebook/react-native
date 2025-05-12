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
#import <react/runtime/JSRuntimeFactory.h>
#import <react/runtime/hermes/JermesInstance.h>

namespace facebook::react {

using CrashManagerProvider =
    std::function<std::shared_ptr<::hermes::vm::CrashManager>()>;

// ObjC++ wrapper for HermesInstance.cpp
class RCTJermesInstance : public JSRuntimeFactory {
 public:
  RCTJermesInstance();
  RCTJermesInstance(CrashManagerProvider crashManagerProvider);
  RCTJermesInstance(
      CrashManagerProvider crashManagerProvider,
      bool allocInOldGenBeforeTTI);

  std::unique_ptr<JSRuntime> createJSRuntime(
      std::shared_ptr<MessageQueueThread> msgQueueThread) noexcept override;

  ~RCTJermesInstance() override{};

 private:
  CrashManagerProvider _crashManagerProvider;
  std::unique_ptr<JermesInstance> _hermesInstance;
  bool _allocInOldGenBeforeTTI;
};

} // namespace facebook::react
