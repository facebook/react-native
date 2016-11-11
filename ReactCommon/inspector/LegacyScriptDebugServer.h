// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <JavaScriptCore/config.h>
#include <JavaScriptCore/ScriptDebugServer.h>

namespace JSC {
class JSGlobalObject;
}

namespace facebook {
namespace react {

class LegacyScriptDebugServer : public Inspector::ScriptDebugServer {
public:
  LegacyScriptDebugServer(JSC::JSGlobalObject& object);

  void addListener(Inspector::ScriptDebugListener* listener);
  void removeListener(Inspector::ScriptDebugListener* listener, bool isBeingDestroyed);

  JSC::JSGlobalObject& globalObject() const { return globalObject_; }

  void recompileAllJSFunctions() override;

private:
  ListenerSet* getListenersForGlobalObject(JSC::JSGlobalObject*) override { return &listeners_; }
  void didPause(JSC::JSGlobalObject*) override { }
  void didContinue(JSC::JSGlobalObject*) override { }
  void runEventLoopWhilePaused() override;
  bool isContentScript(JSC::ExecState*) const override { return false; }

  // NOTE: Currently all exceptions are reported at the API boundary through reportAPIException.
  // Until a time comes where an exception can be caused outside of the API (e.g. setTimeout
  // or some other async operation in a pure JSContext) we can ignore exceptions reported here.
  // TODO: Should we actually ignore them?
  void reportException(JSC::ExecState*, JSC::JSValue) const override { }

  ListenerSet listeners_;
  JSC::JSGlobalObject& globalObject_;
};


}
}
