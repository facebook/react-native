// Copyright 2004-present Facebook. All Rights Reserved.

#include "Agent.h"

#include "Error.h"
#include "Protocol.h"

#include <folly/json.h>

namespace facebook {
namespace react {

void Agent::onConnect(std::shared_ptr<Channel> channel) {
  channel_ = std::move(channel);

  channel_->registerDomain(getDomain(), [this](std::string, int callId, const std::string& method, folly::dynamic args) {
    auto result = handle(method, std::move(args));
    if (result.isNull()) {
      result = folly::dynamic::object;
    }
    auto message = folly::dynamic::object("id", callId)("result", std::move(result));
    channel_->sendMessage(folly::toJson(std::move(message)));
  });
}

void Agent::onDisconnect() {
  channel_.reset();
}

folly::dynamic Agent::handle(const std::string& method, folly::dynamic args) {
  try {
    return methods_.at(method)(std::move(args));
  } catch (const std::out_of_range& e) {
    throw InspectorException(ErrorCode::MethodNotFound, "Unknown method: '" + method + "'");
  }
}

void Agent::registerMethod(std::string name, Method method) {
  methods_.emplace(std::move(name), std::move(method));
}

void Agent::sendEvent(std::string name, folly::dynamic params) {
  if (!channel_) {
    return;
  }
  channel_->sendMessage(Event(getDomain(), std::move(name), std::move(params)));
}

}
}
