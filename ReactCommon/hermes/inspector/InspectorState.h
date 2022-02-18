/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// using include guards instead of #pragma once due to compile issues
// with MSVC and BUCK
#ifndef HERMES_INSPECTOR_INSPECTOR_STATE_H
#define HERMES_INSPECTOR_INSPECTOR_STATE_H

#include <condition_variable>
#include <iostream>
#include <memory>
#include <mutex>
#include <queue>
#include <utility>

#include <folly/Unit.h>
#include <hermes/inspector/Exceptions.h>
#include <hermes/inspector/Inspector.h>

namespace facebook {
namespace hermes {
namespace inspector {

using NextStatePtr = std::unique_ptr<InspectorState>;
using CommandPtr = std::unique_ptr<facebook::hermes::debugger::Command>;
using MonitorLock = std::unique_lock<std::mutex>;

/**
 * InspectorState encapsulates a single state in the Inspector FSM. Events in
 * the FSM are modeled as methods in InspectorState.
 *
 * Some events may cause state transitions. The next state is returned via a
 * pointer to the next InspectorState.
 *
 * We assume that the Inspector's mutex is held across all calls to
 * InspectorState methods. For more threading notes, see the Inspector
 * implementation.
 */
class InspectorState {
 public:
  InspectorState(Inspector &inspector) : inspector_(inspector) {}
  virtual ~InspectorState() = default;
  /**
   * onEnter is called when entering the state. prevState may be null when
   * transitioning into an initial state.
   */
  virtual void onEnter(InspectorState *prevState) {}

  /*
   * Events that may cause a state transition.
   */

  /**
   * detach clears all debugger state and transitions to RunningDetached.
   */
  virtual void detach(std::shared_ptr<folly::Promise<folly::Unit>> promise) {
    // As we're not attached we'd like for the operation to be idempotent
    promise->setValue();
  }

  /**
   * didPause handles the didPause callback from the debugger. It takes the lock
   * associated with the Inspector's mutex by reference in case we need to
   * temporarily relinquish the lock (e.g. via condition_variable::wait).
   */
  virtual std::pair<NextStatePtr, CommandPtr> didPause(MonitorLock &lock) = 0;

  /**
   * enable handles the enable event from the client.
   */
  virtual std::pair<NextStatePtr, bool> enable() {
    return std::make_pair<NextStatePtr, bool>(nullptr, false);
  }

  /*
   * Events that don't cause a state transition.
   */

  /**
   * pushPendingFunc appends a function to run the next time the debugger
   * pauses, either explicitly while paused or implicitly while running.
   * Returns false if it's not possible to push a func in this state.
   */
  virtual bool pushPendingFunc(folly::Func func) {
    return false;
  }

  /**
   * pushPendingEval appends an eval request to run the next time the debugger
   * pauses, either explicitly while paused or implicitly while running.
   * resultTransformer function will be called with EvalResult before returning
   * result so that we can manipulate EvalResult while the VM is paused.
   */
  virtual void pushPendingEval(
      uint32_t frameIndex,
      const std::string &src,
      std::shared_ptr<folly::Promise<facebook::hermes::debugger::EvalResult>>
          promise,
      folly::Function<void(const facebook::hermes::debugger::EvalResult &)>
          resultTransformer) {
    promise->setException(
        InvalidStateException("eval", description(), "paused or running"));
  }

  /**
   * setPendingCommand sets a command to break the debugger out of the didPause
   * run loop. If it's not possible to set a pending command in this state, the
   * promise fails with InvalidStateException. Otherwise, the promise resolves
   * to true when the command actually executes.
   */
  virtual void setPendingCommand(
      debugger::Command command,
      std::shared_ptr<folly::Promise<folly::Unit>> promise) {
    promise->setException(
        InvalidStateException("cmd", description(), "paused"));
  }

  /**
   * pause requests an async pause from the VM.
   */
  virtual bool pause() {
    return false;
  }

  /*
   * Convenience functions for determining the concrete type and description
   * for a state instance without RTTI.
   */

  virtual bool isRunningDetached() const {
    return false;
  }
  virtual bool isRunningWaitEnable() const {
    return false;
  }
  virtual bool isRunningWaitPause() const {
    return false;
  }
  virtual bool isPausedWaitEnable() const {
    return false;
  }
  virtual bool isRunning() const {
    return false;
  }
  virtual bool isPaused() const {
    return false;
  }

  virtual const char *description() const = 0;
  friend std::ostream &operator<<(
      std::ostream &os,
      const InspectorState &state);

  class RunningDetached;
  class RunningWaitEnable;
  class RunningWaitPause;
  class PausedWaitEnable;
  class Running;
  class Paused;

 protected:
  debugger::PauseReason getPauseReason() {
    return inspector_.debugger_.getProgramState().getPauseReason();
  }

 private:
  Inspector &inspector_;
};

extern std::ostream &operator<<(std::ostream &os, const InspectorState &state);

/**
 * RunningDetached is the initial state when we're associated with a VM that
 * initially has no breakpoints.
 */
class InspectorState::RunningDetached : public InspectorState {
 public:
  static std::unique_ptr<InspectorState> make(Inspector &inspector) {
    return std::make_unique<RunningDetached>(inspector);
  }

  RunningDetached(Inspector &inspector) : InspectorState(inspector) {}
  ~RunningDetached() {}

  std::pair<NextStatePtr, CommandPtr> didPause(MonitorLock &lock) override;
  std::pair<NextStatePtr, bool> enable() override;

  void onEnter(InspectorState *prevState) override;

  bool isRunningDetached() const override {
    return true;
  }

  const char *description() const override {
    return "RunningDetached";
  }
};

/**
 * RunningWaitEnable is the initial state when we're associated with a VM that
 * has a breakpoint on the first statement.
 */
class InspectorState::RunningWaitEnable : public InspectorState {
 public:
  static std::unique_ptr<InspectorState> make(Inspector &inspector) {
    return std::make_unique<RunningWaitEnable>(inspector);
  }

  RunningWaitEnable(Inspector &inspector) : InspectorState(inspector) {}
  ~RunningWaitEnable() {}

  std::pair<NextStatePtr, CommandPtr> didPause(MonitorLock &lock) override;
  std::pair<NextStatePtr, bool> enable() override;

  bool isRunningWaitEnable() const override {
    return true;
  }

  const char *description() const override {
    return "RunningWaitEnable";
  }
};

/**
 * RunningWaitPause is the state when we've received enable call, but
 * waiting for didPause because we need to pause on the first statement.
 */
class InspectorState::RunningWaitPause : public InspectorState {
 public:
  static std::unique_ptr<InspectorState> make(Inspector &inspector) {
    return std::make_unique<RunningWaitPause>(inspector);
  }

  std::pair<NextStatePtr, CommandPtr> didPause(MonitorLock &lock) override;

  RunningWaitPause(Inspector &inspector) : InspectorState(inspector) {}
  ~RunningWaitPause() {}

  bool isRunningWaitPause() const override {
    return true;
  }

  const char *description() const override {
    return "RunningWaitPause";
  }
};

/**
 * PausedWaitEnable is the state when we're in a didPause callback and we're
 * waiting for the client to call enable.
 */
class InspectorState::PausedWaitEnable : public InspectorState {
 public:
  static std::unique_ptr<InspectorState> make(Inspector &inspector) {
    return std::make_unique<PausedWaitEnable>(inspector);
  }

  PausedWaitEnable(Inspector &inspector) : InspectorState(inspector) {}
  ~PausedWaitEnable() {}

  std::pair<NextStatePtr, CommandPtr> didPause(MonitorLock &lock) override;
  std::pair<NextStatePtr, bool> enable() override;

  bool isPausedWaitEnable() const override {
    return true;
  }

  const char *description() const override {
    return "PausedWaitEnable";
  }

 private:
  bool enabled_ = false;
  std::condition_variable enabledCondition_;
};

/**
 * PendingEval holds an eval command and a promise that is fulfilled with the
 * eval result.
 */
struct PendingEval {
  debugger::Command command;
  std::shared_ptr<folly::Promise<facebook::hermes::debugger::EvalResult>>
      promise;
  folly::Function<void(const facebook::hermes::debugger::EvalResult &)>
      resultTransformer;
};

/**
 * Running is the state when we're enabled and not currently paused, e.g. when
 * we're actively executing JS.
 *
 * Note that we can be in the running state even if we're not actively running
 * JS. For instance, React Native could be blocked in a native message queue
 * waiting for the next message to process outside of the call in to Hermes.
 * That still counts as Running in this FSM.
 */
class InspectorState::Running : public InspectorState {
 public:
  static std::unique_ptr<InspectorState> make(Inspector &inspector) {
    return std::make_unique<Running>(inspector);
  }

  Running(Inspector &inspector) : InspectorState(inspector) {}
  ~Running() {}

  void onEnter(InspectorState *prevState) override;

  void detach(std::shared_ptr<folly::Promise<folly::Unit>> promise) override;

  std::pair<NextStatePtr, CommandPtr> didPause(MonitorLock &lock) override;
  bool pushPendingFunc(folly::Func func) override;
  void pushPendingEval(
      uint32_t frameIndex,
      const std::string &src,
      std::shared_ptr<folly::Promise<facebook::hermes::debugger::EvalResult>>
          promise,
      folly::Function<void(const facebook::hermes::debugger::EvalResult &)>
          resultTransformer) override;
  bool pause() override;

  bool isRunning() const override {
    return true;
  }

  const char *description() const override {
    return "Running";
  }

 private:
  std::vector<folly::Func> pendingFuncs_;
  std::queue<PendingEval> pendingEvals_;
  std::shared_ptr<folly::Promise<facebook::hermes::debugger::EvalResult>>
      pendingEvalPromise_;
  folly::Function<void(const facebook::hermes::debugger::EvalResult &)>
      pendingEvalResultTransformer_;
  std::shared_ptr<folly::Promise<folly::Unit>> pendingDetach_;
};

/**
 * PendingCommand holds a resume or step command and a promise that is fulfilled
 * just before the debugger resumes or steps.
 */
struct PendingCommand {
  PendingCommand(
      debugger::Command command,
      std::shared_ptr<folly::Promise<folly::Unit>> promise)
      : command(std::move(command)), promise(promise) {}

  debugger::Command command;
  std::shared_ptr<folly::Promise<folly::Unit>> promise;
};

/**
 * Paused is the state when we're enabled and and currently in a didPause
 * callback.
 */
class InspectorState::Paused : public InspectorState {
 public:
  static std::unique_ptr<InspectorState> make(Inspector &inspector) {
    return std::make_unique<Paused>(inspector);
  }

  Paused(Inspector &inspector) : InspectorState(inspector) {}
  ~Paused() {}

  void onEnter(InspectorState *prevState) override;

  void detach(std::shared_ptr<folly::Promise<folly::Unit>> promise) override;

  std::pair<NextStatePtr, CommandPtr> didPause(MonitorLock &lock) override;
  bool pushPendingFunc(folly::Func func) override;
  void pushPendingEval(
      uint32_t frameIndex,
      const std::string &src,
      std::shared_ptr<folly::Promise<facebook::hermes::debugger::EvalResult>>
          promise,
      folly::Function<void(const facebook::hermes::debugger::EvalResult &)>
          resultTransformer) override;
  void setPendingCommand(
      debugger::Command command,
      std::shared_ptr<folly::Promise<folly::Unit>> promise) override;

  bool isPaused() const override {
    return true;
  }

  const char *description() const override {
    return "Paused";
  }

 private:
  std::condition_variable hasPendingWork_;
  std::vector<folly::Func> pendingFuncs_;
  std::queue<PendingEval> pendingEvals_;
  std::shared_ptr<folly::Promise<facebook::hermes::debugger::EvalResult>>
      pendingEvalPromise_;
  folly::Function<void(const facebook::hermes::debugger::EvalResult &)>
      pendingEvalResultTransformer_;
  std::unique_ptr<PendingCommand> pendingCommand_;
  std::shared_ptr<folly::Promise<folly::Unit>> pendingDetach_;
};

} // namespace inspector
} // namespace hermes
} // namespace facebook

#endif // HERMES_INSPECTOR_INSPECTOR_STATE_H
