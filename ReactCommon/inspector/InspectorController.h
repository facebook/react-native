// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include "Dispatcher.h"

#include <memory>
#include <vector>
#include <unordered_map>

namespace JSC {
class JSGlobalObject;
}

namespace facebook {
namespace react {

class ConcreteChannel;
class InspectorAgent;

using Receiver = std::function<void(std::string)>;

class InspectorController {
public:
  InspectorController(JSC::JSGlobalObject& globalObject);
  ~InspectorController();

  JSC::JSGlobalObject& getGlobalObject() const { return globalObject_; }

  void onConnect(Receiver receiver);
  void onMessage(std::string message);
  void onGoingAway();
  void onDisconnect();
private:
  JSC::JSGlobalObject& globalObject_;
  std::shared_ptr<ConcreteChannel> channel_;
  std::vector<std::unique_ptr<Dispatcher>> dispatchers_;
  InspectorAgent* inspectorAgent_;
};

}
}
