/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsinspector-modern/RuntimeTarget.h>

#include "HermesRuntimeTargetDelegate.h"

// If HERMES_ENABLE_DEBUGGER isn't defined, we can't access any Hermes
// CDPHandler headers or types.
#ifdef HERMES_ENABLE_DEBUGGER
#include "HermesRuntimeAgentDelegate.h"

#include <hermes/cdp/CDPDebugAPI.h>

using namespace facebook::hermes::cdp;
#else
#include <jsinspector-modern/FallbackRuntimeTargetDelegate.h>
#endif // HERMES_ENABLE_DEBUGGER

#include <utility>

using namespace facebook::hermes;

namespace facebook::react::jsinspector_modern {

#ifdef HERMES_ENABLE_DEBUGGER
class HermesRuntimeTargetDelegate::Impl final : public RuntimeTargetDelegate {
 public:
  explicit Impl(
      HermesRuntimeTargetDelegate& delegate,
      std::shared_ptr<HermesRuntime> hermesRuntime)
      : delegate_(delegate),
        runtime_(std::move(hermesRuntime)),
        cdpDebugAPI_(CDPDebugAPI::create(*runtime_)) {}

  CDPDebugAPI& getCDPDebugAPI() {
    return *cdpDebugAPI_;
  }

  // RuntimeTargetDelegate methods

  std::unique_ptr<RuntimeAgentDelegate> createAgentDelegate(
      FrontendChannel frontendChannel,
      SessionState& sessionState,
      std::unique_ptr<RuntimeAgentDelegate::ExportedState>
          previouslyExportedState,
      const ExecutionContextDescription& executionContextDescription,
      RuntimeExecutor runtimeExecutor) override {
    return std::unique_ptr<RuntimeAgentDelegate>(new HermesRuntimeAgentDelegate(
        frontendChannel,
        sessionState,
        std::move(previouslyExportedState),
        executionContextDescription,
        *runtime_,
        delegate_,
        std::move(runtimeExecutor)));
  }

  void addConsoleMessage(jsi::Runtime& /*unused*/, ConsoleMessage message)
      override {
    using HermesConsoleMessage = facebook::hermes::cdp::ConsoleMessage;
    using HermesConsoleAPIType = facebook::hermes::cdp::ConsoleAPIType;

    HermesConsoleAPIType type{};
    switch (message.type) {
      case ConsoleAPIType::kLog:
        type = HermesConsoleAPIType::kLog;
        break;
      case ConsoleAPIType::kDebug:
        type = HermesConsoleAPIType::kDebug;
        break;
      case ConsoleAPIType::kInfo:
        type = HermesConsoleAPIType::kInfo;
        break;
      case ConsoleAPIType::kError:
        type = HermesConsoleAPIType::kError;
        break;
      case ConsoleAPIType::kWarning:
        type = HermesConsoleAPIType::kWarning;
        break;
      case ConsoleAPIType::kDir:
        type = HermesConsoleAPIType::kDir;
        break;
      case ConsoleAPIType::kDirXML:
        type = HermesConsoleAPIType::kDirXML;
        break;
      case ConsoleAPIType::kTable:
        type = HermesConsoleAPIType::kTable;
        break;
      case ConsoleAPIType::kTrace:
        type = HermesConsoleAPIType::kTrace;
        break;
      case ConsoleAPIType::kStartGroup:
        type = HermesConsoleAPIType::kStartGroup;
        break;
      case ConsoleAPIType::kStartGroupCollapsed:
        type = HermesConsoleAPIType::kStartGroupCollapsed;
        break;
      case ConsoleAPIType::kEndGroup:
        type = HermesConsoleAPIType::kEndGroup;
        break;
      case ConsoleAPIType::kClear:
        type = HermesConsoleAPIType::kClear;
        break;
      case ConsoleAPIType::kAssert:
        type = HermesConsoleAPIType::kAssert;
        break;
      case ConsoleAPIType::kTimeEnd:
        type = HermesConsoleAPIType::kTimeEnd;
        break;
      case ConsoleAPIType::kCount:
        type = HermesConsoleAPIType::kCount;
        break;
      default:
        throw std::logic_error{"Unknown console message type"};
    }
    cdpDebugAPI_->addConsoleMessage(
        HermesConsoleMessage{message.timestamp, type, std::move(message.args)});
  }

  bool supportsConsole() const override {
    return true;
  }

 private:
  HermesRuntimeTargetDelegate& delegate_;
  std::shared_ptr<HermesRuntime> runtime_;
  const std::unique_ptr<CDPDebugAPI> cdpDebugAPI_;
};

#else

/**
 * A stub for HermesRuntimeTargetDelegate when Hermes is compiled without
 * debugging support.
 */
class HermesRuntimeTargetDelegate::Impl final
    : public FallbackRuntimeTargetDelegate {
 public:
  explicit Impl(
      HermesRuntimeTargetDelegate&,
      std::shared_ptr<HermesRuntime> hermesRuntime)
      : FallbackRuntimeTargetDelegate{hermesRuntime->description()} {}
};

#endif // HERMES_ENABLE_DEBUGGER

HermesRuntimeTargetDelegate::HermesRuntimeTargetDelegate(
    std::shared_ptr<HermesRuntime> hermesRuntime)
    : impl_(std::make_unique<Impl>(*this, std::move(hermesRuntime))) {}

HermesRuntimeTargetDelegate::~HermesRuntimeTargetDelegate() = default;

std::unique_ptr<RuntimeAgentDelegate>
HermesRuntimeTargetDelegate::createAgentDelegate(
    FrontendChannel frontendChannel,
    SessionState& sessionState,
    std::unique_ptr<RuntimeAgentDelegate::ExportedState>
        previouslyExportedState,
    const ExecutionContextDescription& executionContextDescription,
    RuntimeExecutor runtimeExecutor) {
  return impl_->createAgentDelegate(
      frontendChannel,
      sessionState,
      std::move(previouslyExportedState),
      executionContextDescription,
      std::move(runtimeExecutor));
}

void HermesRuntimeTargetDelegate::addConsoleMessage(
    jsi::Runtime& runtime,
    ConsoleMessage message) {
  impl_->addConsoleMessage(runtime, std::move(message));
}

bool HermesRuntimeTargetDelegate::supportsConsole() const {
  return impl_->supportsConsole();
}

#ifdef HERMES_ENABLE_DEBUGGER
CDPDebugAPI& HermesRuntimeTargetDelegate::getCDPDebugAPI() {
  return impl_->getCDPDebugAPI();
}
#endif

} // namespace facebook::react::jsinspector_modern
