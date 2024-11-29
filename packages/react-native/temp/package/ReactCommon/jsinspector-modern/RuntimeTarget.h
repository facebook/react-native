/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>

#include "ConsoleMessage.h"
#include "ExecutionContext.h"
#include "InspectorInterfaces.h"
#include "RuntimeAgent.h"
#include "ScopedExecutor.h"
#include "StackTrace.h"
#include "WeakList.h"

#include <memory>

#ifndef JSINSPECTOR_EXPORT
#ifdef _MSC_VER
#ifdef CREATE_SHARED_LIBRARY
#define JSINSPECTOR_EXPORT __declspec(dllexport)
#else
#define JSINSPECTOR_EXPORT
#endif // CREATE_SHARED_LIBRARY
#else // _MSC_VER
#define JSINSPECTOR_EXPORT __attribute__((visibility("default")))
#endif // _MSC_VER
#endif // !defined(JSINSPECTOR_EXPORT)

namespace facebook::react::jsinspector_modern {

class RuntimeAgent;
class RuntimeAgentDelegate;
class RuntimeTarget;
struct SessionState;

/**
 * Receives events from a RuntimeTarget. This is a shared interface that
 * each React Native platform needs to implement in order to integrate with
 * the debugging stack.
 */
class RuntimeTargetDelegate {
 public:
  virtual ~RuntimeTargetDelegate() = default;
  virtual std::unique_ptr<RuntimeAgentDelegate> createAgentDelegate(
      FrontendChannel channel,
      SessionState& sessionState,
      std::unique_ptr<RuntimeAgentDelegate::ExportedState>
          previouslyExportedState,
      const ExecutionContextDescription& executionContextDescription,
      RuntimeExecutor runtimeExecutor) = 0;

  /**
   * Called when the runtime intercepts a console API call. The target delegate
   * should notify the frontend (via its agent delegates) of the message, and
   * perform any buffering required for logging the message later (in the
   * existing and/or new sessions).
   *
   * \note The method is called on the JS thread, and receives a valid reference
   * to the current \c jsi::Runtime. The callee MAY use its own intrinsic
   * Runtime reference, if it has one, without checking it for equivalence with
   * the one provided here.
   */
  virtual void addConsoleMessage(
      jsi::Runtime& runtime,
      ConsoleMessage message) = 0;

  /**
   * \returns true if the runtime supports reporting console API calls over CDP.
   * \c addConsoleMessage MAY be called even if this method returns false.
   */
  virtual bool supportsConsole() const = 0;

  /**
   * \returns an opaque representation of a stack trace. This may be passed back
   * to the `RuntimeTargetDelegate` as part of `addConsoleMessage` or other APIs
   * that report stack traces.
   * \param framesToSkip The number of call frames to skip. The first call frame
   * is the topmost (current) frame on the Runtime's call stack, which will
   * typically be the (native) JSI HostFunction that called this method.
   * \note The method is called on the JS thread, and receives a valid reference
   * to the current \c jsi::Runtime. The callee MAY use its own intrinsic
   * Runtime reference, if it has one, without checking it for equivalence with
   * the one provided here.
   */
  virtual std::unique_ptr<StackTrace> captureStackTrace(
      jsi::Runtime& runtime,
      size_t framesToSkip = 0) = 0;
};

/**
 * The limited interface that RuntimeTarget exposes to its connected agents.
 */
class RuntimeTargetController {
 public:
  explicit RuntimeTargetController(RuntimeTarget& target);

  /**
   * Adds a function with the given name on the runtime's global object, that
   * when called will send a Runtime.bindingCalled event through all connected
   * sessions that have registered to receive binding events for that name.
   */
  void installBindingHandler(const std::string& bindingName);

  /**
   * Notifies the target to emit some message that debugger session is
   * created.
   */
  void notifyDebuggerSessionCreated();

  /**
   * Notifies the target to emit some message that debugger session is
   * destroyed.
   */
  void notifyDebuggerSessionDestroyed();

 private:
  RuntimeTarget& target_;
};

/**
 * A Target corresponding to a JavaScript runtime.
 */
class JSINSPECTOR_EXPORT RuntimeTarget
    : public EnableExecutorFromThis<RuntimeTarget> {
 public:
  /**
   * \param executionContextDescription A description of the execution context
   * represented by this runtime. This is used for disambiguating the
   * source/destination of CDP messages when there are multiple runtimes
   * (concurrently or over the life of a Host).
   * \param delegate The object that will receive events from this target. The
   * caller is responsible for ensuring that the delegate outlives this object
   * AND that it remains valid for as long as the JS runtime is executing any
   * code, even if the \c RuntimeTarget itself is destroyed. The delegate SHOULD
   * be the object that owns the underlying jsi::Runtime, if any.
   * \param jsExecutor A RuntimeExecutor that can be used to schedule work on
   * the JS runtime's thread. The executor's queue should be empty when
   * RuntimeTarget is constructed (i.e. anything scheduled during the
   * constructor should be executed before any user code is run).
   * \param selfExecutor An executor that may be used to call methods on this
   * RuntimeTarget while it exists. \c create additionally guarantees that the
   * executor will not be called after the RuntimeTarget is destroyed.
   */
  static std::shared_ptr<RuntimeTarget> create(
      const ExecutionContextDescription& executionContextDescription,
      RuntimeTargetDelegate& delegate,
      RuntimeExecutor jsExecutor,
      VoidExecutor selfExecutor);

  RuntimeTarget(const RuntimeTarget&) = delete;
  RuntimeTarget(RuntimeTarget&&) = delete;
  RuntimeTarget& operator=(const RuntimeTarget&) = delete;
  RuntimeTarget& operator=(RuntimeTarget&&) = delete;
  ~RuntimeTarget();

  /**
   * Create a new RuntimeAgent that can be used to debug the underlying JS VM.
   * The agent will be destroyed when the session ends, the containing
   * InstanceTarget is unregistered from its HostTarget, or the RuntimeAgent is
   * unregistered from its InstanceTarget (whichever happens first).
   * \param channel A thread-safe channel forHostTargetDP messages to the
   * frontend.
   * \returns The new agent, or nullptr if the runtime is not debuggable.
   */
  std::shared_ptr<RuntimeAgent> createAgent(
      FrontendChannel channel,
      SessionState& sessionState);

 private:
  /**
   * Constructs a new RuntimeTarget. The caller must call setExecutor
   * immediately afterwards.
   * \param executionContextDescription A description of the execution context
   * represented by this runtime. This is used for disambiguating the
   * source/destination of CDP messages when there are multiple runtimes
   * (concurrently or over the life of a Host).
   * \param delegate The object that will receive events from this target. The
   * caller is responsible for ensuring that the delegate outlives this object
   * AND that it remains valid for as long as the JS runtime is executing any
   * code, even if the \c RuntimeTarget itself is destroyed. The delegate SHOULD
   * be the object that owns the underlying jsi::Runtime, if any.
   * \param jsExecutor A RuntimeExecutor that can be used to schedule work on
   * the JS runtime's thread. The executor's queue should be empty when
   * RuntimeTarget is constructed (i.e. anything scheduled during the
   * constructor should be executed before any user code is run).
   */
  RuntimeTarget(
      const ExecutionContextDescription& executionContextDescription,
      RuntimeTargetDelegate& delegate,
      RuntimeExecutor jsExecutor);

  const ExecutionContextDescription executionContextDescription_;
  RuntimeTargetDelegate& delegate_;
  RuntimeExecutor jsExecutor_;
  WeakList<RuntimeAgent> agents_;
  RuntimeTargetController controller_{*this};

  /**
   * Adds a function with the given name on the runtime's global object, that
   * when called will send a Runtime.bindingCalled event through all connected
   * sessions that have registered to receive binding events for that name.
   */
  void installBindingHandler(const std::string& bindingName);

  /**
   * Installs any global values we want to expose to framework/user JavaScript
   * code.
   */
  void installGlobals();

  /**
   * Install the console API handler.
   */
  void installConsoleHandler();

  /**
   * Installs __DEBUGGER_SESSION_OBSERVER__ object on the JavaScript's global
   * object, which later could be referenced from JavaScript side for
   * determining the status of the debugger session.
   */
  void installDebuggerSessionObserver();

  /**
   * Propagates the debugger session state change to the JavaScript via calling
   * onStatusChange on __DEBUGGER_SESSION_OBSERVER__.
   */
  void emitDebuggerSessionCreated();

  /**
   * Propagates the debugger session state change to the JavaScript via calling
   * onStatusChange on __DEBUGGER_SESSION_OBSERVER__.
   */
  void emitDebuggerSessionDestroyed();

  // Necessary to allow RuntimeAgent to access RuntimeTarget's internals in a
  // controlled way (i.e. only RuntimeTargetController gets friend access, while
  // RuntimeAgent itself doesn't).
  friend class RuntimeTargetController;
};

} // namespace facebook::react::jsinspector_modern
