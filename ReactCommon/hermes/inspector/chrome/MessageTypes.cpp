// Copyright 2004-present Facebook. All Rights Reserved.
// @generated SignedSource<<e4c911229f0e8cac24dbc3ec8a933d5e>>

#include "MessageTypes.h"

#include "MessageTypesInlines.h"

namespace facebook {
namespace hermes {
namespace inspector {
namespace chrome {
namespace message {

using RequestBuilder = std::unique_ptr<Request> (*)(const dynamic &);

namespace {

template <typename T>
std::unique_ptr<Request> makeUnique(const dynamic &obj) {
  return std::make_unique<T>(obj);
}

} // namespace

std::unique_ptr<Request> Request::fromJsonThrowOnError(const std::string &str) {
  static std::unordered_map<std::string, RequestBuilder> builders = {
      {"Debugger.disable", makeUnique<debugger::DisableRequest>},
      {"Debugger.enable", makeUnique<debugger::EnableRequest>},
      {"Debugger.evaluateOnCallFrame",
       makeUnique<debugger::EvaluateOnCallFrameRequest>},
      {"Debugger.pause", makeUnique<debugger::PauseRequest>},
      {"Debugger.removeBreakpoint",
       makeUnique<debugger::RemoveBreakpointRequest>},
      {"Debugger.resume", makeUnique<debugger::ResumeRequest>},
      {"Debugger.setBreakpoint", makeUnique<debugger::SetBreakpointRequest>},
      {"Debugger.setBreakpointByUrl",
       makeUnique<debugger::SetBreakpointByUrlRequest>},
      {"Debugger.setBreakpointsActive",
       makeUnique<debugger::SetBreakpointsActiveRequest>},
      {"Debugger.setInstrumentationBreakpoint",
       makeUnique<debugger::SetInstrumentationBreakpointRequest>},
      {"Debugger.setPauseOnExceptions",
       makeUnique<debugger::SetPauseOnExceptionsRequest>},
      {"Debugger.stepInto", makeUnique<debugger::StepIntoRequest>},
      {"Debugger.stepOut", makeUnique<debugger::StepOutRequest>},
      {"Debugger.stepOver", makeUnique<debugger::StepOverRequest>},
      {"HeapProfiler.collectGarbage",
       makeUnique<heapProfiler::CollectGarbageRequest>},
      {"HeapProfiler.startTrackingHeapObjects",
       makeUnique<heapProfiler::StartTrackingHeapObjectsRequest>},
      {"HeapProfiler.stopTrackingHeapObjects",
       makeUnique<heapProfiler::StopTrackingHeapObjectsRequest>},
      {"HeapProfiler.takeHeapSnapshot",
       makeUnique<heapProfiler::TakeHeapSnapshotRequest>},
      {"Runtime.evaluate", makeUnique<runtime::EvaluateRequest>},
      {"Runtime.getProperties", makeUnique<runtime::GetPropertiesRequest>},
      {"Runtime.runIfWaitingForDebugger",
       makeUnique<runtime::RunIfWaitingForDebuggerRequest>},
  };

  dynamic obj = folly::parseJson(str);
  std::string method = obj.at("method").asString();

  auto it = builders.find(method);
  if (it == builders.end()) {
    return std::make_unique<UnknownRequest>(obj);
  }

  auto builder = it->second;
  return builder(obj);
}

folly::Try<std::unique_ptr<Request>> Request::fromJson(const std::string &str) {
  return folly::makeTryWith(
      [&str] { return Request::fromJsonThrowOnError(str); });
}

/// Types
debugger::Location::Location(const dynamic &obj) {
  assign(scriptId, obj, "scriptId");
  assign(lineNumber, obj, "lineNumber");
  assign(columnNumber, obj, "columnNumber");
}

dynamic debugger::Location::toDynamic() const {
  dynamic obj = dynamic::object;

  put(obj, "scriptId", scriptId);
  put(obj, "lineNumber", lineNumber);
  put(obj, "columnNumber", columnNumber);
  return obj;
}

runtime::RemoteObject::RemoteObject(const dynamic &obj) {
  assign(type, obj, "type");
  assign(subtype, obj, "subtype");
  assign(className, obj, "className");
  assign(value, obj, "value");
  assign(unserializableValue, obj, "unserializableValue");
  assign(description, obj, "description");
  assign(objectId, obj, "objectId");
}

dynamic runtime::RemoteObject::toDynamic() const {
  dynamic obj = dynamic::object;

  put(obj, "type", type);
  put(obj, "subtype", subtype);
  put(obj, "className", className);
  put(obj, "value", value);
  put(obj, "unserializableValue", unserializableValue);
  put(obj, "description", description);
  put(obj, "objectId", objectId);
  return obj;
}

runtime::CallFrame::CallFrame(const dynamic &obj) {
  assign(functionName, obj, "functionName");
  assign(scriptId, obj, "scriptId");
  assign(url, obj, "url");
  assign(lineNumber, obj, "lineNumber");
  assign(columnNumber, obj, "columnNumber");
}

dynamic runtime::CallFrame::toDynamic() const {
  dynamic obj = dynamic::object;

  put(obj, "functionName", functionName);
  put(obj, "scriptId", scriptId);
  put(obj, "url", url);
  put(obj, "lineNumber", lineNumber);
  put(obj, "columnNumber", columnNumber);
  return obj;
}

runtime::StackTrace::StackTrace(const dynamic &obj) {
  assign(description, obj, "description");
  assign(callFrames, obj, "callFrames");
  assign(parent, obj, "parent");
}

dynamic runtime::StackTrace::toDynamic() const {
  dynamic obj = dynamic::object;

  put(obj, "description", description);
  put(obj, "callFrames", callFrames);
  put(obj, "parent", parent);
  return obj;
}

runtime::ExceptionDetails::ExceptionDetails(const dynamic &obj) {
  assign(exceptionId, obj, "exceptionId");
  assign(text, obj, "text");
  assign(lineNumber, obj, "lineNumber");
  assign(columnNumber, obj, "columnNumber");
  assign(scriptId, obj, "scriptId");
  assign(url, obj, "url");
  assign(stackTrace, obj, "stackTrace");
  assign(exception, obj, "exception");
  assign(executionContextId, obj, "executionContextId");
}

dynamic runtime::ExceptionDetails::toDynamic() const {
  dynamic obj = dynamic::object;

  put(obj, "exceptionId", exceptionId);
  put(obj, "text", text);
  put(obj, "lineNumber", lineNumber);
  put(obj, "columnNumber", columnNumber);
  put(obj, "scriptId", scriptId);
  put(obj, "url", url);
  put(obj, "stackTrace", stackTrace);
  put(obj, "exception", exception);
  put(obj, "executionContextId", executionContextId);
  return obj;
}

debugger::Scope::Scope(const dynamic &obj) {
  assign(type, obj, "type");
  assign(object, obj, "object");
  assign(name, obj, "name");
  assign(startLocation, obj, "startLocation");
  assign(endLocation, obj, "endLocation");
}

dynamic debugger::Scope::toDynamic() const {
  dynamic obj = dynamic::object;

  put(obj, "type", type);
  put(obj, "object", object);
  put(obj, "name", name);
  put(obj, "startLocation", startLocation);
  put(obj, "endLocation", endLocation);
  return obj;
}

debugger::CallFrame::CallFrame(const dynamic &obj) {
  assign(callFrameId, obj, "callFrameId");
  assign(functionName, obj, "functionName");
  assign(functionLocation, obj, "functionLocation");
  assign(location, obj, "location");
  assign(url, obj, "url");
  assign(scopeChain, obj, "scopeChain");
  assign(thisObj, obj, "this");
  assign(returnValue, obj, "returnValue");
}

dynamic debugger::CallFrame::toDynamic() const {
  dynamic obj = dynamic::object;

  put(obj, "callFrameId", callFrameId);
  put(obj, "functionName", functionName);
  put(obj, "functionLocation", functionLocation);
  put(obj, "location", location);
  put(obj, "url", url);
  put(obj, "scopeChain", scopeChain);
  put(obj, "this", thisObj);
  put(obj, "returnValue", returnValue);
  return obj;
}

runtime::ExecutionContextDescription::ExecutionContextDescription(
    const dynamic &obj) {
  assign(id, obj, "id");
  assign(origin, obj, "origin");
  assign(name, obj, "name");
  assign(auxData, obj, "auxData");
}

dynamic runtime::ExecutionContextDescription::toDynamic() const {
  dynamic obj = dynamic::object;

  put(obj, "id", id);
  put(obj, "origin", origin);
  put(obj, "name", name);
  put(obj, "auxData", auxData);
  return obj;
}

runtime::PropertyDescriptor::PropertyDescriptor(const dynamic &obj) {
  assign(name, obj, "name");
  assign(value, obj, "value");
  assign(writable, obj, "writable");
  assign(get, obj, "get");
  assign(set, obj, "set");
  assign(configurable, obj, "configurable");
  assign(enumerable, obj, "enumerable");
  assign(wasThrown, obj, "wasThrown");
  assign(isOwn, obj, "isOwn");
  assign(symbol, obj, "symbol");
}

dynamic runtime::PropertyDescriptor::toDynamic() const {
  dynamic obj = dynamic::object;

  put(obj, "name", name);
  put(obj, "value", value);
  put(obj, "writable", writable);
  put(obj, "get", get);
  put(obj, "set", set);
  put(obj, "configurable", configurable);
  put(obj, "enumerable", enumerable);
  put(obj, "wasThrown", wasThrown);
  put(obj, "isOwn", isOwn);
  put(obj, "symbol", symbol);
  return obj;
}

runtime::InternalPropertyDescriptor::InternalPropertyDescriptor(
    const dynamic &obj) {
  assign(name, obj, "name");
  assign(value, obj, "value");
}

dynamic runtime::InternalPropertyDescriptor::toDynamic() const {
  dynamic obj = dynamic::object;

  put(obj, "name", name);
  put(obj, "value", value);
  return obj;
}

/// Requests
UnknownRequest::UnknownRequest() {}

UnknownRequest::UnknownRequest(const dynamic &obj) {
  assign(id, obj, "id");
  assign(method, obj, "method");
  assign(params, obj, "params");
}

dynamic UnknownRequest::toDynamic() const {
  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  put(obj, "params", params);
  return obj;
}

void UnknownRequest::accept(RequestHandler &handler) const {
  handler.handle(*this);
}

debugger::DisableRequest::DisableRequest() : Request("Debugger.disable") {}

debugger::DisableRequest::DisableRequest(const dynamic &obj)
    : Request("Debugger.disable") {
  assign(id, obj, "id");
  assign(method, obj, "method");
}

dynamic debugger::DisableRequest::toDynamic() const {
  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  return obj;
}

void debugger::DisableRequest::accept(RequestHandler &handler) const {
  handler.handle(*this);
}

debugger::EnableRequest::EnableRequest() : Request("Debugger.enable") {}

debugger::EnableRequest::EnableRequest(const dynamic &obj)
    : Request("Debugger.enable") {
  assign(id, obj, "id");
  assign(method, obj, "method");
}

dynamic debugger::EnableRequest::toDynamic() const {
  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  return obj;
}

void debugger::EnableRequest::accept(RequestHandler &handler) const {
  handler.handle(*this);
}

debugger::EvaluateOnCallFrameRequest::EvaluateOnCallFrameRequest()
    : Request("Debugger.evaluateOnCallFrame") {}

debugger::EvaluateOnCallFrameRequest::EvaluateOnCallFrameRequest(
    const dynamic &obj)
    : Request("Debugger.evaluateOnCallFrame") {
  assign(id, obj, "id");
  assign(method, obj, "method");

  dynamic params = obj.at("params");
  assign(callFrameId, params, "callFrameId");
  assign(expression, params, "expression");
  assign(objectGroup, params, "objectGroup");
  assign(includeCommandLineAPI, params, "includeCommandLineAPI");
  assign(silent, params, "silent");
  assign(returnByValue, params, "returnByValue");
  assign(throwOnSideEffect, params, "throwOnSideEffect");
}

dynamic debugger::EvaluateOnCallFrameRequest::toDynamic() const {
  dynamic params = dynamic::object;
  put(params, "callFrameId", callFrameId);
  put(params, "expression", expression);
  put(params, "objectGroup", objectGroup);
  put(params, "includeCommandLineAPI", includeCommandLineAPI);
  put(params, "silent", silent);
  put(params, "returnByValue", returnByValue);
  put(params, "throwOnSideEffect", throwOnSideEffect);

  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  put(obj, "params", std::move(params));
  return obj;
}

void debugger::EvaluateOnCallFrameRequest::accept(
    RequestHandler &handler) const {
  handler.handle(*this);
}

debugger::PauseRequest::PauseRequest() : Request("Debugger.pause") {}

debugger::PauseRequest::PauseRequest(const dynamic &obj)
    : Request("Debugger.pause") {
  assign(id, obj, "id");
  assign(method, obj, "method");
}

dynamic debugger::PauseRequest::toDynamic() const {
  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  return obj;
}

void debugger::PauseRequest::accept(RequestHandler &handler) const {
  handler.handle(*this);
}

debugger::RemoveBreakpointRequest::RemoveBreakpointRequest()
    : Request("Debugger.removeBreakpoint") {}

debugger::RemoveBreakpointRequest::RemoveBreakpointRequest(const dynamic &obj)
    : Request("Debugger.removeBreakpoint") {
  assign(id, obj, "id");
  assign(method, obj, "method");

  dynamic params = obj.at("params");
  assign(breakpointId, params, "breakpointId");
}

dynamic debugger::RemoveBreakpointRequest::toDynamic() const {
  dynamic params = dynamic::object;
  put(params, "breakpointId", breakpointId);

  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  put(obj, "params", std::move(params));
  return obj;
}

void debugger::RemoveBreakpointRequest::accept(RequestHandler &handler) const {
  handler.handle(*this);
}

debugger::ResumeRequest::ResumeRequest() : Request("Debugger.resume") {}

debugger::ResumeRequest::ResumeRequest(const dynamic &obj)
    : Request("Debugger.resume") {
  assign(id, obj, "id");
  assign(method, obj, "method");
}

dynamic debugger::ResumeRequest::toDynamic() const {
  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  return obj;
}

void debugger::ResumeRequest::accept(RequestHandler &handler) const {
  handler.handle(*this);
}

debugger::SetBreakpointRequest::SetBreakpointRequest()
    : Request("Debugger.setBreakpoint") {}

debugger::SetBreakpointRequest::SetBreakpointRequest(const dynamic &obj)
    : Request("Debugger.setBreakpoint") {
  assign(id, obj, "id");
  assign(method, obj, "method");

  dynamic params = obj.at("params");
  assign(location, params, "location");
  assign(condition, params, "condition");
}

dynamic debugger::SetBreakpointRequest::toDynamic() const {
  dynamic params = dynamic::object;
  put(params, "location", location);
  put(params, "condition", condition);

  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  put(obj, "params", std::move(params));
  return obj;
}

void debugger::SetBreakpointRequest::accept(RequestHandler &handler) const {
  handler.handle(*this);
}

debugger::SetBreakpointByUrlRequest::SetBreakpointByUrlRequest()
    : Request("Debugger.setBreakpointByUrl") {}

debugger::SetBreakpointByUrlRequest::SetBreakpointByUrlRequest(
    const dynamic &obj)
    : Request("Debugger.setBreakpointByUrl") {
  assign(id, obj, "id");
  assign(method, obj, "method");

  dynamic params = obj.at("params");
  assign(lineNumber, params, "lineNumber");
  assign(url, params, "url");
  assign(urlRegex, params, "urlRegex");
  assign(scriptHash, params, "scriptHash");
  assign(columnNumber, params, "columnNumber");
  assign(condition, params, "condition");
}

dynamic debugger::SetBreakpointByUrlRequest::toDynamic() const {
  dynamic params = dynamic::object;
  put(params, "lineNumber", lineNumber);
  put(params, "url", url);
  put(params, "urlRegex", urlRegex);
  put(params, "scriptHash", scriptHash);
  put(params, "columnNumber", columnNumber);
  put(params, "condition", condition);

  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  put(obj, "params", std::move(params));
  return obj;
}

void debugger::SetBreakpointByUrlRequest::accept(
    RequestHandler &handler) const {
  handler.handle(*this);
}

debugger::SetBreakpointsActiveRequest::SetBreakpointsActiveRequest()
    : Request("Debugger.setBreakpointsActive") {}

debugger::SetBreakpointsActiveRequest::SetBreakpointsActiveRequest(
    const dynamic &obj)
    : Request("Debugger.setBreakpointsActive") {
  assign(id, obj, "id");
  assign(method, obj, "method");

  dynamic params = obj.at("params");
  assign(active, params, "active");
}

dynamic debugger::SetBreakpointsActiveRequest::toDynamic() const {
  dynamic params = dynamic::object;
  put(params, "active", active);

  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  put(obj, "params", std::move(params));
  return obj;
}

void debugger::SetBreakpointsActiveRequest::accept(
    RequestHandler &handler) const {
  handler.handle(*this);
}

debugger::SetInstrumentationBreakpointRequest::
    SetInstrumentationBreakpointRequest()
    : Request("Debugger.setInstrumentationBreakpoint") {}

debugger::SetInstrumentationBreakpointRequest::
    SetInstrumentationBreakpointRequest(const dynamic &obj)
    : Request("Debugger.setInstrumentationBreakpoint") {
  assign(id, obj, "id");
  assign(method, obj, "method");

  dynamic params = obj.at("params");
  assign(instrumentation, params, "instrumentation");
}

dynamic debugger::SetInstrumentationBreakpointRequest::toDynamic() const {
  dynamic params = dynamic::object;
  put(params, "instrumentation", instrumentation);

  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  put(obj, "params", std::move(params));
  return obj;
}

void debugger::SetInstrumentationBreakpointRequest::accept(
    RequestHandler &handler) const {
  handler.handle(*this);
}

debugger::SetPauseOnExceptionsRequest::SetPauseOnExceptionsRequest()
    : Request("Debugger.setPauseOnExceptions") {}

debugger::SetPauseOnExceptionsRequest::SetPauseOnExceptionsRequest(
    const dynamic &obj)
    : Request("Debugger.setPauseOnExceptions") {
  assign(id, obj, "id");
  assign(method, obj, "method");

  dynamic params = obj.at("params");
  assign(state, params, "state");
}

dynamic debugger::SetPauseOnExceptionsRequest::toDynamic() const {
  dynamic params = dynamic::object;
  put(params, "state", state);

  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  put(obj, "params", std::move(params));
  return obj;
}

void debugger::SetPauseOnExceptionsRequest::accept(
    RequestHandler &handler) const {
  handler.handle(*this);
}

debugger::StepIntoRequest::StepIntoRequest() : Request("Debugger.stepInto") {}

debugger::StepIntoRequest::StepIntoRequest(const dynamic &obj)
    : Request("Debugger.stepInto") {
  assign(id, obj, "id");
  assign(method, obj, "method");
}

dynamic debugger::StepIntoRequest::toDynamic() const {
  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  return obj;
}

void debugger::StepIntoRequest::accept(RequestHandler &handler) const {
  handler.handle(*this);
}

debugger::StepOutRequest::StepOutRequest() : Request("Debugger.stepOut") {}

debugger::StepOutRequest::StepOutRequest(const dynamic &obj)
    : Request("Debugger.stepOut") {
  assign(id, obj, "id");
  assign(method, obj, "method");
}

dynamic debugger::StepOutRequest::toDynamic() const {
  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  return obj;
}

void debugger::StepOutRequest::accept(RequestHandler &handler) const {
  handler.handle(*this);
}

debugger::StepOverRequest::StepOverRequest() : Request("Debugger.stepOver") {}

debugger::StepOverRequest::StepOverRequest(const dynamic &obj)
    : Request("Debugger.stepOver") {
  assign(id, obj, "id");
  assign(method, obj, "method");
}

dynamic debugger::StepOverRequest::toDynamic() const {
  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  return obj;
}

void debugger::StepOverRequest::accept(RequestHandler &handler) const {
  handler.handle(*this);
}

heapProfiler::CollectGarbageRequest::CollectGarbageRequest()
    : Request("HeapProfiler.collectGarbage") {}

heapProfiler::CollectGarbageRequest::CollectGarbageRequest(const dynamic &obj)
    : Request("HeapProfiler.collectGarbage") {
  assign(id, obj, "id");
  assign(method, obj, "method");
}

dynamic heapProfiler::CollectGarbageRequest::toDynamic() const {
  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  return obj;
}

void heapProfiler::CollectGarbageRequest::accept(
    RequestHandler &handler) const {
  handler.handle(*this);
}

heapProfiler::StartTrackingHeapObjectsRequest::StartTrackingHeapObjectsRequest()
    : Request("HeapProfiler.startTrackingHeapObjects") {}

heapProfiler::StartTrackingHeapObjectsRequest::StartTrackingHeapObjectsRequest(
    const dynamic &obj)
    : Request("HeapProfiler.startTrackingHeapObjects") {
  assign(id, obj, "id");
  assign(method, obj, "method");

  dynamic params = obj.at("params");
  assign(trackAllocations, params, "trackAllocations");
}

dynamic heapProfiler::StartTrackingHeapObjectsRequest::toDynamic() const {
  dynamic params = dynamic::object;
  put(params, "trackAllocations", trackAllocations);

  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  put(obj, "params", std::move(params));
  return obj;
}

void heapProfiler::StartTrackingHeapObjectsRequest::accept(
    RequestHandler &handler) const {
  handler.handle(*this);
}

heapProfiler::StopTrackingHeapObjectsRequest::StopTrackingHeapObjectsRequest()
    : Request("HeapProfiler.stopTrackingHeapObjects") {}

heapProfiler::StopTrackingHeapObjectsRequest::StopTrackingHeapObjectsRequest(
    const dynamic &obj)
    : Request("HeapProfiler.stopTrackingHeapObjects") {
  assign(id, obj, "id");
  assign(method, obj, "method");

  dynamic params = obj.at("params");
  assign(reportProgress, params, "reportProgress");
  assign(treatGlobalObjectsAsRoots, params, "treatGlobalObjectsAsRoots");
}

dynamic heapProfiler::StopTrackingHeapObjectsRequest::toDynamic() const {
  dynamic params = dynamic::object;
  put(params, "reportProgress", reportProgress);
  put(params, "treatGlobalObjectsAsRoots", treatGlobalObjectsAsRoots);

  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  put(obj, "params", std::move(params));
  return obj;
}

void heapProfiler::StopTrackingHeapObjectsRequest::accept(
    RequestHandler &handler) const {
  handler.handle(*this);
}

heapProfiler::TakeHeapSnapshotRequest::TakeHeapSnapshotRequest()
    : Request("HeapProfiler.takeHeapSnapshot") {}

heapProfiler::TakeHeapSnapshotRequest::TakeHeapSnapshotRequest(
    const dynamic &obj)
    : Request("HeapProfiler.takeHeapSnapshot") {
  assign(id, obj, "id");
  assign(method, obj, "method");

  dynamic params = obj.at("params");
  assign(reportProgress, params, "reportProgress");
  assign(treatGlobalObjectsAsRoots, params, "treatGlobalObjectsAsRoots");
}

dynamic heapProfiler::TakeHeapSnapshotRequest::toDynamic() const {
  dynamic params = dynamic::object;
  put(params, "reportProgress", reportProgress);
  put(params, "treatGlobalObjectsAsRoots", treatGlobalObjectsAsRoots);

  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  put(obj, "params", std::move(params));
  return obj;
}

void heapProfiler::TakeHeapSnapshotRequest::accept(
    RequestHandler &handler) const {
  handler.handle(*this);
}

runtime::EvaluateRequest::EvaluateRequest() : Request("Runtime.evaluate") {}

runtime::EvaluateRequest::EvaluateRequest(const dynamic &obj)
    : Request("Runtime.evaluate") {
  assign(id, obj, "id");
  assign(method, obj, "method");

  dynamic params = obj.at("params");
  assign(expression, params, "expression");
  assign(objectGroup, params, "objectGroup");
  assign(includeCommandLineAPI, params, "includeCommandLineAPI");
  assign(silent, params, "silent");
  assign(contextId, params, "contextId");
  assign(returnByValue, params, "returnByValue");
  assign(userGesture, params, "userGesture");
  assign(awaitPromise, params, "awaitPromise");
}

dynamic runtime::EvaluateRequest::toDynamic() const {
  dynamic params = dynamic::object;
  put(params, "expression", expression);
  put(params, "objectGroup", objectGroup);
  put(params, "includeCommandLineAPI", includeCommandLineAPI);
  put(params, "silent", silent);
  put(params, "contextId", contextId);
  put(params, "returnByValue", returnByValue);
  put(params, "userGesture", userGesture);
  put(params, "awaitPromise", awaitPromise);

  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  put(obj, "params", std::move(params));
  return obj;
}

void runtime::EvaluateRequest::accept(RequestHandler &handler) const {
  handler.handle(*this);
}

runtime::GetPropertiesRequest::GetPropertiesRequest()
    : Request("Runtime.getProperties") {}

runtime::GetPropertiesRequest::GetPropertiesRequest(const dynamic &obj)
    : Request("Runtime.getProperties") {
  assign(id, obj, "id");
  assign(method, obj, "method");

  dynamic params = obj.at("params");
  assign(objectId, params, "objectId");
  assign(ownProperties, params, "ownProperties");
}

dynamic runtime::GetPropertiesRequest::toDynamic() const {
  dynamic params = dynamic::object;
  put(params, "objectId", objectId);
  put(params, "ownProperties", ownProperties);

  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  put(obj, "params", std::move(params));
  return obj;
}

void runtime::GetPropertiesRequest::accept(RequestHandler &handler) const {
  handler.handle(*this);
}

runtime::RunIfWaitingForDebuggerRequest::RunIfWaitingForDebuggerRequest()
    : Request("Runtime.runIfWaitingForDebugger") {}

runtime::RunIfWaitingForDebuggerRequest::RunIfWaitingForDebuggerRequest(
    const dynamic &obj)
    : Request("Runtime.runIfWaitingForDebugger") {
  assign(id, obj, "id");
  assign(method, obj, "method");
}

dynamic runtime::RunIfWaitingForDebuggerRequest::toDynamic() const {
  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  return obj;
}

void runtime::RunIfWaitingForDebuggerRequest::accept(
    RequestHandler &handler) const {
  handler.handle(*this);
}

/// Responses
ErrorResponse::ErrorResponse(const dynamic &obj) {
  assign(id, obj, "id");

  dynamic error = obj.at("error");
  assign(code, error, "code");
  assign(message, error, "message");
  assign(data, error, "data");
}

dynamic ErrorResponse::toDynamic() const {
  dynamic error = dynamic::object;
  put(error, "code", code);
  put(error, "message", message);
  put(error, "data", data);

  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "error", std::move(error));
  return obj;
}

OkResponse::OkResponse(const dynamic &obj) {
  assign(id, obj, "id");
}

dynamic OkResponse::toDynamic() const {
  dynamic result = dynamic::object;

  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "result", std::move(result));
  return obj;
}

debugger::EvaluateOnCallFrameResponse::EvaluateOnCallFrameResponse(
    const dynamic &obj) {
  assign(id, obj, "id");

  dynamic res = obj.at("result");
  assign(result, res, "result");
  assign(exceptionDetails, res, "exceptionDetails");
}

dynamic debugger::EvaluateOnCallFrameResponse::toDynamic() const {
  dynamic res = dynamic::object;
  put(res, "result", result);
  put(res, "exceptionDetails", exceptionDetails);

  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "result", std::move(res));
  return obj;
}

debugger::SetBreakpointResponse::SetBreakpointResponse(const dynamic &obj) {
  assign(id, obj, "id");

  dynamic res = obj.at("result");
  assign(breakpointId, res, "breakpointId");
  assign(actualLocation, res, "actualLocation");
}

dynamic debugger::SetBreakpointResponse::toDynamic() const {
  dynamic res = dynamic::object;
  put(res, "breakpointId", breakpointId);
  put(res, "actualLocation", actualLocation);

  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "result", std::move(res));
  return obj;
}

debugger::SetBreakpointByUrlResponse::SetBreakpointByUrlResponse(
    const dynamic &obj) {
  assign(id, obj, "id");

  dynamic res = obj.at("result");
  assign(breakpointId, res, "breakpointId");
  assign(locations, res, "locations");
}

dynamic debugger::SetBreakpointByUrlResponse::toDynamic() const {
  dynamic res = dynamic::object;
  put(res, "breakpointId", breakpointId);
  put(res, "locations", locations);

  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "result", std::move(res));
  return obj;
}

debugger::SetInstrumentationBreakpointResponse::
    SetInstrumentationBreakpointResponse(const dynamic &obj) {
  assign(id, obj, "id");

  dynamic res = obj.at("result");
  assign(breakpointId, res, "breakpointId");
}

dynamic debugger::SetInstrumentationBreakpointResponse::toDynamic() const {
  dynamic res = dynamic::object;
  put(res, "breakpointId", breakpointId);

  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "result", std::move(res));
  return obj;
}

runtime::EvaluateResponse::EvaluateResponse(const dynamic &obj) {
  assign(id, obj, "id");

  dynamic res = obj.at("result");
  assign(result, res, "result");
  assign(exceptionDetails, res, "exceptionDetails");
}

dynamic runtime::EvaluateResponse::toDynamic() const {
  dynamic res = dynamic::object;
  put(res, "result", result);
  put(res, "exceptionDetails", exceptionDetails);

  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "result", std::move(res));
  return obj;
}

runtime::GetPropertiesResponse::GetPropertiesResponse(const dynamic &obj) {
  assign(id, obj, "id");

  dynamic res = obj.at("result");
  assign(result, res, "result");
  assign(internalProperties, res, "internalProperties");
  assign(exceptionDetails, res, "exceptionDetails");
}

dynamic runtime::GetPropertiesResponse::toDynamic() const {
  dynamic res = dynamic::object;
  put(res, "result", result);
  put(res, "internalProperties", internalProperties);
  put(res, "exceptionDetails", exceptionDetails);

  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "result", std::move(res));
  return obj;
}

/// Notifications
debugger::BreakpointResolvedNotification::BreakpointResolvedNotification()
    : Notification("Debugger.breakpointResolved") {}

debugger::BreakpointResolvedNotification::BreakpointResolvedNotification(
    const dynamic &obj)
    : Notification("Debugger.breakpointResolved") {
  assign(method, obj, "method");

  dynamic params = obj.at("params");
  assign(breakpointId, params, "breakpointId");
  assign(location, params, "location");
}

dynamic debugger::BreakpointResolvedNotification::toDynamic() const {
  dynamic params = dynamic::object;
  put(params, "breakpointId", breakpointId);
  put(params, "location", location);

  dynamic obj = dynamic::object;
  put(obj, "method", method);
  put(obj, "params", std::move(params));
  return obj;
}

debugger::PausedNotification::PausedNotification()
    : Notification("Debugger.paused") {}

debugger::PausedNotification::PausedNotification(const dynamic &obj)
    : Notification("Debugger.paused") {
  assign(method, obj, "method");

  dynamic params = obj.at("params");
  assign(callFrames, params, "callFrames");
  assign(reason, params, "reason");
  assign(data, params, "data");
  assign(hitBreakpoints, params, "hitBreakpoints");
  assign(asyncStackTrace, params, "asyncStackTrace");
}

dynamic debugger::PausedNotification::toDynamic() const {
  dynamic params = dynamic::object;
  put(params, "callFrames", callFrames);
  put(params, "reason", reason);
  put(params, "data", data);
  put(params, "hitBreakpoints", hitBreakpoints);
  put(params, "asyncStackTrace", asyncStackTrace);

  dynamic obj = dynamic::object;
  put(obj, "method", method);
  put(obj, "params", std::move(params));
  return obj;
}

debugger::ResumedNotification::ResumedNotification()
    : Notification("Debugger.resumed") {}

debugger::ResumedNotification::ResumedNotification(const dynamic &obj)
    : Notification("Debugger.resumed") {
  assign(method, obj, "method");
}

dynamic debugger::ResumedNotification::toDynamic() const {
  dynamic obj = dynamic::object;
  put(obj, "method", method);
  return obj;
}

debugger::ScriptParsedNotification::ScriptParsedNotification()
    : Notification("Debugger.scriptParsed") {}

debugger::ScriptParsedNotification::ScriptParsedNotification(const dynamic &obj)
    : Notification("Debugger.scriptParsed") {
  assign(method, obj, "method");

  dynamic params = obj.at("params");
  assign(scriptId, params, "scriptId");
  assign(url, params, "url");
  assign(startLine, params, "startLine");
  assign(startColumn, params, "startColumn");
  assign(endLine, params, "endLine");
  assign(endColumn, params, "endColumn");
  assign(executionContextId, params, "executionContextId");
  assign(hash, params, "hash");
  assign(executionContextAuxData, params, "executionContextAuxData");
  assign(sourceMapURL, params, "sourceMapURL");
  assign(hasSourceURL, params, "hasSourceURL");
  assign(isModule, params, "isModule");
  assign(length, params, "length");
}

dynamic debugger::ScriptParsedNotification::toDynamic() const {
  dynamic params = dynamic::object;
  put(params, "scriptId", scriptId);
  put(params, "url", url);
  put(params, "startLine", startLine);
  put(params, "startColumn", startColumn);
  put(params, "endLine", endLine);
  put(params, "endColumn", endColumn);
  put(params, "executionContextId", executionContextId);
  put(params, "hash", hash);
  put(params, "executionContextAuxData", executionContextAuxData);
  put(params, "sourceMapURL", sourceMapURL);
  put(params, "hasSourceURL", hasSourceURL);
  put(params, "isModule", isModule);
  put(params, "length", length);

  dynamic obj = dynamic::object;
  put(obj, "method", method);
  put(obj, "params", std::move(params));
  return obj;
}

heapProfiler::AddHeapSnapshotChunkNotification::
    AddHeapSnapshotChunkNotification()
    : Notification("HeapProfiler.addHeapSnapshotChunk") {}

heapProfiler::AddHeapSnapshotChunkNotification::
    AddHeapSnapshotChunkNotification(const dynamic &obj)
    : Notification("HeapProfiler.addHeapSnapshotChunk") {
  assign(method, obj, "method");

  dynamic params = obj.at("params");
  assign(chunk, params, "chunk");
}

dynamic heapProfiler::AddHeapSnapshotChunkNotification::toDynamic() const {
  dynamic params = dynamic::object;
  put(params, "chunk", chunk);

  dynamic obj = dynamic::object;
  put(obj, "method", method);
  put(obj, "params", std::move(params));
  return obj;
}

heapProfiler::HeapStatsUpdateNotification::HeapStatsUpdateNotification()
    : Notification("HeapProfiler.heapStatsUpdate") {}

heapProfiler::HeapStatsUpdateNotification::HeapStatsUpdateNotification(
    const dynamic &obj)
    : Notification("HeapProfiler.heapStatsUpdate") {
  assign(method, obj, "method");

  dynamic params = obj.at("params");
  assign(statsUpdate, params, "statsUpdate");
}

dynamic heapProfiler::HeapStatsUpdateNotification::toDynamic() const {
  dynamic params = dynamic::object;
  put(params, "statsUpdate", statsUpdate);

  dynamic obj = dynamic::object;
  put(obj, "method", method);
  put(obj, "params", std::move(params));
  return obj;
}

heapProfiler::LastSeenObjectIdNotification::LastSeenObjectIdNotification()
    : Notification("HeapProfiler.lastSeenObjectId") {}

heapProfiler::LastSeenObjectIdNotification::LastSeenObjectIdNotification(
    const dynamic &obj)
    : Notification("HeapProfiler.lastSeenObjectId") {
  assign(method, obj, "method");

  dynamic params = obj.at("params");
  assign(lastSeenObjectId, params, "lastSeenObjectId");
  assign(timestamp, params, "timestamp");
}

dynamic heapProfiler::LastSeenObjectIdNotification::toDynamic() const {
  dynamic params = dynamic::object;
  put(params, "lastSeenObjectId", lastSeenObjectId);
  put(params, "timestamp", timestamp);

  dynamic obj = dynamic::object;
  put(obj, "method", method);
  put(obj, "params", std::move(params));
  return obj;
}

heapProfiler::ReportHeapSnapshotProgressNotification::
    ReportHeapSnapshotProgressNotification()
    : Notification("HeapProfiler.reportHeapSnapshotProgress") {}

heapProfiler::ReportHeapSnapshotProgressNotification::
    ReportHeapSnapshotProgressNotification(const dynamic &obj)
    : Notification("HeapProfiler.reportHeapSnapshotProgress") {
  assign(method, obj, "method");

  dynamic params = obj.at("params");
  assign(done, params, "done");
  assign(total, params, "total");
  assign(finished, params, "finished");
}

dynamic heapProfiler::ReportHeapSnapshotProgressNotification::toDynamic()
    const {
  dynamic params = dynamic::object;
  put(params, "done", done);
  put(params, "total", total);
  put(params, "finished", finished);

  dynamic obj = dynamic::object;
  put(obj, "method", method);
  put(obj, "params", std::move(params));
  return obj;
}

runtime::ConsoleAPICalledNotification::ConsoleAPICalledNotification()
    : Notification("Runtime.consoleAPICalled") {}

runtime::ConsoleAPICalledNotification::ConsoleAPICalledNotification(
    const dynamic &obj)
    : Notification("Runtime.consoleAPICalled") {
  assign(method, obj, "method");

  dynamic params = obj.at("params");
  assign(type, params, "type");
  assign(args, params, "args");
  assign(executionContextId, params, "executionContextId");
  assign(timestamp, params, "timestamp");
  assign(stackTrace, params, "stackTrace");
}

dynamic runtime::ConsoleAPICalledNotification::toDynamic() const {
  dynamic params = dynamic::object;
  put(params, "type", type);
  put(params, "args", args);
  put(params, "executionContextId", executionContextId);
  put(params, "timestamp", timestamp);
  put(params, "stackTrace", stackTrace);

  dynamic obj = dynamic::object;
  put(obj, "method", method);
  put(obj, "params", std::move(params));
  return obj;
}

runtime::ExecutionContextCreatedNotification::
    ExecutionContextCreatedNotification()
    : Notification("Runtime.executionContextCreated") {}

runtime::ExecutionContextCreatedNotification::
    ExecutionContextCreatedNotification(const dynamic &obj)
    : Notification("Runtime.executionContextCreated") {
  assign(method, obj, "method");

  dynamic params = obj.at("params");
  assign(context, params, "context");
}

dynamic runtime::ExecutionContextCreatedNotification::toDynamic() const {
  dynamic params = dynamic::object;
  put(params, "context", context);

  dynamic obj = dynamic::object;
  put(obj, "method", method);
  put(obj, "params", std::move(params));
  return obj;
}

} // namespace message
} // namespace chrome
} // namespace inspector
} // namespace hermes
} // namespace facebook
