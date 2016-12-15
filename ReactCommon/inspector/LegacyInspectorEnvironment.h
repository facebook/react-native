// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <JavaScriptCore/config.h>
#include <JavaScriptCore/InspectorEnvironment.h>

namespace Inspector {
class InjectedScriptManager;
}

namespace facebook {
namespace react {

class LegacyInspectorEnvironment : public Inspector::InspectorEnvironment {
public:
  LegacyInspectorEnvironment();
  ~LegacyInspectorEnvironment();

  Inspector::InjectedScriptManager* injectedScriptManager() const {
    return injectedScriptManager_.get();
  }
private:
  std::unique_ptr<Inspector::InjectedScriptManager> injectedScriptManager_;

  bool developerExtrasEnabled() const override { return true; }
  bool canAccessInspectedScriptState(JSC::ExecState*) const override { return true; }
  Inspector::InspectorFunctionCallHandler functionCallHandler() const override;
  Inspector::InspectorEvaluateHandler evaluateHandler() const override;
  void willCallInjectedScriptFunction(JSC::ExecState*, const WTF::String& scriptName, int scriptLine) override {};
  void didCallInjectedScriptFunction(JSC::ExecState*) override {}
};

}
}
