// Copyright 2004-present Facebook. All Rights Reserved.

#include "InspectorController.h"

#include "Error.h"
#include "Agent.h"
#include "LegacyInspectorEnvironment.h"
#include "InspectorAgent.h"
#include "PageAgent.h"
#include "ConsoleAgent.h"
#include "JSDispatcher.h"
#include "LegacyAgents.h"

#include <folly/Memory.h>
#include <folly/Conv.h>
#include <folly/json.h>

namespace facebook {
namespace react {

class ConcreteChannel : public Channel {
public:
  ConcreteChannel(Receiver receiver)
  : receiver_(std::move(receiver)) {}

  void sendMessage(std::string message) override {
    receiver_(std::move(message));
  }

  void registerDomain(std::string domain, MessageHandler handler) override {
    domains_.emplace(std::move(domain), std::move(handler));
  }

  std::unordered_map<std::string, MessageHandler>& getDomains() {
    return domains_;
  }
private:
  std::unordered_map<std::string, MessageHandler> domains_;
  Receiver receiver_;
};

class MessageRouter {
public:
  MessageRouter(ConcreteChannel* channel)
  : channel_(channel) {
    CHECK(channel_) << "Channel is null";
  }

  /*
   * Messages are in JSON, formatted like:
   * {
   *   "id": 1,
   *   "method": "Debugger.removeBreakpoint",
   *   "params": { "removeBreakpoint": "xyz" }
   * }
   */
  void route(std::string message) {
    try {
      auto json = parseJson(message);
      auto callId = getCallId(json);
      receive(callId, std::move(message), std::move(json));
    } catch (const InspectorException& e) {
      channel_->sendMessage(e.error());
    }
  }
private:
  void receive(int callId, std::string message, folly::dynamic json) {
    try {
      auto method = Method::parse(json["method"].asString());
      auto& handler = getHandler(method.domain());
      handler(std::move(message), callId, method.name(), std::move(json["params"]));
    } catch (const InspectorException& e) {
      throw e.withCallId(callId);
    } catch (const std::exception& e) {
      LOG(ERROR) << "Dispatcher failed: " << e.what();
      throw InspectorException(callId, ErrorCode::ServerError, "Internal error");
    } catch (...) {
      throw InspectorException(callId, ErrorCode::ServerError, "Internal error");
    }
  }

  folly::dynamic parseJson(const std::string& message) {
    try {
      return folly::parseJson(message);
    } catch (const std::runtime_error& e) {
      throw InspectorException(ErrorCode::ParseError, "Message must be in JSON format");
    }
  }

  int getCallId(folly::dynamic& json) {
    auto& id = json["id"];
    if (!id.isInt()) {
      throw InspectorException(ErrorCode::InvalidRequest, "The type of 'id' property must be number");
    } else {
      return id.asInt();
    }
  }

  Channel::MessageHandler& getHandler(const std::string& domain) {
    try {
      auto& domains = channel_->getDomains();
      return domains.at(domain);
    } catch (const std::out_of_range& e) {
      throw InspectorException(ErrorCode::MethodNotFound, folly::to<std::string>("Unknown domain: '", domain, "'"));
    }
  }

  ConcreteChannel* channel_;
};

class SchemaAgent : public Agent {
public:
  SchemaAgent() {
    registerMethod("getDomains", [this](folly::dynamic) -> folly::dynamic {
      CHECK(channel_) << "Channel is null";
      folly::dynamic names = folly::dynamic::array;
      auto& domains = channel_->getDomains();
      for (auto& entry : domains) {
        // TODO(blom): Actually get version?
        names.push_back(folly::dynamic::object("name", entry.first)("version", "1.0"));
      }
      return names;
    });
  }

  void onConnect(std::shared_ptr<Channel> channel) override {
    Agent::onConnect(channel);
    channel_ = std::static_pointer_cast<ConcreteChannel>(channel);
  }
private:
  std::shared_ptr<ConcreteChannel> channel_;

  std::string getDomain() override {
    return "Schema";
  }
};

InspectorController::InspectorController(JSC::JSGlobalObject& globalObject)
    : globalObject_(globalObject) {
  auto environment = folly::make_unique<LegacyInspectorEnvironment>();
  auto inspectorAgent = folly::make_unique<InspectorAgent>();
  inspectorAgent_ = inspectorAgent.get();
  dispatchers_.push_back(std::move(inspectorAgent));
  dispatchers_.push_back(folly::make_unique<SchemaAgent>());
  dispatchers_.push_back(folly::make_unique<PageAgent>());
  dispatchers_.push_back(folly::make_unique<JSDispatcher>(globalObject));

  auto consoleAgent = folly::make_unique<ConsoleAgent>(globalObject, environment->injectedScriptManager());
  auto legacyAgents = folly::make_unique<LegacyAgents>(globalObject, std::move(environment), consoleAgent.get());

  dispatchers_.push_back(std::move(consoleAgent));
  dispatchers_.push_back(std::move(legacyAgents));
}

InspectorController::~InspectorController() {
  CHECK(!channel_) << "Wasn't disconnected";
}

void InspectorController::onConnect(Receiver receiver) {
  CHECK(!channel_) << "Already connected";

  channel_ = std::make_shared<ConcreteChannel>(std::move(receiver));

  for (auto& dispatcher : dispatchers_) {
    dispatcher->onConnect(channel_);
  }
}

void InspectorController::onMessage(std::string message) {
  CHECK(channel_) << "Not connected";

  MessageRouter(channel_.get()).route(message);
}

void InspectorController::onGoingAway() {
  CHECK(channel_) << "Not connected";

  inspectorAgent_->detach();
}

void InspectorController::onDisconnect() {
  CHECK(channel_) << "Not connected";

  for (auto& dispatcher : dispatchers_) {
    dispatcher->onDisconnect();
  }

  channel_.reset();
}

}
}
