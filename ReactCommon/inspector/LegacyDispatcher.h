// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include "Dispatcher.h"

#include <JavaScriptCore/config.h>
#include <JavaScriptCore/InspectorAgentRegistry.h>
#include <JavaScriptCore/InspectorAgentBase.h>
#include <JavaScriptCore/InspectorFrontendChannel.h>
#include <JavaScriptCore/InspectorBackendDispatcher.h>

#include <memory>
#include <vector>

namespace JSC {
class JSGlobalObject;
}

namespace facebook {
namespace react {

/*
 * An dispatcher that is able to register JavaScriptCore agents that extend the InspectorAgentBase
 * base class.
 */
class LegacyDispatcher : public Dispatcher {
public:
  LegacyDispatcher(JSC::JSGlobalObject& globalObject);
  void addAgent(std::string domain, std::unique_ptr<Inspector::InspectorAgentBase> agent);

  void onConnect(std::shared_ptr<Channel> channel) override;
  void onDisconnect() override;
private:
  class FrontendChannel : public Inspector::InspectorFrontendChannel {
  public:
    FrontendChannel(std::shared_ptr<Channel> channel);
    bool sendMessageToFrontend(const WTF::String& message) override;
  private:
    std::shared_ptr<Channel> channel_;
  };

  JSC::JSGlobalObject& globalObject_;
  std::vector<std::string> domains_;
  Inspector::InspectorAgentRegistry agents_;

  std::unique_ptr<FrontendChannel> frontendChannel_;
  std::unique_ptr<Inspector::InspectorBackendDispatcher> dispatcher_;
};

}
}
