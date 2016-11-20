// Copyright 2004-present Facebook. All Rights Reserved.

#include "LegacyScriptDebugServer.h"

#include <JavaScriptCore/JSGlobalObject.h>

namespace facebook {
namespace react {

using namespace Inspector;

LegacyScriptDebugServer::LegacyScriptDebugServer(JSC::JSGlobalObject& globalObject)
  : Inspector::ScriptDebugServer(false)
  , globalObject_(globalObject) {}

void LegacyScriptDebugServer::addListener(ScriptDebugListener* listener)
{
  if (!listener) {
    return;
  }

  bool wasEmpty = listeners_.isEmpty();
  listeners_.add(listener);

  // First listener. Attach the debugger to the JSGlobalObject.
  if (wasEmpty) {
    attach(&globalObject_);
    recompileAllJSFunctions();
  }
}

void LegacyScriptDebugServer::removeListener(ScriptDebugListener* listener, bool isBeingDestroyed) {
  if (!listener) {
    return;
  }

  listeners_.remove(listener);

  // Last listener. Detach the debugger from the JSGlobalObject.
  if (listeners_.isEmpty()) {
    detach(&globalObject_, isBeingDestroyed ? Debugger::GlobalObjectIsDestructing : Debugger::TerminatingDebuggingSession);
    if (!isBeingDestroyed) {
      recompileAllJSFunctions();
    }
  }
}

void LegacyScriptDebugServer::recompileAllJSFunctions() {
  JSC::Debugger::recompileAllJSFunctions(&globalObject_.vm());
}

void LegacyScriptDebugServer::runEventLoopWhilePaused() {
  // Drop all locks so another thread can work in the VM while we are nested.
  JSC::JSLock::DropAllLocks dropAllLocks(&globalObject_.vm());

  // Spinning here is our best option, we could override the method
  // notifyDoneProcessingDebuggerEvents but it's marked as final :(
  while (!m_doneProcessingDebuggerEvents) {
    usleep(10 * 1000);
  }
}

}
}
