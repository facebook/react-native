// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include "ConsoleAgent.h"
#include "LegacyScriptDebugServer.h"

#include <JavaScriptCore/config.h>
#include <JavaScriptCore/InspectorDebuggerAgent.h>
#include <JavaScriptCore/InspectorConsoleAgent.h>

namespace JSC {
class JSGlobalObject;
}

namespace facebook {
namespace react {

class LegacyDebuggerAgent : public Inspector::InspectorDebuggerAgent {
public:
  LegacyDebuggerAgent(Inspector::InjectedScriptManager*, JSC::JSGlobalObject&, ConsoleAgent*);

  virtual LegacyScriptDebugServer& scriptDebugServer() override { return scriptDebugServer_; }

  virtual void startListeningScriptDebugServer() override;
  virtual void stopListeningScriptDebugServer(bool isBeingDestroyed) override;
  virtual Inspector::InjectedScript injectedScriptForEval(Inspector::ErrorString*, const int* executionContextId) override;

  virtual void breakpointActionLog(JSC::ExecState*, const String&) override;

  virtual void muteConsole() override { }
  virtual void unmuteConsole() override { }

private:
  LegacyScriptDebugServer scriptDebugServer_;
  ConsoleAgent* consoleAgent_;
};

}
}
