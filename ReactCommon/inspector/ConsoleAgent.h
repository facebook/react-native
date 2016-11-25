// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include "Agent.h"

namespace JSC {
class JSGlobalObject;
class ExecState;
class JSArray;
}

namespace Inspector {
class InjectedScriptManager;
}

namespace facebook {
namespace react {

/**
 * Implements the Console agent. Relies on Javascript to call the globally exposed method __inspectorLog
 * to send logging events.
 */
class ConsoleAgent : public Agent {
public:
  ConsoleAgent(JSC::JSGlobalObject& globalObject, Inspector::InjectedScriptManager* injectedScriptManager);

  void log(JSC::ExecState* execState, std::string message);
  void log(JSC::ExecState* execState, std::string level, std::string message, JSC::JSArray* params, size_t framesToSkip);
private:
  bool enabled_{false};
  JSC::JSGlobalObject& globalObject_;
  Inspector::InjectedScriptManager* injectedScriptManager_;

  folly::dynamic convertParams(JSC::ExecState* execState, JSC::JSArray* params);

  std::string getDomain() override {
    return "Console";
  }
};

}
}
