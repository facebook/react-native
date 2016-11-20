// Copyright 2004-present Facebook. All Rights Reserved.

#include "LegacyDispatcher.h"

#include "Util.h"

#include <wtf/text/CString.h>
#include <JavaScriptCore/JSGlobalObject.h>
#include <JavaScriptCore/JSLock.h>

namespace facebook {
namespace react {

using namespace Inspector;

LegacyDispatcher::FrontendChannel::FrontendChannel(std::shared_ptr<Channel> channel)
: channel_(channel) {}

bool LegacyDispatcher::FrontendChannel::sendMessageToFrontend(const WTF::String& message) {
  channel_->sendMessage(toStdString(message));
  return true;
}

LegacyDispatcher::LegacyDispatcher(JSC::JSGlobalObject& globalObject)
  : globalObject_(globalObject) {}

void LegacyDispatcher::addAgent(std::string domain, std::unique_ptr<InspectorAgentBase> agent) {
  domains_.emplace_back(std::move(domain));
  agents_.append(std::move(agent));
}

void LegacyDispatcher::onConnect(std::shared_ptr<Channel> channel) {
  // TODO: Should perhaps only create this once and then connect each time instead
  frontendChannel_ = std::make_unique<FrontendChannel>(channel);
  dispatcher_.reset(InspectorBackendDispatcher::create(frontendChannel_.get()).leakRef());

  auto messageHandler = [this](std::string message, int, const std::string&, folly::dynamic) {
    JSC::JSLockHolder lock(globalObject_.globalExec());
    dispatcher_->dispatch(message.c_str());
  };
  for (auto& domain : domains_) {
    channel->registerDomain(domain, messageHandler);
  }

  agents_.didCreateFrontendAndBackend(frontendChannel_.get(), dispatcher_.get());
}

void LegacyDispatcher::onDisconnect() {
  // TODO: Perhaps support InspectedTargetDestroyed
  agents_.willDestroyFrontendAndBackend(InspectorDisconnectReason::InspectorDestroyed);
}

}
}
