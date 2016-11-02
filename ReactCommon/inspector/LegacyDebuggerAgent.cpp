// Copyright 2004-present Facebook. All Rights Reserved.

#include "LegacyDebuggerAgent.h"

#include "Util.h"

#include <JavaScriptCore/InjectedScript.h>
#include <JavaScriptCore/InjectedScriptManager.h>
#include <JavaScriptCore/JSGlobalObject.h>

namespace facebook {
namespace react {

using namespace Inspector;

LegacyDebuggerAgent::LegacyDebuggerAgent(InjectedScriptManager* injectedScriptManager, JSC::JSGlobalObject& globalObject, ConsoleAgent* consoleAgent)
  : InspectorDebuggerAgent(injectedScriptManager)
  , scriptDebugServer_(globalObject)
  , consoleAgent_(consoleAgent) {}

void LegacyDebuggerAgent::startListeningScriptDebugServer() {
  scriptDebugServer().addListener(this);
}

void LegacyDebuggerAgent::stopListeningScriptDebugServer(bool isBeingDestroyed) {
  scriptDebugServer().removeListener(this, isBeingDestroyed);
}

InjectedScript LegacyDebuggerAgent::injectedScriptForEval(ErrorString* error, const int* executionContextId) {
  if (executionContextId) {
    *error = ASCIILiteral("Execution context id is not supported for JSContext inspection as there is only one execution context.");
    return InjectedScript();
  }

  JSC::ExecState* exec = scriptDebugServer_.globalObject().globalExec();
  return injectedScriptManager()->injectedScriptFor(exec);
}

void LegacyDebuggerAgent::breakpointActionLog(JSC::ExecState* exec, const String& message) {
  consoleAgent_->log(exec, toStdString(message));
}

}
}
