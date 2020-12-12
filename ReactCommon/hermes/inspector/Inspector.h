/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// using include guards instead of #pragma once due to compile issues
// with MSVC and BUCK
#ifndef HERMES_INSPECTOR_INSPECTOR_H
#define HERMES_INSPECTOR_INSPECTOR_H

#include <memory>
#include <queue>
#include <unordered_map>

#include <folly/Executor.h>
#include <folly/Unit.h>
#include <folly/futures/Future.h>
#include <hermes/DebuggerAPI.h>
#include <hermes/hermes.h>
#include <hermes/inspector/AsyncPauseState.h>
#include <hermes/inspector/RuntimeAdapter.h>

namespace facebook {
namespace hermes {
namespace inspector {

class Inspector;
class InspectorState;

/**
 * ScriptInfo contains info about loaded scripts.
 */
struct ScriptInfo {
  uint32_t fileId{};
  std::string fileName;
  std::string sourceMappingUrl;
};

struct ConsoleMessageInfo {
  std::string source;
  std::string level;
  std::string url;
  int line;
  int column;

  jsi::Array args;

  ConsoleMessageInfo(std::string level, jsi::Array args)
      : source("console-api"),
        level(level),
        url(""),
        line(-1),
        column(-1),
        args(std::move(args)) {}
};

enum PauseOnLoadMode { None, Smart, All };

/**
 * InspectorObserver notifies the observer of events that occur in the VM.
 */
class InspectorObserver {
 public:
  virtual ~InspectorObserver() = default;

  /// onContextCreated fires when the VM is created.
  virtual void onContextCreated(Inspector &inspector) = 0;

  /// onBreakpointResolve fires when a lazy breakpoint is resolved.
  virtual void onBreakpointResolved(
      Inspector &inspector,
      const facebook::hermes::debugger::BreakpointInfo &info) = 0;

  /// onPause fires when VM transitions from running to paused state. This is
  /// called directly on the JS thread while the VM is paused, so the receiver
  /// can call debugger::ProgramState methods safely.
  virtual void onPause(
      Inspector &inspector,
      const facebook::hermes::debugger::ProgramState &state) = 0;

  /// onResume fires when VM transitions from paused to running state.
  virtual void onResume(Inspector &inspector) = 0;

  /// onScriptParsed fires when after the VM parses a script.
  virtual void onScriptParsed(Inspector &inspector, const ScriptInfo &info) = 0;

  // onMessageAdded fires when new console message is added.
  virtual void onMessageAdded(
      Inspector &inspector,
      const ConsoleMessageInfo &info) = 0;
};

/**
 * Inspector implements a future-based interface over the low-level Hermes
 * debugging API.
 */
class Inspector : public facebook::hermes::debugger::EventObserver,
                  public std::enable_shared_from_this<Inspector> {
 public:
  /**
   * Inspector's constructor should be used to install the inspector on the
   * provided runtime before any JS executes in the runtime.
   */
  Inspector(
      std::shared_ptr<RuntimeAdapter> adapter,
      InspectorObserver &observer,
      bool pauseOnFirstStatement);
  ~Inspector();

  /**
   * disable turns off the inspector. All of the subsequent methods will not do
   * anything unless the inspector is enabled.
   */
  folly::Future<folly::Unit> disable();

  /**
   * enable turns on the inspector. All of the subsequent methods will not do
   * anything unless the inspector is enabled. The returned future succeeds when
   * the debugger is enabled, or fails with AlreadyEnabledException if the
   * debugger was already enabled.
   */
  folly::Future<folly::Unit> enable();

  /**
   * installs console log handler. Ideally this should be done inside
   * constructor, but because it uses shared_from_this we can't do this
   * in constructor.
   */
  void installLogHandler();

  /**
   * executeIfEnabled executes the provided callback *on the JS thread with the
   * inspector lock held*. Execution can be implicitly requested while running.
   * The inspector lock:
   *
   *  1) Protects VM state transitions. This means that the VM is guaranteed to
   *     stay in the paused or running state for the duration of the callback.
   *  2) Protects InspectorObserver callbacks. This means that if some shared
   *     data is accessed only in InspectorObserver and executeIfEnabled
   *     callbacks, it does not need to be locked, since it's already protected
   *     by the inspector lock.
   *
   * The returned future resolves to true in the VM can be paused, or
   * fails with IllegalStateException otherwise. The description is only used
   * to populate the IllegalStateException with more useful info on failure.
   */
  folly::Future<folly::Unit> executeIfEnabled(
      const std::string &description,
      folly::Function<void(const facebook::hermes::debugger::ProgramState &)>
          func);

  /**
   * setBreakpoint can be called at any time after the debugger is enabled to
   * set a breakpoint in the VM. The future is fulfilled with the resolved
   * breakpoint info.
   *
   * Resolving a breakpoint takes an indeterminate amount of time since Hermes
   * only resolves breakpoints when the debugger is able to actively pause JS
   * execution.
   */
  folly::Future<facebook::hermes::debugger::BreakpointInfo> setBreakpoint(
      facebook::hermes::debugger::SourceLocation loc,
      folly::Optional<std::string> condition = folly::none);

  folly::Future<folly::Unit> removeBreakpoint(
      facebook::hermes::debugger::BreakpointID loc);

  /**
   * logs console message.
   */
  folly::Future<folly::Unit> logMessage(ConsoleMessageInfo info);

  /**
   * resume and step methods are only valid when the VM is currently paused. The
   * returned future suceeds when the VM resumes execution, or fails with an
   * InvalidStateException otherwise.
   */
  folly::Future<folly::Unit> resume();
  folly::Future<folly::Unit> stepIn();
  folly::Future<folly::Unit> stepOver();
  folly::Future<folly::Unit> stepOut();

  /**
   * pause can be issued at any time while the inspector is enabled. It requests
   * the VM to asynchronously break execution. The returned future suceeds if
   * the VM can be paused in this state and fails with InvalidStateException if
   * otherwise.
   */
  folly::Future<folly::Unit> pause();

  /**
   * evaluate runs JavaScript code within the context of a call frame. The
   * returned promise is fulfilled with an eval result if it's possible to
   * evaluate code in the current state or fails with InvalidStateException
   * otherwise.
   */
  folly::Future<facebook::hermes::debugger::EvalResult> evaluate(
      uint32_t frameIndex,
      const std::string &src,
      folly::Function<void(const facebook::hermes::debugger::EvalResult &)>
          resultTransformer);

  folly::Future<folly::Unit> setPauseOnExceptions(
      const facebook::hermes::debugger::PauseOnThrowMode &mode);

  /**
   * Set whether to pause on loads. This does not require runtime modifications,
   * but returns a future for consistency.
   */
  folly::Future<folly::Unit> setPauseOnLoads(const PauseOnLoadMode mode);

  /**
   * Set whether breakpoints are active (pause when hit). This does not require
   * runtime modifications, but returns a future for consistency.
   */
  folly::Future<folly::Unit> setBreakpointsActive(bool active);

  /**
   * If called during a script load event, return true if we should pause.
   * Assumed to be called from a script load event where we already hold
   * `mutex_`.
   */
  bool shouldPauseOnThisScriptLoad();

  /**
   * didPause implements the pause callback from Hermes. This callback arrives
   * on the JS thread.
   */
  facebook::hermes::debugger::Command didPause(
      facebook::hermes::debugger::Debugger &debugger) override;

  /**
   * breakpointResolved implements the breakpointResolved callback from Hermes.
   */
  void breakpointResolved(
      facebook::hermes::debugger::Debugger &debugger,
      facebook::hermes::debugger::BreakpointID breakpointId) override;

  /**
   * Get whether we started with pauseOnFirstStatement, and have not yet had a
   * debugger attach and ask to resume from that point. This matches the
   * semantics of when CDP Debugger.runIfWaitingForDebugger should resume.
   *
   * It's not named "isPausedOnStart" because the VM and inspector is not
   * necessarily paused; we could be in a RunningWaitPause state.
   */
  bool isAwaitingDebuggerOnStart();

 private:
  friend class InspectorState;

  void triggerAsyncPause(bool andTickle);

  void notifyContextCreated();

  ScriptInfo getScriptInfoFromTopCallFrame();

  void addCurrentScriptToLoadedScripts();
  void removeAllBreakpoints();
  void resetScriptsLoaded();
  void notifyScriptsLoaded();

  folly::Future<folly::Unit> setPendingCommand(debugger::Command command);

  void transition(std::unique_ptr<InspectorState> nextState);

  // All methods that end with OnExecutor run on executor_.
  void disableOnExecutor(std::shared_ptr<folly::Promise<folly::Unit>> promise);

  void enableOnExecutor(std::shared_ptr<folly::Promise<folly::Unit>> promise);

  void executeIfEnabledOnExecutor(
      const std::string &description,
      folly::Function<void(const facebook::hermes::debugger::ProgramState &)>
          func,
      std::shared_ptr<folly::Promise<folly::Unit>> promise);

  void setBreakpointOnExecutor(
      debugger::SourceLocation loc,
      folly::Optional<std::string> condition,
      std::shared_ptr<
          folly::Promise<facebook::hermes::debugger::BreakpointInfo>> promise);

  void removeBreakpointOnExecutor(
      debugger::BreakpointID breakpointId,
      std::shared_ptr<folly::Promise<folly::Unit>> promise);

  void logOnExecutor(
      ConsoleMessageInfo info,
      std::shared_ptr<folly::Promise<folly::Unit>> promise);

  void setPendingCommandOnExecutor(
      facebook::hermes::debugger::Command command,
      std::shared_ptr<folly::Promise<folly::Unit>> promise);

  void pauseOnExecutor(std::shared_ptr<folly::Promise<folly::Unit>> promise);

  void evaluateOnExecutor(
      uint32_t frameIndex,
      const std::string &src,
      std::shared_ptr<folly::Promise<facebook::hermes::debugger::EvalResult>>
          promise,
      folly::Function<void(const facebook::hermes::debugger::EvalResult &)>
          resultTransformer);

  void setPauseOnExceptionsOnExecutor(
      const facebook::hermes::debugger::PauseOnThrowMode &mode,
      std::shared_ptr<folly::Promise<folly::Unit>> promise);

  void installConsoleFunction(
      jsi::Object &console,
      std::shared_ptr<jsi::Object> &originalConsole,
      const std::string &name,
      const std::string &chromeType);

  std::shared_ptr<RuntimeAdapter> adapter_;
  facebook::hermes::debugger::Debugger &debugger_;
  InspectorObserver &observer_;

  // All of the following member variables are guarded by mutex_.
  std::mutex mutex_;
  std::unique_ptr<InspectorState> state_;

  // See the InspectorState::Running implementation for an explanation for why
  // this state is here rather than in the Running class.
  AsyncPauseState pendingPauseState_ = AsyncPauseState::None;

  // Whether we should enter a paused state when a script loads.
  PauseOnLoadMode pauseOnLoadMode_ = PauseOnLoadMode::None;

  // Whether or not we should pause on breakpoints.
  bool breakpointsActive_ = true;

  // All scripts loaded in to the VM, along with whether we've notified the
  // client about the script yet.
  struct LoadedScriptInfo {
    ScriptInfo info;
    bool notifiedClient;
  };
  std::unordered_map<int, LoadedScriptInfo> loadedScripts_;
  std::unordered_map<std::string, int> loadedScriptIdByName_;

  // Returns true if we are executing a file instance that has since been
  // reloaded. I.e. we are running an old version of the file.
  bool isExecutingSupersededFile();

  // Allow the user to suppress warnings about superseded files.
  bool shouldSuppressAlertAboutSupersededFiles();

  // Trigger a fake console.log if we're currently in a superseded file.
  void alertIfPausedInSupersededFile();

  // Are we currently waiting for a debugger to attach, because we
  // requested 'pauseOnFirstStatement'?
  bool awaitingDebuggerOnStart_;

  // All client methods (e.g. enable, setBreakpoint, resume, etc.) are executed
  // on executor_ to prevent deadlocking on mutex_. See the implementation for
  // more comments on the threading invariants used in this class.
  // NOTE: This needs to be declared LAST because it should be destroyed FIRST.
  std::unique_ptr<folly::Executor> executor_;
};

} // namespace inspector
} // namespace hermes
} // namespace facebook

#endif // HERMES_INSPECTOR_INSPECTOR_H
