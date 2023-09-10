// Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
// @generated SignedSource<<9d3e7527c4d2c6ae6b1c80ff06637b02>>

#pragma once

#include <hermes/inspector-modern/chrome/MessageInterfaces.h>

#include <optional>
#include <vector>

namespace facebook {
namespace hermes {
namespace inspector_modern {
namespace chrome {
namespace message {

template <typename T>
void deleter(T *p);
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
struct CustomPreview;
struct EntryPreview;
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
struct ObjectPreview;
struct PropertyDescriptor;
struct PropertyPreview;
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
  Location(Location &&) = default;
  Location(const Location &) = delete;
  explicit Location(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
  Location &operator=(const Location &) = delete;
  Location &operator=(Location &&) = default;

  runtime::ScriptId scriptId{};
  int lineNumber{};
  std::optional<int> columnNumber;
};

struct runtime::PropertyPreview : public Serializable {
  PropertyPreview() = default;
  PropertyPreview(PropertyPreview &&) = default;
  PropertyPreview(const PropertyPreview &) = delete;
  explicit PropertyPreview(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
  PropertyPreview &operator=(const PropertyPreview &) = delete;
  PropertyPreview &operator=(PropertyPreview &&) = default;

  std::string name;
  std::string type;
  std::optional<std::string> value;
  std::unique_ptr<
      runtime::ObjectPreview,
      std::function<void(runtime::ObjectPreview *)>>
      valuePreview{nullptr, deleter<runtime::ObjectPreview>};
  std::optional<std::string> subtype;
};

struct runtime::EntryPreview : public Serializable {
  EntryPreview() = default;
  EntryPreview(EntryPreview &&) = default;
  EntryPreview(const EntryPreview &) = delete;
  explicit EntryPreview(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
  EntryPreview &operator=(const EntryPreview &) = delete;
  EntryPreview &operator=(EntryPreview &&) = default;

  std::unique_ptr<
      runtime::ObjectPreview,
      std::function<void(runtime::ObjectPreview *)>>
      key{nullptr, deleter<runtime::ObjectPreview>};
  std::unique_ptr<
      runtime::ObjectPreview,
      std::function<void(runtime::ObjectPreview *)>>
      value{nullptr, deleter<runtime::ObjectPreview>};
};

struct runtime::ObjectPreview : public Serializable {
  ObjectPreview() = default;
  ObjectPreview(ObjectPreview &&) = default;
  ObjectPreview(const ObjectPreview &) = delete;
  explicit ObjectPreview(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
  ObjectPreview &operator=(const ObjectPreview &) = delete;
  ObjectPreview &operator=(ObjectPreview &&) = default;

  std::string type;
  std::optional<std::string> subtype;
  std::optional<std::string> description;
  bool overflow{};
  std::vector<runtime::PropertyPreview> properties;
  std::optional<std::vector<runtime::EntryPreview>> entries;
};

struct runtime::CustomPreview : public Serializable {
  CustomPreview() = default;
  CustomPreview(CustomPreview &&) = default;
  CustomPreview(const CustomPreview &) = delete;
  explicit CustomPreview(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
  CustomPreview &operator=(const CustomPreview &) = delete;
  CustomPreview &operator=(CustomPreview &&) = default;

  std::string header;
  std::optional<runtime::RemoteObjectId> bodyGetterId;
};

struct runtime::RemoteObject : public Serializable {
  RemoteObject() = default;
  RemoteObject(RemoteObject &&) = default;
  RemoteObject(const RemoteObject &) = delete;
  explicit RemoteObject(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
  RemoteObject &operator=(const RemoteObject &) = delete;
  RemoteObject &operator=(RemoteObject &&) = default;

  std::string type;
  std::optional<std::string> subtype;
  std::optional<std::string> className;
  std::optional<folly::dynamic> value;
  std::optional<runtime::UnserializableValue> unserializableValue;
  std::optional<std::string> description;
  std::optional<runtime::RemoteObjectId> objectId;
  std::optional<runtime::ObjectPreview> preview;
  std::optional<runtime::CustomPreview> customPreview;
};

struct runtime::CallFrame : public Serializable {
  CallFrame() = default;
  CallFrame(CallFrame &&) = default;
  CallFrame(const CallFrame &) = delete;
  explicit CallFrame(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
  CallFrame &operator=(const CallFrame &) = delete;
  CallFrame &operator=(CallFrame &&) = default;

  std::string functionName;
  runtime::ScriptId scriptId{};
  std::string url;
  int lineNumber{};
  int columnNumber{};
};

struct runtime::StackTrace : public Serializable {
  StackTrace() = default;
  StackTrace(StackTrace &&) = default;
  StackTrace(const StackTrace &) = delete;
  explicit StackTrace(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
  StackTrace &operator=(const StackTrace &) = delete;
  StackTrace &operator=(StackTrace &&) = default;

  std::optional<std::string> description;
  std::vector<runtime::CallFrame> callFrames;
  std::unique_ptr<runtime::StackTrace> parent;
};

struct runtime::ExceptionDetails : public Serializable {
  ExceptionDetails() = default;
  ExceptionDetails(ExceptionDetails &&) = default;
  ExceptionDetails(const ExceptionDetails &) = delete;
  explicit ExceptionDetails(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
  ExceptionDetails &operator=(const ExceptionDetails &) = delete;
  ExceptionDetails &operator=(ExceptionDetails &&) = default;

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
  Scope(Scope &&) = default;
  Scope(const Scope &) = delete;
  explicit Scope(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
  Scope &operator=(const Scope &) = delete;
  Scope &operator=(Scope &&) = default;

  std::string type;
  runtime::RemoteObject object{};
  std::optional<std::string> name;
  std::optional<debugger::Location> startLocation;
  std::optional<debugger::Location> endLocation;
};

struct debugger::CallFrame : public Serializable {
  CallFrame() = default;
  CallFrame(CallFrame &&) = default;
  CallFrame(const CallFrame &) = delete;
  explicit CallFrame(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
  CallFrame &operator=(const CallFrame &) = delete;
  CallFrame &operator=(CallFrame &&) = default;

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
  SamplingHeapProfileNode(SamplingHeapProfileNode &&) = default;
  SamplingHeapProfileNode(const SamplingHeapProfileNode &) = delete;
  explicit SamplingHeapProfileNode(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
  SamplingHeapProfileNode &operator=(const SamplingHeapProfileNode &) = delete;
  SamplingHeapProfileNode &operator=(SamplingHeapProfileNode &&) = default;

  runtime::CallFrame callFrame{};
  double selfSize{};
  int id{};
  std::vector<heapProfiler::SamplingHeapProfileNode> children;
};

struct heapProfiler::SamplingHeapProfileSample : public Serializable {
  SamplingHeapProfileSample() = default;
  SamplingHeapProfileSample(SamplingHeapProfileSample &&) = default;
  SamplingHeapProfileSample(const SamplingHeapProfileSample &) = delete;
  explicit SamplingHeapProfileSample(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
  SamplingHeapProfileSample &operator=(const SamplingHeapProfileSample &) =
      delete;
  SamplingHeapProfileSample &operator=(SamplingHeapProfileSample &&) = default;

  double size{};
  int nodeId{};
  double ordinal{};
};

struct heapProfiler::SamplingHeapProfile : public Serializable {
  SamplingHeapProfile() = default;
  SamplingHeapProfile(SamplingHeapProfile &&) = default;
  SamplingHeapProfile(const SamplingHeapProfile &) = delete;
  explicit SamplingHeapProfile(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
  SamplingHeapProfile &operator=(const SamplingHeapProfile &) = delete;
  SamplingHeapProfile &operator=(SamplingHeapProfile &&) = default;

  heapProfiler::SamplingHeapProfileNode head{};
  std::vector<heapProfiler::SamplingHeapProfileSample> samples;
};

struct profiler::PositionTickInfo : public Serializable {
  PositionTickInfo() = default;
  PositionTickInfo(PositionTickInfo &&) = default;
  PositionTickInfo(const PositionTickInfo &) = delete;
  explicit PositionTickInfo(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
  PositionTickInfo &operator=(const PositionTickInfo &) = delete;
  PositionTickInfo &operator=(PositionTickInfo &&) = default;

  int line{};
  int ticks{};
};

struct profiler::ProfileNode : public Serializable {
  ProfileNode() = default;
  ProfileNode(ProfileNode &&) = default;
  ProfileNode(const ProfileNode &) = delete;
  explicit ProfileNode(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
  ProfileNode &operator=(const ProfileNode &) = delete;
  ProfileNode &operator=(ProfileNode &&) = default;

  int id{};
  runtime::CallFrame callFrame{};
  std::optional<int> hitCount;
  std::optional<std::vector<int>> children;
  std::optional<std::string> deoptReason;
  std::optional<std::vector<profiler::PositionTickInfo>> positionTicks;
};

struct profiler::Profile : public Serializable {
  Profile() = default;
  Profile(Profile &&) = default;
  Profile(const Profile &) = delete;
  explicit Profile(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
  Profile &operator=(const Profile &) = delete;
  Profile &operator=(Profile &&) = default;

  std::vector<profiler::ProfileNode> nodes;
  double startTime{};
  double endTime{};
  std::optional<std::vector<int>> samples;
  std::optional<std::vector<int>> timeDeltas;
};

struct runtime::CallArgument : public Serializable {
  CallArgument() = default;
  CallArgument(CallArgument &&) = default;
  CallArgument(const CallArgument &) = delete;
  explicit CallArgument(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
  CallArgument &operator=(const CallArgument &) = delete;
  CallArgument &operator=(CallArgument &&) = default;

  std::optional<folly::dynamic> value;
  std::optional<runtime::UnserializableValue> unserializableValue;
  std::optional<runtime::RemoteObjectId> objectId;
};

struct runtime::ExecutionContextDescription : public Serializable {
  ExecutionContextDescription() = default;
  ExecutionContextDescription(ExecutionContextDescription &&) = default;
  ExecutionContextDescription(const ExecutionContextDescription &) = delete;
  explicit ExecutionContextDescription(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
  ExecutionContextDescription &operator=(const ExecutionContextDescription &) =
      delete;
  ExecutionContextDescription &operator=(ExecutionContextDescription &&) =
      default;

  runtime::ExecutionContextId id{};
  std::string origin;
  std::string name;
  std::optional<folly::dynamic> auxData;
};

struct runtime::PropertyDescriptor : public Serializable {
  PropertyDescriptor() = default;
  PropertyDescriptor(PropertyDescriptor &&) = default;
  PropertyDescriptor(const PropertyDescriptor &) = delete;
  explicit PropertyDescriptor(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
  PropertyDescriptor &operator=(const PropertyDescriptor &) = delete;
  PropertyDescriptor &operator=(PropertyDescriptor &&) = default;

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
  InternalPropertyDescriptor(InternalPropertyDescriptor &&) = default;
  InternalPropertyDescriptor(const InternalPropertyDescriptor &) = delete;
  explicit InternalPropertyDescriptor(const folly::dynamic &obj);
  folly::dynamic toDynamic() const override;
  InternalPropertyDescriptor &operator=(const InternalPropertyDescriptor &) =
      delete;
  InternalPropertyDescriptor &operator=(InternalPropertyDescriptor &&) =
      default;

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
  std::optional<bool> generatePreview;
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
  std::optional<bool> includeObjectsCollectedByMajorGC;
  std::optional<bool> includeObjectsCollectedByMinorGC;
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
  std::optional<bool> generatePreview;
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
  std::optional<bool> generatePreview;
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
  std::optional<bool> generatePreview;
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
} // namespace inspector_modern
} // namespace hermes
} // namespace facebook
