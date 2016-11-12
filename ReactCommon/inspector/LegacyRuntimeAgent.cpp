// Copyright 2004-present Facebook. All Rights Reserved.

#include "LegacyRuntimeAgent.h"

#include <JavaScriptCore/InjectedScript.h>
#include <JavaScriptCore/InjectedScriptManager.h>
#include <JavaScriptCore/JSGlobalObject.h>

namespace facebook {
namespace react {

using namespace Inspector;

LegacyRuntimeAgent::LegacyRuntimeAgent(InjectedScriptManager* injectedScriptManager, JSC::JSGlobalObject& globalObject)
  : InspectorRuntimeAgent(injectedScriptManager)
  , m_globalObject(globalObject) {}

void LegacyRuntimeAgent::didCreateFrontendAndBackend(InspectorFrontendChannel* frontendChannel, InspectorBackendDispatcher* backendDispatcher) {
  // m_frontendDispatcher = folly::make_unique<InspectorRuntimeFrontendDispatcher>(frontendChannel);
  frontendChannel_ = frontendChannel;
  m_backendDispatcher.reset(InspectorRuntimeBackendDispatcher::create(backendDispatcher, this).leakRef());
}

void LegacyRuntimeAgent::enable(ErrorString* error) {
  InspectorRuntimeAgent::enable(error);

  auto contextObject = InspectorObject::create();
  contextObject->setNumber(ASCIILiteral("id"), 1);
  contextObject->setBoolean(ASCIILiteral("isDefault"), true);
  contextObject->setBoolean(ASCIILiteral("isPageContext"), true);
  contextObject->setString(ASCIILiteral("origin"), ASCIILiteral(""));
  contextObject->setString(ASCIILiteral("name"), ASCIILiteral("React Native"));

  auto jsonMessage = InspectorObject::create();
  jsonMessage->setString(ASCIILiteral("method"), ASCIILiteral("Runtime.executionContextCreated"));
  auto paramsObject = InspectorObject::create();
  paramsObject->setValue(ASCIILiteral("context"), contextObject);
  jsonMessage->setObject(ASCIILiteral("params"), paramsObject);

  frontendChannel_->sendMessageToFrontend(jsonMessage->toJSONString());
}

void LegacyRuntimeAgent::willDestroyFrontendAndBackend(InspectorDisconnectReason) {
  frontendChannel_ = nullptr;
  m_backendDispatcher = nullptr;
}

JSC::VM& LegacyRuntimeAgent::globalVM() {
  return m_globalObject.vm();
}

InjectedScript LegacyRuntimeAgent::injectedScriptForEval(ErrorString* error, const int* executionContextId) {
  JSC::ExecState* scriptState = m_globalObject.globalExec();
  InjectedScript injectedScript = injectedScriptManager()->injectedScriptFor(scriptState);
  if (injectedScript.hasNoValue()) {
    *error = ASCIILiteral("Internal error: main world execution context not found.");
  }

  return injectedScript;
}

}
}
