// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>

#include <JavaScriptCore/config.h>
#include <JavaScriptCore/InspectorRuntimeAgent.h>

namespace JSC {
class JSGlobalObject;
}

namespace facebook {
namespace react {

class LegacyRuntimeAgent : public Inspector::InspectorRuntimeAgent {
public:
  LegacyRuntimeAgent(Inspector::InjectedScriptManager*, JSC::JSGlobalObject&);

  void enable(Inspector::ErrorString* error) override;

  void didCreateFrontendAndBackend(Inspector::InspectorFrontendChannel*, Inspector::InspectorBackendDispatcher*) override;
  void willDestroyFrontendAndBackend(Inspector::InspectorDisconnectReason) override;

  JSC::VM& globalVM() override;
  Inspector::InjectedScript injectedScriptForEval(Inspector::ErrorString* error, const int* executionContextId) override;

  void muteConsole() override { }
  void unmuteConsole() override { }
private:
  Inspector::InspectorFrontendChannel* frontendChannel_;
  // std::unique_ptr<Inspector::InspectorRuntimeFrontendDispatcher> m_frontendDispatcher;
  std::unique_ptr<Inspector::InspectorRuntimeBackendDispatcher> m_backendDispatcher;
  JSC::JSGlobalObject& m_globalObject;
};

}
}
