// Copyright 2004-present Facebook. All Rights Reserved.

#include "LegacyAgents.h"

#include "LegacyInspectorEnvironment.h"
#include "LegacyRuntimeAgent.h"
#include "LegacyDebuggerAgent.h"

#include <JavaScriptCore/config.h>
#include <JavaScriptCore/JSGlobalObject.h>
#include <folly/Memory.h>

namespace facebook {
namespace react {

using namespace Inspector;

LegacyAgents::LegacyAgents(
  JSC::JSGlobalObject& globalObject,
  std::unique_ptr<LegacyInspectorEnvironment> environment,
  ConsoleAgent* consoleAgent)
    : LegacyDispatcher(globalObject)
    , environment_(std::move(environment)) {
  auto injectedScriptManager = environment_->injectedScriptManager();
  auto runtimeAgent = folly::make_unique<LegacyRuntimeAgent>(injectedScriptManager, globalObject);
  auto debuggerAgent = folly::make_unique<LegacyDebuggerAgent>(injectedScriptManager, globalObject, consoleAgent);

  runtimeAgent->setScriptDebugServer(&debuggerAgent->scriptDebugServer());

  addAgent("Runtime", std::move(runtimeAgent));
  addAgent("Debugger", std::move(debuggerAgent));
}

}
}
