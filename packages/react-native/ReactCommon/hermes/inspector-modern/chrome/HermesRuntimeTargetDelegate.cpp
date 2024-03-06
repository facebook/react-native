/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HermesRuntimeTargetDelegate.h"
#include "HermesRuntimeAgentDelegate.h"

#include <utility>

using namespace facebook::hermes;

namespace facebook::react::jsinspector_modern {

class HermesRuntimeTargetDelegate::Impl : public RuntimeTargetDelegate {
 public:
  Impl(
      std::shared_ptr<HermesRuntime> hermesRuntime,
      std::shared_ptr<MessageQueueThread> jsMessageQueueThread)
      : Impl(
            hermesRuntime,
            [msgQueueThreadWeak = std::weak_ptr(jsMessageQueueThread),
             runtimeWeak = std::weak_ptr(hermesRuntime)](auto fn) {
              auto msgQueueThread = msgQueueThreadWeak.lock();
              if (!msgQueueThread) {
                return;
              }
              msgQueueThread->runOnQueue([runtimeWeak, fn]() {
                auto runtime = runtimeWeak.lock();
                if (!runtime) {
                  return;
                }
                fn(*runtime);
              });
            }) {}

  Impl(
      std::shared_ptr<HermesRuntime> hermesRuntime,
      RuntimeExecutor runtimeExecutor)
      : runtime_(std::move(hermesRuntime)),
        runtimeExecutor_(std::move(runtimeExecutor)) {}

  // RuntimeTargetDelegate methods

  std::unique_ptr<RuntimeAgentDelegate> createAgentDelegate(
      FrontendChannel frontendChannel,
      SessionState& sessionState,
      std::unique_ptr<RuntimeAgentDelegate::ExportedState>
          previouslyExportedState,
      const ExecutionContextDescription& executionContextDescription) override {
    return std::unique_ptr<RuntimeAgentDelegate>(new HermesRuntimeAgentDelegate(
        frontendChannel,
        sessionState,
        std::move(previouslyExportedState),
        executionContextDescription,
        runtime_,
        runtimeExecutor_));
  }

 private:
  std::shared_ptr<HermesRuntime> runtime_;
  RuntimeExecutor runtimeExecutor_;
};

HermesRuntimeTargetDelegate::HermesRuntimeTargetDelegate(
    std::shared_ptr<HermesRuntime> hermesRuntime,
    std::shared_ptr<MessageQueueThread> jsMessageQueueThread)
    : impl_(std::make_unique<Impl>(
          std::move(hermesRuntime),
          std::move(jsMessageQueueThread))) {}

HermesRuntimeTargetDelegate::HermesRuntimeTargetDelegate(
    std::shared_ptr<HermesRuntime> hermesRuntime,
    RuntimeExecutor runtimeExecutor)
    : impl_(std::make_unique<Impl>(
          std::move(hermesRuntime),
          std::move(runtimeExecutor))) {}

HermesRuntimeTargetDelegate::~HermesRuntimeTargetDelegate() = default;

std::unique_ptr<RuntimeAgentDelegate>
HermesRuntimeTargetDelegate::createAgentDelegate(
    FrontendChannel frontendChannel,
    SessionState& sessionState,
    std::unique_ptr<RuntimeAgentDelegate::ExportedState>
        previouslyExportedState,
    const ExecutionContextDescription& executionContextDescription) {
  return impl_->createAgentDelegate(
      frontendChannel,
      sessionState,
      std::move(previouslyExportedState),
      executionContextDescription);
}

} // namespace facebook::react::jsinspector_modern
