// Copyright 2004-present Facebook. All Rights Reserved.

#include "ConsoleAgent.h"

#include "Protocol.h"
#include "Util.h"

#include <jschelpers/JSCHelpers.h>

#include <JavaScriptCore/config.h>
#include <JavaScriptCore/APICast.h>
#include <JavaScriptCore/JSContextRef.h>
#include <JavaScriptCore/JSObjectRef.h>
#include <JavaScriptCore/JSValueRef.h>
#include <JavaScriptCore/JSStringRef.h>

#include <JavaScriptCore/JSLock.h>
#include <JavaScriptCore/JSGlobalObject.h>
#include <JavaScriptCore/JSArray.h>
#include <JavaScriptCore/InjectedScriptManager.h>
#include <JavaScriptCore/ScriptArguments.h>
#include <JavaScriptCore/ScriptCallStack.h>
#include <JavaScriptCore/ScriptCallStackFactory.h>

#include <folly/json.h>

namespace facebook {
namespace react {

namespace {

static JSValueRef inspectorLog(
    ConsoleAgent* agent,
    JSContextRef ctx,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[]) {
  CHECK(argumentCount == 4) << "__inspectorLog takes 4 args";
  auto execState = toJS(ctx);
  JSC::JSLockHolder lock(execState);
  auto params = toJS(execState, arguments[2]);
  agent->log(
    execState,
    Value(ctx, arguments[0]).toString().str(),
    Value(ctx, arguments[1]).toString().str(),
    JSC::asArray(params),
    Value(ctx, arguments[3]).asUnsignedInteger());
  return JSValueMakeUndefined(ctx);
}

size_t skipNativeCode(const Inspector::ScriptCallStack& callStack, size_t offset) {
  for (; offset < callStack.size(); offset++) {
    auto& frame = callStack.at(offset);
    if (frame.sourceURL() != "[native code]") {
      return offset;
    }
  }

  return callStack.size();
}

const Inspector::ScriptCallFrame* firstUserFrame(const Inspector::ScriptCallStack& callStack, size_t framesToSkip) {
  // Skip out of native code
  size_t offset = skipNativeCode(callStack, 0);

  // Skip frames of console polyfill
  offset = skipNativeCode(callStack, offset + framesToSkip);
  if (offset >= callStack.size()) {
    return nullptr;
  }

  if (callStack.at(offset).functionName() == "infoLog") {
    offset += 1;
  }

  if (offset >= callStack.size()) {
    return nullptr;
  }

  return &callStack.at(offset);
}

}

ConsoleAgent::ConsoleAgent(JSC::JSGlobalObject& globalObject, Inspector::InjectedScriptManager* injectedScriptManager)
    : globalObject_(globalObject)
    , injectedScriptManager_(injectedScriptManager) {
  registerMethod("enable", [this](folly::dynamic) -> folly::dynamic {
    using namespace std::placeholders;
    enabled_ = true;
    JSGlobalContextRef context = toGlobalRef(globalObject_.globalExec());
    installGlobalFunction(context, "__inspectorLog", std::bind(&inspectorLog, this, _1, _2, _3, _4));
    return nullptr;
  });
  registerMethod("disable", [this](folly::dynamic) -> folly::dynamic {
    JSGlobalContextRef context = toGlobalRef(globalObject_.globalExec());
    removeGlobal(context, "__inspectorLog");
    enabled_ = false;
    return nullptr;
  });
}

void ConsoleAgent::log(JSC::ExecState* execState, std::string message) {
  log(execState, "log", std::move(message), nullptr, 0);
}

void ConsoleAgent::log(JSC::ExecState* execState, std::string level, std::string message, JSC::JSArray* params, size_t framesToSkip) {
  if (!enabled_) {
    return;
  }

  auto callStack = Inspector::createScriptCallStack(execState, Inspector::ScriptCallStack::maxCallStackSizeToCapture);

  auto logEntry = folly::dynamic::object
    ("source", "console-api")
    ("level", level)
    ("text", std::move(message))
    ("timestamp", Timestamp::now())
    ("stackTrace", folly::parseJson(toStdString(callStack->buildInspectorArray()->toJSONString())));

  if (params) {
    logEntry("parameters", convertParams(execState, params));
  }

  if (auto frame = firstUserFrame(*callStack, framesToSkip)) {
    logEntry
      ("url", toStdString(frame->sourceURL()))
      ("line", frame->lineNumber())
      ("column", frame->columnNumber());
  }

  sendEvent("messageAdded", folly::dynamic::object("message", std::move(logEntry)));
}

folly::dynamic ConsoleAgent::convertParams(JSC::ExecState* execState, JSC::JSArray* params) {
  auto injectedScript = injectedScriptManager_->injectedScriptFor(execState->lexicalGlobalObject()->globalExec());
  if (injectedScript.hasNoValue()) {
    return nullptr;
  }

  folly::dynamic remoteParams = folly::dynamic::array;
  for (size_t i = 0, size = params->length(); i < size; i++) {
    auto scriptValue = Deprecated::ScriptValue(execState->vm(), params->getIndex(execState, i));
    auto remoteValue = injectedScript.wrapObject(std::move(scriptValue), "console", true);
    remoteParams.push_back(folly::parseJson(toStdString(remoteValue->toJSONString())));
  }

  return remoteParams;
}

}
}
