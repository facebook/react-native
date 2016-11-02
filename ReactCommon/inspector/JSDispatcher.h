// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include "Dispatcher.h"

#include <JavaScriptCore/config.h>
#include <JavaScriptCore/JSValueRef.h>

#include <jschelpers/Value.h>

#include <unordered_map>

namespace JSC {
class JSGlobalObject;
class JSObject;
class ExecState;
class JSArray;
}

namespace facebook {
namespace react {

class JSDispatcher : public Dispatcher {
public:
  JSDispatcher(JSC::JSGlobalObject& globalObject);

  void onConnect(std::shared_ptr<Channel> channel) override;
  void onDisconnect() override;

  void addAgent(JSC::ExecState* execState, Object agentType);
  void registerAgent(const std::string& name);

  void sendEvent(std::string domain, std::string name, folly::dynamic params);
private:
  std::shared_ptr<Channel> channel_;

  std::unordered_map<std::string, Object> agents_;
};

}
}
