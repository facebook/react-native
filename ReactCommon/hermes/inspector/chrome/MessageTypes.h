// Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
// @generated SignedSource<<521cb6eba7e5df060b4836f0f60126b9>>

#pragma once

#include <hermes/inspector/chrome/MessageInterfaces.h>

#include <optional>
#include <vector>

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
struct SetBreakpointRequest;
struct SetBreakpointResponse;
struct SetBreakpointsActiveRequest;
struct SetInstrumentationBreakpointRequest;
struct SetInstrumentationBreakpointResponse;
struct SetPauseOnExceptionsRequest;
struct StepIntoRequest;
struct StepOutRequest;
struct StepOverRequest;
} // namespace debugger

namespace runtime {
struct CallArgument;
struct CallFrame;
struct CallFunctionOnRequest;
struct CallFunctionOnResponse;
struct CompileScriptRequest;
struct CompileScriptResponse;
struct ConsoleAPICalledNotification;
struct EvaluateRequest;
struct EvaluateResponse;
struct ExceptionDetails;
struct ExecutionContextCreatedNotification;
struct ExecutionContextDescription;
using ExecutionContextId = int;
struct GetHeapUsageRequest;
struct GetHeapUsageResponse;
struct GetPropertiesRequest;
struct GetPropertiesResponse;
struct GlobalLexicalScopeNamesRequest;
struct GlobalLexicalScopeNamesResponse;
struct InternalPropertyDescriptor;
struct PropertyDescriptor;
struct RemoteObject;
using RemoteObjectId = std::string;
struct RunIfWaitingForDebuggerRequest;
using ScriptId = std::string;
struct StackTrace;
using Timestamp = double;
using UnserializableValue = std::string;
} // namespace runtime

namespace heapProfiler {
struct AddHeapSnapshotChunkNotification;
struct CollectGarbageRequest;
struct GetHeapObjectIdRequest;
struct GetHeapObjectIdResponse;
struct GetObjectByHeapObjectIdRequest;
struct GetObjectByHeapObjectIdResponse;
using HeapSnapshotObjectId = std::string;
struct HeapStatsUpdateNotification;
struct LastSeenObjectIdNotification;
struct ReportHeapSnapshotProgressNotification;
struct SamplingHeapProfile;
struct SamplingHeapProfileNode;
struct SamplingHeapProfileSample;
struct StartSamplingRequest;
struct StartTrackingHeapObjectsRequest;
struct StopSamplingRequest;
struct StopSamplingResponse;
struct StopTrackingHeapObjectsRequest;
struct TakeHeapSnapshotRequest;
} // namespace heapProfiler

namespace profiler {
struct PositionTickInfo;
struct Profile;
struct ProfileNode;
struct StartRequest;
struct StopRequest;
struct StopResponse;
} // namespace profiler

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
  virtual void handle(const debugger::SetBreakpointRequest &req) = 0;
  virtual void handle(const debugger::SetBreakpointByUrlRequest &req) = 0;
  virtual void handle(const debugger::SetBreakpointsActiveRequest &req) = 0;
  virtual void handle(
      const debugger::SetInstrumentationBreakpointRequest &req) = 0;
  virtual void handle(const debugger::SetPauseOnExceptionsRequest &req) = 0;
  virtual void handle(const debugger::StepIntoRequest &req) = 0;
  virtual void handle(const debugger::StepOutRequest &req) = 0;
  virtual void handle(const debugger::StepOverRequest &req) = 0;
  virtual void handle(const heapProfiler::CollectGarbageRequest &req) = 0;
  virtual void handle(const heapProfiler::GetHeapObjectIdRequest &req) = 0;
  virtual void handle(
      const heapProfiler::GetObjectByHeapObjectIdRequest &req) = 0;
  virtual void handle(const heapProfiler::StartSamplingRequest &req) = 0;
  virtual void handle(
      const heapProfiler::StartTrackingHeapObjectsRequest &req) = 0;
  virtual void handle(const heapProfiler::StopSamplingRequest &req) = 0;
  virtual void handle(
      const heapProfiler::StopTrackingHeapObjectsRequest &req) = 0;
  virtual void handle(const heapProfiler::TakeHeapSnapshotRequest &req) = 0;
  virtual void handle(const profiler::StartRequest &req) = 0;
  virtual void handle(const profiler::StopRequest &req) = 0;
  virtual void handle(const runtime::CallFunctionOnRequest &req) = 0;
  virtual void handle(const runtime::CompileScriptRequest &req) = 0;
  virtual void handle(const runtime::EvaluateRequest &req) = 0;
  virtual void handle(const runtime::GetHeapUsageRequest &req) = 0;
  virtual void handle(const runtime::GetPropertiesRequest &req) = 0;
  virtual void handle(const runtime::GlobalLexicalScopeNamesRequest &req) = 0;
  virtual void handle(const runtime::RunIfWaitingForDebuggerRequest &req) = 0;
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
  void handle(const debugger::SetBreakpointRequest &req) override {}
  void handle(const debugger::SetBreakpointByUrlRequest &req) override {}
  void handle(const debugger::SetBreakpointsActiveRequest &req) override {}
  void handle(
      const debugger::SetInstrumentationBreakpointRequest &req) override {}
  void handle(const debugger::SetPauseOnExceptionsRequest &req) override {}
  void handle(const debugger::StepIntoRequest &req) override {}
  void handle(const debugger::StepOutRequest &req) override {}
  void handle(const debugger::StepOverRequest &req) override {}
  void handle(const heapProfiler::CollectGarbageRequest &req) override {}
  void handle(const heapProfiler::GetHeapObjectIdRequest &req) override {}
  void handle(
      const heapProfiler::GetObjectByHeapObjectIdRequest &req) override {}
  void handle(const heapProfiler::StartSamplingRequest &req) override {}
  void handle(
      const heapProfiler::StartTrackingHeapObjectsRequest &req) override {}
  void handle(const heapProfiler::StopSamplingRequest &req) override {}
  void handle(
      const heapProfiler::StopTrackingHeapObjectsRequest &req) override {}
  void handle(const heapProfiler::TakeHeapSnapshotRequest &req) override {}
  void handle(const profiler::StartRequest &req) override {}
  void handle(const profiler::StopRequest &req) override {}
  void handle(const runtime::CallFunctionOnRequest &req) override {}
  void handle(const runtime::CompileScriptRequest &req) override {}
  void handle(const runtime::EvaluateRequest &req) override {}
  void handle(const runtime::GetHeapUsageRequest &req) override {}
  void handle(const runtime::GetPropertiesRequest &req) override {}
  void handle(const runtime::GlobalLexicalScopeNamesRequest &req) override {}
  void handle(const runtime::RunIfWaitingForDebuggerRequest &req) override {}
};

/// Types
struct debugger::Location : public Serializable {
  Location() = default;
  explicit Location(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  runtime::ScriptId scriptId{};
  int lineNumber{};
  std::optional<int> columnNumber;
};

struct runtime::RemoteObject : public Serializable {
  RemoteObject() = default;
  explicit RemoteObject(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  std::string type;
  std::optional<std::string> subtype;
  std::optional<std::string> className;
  std::optional<folly::dynamic> value;
  std::optional<runtime::UnserializableValue> unserializableValue;
  std::optional<std::string> description;
  std::optional<runtime::RemoteObjectId> objectId;
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

  std::optional<std::string> description;
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
  std::optional<runtime::ScriptId> scriptId;
  std::optional<std::string> url;
  std::optional<runtime::StackTrace> stackTrace;
  std::optional<runtime::RemoteObject> exception;
  std::optional<runtime::ExecutionContextId> executionContextId;
};

struct debugger::Scope : public Serializable {
  Scope() = default;
  explicit Scope(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  std::string type;
  runtime::RemoteObject object{};
  std::optional<std::string> name;
  std::optional<debugger::Location> startLocation;
  std::optional<debugger::Location> endLocation;
};

struct debugger::CallFrame : public Serializable {
  CallFrame() = default;
  explicit CallFrame(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  debugger::CallFrameId callFrameId{};
  std::string functionName;
  std::optional<debugger::Location> functionLocation;
  debugger::Location location{};
  std::string url;
  std::vector<debugger::Scope> scopeChain;
  runtime::RemoteObject thisObj{};
  std::optional<runtime::RemoteObject> returnValue;
};

struct heapProfiler::SamplingHeapProfileNode : public Serializable {
  SamplingHeapProfileNode() = default;
  explicit SamplingHeapProfileNode(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  runtime::CallFrame callFrame{};
  double selfSize{};
  int id{};
  std::vector<heapProfiler::SamplingHeapProfileNode> children;
};

struct heapProfiler::SamplingHeapProfileSample : public Serializable {
  SamplingHeapProfileSample() = default;
  explicit SamplingHeapProfileSample(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  double size{};
  int nodeId{};
  double ordinal{};
};

struct heapProfiler::SamplingHeapProfile : public Serializable {
  SamplingHeapProfile() = default;
  explicit SamplingHeapProfile(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  heapProfiler::SamplingHeapProfileNode head{};
  std::vector<heapProfiler::SamplingHeapProfileSample> samples;
};

struct profiler::PositionTickInfo : public Serializable {
  PositionTickInfo() = default;
  explicit PositionTickInfo(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  int line{};
  int ticks{};
};

struct profiler::ProfileNode : public Serializable {
  ProfileNode() = default;
  explicit ProfileNode(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  int id{};
  runtime::CallFrame callFrame{};
  std::optional<int> hitCount;
  std::optional<std::vector<int>> children;
  std::optional<std::string> deoptReason;
  std::optional<std::vector<profiler::PositionTickInfo>> positionTicks;
};

struct profiler::Profile : public Serializable {
  Profile() = default;
  explicit Profile(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  std::vector<profiler::ProfileNode> nodes;
  double startTime{};
  double endTime{};
  std::optional<std::vector<int>> samples;
  std::optional<std::vector<int>> timeDeltas;
};

struct runtime::CallArgument : public Serializable {
  CallArgument() = default;
  explicit CallArgument(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  std::optional<folly::dynamic> value;
  std::optional<runtime::UnserializableValue> unserializableValue;
  std::optional<runtime::RemoteObjectId> objectId;
};

struct runtime::ExecutionContextDescription : public Serializable {
  ExecutionContextDescription() = default;
  explicit ExecutionContextDescription(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  runtime::ExecutionContextId id{};
  std::string origin;
  std::string name;
  std::optional<folly::dynamic> auxData;
};

struct runtime::PropertyDescriptor : public Serializable {
  PropertyDescriptor() = default;
  explicit PropertyDescriptor(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  std::string name;
  std::optional<runtime::RemoteObject> value;
  std::optional<bool> writable;
  std::optional<runtime::RemoteObject> get;
  std::optional<runtime::RemoteObject> set;
  bool configurable{};
  bool enumerable{};
  std::optional<bool> wasThrown;
  std::optional<bool> isOwn;
  std::optional<runtime::RemoteObject> symbol;
};

struct runtime::InternalPropertyDescriptor : public Serializable {
  InternalPropertyDescriptor() = default;
  explicit InternalPropertyDescriptor(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  std::string name;
  std::optional<runtime::RemoteObject> value;
};

/// Requests
struct UnknownRequest : public Request {
  UnknownRequest();
  explicit UnknownRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  std::optional<folly::dynamic> params;
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
  std::optional<std::string> objectGroup;
  std::optional<bool> includeCommandLineAPI;
  std::optional<bool> silent;
  std::optional<bool> returnByValue;
  std::optional<bool> throwOnSideEffect;
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

  std::optional<bool> terminateOnResume;
};

struct debugger::SetBreakpointRequest : public Request {
  SetBreakpointRequest();
  explicit SetBreakpointRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  debugger::Location location{};
  std::optional<std::string> condition;
};

struct debugger::SetBreakpointByUrlRequest : public Request {
  SetBreakpointByUrlRequest();
  explicit SetBreakpointByUrlRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  int lineNumber{};
  std::optional<std::string> url;
  std::optional<std::string> urlRegex;
  std::optional<std::string> scriptHash;
  std::optional<int> columnNumber;
  std::optional<std::string> condition;
};

struct debugger::SetBreakpointsActiveRequest : public Request {
  SetBreakpointsActiveRequest();
  explicit SetBreakpointsActiveRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  bool active{};
};

struct debugger::SetInstrumentationBreakpointRequest : public Request {
  SetInstrumentationBreakpointRequest();
  explicit SetInstrumentationBreakpointRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  std::string instrumentation;
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

struct heapProfiler::CollectGarbageRequest : public Request {
  CollectGarbageRequest();
  explicit CollectGarbageRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;
};

struct heapProfiler::GetHeapObjectIdRequest : public Request {
  GetHeapObjectIdRequest();
  explicit GetHeapObjectIdRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  runtime::RemoteObjectId objectId{};
};

struct heapProfiler::GetObjectByHeapObjectIdRequest : public Request {
  GetObjectByHeapObjectIdRequest();
  explicit GetObjectByHeapObjectIdRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  heapProfiler::HeapSnapshotObjectId objectId{};
  std::optional<std::string> objectGroup;
};

struct heapProfiler::StartSamplingRequest : public Request {
  StartSamplingRequest();
  explicit StartSamplingRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  std::optional<double> samplingInterval;
};

struct heapProfiler::StartTrackingHeapObjectsRequest : public Request {
  StartTrackingHeapObjectsRequest();
  explicit StartTrackingHeapObjectsRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  std::optional<bool> trackAllocations;
};

struct heapProfiler::StopSamplingRequest : public Request {
  StopSamplingRequest();
  explicit StopSamplingRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;
};

struct heapProfiler::StopTrackingHeapObjectsRequest : public Request {
  StopTrackingHeapObjectsRequest();
  explicit StopTrackingHeapObjectsRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  std::optional<bool> reportProgress;
  std::optional<bool> treatGlobalObjectsAsRoots;
  std::optional<bool> captureNumericValue;
};

struct heapProfiler::TakeHeapSnapshotRequest : public Request {
  TakeHeapSnapshotRequest();
  explicit TakeHeapSnapshotRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  std::optional<bool> reportProgress;
  std::optional<bool> treatGlobalObjectsAsRoots;
  std::optional<bool> captureNumericValue;
};

struct profiler::StartRequest : public Request {
  StartRequest();
  explicit StartRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;
};

struct profiler::StopRequest : public Request {
  StopRequest();
  explicit StopRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;
};

struct runtime::CallFunctionOnRequest : public Request {
  CallFunctionOnRequest();
  explicit CallFunctionOnRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  std::string functionDeclaration;
  std::optional<runtime::RemoteObjectId> objectId;
  std::optional<std::vector<runtime::CallArgument>> arguments;
  std::optional<bool> silent;
  std::optional<bool> returnByValue;
  std::optional<bool> userGesture;
  std::optional<bool> awaitPromise;
  std::optional<runtime::ExecutionContextId> executionContextId;
  std::optional<std::string> objectGroup;
};

struct runtime::CompileScriptRequest : public Request {
  CompileScriptRequest();
  explicit CompileScriptRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  std::string expression;
  std::string sourceURL;
  bool persistScript{};
  std::optional<runtime::ExecutionContextId> executionContextId;
};

struct runtime::EvaluateRequest : public Request {
  EvaluateRequest();
  explicit EvaluateRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  std::string expression;
  std::optional<std::string> objectGroup;
  std::optional<bool> includeCommandLineAPI;
  std::optional<bool> silent;
  std::optional<runtime::ExecutionContextId> contextId;
  std::optional<bool> returnByValue;
  std::optional<bool> userGesture;
  std::optional<bool> awaitPromise;
};

struct runtime::GetHeapUsageRequest : public Request {
  GetHeapUsageRequest();
  explicit GetHeapUsageRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;
};

struct runtime::GetPropertiesRequest : public Request {
  GetPropertiesRequest();
  explicit GetPropertiesRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  runtime::RemoteObjectId objectId{};
  std::optional<bool> ownProperties;
};

struct runtime::GlobalLexicalScopeNamesRequest : public Request {
  GlobalLexicalScopeNamesRequest();
  explicit GlobalLexicalScopeNamesRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;

  std::optional<runtime::ExecutionContextId> executionContextId;
};

struct runtime::RunIfWaitingForDebuggerRequest : public Request {
  RunIfWaitingForDebuggerRequest();
  explicit RunIfWaitingForDebuggerRequest(const folly::dynamic &obj);

  folly::dynamic toDynamic() const override;
  void accept(RequestHandler &handler) const override;
};

/// Responses
struct ErrorResponse : public Response {
  ErrorResponse() = default;
  explicit ErrorResponse(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  int code;
  std::string message;
  std::optional<folly::dynamic> data;
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
  std::optional<runtime::ExceptionDetails> exceptionDetails;
};

struct debugger::SetBreakpointResponse : public Response {
  SetBreakpointResponse() = default;
  explicit SetBreakpointResponse(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  debugger::BreakpointId breakpointId{};
  debugger::Location actualLocation{};
};

struct debugger::SetBreakpointByUrlResponse : public Response {
  SetBreakpointByUrlResponse() = default;
  explicit SetBreakpointByUrlResponse(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  debugger::BreakpointId breakpointId{};
  std::vector<debugger::Location> locations;
};

struct debugger::SetInstrumentationBreakpointResponse : public Response {
  SetInstrumentationBreakpointResponse() = default;
  explicit SetInstrumentationBreakpointResponse(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  debugger::BreakpointId breakpointId{};
};

struct heapProfiler::GetHeapObjectIdResponse : public Response {
  GetHeapObjectIdResponse() = default;
  explicit GetHeapObjectIdResponse(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  heapProfiler::HeapSnapshotObjectId heapSnapshotObjectId{};
};

struct heapProfiler::GetObjectByHeapObjectIdResponse : public Response {
  GetObjectByHeapObjectIdResponse() = default;
  explicit GetObjectByHeapObjectIdResponse(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  runtime::RemoteObject result{};
};

struct heapProfiler::StopSamplingResponse : public Response {
  StopSamplingResponse() = default;
  explicit StopSamplingResponse(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  heapProfiler::SamplingHeapProfile profile{};
};

struct profiler::StopResponse : public Response {
  StopResponse() = default;
  explicit StopResponse(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  profiler::Profile profile{};
};

struct runtime::CallFunctionOnResponse : public Response {
  CallFunctionOnResponse() = default;
  explicit CallFunctionOnResponse(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  runtime::RemoteObject result{};
  std::optional<runtime::ExceptionDetails> exceptionDetails;
};

struct runtime::CompileScriptResponse : public Response {
  CompileScriptResponse() = default;
  explicit CompileScriptResponse(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  std::optional<runtime::ScriptId> scriptId;
  std::optional<runtime::ExceptionDetails> exceptionDetails;
};

struct runtime::EvaluateResponse : public Response {
  EvaluateResponse() = default;
  explicit EvaluateResponse(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  runtime::RemoteObject result{};
  std::optional<runtime::ExceptionDetails> exceptionDetails;
};

struct runtime::GetHeapUsageResponse : public Response {
  GetHeapUsageResponse() = default;
  explicit GetHeapUsageResponse(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  double usedSize{};
  double totalSize{};
};

struct runtime::GetPropertiesResponse : public Response {
  GetPropertiesResponse() = default;
  explicit GetPropertiesResponse(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  std::vector<runtime::PropertyDescriptor> result;
  std::optional<std::vector<runtime::InternalPropertyDescriptor>>
      internalProperties;
  std::optional<runtime::ExceptionDetails> exceptionDetails;
};

struct runtime::GlobalLexicalScopeNamesResponse : public Response {
  GlobalLexicalScopeNamesResponse() = default;
  explicit GlobalLexicalScopeNamesResponse(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  std::vector<std::string> names;
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
  std::optional<folly::dynamic> data;
  std::optional<std::vector<std::string>> hitBreakpoints;
  std::optional<runtime::StackTrace> asyncStackTrace;
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
  std::optional<folly::dynamic> executionContextAuxData;
  std::optional<std::string> sourceMapURL;
  std::optional<bool> hasSourceURL;
  std::optional<bool> isModule;
  std::optional<int> length;
};

struct heapProfiler::AddHeapSnapshotChunkNotification : public Notification {
  AddHeapSnapshotChunkNotification();
  explicit AddHeapSnapshotChunkNotification(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  std::string chunk;
};

struct heapProfiler::HeapStatsUpdateNotification : public Notification {
  HeapStatsUpdateNotification();
  explicit HeapStatsUpdateNotification(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  std::vector<int> statsUpdate;
};

struct heapProfiler::LastSeenObjectIdNotification : public Notification {
  LastSeenObjectIdNotification();
  explicit LastSeenObjectIdNotification(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  int lastSeenObjectId{};
  double timestamp{};
};

struct heapProfiler::ReportHeapSnapshotProgressNotification
    : public Notification {
  ReportHeapSnapshotProgressNotification();
  explicit ReportHeapSnapshotProgressNotification(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  int done{};
  int total{};
  std::optional<bool> finished;
};

struct runtime::ConsoleAPICalledNotification : public Notification {
  ConsoleAPICalledNotification();
  explicit ConsoleAPICalledNotification(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;

  std::string type;
  std::vector<runtime::RemoteObject> args;
  runtime::ExecutionContextId executionContextId{};
  runtime::Timestamp timestamp{};
  std::optional<runtime::StackTrace> stackTrace;
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
