// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSDispatcher.h"

#include "Protocol.h"
#include "Util.h"

#include <jschelpers/JSCHelpers.h>

#include <JavaScriptCore/APICast.h>
#include <JavaScriptCore/JSContextRef.h>
#include <JavaScriptCore/JSObjectRef.h>
#include <JavaScriptCore/JSStringRef.h>

#include <folly/json.h>

#include <exception>

namespace facebook {
namespace react {

namespace {

static JSValueRef nativeRegisterAgent(
    JSDispatcher* agent,
    JSContextRef ctx,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[]) {
  CHECK(argumentCount == 1) << "__registerInspectorAgent takes 1 arg";
  auto execState = toJS(ctx);
  JSC::JSLockHolder lock(execState);
  auto globalContext = JSContextGetGlobalContext(ctx);
  agent->addAgent(
    execState,
    Value(globalContext, arguments[0]).asObject());
  return JSValueMakeUndefined(ctx);
}

static JSValueRef nativeSendEvent(
    JSDispatcher* agent,
    const std::string& domain,
    JSContextRef ctx,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[]) {
  CHECK(argumentCount == 2) << "sendEvent takes 2 args";
  auto execState = toJS(ctx);
  JSC::JSLockHolder lock(execState);
  auto globalContext = JSContextGetGlobalContext(ctx);
  auto params = folly::parseJson(Value(globalContext, arguments[1]).toJSONString());
  agent->sendEvent(
    domain,
    Value(globalContext, arguments[0]).toString().str(),
    std::move(params));
  return JSValueMakeUndefined(ctx);
}

static JSValueRef nativeInspectorTimestamp(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception) {
  return JSValueMakeNumber(ctx, Timestamp::now());
}

}

JSDispatcher::JSDispatcher(JSC::JSGlobalObject& globalObject) {
  using namespace std::placeholders;
  JSGlobalContextRef context = toGlobalRef(globalObject.globalExec());
  installGlobalFunction(context, "__registerInspectorAgent", std::bind(&nativeRegisterAgent, this, _1, _2, _3, _4));
  installGlobalFunction(context, "__inspectorTimestamp", &nativeInspectorTimestamp);
}

void JSDispatcher::onConnect(std::shared_ptr<Channel> channel) {
  channel_ = std::move(channel);

  for (auto& pair : agents_) {
    registerAgent(pair.first);
  }
}

void JSDispatcher::onDisconnect() {
  channel_.reset();
}

void JSDispatcher::addAgent(JSC::ExecState* execState, Object agentType) {
  auto context = agentType.context();
  auto domainObject = agentType.getProperty("DOMAIN");
  if (domainObject.isUndefined()) {
    throw std::invalid_argument("DOMAIN should be string");
  }
  auto domain = domainObject.toString().str();
  // Bind the domain to the send event function
  using namespace std::placeholders;
  Value sendEventFunction = Object(
    context,
    makeFunction(context, "sendEvent",  std::bind(&nativeSendEvent, this, domain, _1, _2, _3, _4)));
  auto agent = agentType.callAsConstructor({ sendEventFunction });
  agent.makeProtected();

  if (channel_) {
    registerAgent(domain);
  }
  agents_.emplace(std::move(domain), std::move(agent));
}

void JSDispatcher::registerAgent(const std::string& name) {
  channel_->registerDomain(
    name,
    [this, name](std::string, int callId, const std::string& methodName, folly::dynamic args) {
      Object& agent = agents_.at(name);
      auto context = agent.context();
      JSC::JSLockHolder lock(toJS(context));
      // TODO(blom): Check undefined before asObject
      auto method = agent.getProperty(methodName.c_str()).asObject();
      if (args.isNull()) {
        args = folly::dynamic::object;
      }
      auto response = method.callAsFunction(agent, { Value::fromDynamic(context, args) });
      auto result = (response.isUndefined() || response.isNull()) ? folly::dynamic::object() : folly::parseJson(response.toJSONString());
      auto message = folly::dynamic::object("id", callId)("result", std::move(result));
      channel_->sendMessage(folly::toJson(std::move(message)));
    });
}

void JSDispatcher::sendEvent(std::string domain, std::string name, folly::dynamic params) {
  channel_->sendMessage(Event(std::move(domain), std::move(name), std::move(params)));
}

}
}
