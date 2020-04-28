// Copyright 2004-present Facebook. All Rights Reserved.
// @generated <<SignedSource::*O*zOeWoEQle#+L!plEphiEmie@IsG>>

#pragma once

#include <hermes/inspector/chrome/MessageInterfaces.h>

#include <vector>

#include <folly/Optional.h>

namespace facebook {
namespace hermes {
namespace inspector {
namespace chrome {
namespace message {

struct UnknownRequest;

namespace debugger {
using BreakpointId = std::string;
struct BreakpointResolvedNotification;
struct CallFrame;
using CallFrameId = std::string;
struct DisableRequest;
struct EnableRequest;
struct EvaluateOnCallFrameRequest;
struct EvaluateOnCallFrameResponse;
struct Location;
struct PauseRequest;
struct PausedNotification;
struct RemoveBreakpointRequest;
struct ResumeRequest;
struct ResumedNotification;
struct Scope;
struct ScriptParsedNotification;
struct SetBreakpointByUrlRequest;
struct SetBreakpointByUrlResponse;
struct SetPauseOnExceptionsRequest;
struct StepIntoRequest;
struct StepOutRequest;
struct StepOverRequest;
} // namespace debugger

namespace runtime {
struct CallFrame;
struct ConsoleAPICalledNotification;
struct EvaluateRequest;
struct EvaluateResponse;
struct ExceptionDetails;
struct ExecutionContextCreatedNotification;
struct ExecutionContextDescription;
using ExecutionContextId = int;
struct GetPropertiesRequest;
struct GetPropertiesResponse;
struct InternalPropertyDescriptor;
struct PropertyDescriptor;
struct RemoteObject;
using RemoteObjectId = std::string;
using ScriptId = std::string;
struct StackTrace;
using Timestamp = double;
using UnserializableValue = std::string;
} // namespace runtime

/// RequestHandler handles requests via the visitor pattern.
struct RequestHandler {
  virtual ~RequestHandler() = default;

  virtual void handle(const UnknownRequest &req) = 0;
  virtual void handle(const debugger::DisableRequest &req) = 0;
  virtual void handle(const debugger::EnableRequest &req) = 0;
  virtual void handle(const debugger::EvaluateOnCallFrameRequest &req) = 0;
  virtual void handle(const debugger::PauseRequest &req) = 0;
  virtual void handle(const debugger::RemoveBreakpointRequest &req) = 0;
  virtual void handle(const debugger::ResumeRequest &req) = 0;
  virtual void handle(const debugger::SetBreakpointByUrlRequest &req) = 0;
  virtual void handle(const debugger::SetPauseOnExceptionsRequest &req) = 0;
  virtual void handle(const debugger::StepIntoRequest &req) = 0;
  virtual void handle(const debugger::StepOutRequest &req) = 0;
  virtual void handle(const debugger::StepOverRequest &req) = 0;
  virtual void handle(const runtime::EvaluateRequest &req) = 0;
  virtual void handle(const runtime::GetPropertiesRequest &req) = 0;
};

/// NoopRequestHandler can be subclassed to only handle some requests.
struct NoopRequestHandler : public RequestHandler {
  void handle(const UnknownRequest &req) override {}
  void handle(const debugger::DisableRequest &req) override {}
  void handle(const debugger::EnableRequest &req) override {}
  void handle(const debugger::EvaluateOnCallFrameRequest &req) override {}
  void handle(const debugger::PauseRequest &req) override {}
  void handle(const debugger::RemoveBreakpointRequest &req) override {}
  void handle(const debugger::ResumeRequest &req) override {}
  void handle(const debugger::SetBreakpointByUrlRequest &req) override {}
  void handle(const debugger::SetPauseOnExceptionsRequest &req) override {}
  void handle(const debugger::StepIntoRequest &req) override {}
  void handle(const debugger::StepOutRequest &req) override {}
  void handle(const debugger::StepOverRequest &req) override {}
  void handle(const runtime::EvaluateRequest &req) override {}
  void handle(const runtime::GetPropertiesRequest &req) override {}
};

/// Types
struct debugger::Location : public Serializable {
  Location() = default;
  explicit Location(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  runtime::ScriptId scriptId{};
  int lineNumber{};
  folly::Optional<int> columnNumber;
};

struct runtime::RemoteObject : public Serializable {
  RemoteObject() = default;
  explicit RemoteObject(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  std::string type;
  folly::Optional<std::string> subtype;
  folly::Optional<std::string> className;
  folly::Optional<folly::dynamic> value;
  folly::Optional<runtime::UnserializableValue> unserializableValue;
  folly::Optional<std::string> description;
  folly::Optional<runtime::RemoteObjectId> objectId;
};

struct runtime::CallFrame : public Serializable {
  CallFrame() = default;
  explicit CallFrame(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  std::string functionName;
  runtime::ScriptId scriptId{};
  std::string url;
  int lineNumber{};
  int columnNumber{};
};

struct runtime::StackTrace : public Serializable {
  StackTrace() = default;
  explicit StackTrace(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  folly::Optional<std::string> description;
  std::vector<runtime::CallFrame> callFrames;
  std::unique_ptr<runtime::StackTrace> parent;
};

struct runtime::ExceptionDetails : public Serializable {
  ExceptionDetails() = default;
  explicit ExceptionDetails(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  int exceptionId{};
  std::string text;
  int lineNumber{};
  int columnNumber{};
  folly::Optional<runtime::ScriptId> scriptId;
  folly::Optional<std::string> url;
  folly::Optional<runtime::StackTrace> stackTrace;
  folly::Optional<runtime::RemoteObject> exception;
  folly::Optional<runtime::ExecutionContextId> executionContextId;
};

struct debugger::Scope : public Serializable {
  Scope() = default;
  explicit Scope(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  std::string type;
  runtime::RemoteObject object{};
  folly::Optional<std::string> name;
  folly::Optional<debugger::Location> startLocation;
  folly::Optional<debugger::Location> endLocation;
};

struct debugger::CallFrame : public Serializable {
  CallFrame() = default;
  explicit CallFrame(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  debugger::CallFrameId callFrameId{};
  std::string functionName;
  debugger::Location location{};
  std::string url;
  std::vector<debugger::Scope> scopeChain;
  runtime::RemoteObject thisObj{};
  folly::Optional<runtime::RemoteObject> returnValue;
};

struct runtime::ExecutionContextDescription : public Serializable {
  ExecutionContextDescription() = default;
  explicit ExecutionContextDescription(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  runtime::ExecutionContextId id{};
  std::string origin;
  std::string name;
  folly::Optional<folly::dynamic> auxData;
  folly::Optional<bool> isPageContext;
  folly::Optional<bool> isDefault;
};

struct runtime::PropertyDescriptor : public Serializable {
  PropertyDescriptor() = default;
  explicit PropertyDescriptor(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  std::string name;
  folly::Optional<runtime::RemoteObject> value;
  folly::Optional<bool> writable;
  folly::Optional<runtime::RemoteObject> get;
  folly::Optional<runtime::RemoteObject> set;
  bool configurable{};
  bool enumerable{};
  folly::Optional<bool> wasThrown;
  folly::Optional<bool> isOwn;
  folly::Optional<runtime::RemoteObject> symbol;
};

struct runtime::InternalPropertyDescriptor : public Serializable {
  InternalPropertyDescriptor() = default;
  explicit InternalPropertyDescriptor(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  std::string name;
  folly::Optional<runtime::RemoteObject> value;
};

/// Requests
struct UnknownRequest : public Request {
  UnknownRequest();
  explicit UnknownRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  folly::Optional<folly::dynamic> params;
};

struct debugger::DisableRequest : public Request {
  DisableRequest();
  explicit DisableRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;
};

struct debugger::EnableRequest : public Request {
  EnableRequest();
  explicit EnableRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;
};

struct debugger::EvaluateOnCallFrameRequest : public Request {
  EvaluateOnCallFrameRequest();
  explicit EvaluateOnCallFrameRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  debugger::CallFrameId callFrameId{};
  std::string expression;
  folly::Optional<std::string> objectGroup;
  folly::Optional<bool> includeCommandLineAPI;
  folly::Optional<bool> silent;
  folly::Optional<bool> returnByValue;
};

struct debugger::PauseRequest : public Request {
  PauseRequest();
  explicit PauseRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;
};

struct debugger::RemoveBreakpointRequest : public Request {
  RemoveBreakpointRequest();
  explicit RemoveBreakpointRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  debugger::BreakpointId breakpointId{};
};

struct debugger::ResumeRequest : public Request {
  ResumeRequest();
  explicit ResumeRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;
};

struct debugger::SetBreakpointByUrlRequest : public Request {
  SetBreakpointByUrlRequest();
  explicit SetBreakpointByUrlRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  int lineNumber{};
  folly::Optional<std::string> url;
  folly::Optional<std::string> urlRegex;
  folly::Optional<int> columnNumber;
  folly::Optional<std::string> condition;
};

struct debugger::SetPauseOnExceptionsRequest : public Request {
  SetPauseOnExceptionsRequest();
  explicit SetPauseOnExceptionsRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  std::string state;
};

struct debugger::StepIntoRequest : public Request {
  StepIntoRequest();
  explicit StepIntoRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;
};

struct debugger::StepOutRequest : public Request {
  StepOutRequest();
  explicit StepOutRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;
};

struct debugger::StepOverRequest : public Request {
  StepOverRequest();
  explicit StepOverRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;
};

struct runtime::EvaluateRequest : public Request {
  EvaluateRequest();
  explicit EvaluateRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  std::string expression;
  folly::Optional<std::string> objectGroup;
  folly::Optional<bool> includeCommandLineAPI;
  folly::Optional<bool> silent;
  folly::Optional<runtime::ExecutionContextId> contextId;
  folly::Optional<bool> returnByValue;
  folly::Optional<bool> awaitPromise;
};

struct runtime::GetPropertiesRequest : public Request {
  GetPropertiesRequest();
  explicit GetPropertiesRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  runtime::RemoteObjectId objectId{};
  folly::Optional<bool> ownProperties;
};

/// Responses
struct ErrorResponse : public Response {
  ErrorResponse() = default;
  explicit ErrorResponse(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  int code;
  std::string message;
  folly::Optional<folly::dynamic> data;
};

struct OkResponse : public Response {
  OkResponse() = default;
  explicit OkResponse(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
};

struct debugger::EvaluateOnCallFrameResponse : public Response {
  EvaluateOnCallFrameResponse() = default;
  explicit EvaluateOnCallFrameResponse(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  runtime::RemoteObject result{};
  folly::Optional<runtime::ExceptionDetails> exceptionDetails;
};

struct debugger::SetBreakpointByUrlResponse : public Response {
  SetBreakpointByUrlResponse() = default;
  explicit SetBreakpointByUrlResponse(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  debugger::BreakpointId breakpointId{};
  std::vector<debugger::Location> locations;
};

struct runtime::EvaluateResponse : public Response {
  EvaluateResponse() = default;
  explicit EvaluateResponse(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  runtime::RemoteObject result{};
  folly::Optional<runtime::ExceptionDetails> exceptionDetails;
};

struct runtime::GetPropertiesResponse : public Response {
  GetPropertiesResponse() = default;
  explicit GetPropertiesResponse(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  std::vector<runtime::PropertyDescriptor> result;
  folly::Optional<std::vector<runtime::InternalPropertyDescriptor>>
      internalProperties;
  folly::Optional<runtime::ExceptionDetails> exceptionDetails;
};

/// Notifications
struct debugger::BreakpointResolvedNotification : public Notification {
  BreakpointResolvedNotification();
  explicit BreakpointResolvedNotification(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  debugger::BreakpointId breakpointId{};
  debugger::Location location{};
};

struct debugger::PausedNotification : public Notification {
  PausedNotification();
  explicit PausedNotification(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  std::vector<debugger::CallFrame> callFrames;
  std::string reason;
  folly::Optional<folly::dynamic> data;
  folly::Optional<std::vector<std::string>> hitBreakpoints;
  folly::Optional<runtime::StackTrace> asyncStackTrace;
};

struct debugger::ResumedNotification : public Notification {
  ResumedNotification();
  explicit ResumedNotification(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
};

struct debugger::ScriptParsedNotification : public Notification {
  ScriptParsedNotification();
  explicit ScriptParsedNotification(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  runtime::ScriptId scriptId{};
  std::string url;
  int startLine{};
  int startColumn{};
  int endLine{};
  int endColumn{};
  runtime::ExecutionContextId executionContextId{};
  std::string hash;
  folly::Optional<folly::dynamic> executionContextAuxData;
  folly::Optional<std::string> sourceMapURL;
};

struct runtime::ConsoleAPICalledNotification : public Notification {
  ConsoleAPICalledNotification();
  explicit ConsoleAPICalledNotification(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  std::string type;
  std::vector<runtime::RemoteObject> args;
  runtime::ExecutionContextId executionContextId{};
  runtime::Timestamp timestamp{};
  folly::Optional<runtime::StackTrace> stackTrace;
};

struct runtime::ExecutionContextCreatedNotification : public Notification {
  ExecutionContextCreatedNotification();
  explicit ExecutionContextCreatedNotification(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  runtime::ExecutionContextDescription context{};
};

} // namespace message
} // namespace chrome
} // namespace inspector
} // namespace hermes
} // namespace facebook
