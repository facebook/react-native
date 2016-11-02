// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include "LegacyDispatcher.h"

namespace JSC {
class JSGlobalObject;
}

namespace facebook {
namespace react {

class LegacyInspectorEnvironment;
class ConsoleAgent;

/*
 * An dispatcher that provides the existing agents in JavaScriptCore.
 */
class LegacyAgents : public LegacyDispatcher {
public:
  LegacyAgents(
    JSC::JSGlobalObject& globalObject,
    std::unique_ptr<LegacyInspectorEnvironment> environment,
    ConsoleAgent* consoleAgent);
private:
  std::unique_ptr<LegacyInspectorEnvironment> environment_;
  ConsoleAgent* consoleAgent_;
};

}
}
