/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "InspectorState.h"

#include <glog/logging.h>

namespace facebook {
namespace hermes {
namespace inspector {

using folly::Unit;

namespace debugger = ::facebook::hermes::debugger;

namespace {

std::unique_ptr<debugger::Command> makeContinueCommand() {
  return std::make_unique<debugger::Command>(
      debugger::Command::continueExecution());
}

} // namespace

std::ostream &operator<<(std::ostream &os, const InspectorState &state) {
  return os << state.description();
}

/*
 * InspectorState::RunningDetached
 */

std::pair<NextStatePtr, CommandPtr> InspectorState::RunningDetached::didPause(
    MonitorLock &lock) {
  debugger::PauseReason reason = getPauseReason();

  if (reason == debugger::PauseReason::DebuggerStatement) {
    return std::make_pair<NextStatePtr, CommandPtr>(
        InspectorState::PausedWaitEnable::make(inspector_), nullptr);
  }

  if (reason == debugger::PauseReason::ScriptLoaded) {
    inspector_.addCurrentScriptToLoadedScripts();
  }

  return std::make_pair<NextStatePtr, CommandPtr>(
      nullptr, makeContinueCommand());
}

void InspectorState::RunningDetached::onEnter(InspectorState *previous) {
  inspector_.awaitingDebuggerOnStart_ = false;
}

std::pair<NextStatePtr, bool> InspectorState::RunningDetached::enable() {
  return std::make_pair<NextStatePtr, bool>(
      InspectorState::Running::make(inspector_), true);
}

/*
 * InspectorState::RunningWaitEnable
 */

std::pair<NextStatePtr, CommandPtr> InspectorState::RunningWaitEnable::didPause(
    MonitorLock &lock) {
  // If we started in RWE, then we asked for the VM to break on the first
  // statement, and the first pause should be because of a script load.
  assert(getPauseReason() == debugger::PauseReason::ScriptLoaded);
  inspector_.addCurrentScriptToLoadedScripts();

  return std::make_pair<NextStatePtr, CommandPtr>(
      InspectorState::PausedWaitEnable::make(inspector_), nullptr);
}

std::pair<NextStatePtr, bool> InspectorState::RunningWaitEnable::enable() {
  return std::make_pair<NextStatePtr, bool>(
      InspectorState::RunningWaitPause::make(inspector_), true);
}

/*
 * InspectorState::RunningWaitPause
 */
std::pair<NextStatePtr, CommandPtr> InspectorState::RunningWaitPause::didPause(
    MonitorLock &lock) {
  // If we are in RWP, then we asked for the VM to break on the first
  // statement, and the first pause should be because of a script load.
  assert(getPauseReason() == debugger::PauseReason::ScriptLoaded);
  inspector_.addCurrentScriptToLoadedScripts();

  return std::make_pair<NextStatePtr, CommandPtr>(
      InspectorState::Paused::make(inspector_), nullptr);
}

/*
 * InspectorState::PausedWaitEnable
 */

std::pair<NextStatePtr, CommandPtr> InspectorState::PausedWaitEnable::didPause(
    MonitorLock &lock) {
  if (getPauseReason() == debugger::PauseReason::ScriptLoaded) {
    inspector_.addCurrentScriptToLoadedScripts();
  }

  while (!enabled_) {
    /*
     * The call to wait temporarily relinquishes the inspector mutex. This is
     * safe because no other PausedWaitEnable event handler directly transitions
     * out of PausedWaitEnable. So we know that our state is the active state
     * both before and after the call to wait. This preserves the invariant that
     * the inspector state is not modified during the execution of this method.
     *
     * Instead, PausedWaitEnable::enable indirectly induces the state transition
     * out of PausedWaitEnable by signaling us via enabledCondition_.
     */
    enabledCondition_.wait(lock);

    assert(inspector_.state_.get() == this);
  }

  return std::make_pair<NextStatePtr, CommandPtr>(
      InspectorState::Paused::make(inspector_), nullptr);
}

std::pair<NextStatePtr, bool> InspectorState::PausedWaitEnable::enable() {
  if (enabled_) {
    // Someone already called enable before and we're just waiting for the
    // condition variable to wake up didPause.
    return std::make_pair<NextStatePtr, bool>(nullptr, false);
  }

  enabled_ = true;
  enabledCondition_.notify_one();
  return std::make_pair<NextStatePtr, bool>(nullptr, true);
}

/*
 * InspectorState::Running
 *
 * # Async Pauses
 *
 * We distinguish between implicit and explicit async pauses. An implicit async
 * pause is requested by the inspector itself to service a request that requires
 * the VM to be paused (e.g. to set a breakpoint). This is different from an
 * explicit async pause requested by the user by hitting the pause button in the
 * debugger UI.
 *
 * The async pause state must live in the Inspector class instead of the Running
 * class because of potential races between when the implicit pause is requested
 * and when it's serviced. Consider:
 *
 *  1. We request an implicit pause (e.g. to set a breakpoint).
 *  2. An existing breakpoint fires, moving us from Running => Paused.
 *  3. Client resumes execution, moving us from Paused => Running.
 *  4. Now the debugger notices the async pause flag we set in (1), which pauses
 *     us again, causing Running::didPause to run.
 *
 * In this case, the Running state instance from (1) is no longer the same as
 * the Running state instance in (4). But the running state instance in (4)
 * needs to know that we requested the async break sometime in the past so it
 * knows to automatically continue in the didPause callback. Therefore the async
 * break state has to be stored in the long-lived Inspector class rather than in
 * the short-lived Running class.
 */

void InspectorState::Running::onEnter(InspectorState *prevState) {
  if (prevState) {
    if (prevState->isPaused()) {
      inspector_.observer_.onResume(inspector_);
    } else {
      // send context created and script load notifications if we just enabled
      // the debugger
      inspector_.notifyContextCreated();
      inspector_.notifyScriptsLoaded();
    }
  }

  inspector_.awaitingDebuggerOnStart_ = false;
}

void InspectorState::Running::detach(
    std::shared_ptr<folly::Promise<Unit>> promise) {
  pushPendingFunc([this, promise] {
    pendingDetach_ = promise;

    inspector_.removeAllBreakpoints();
    inspector_.resetScriptsLoaded();
  });
}

std::pair<NextStatePtr, CommandPtr> InspectorState::Running::didPause(
    MonitorLock &lock) {
  debugger::PauseReason reason = getPauseReason();

  for (auto &func : pendingFuncs_) {
    func();
  }
  pendingFuncs_.clear();

  if (pendingDetach_) {
    // Clear any pending pause state back to no requests for the next attach
    inspector_.pendingPauseState_ = AsyncPauseState::None;

    // Ensure we fulfill any pending ScriptLoaded requests
    if (reason == debugger::PauseReason::ScriptLoaded) {
      inspector_.addCurrentScriptToLoadedScripts();
    }

    // Fail any in-flight Eval requests
    if (pendingEvalPromise_) {
      pendingEvalPromise_->setException(NotEnabledException("eval"));
    }

    // if we requested the break implicitly to clear state and detach,
    // transition to RunningDetached
    pendingDetach_->setValue();

    return std::make_pair<NextStatePtr, CommandPtr>(
        InspectorState::RunningDetached::make(inspector_),
        makeContinueCommand());
  }

  if (reason == debugger::PauseReason::AsyncTrigger) {
    AsyncPauseState &pendingPauseState = inspector_.pendingPauseState_;

    switch (pendingPauseState) {
      case AsyncPauseState::None:
        // shouldn't ever async break without us asking first
        assert(false);
        break;
      case AsyncPauseState::Implicit:
        pendingPauseState = AsyncPauseState::None;
        break;
      case AsyncPauseState::Explicit:
        // explicit break was requested by user, so go to Paused state
        pendingPauseState = AsyncPauseState::None;
        return std::make_pair<NextStatePtr, CommandPtr>(
            InspectorState::Paused::make(inspector_), nullptr);
    }
  } else if (reason == debugger::PauseReason::ScriptLoaded) {
    inspector_.addCurrentScriptToLoadedScripts();
    inspector_.notifyScriptsLoaded();
    if (inspector_.shouldPauseOnThisScriptLoad()) {
      return std::make_pair<NextStatePtr, CommandPtr>(
          InspectorState::Paused::make(inspector_), nullptr);
    }
  } else if (reason == debugger::PauseReason::EvalComplete) {
    assert(pendingEvalPromise_);

    if (auto userCallbackException = runUserCallback(
            pendingEvalResultTransformer_,
            inspector_.debugger_.getProgramState().getEvalResult())) {
      pendingEvalPromise_->setException(*userCallbackException);
    } else {
      pendingEvalPromise_->setValue(
          inspector_.debugger_.getProgramState().getEvalResult());
    }
    pendingEvalPromise_.reset();
  } else if (
      reason == debugger::PauseReason::Breakpoint &&
      !inspector_.breakpointsActive_) {
    // We hit a user defined breakpoint, but breakpoints have been deactivated.
    return std::make_pair<NextStatePtr, CommandPtr>(
        nullptr, makeContinueCommand());
  } else /* other cases imply a transition to Pause */ {
    return std::make_pair<NextStatePtr, CommandPtr>(
        InspectorState::Paused::make(inspector_), nullptr);
  }

  if (!pendingEvals_.empty()) {
    assert(!pendingEvalPromise_);

    auto eval = std::make_unique<PendingEval>(std::move(pendingEvals_.front()));
    pendingEvals_.pop();

    pendingEvalPromise_ = eval->promise;
    pendingEvalResultTransformer_ = std::move(eval->resultTransformer);

    return std::make_pair<NextStatePtr, CommandPtr>(
        nullptr, std::make_unique<debugger::Command>(std::move(eval->command)));
  }

  return std::make_pair<NextStatePtr, CommandPtr>(
      nullptr, makeContinueCommand());
}

bool InspectorState::Running::pushPendingFunc(folly::Func func) {
  pendingFuncs_.emplace_back(std::move(func));

  if (inspector_.pendingPauseState_ == AsyncPauseState::None) {
    inspector_.pendingPauseState_ = AsyncPauseState::Implicit;
    inspector_.triggerAsyncPause(true);
  }

  return true;
}

void InspectorState::Running::pushPendingEval(
    uint32_t frameIndex,
    const std::string &src,
    std::shared_ptr<folly::Promise<debugger::EvalResult>> promise,
    folly::Function<void(const facebook::hermes::debugger::EvalResult &)>
        resultTransformer) {
  PendingEval pendingEval{
      debugger::Command::eval(src, frameIndex),
      promise,
      std::move(resultTransformer)};

  pendingEvals_.emplace(std::move(pendingEval));

  if (inspector_.pendingPauseState_ == AsyncPauseState::None) {
    inspector_.pendingPauseState_ = AsyncPauseState::Implicit;
  }

  inspector_.triggerAsyncPause(true);
}

bool InspectorState::Running::pause() {
  AsyncPauseState &pendingPauseState = inspector_.pendingPauseState_;
  bool canPause = false;

  switch (pendingPauseState) {
    case AsyncPauseState::None:
      // haven't yet requested a pause, so do it now
      pendingPauseState = AsyncPauseState::Explicit;
      inspector_.triggerAsyncPause(false);
      canPause = true;
      break;
    case AsyncPauseState::Implicit:
      // already requested an implicit pause on our own, upgrade it to an
      // explicit pause
      pendingPauseState = AsyncPauseState::Explicit;
      inspector_.triggerAsyncPause(false);
      canPause = true;
      break;
    case AsyncPauseState::Explicit:
      // client already requested a pause that hasn't occurred yet
      canPause = false;
      break;
  }

  return canPause;
}

/*
 * InspectorState::Paused
 */

void InspectorState::Paused::onEnter(InspectorState *prevState) {
  // send script load notifications if we just enabled the debugger
  if (prevState && !prevState->isRunning()) {
    inspector_.notifyContextCreated();
    inspector_.notifyScriptsLoaded();
  }

  const debugger::ProgramState &state = inspector_.debugger_.getProgramState();
  inspector_.alertIfPausedInSupersededFile();
  inspector_.observer_.onPause(inspector_, state);
}

std::pair<NextStatePtr, CommandPtr> InspectorState::Paused::didPause(
    std::unique_lock<std::mutex> &lock) {
  switch (getPauseReason()) {
    case debugger::PauseReason::AsyncTrigger:
      inspector_.pendingPauseState_ = AsyncPauseState::None;
      break;
    case debugger::PauseReason::EvalComplete: {
      assert(pendingEvalPromise_);
      if (auto userCallbackException = runUserCallback(
              pendingEvalResultTransformer_,
              inspector_.debugger_.getProgramState().getEvalResult())) {
        pendingEvalPromise_->setException(*userCallbackException);
      } else {
        pendingEvalPromise_->setValue(
            inspector_.debugger_.getProgramState().getEvalResult());
      }
      pendingEvalPromise_.reset();
    } break;
    case debugger::PauseReason::ScriptLoaded:
      inspector_.addCurrentScriptToLoadedScripts();
      inspector_.notifyScriptsLoaded();
      break;
    default:
      break;
  }

  std::unique_ptr<PendingEval> eval;
  std::unique_ptr<PendingCommand> resumeOrStep;

  while (!eval && !resumeOrStep && !pendingDetach_) {
    {
      while (!pendingCommand_ && pendingEvals_.empty() &&
             pendingFuncs_.empty()) {
        /*
         * The call to wait temporarily relinquishes the inspector mutex. This
         * is safe because no other Paused event handler directly transitions
         * out of Paused. So we know that our state is the active state both
         * before and after the call to wait. This preserves the invariant that
         * the inspector state is not modified during the execution of this
         * method.
         */
        hasPendingWork_.wait(lock);
      }

      assert(inspector_.state_.get() == this);
    }

    if (!pendingEvals_.empty()) {
      eval = std::make_unique<PendingEval>(std::move(pendingEvals_.front()));
      pendingEvals_.pop();
    } else if (pendingCommand_) {
      resumeOrStep.swap(pendingCommand_);
    }

    for (auto &func : pendingFuncs_) {
      func();
    }
    pendingFuncs_.clear();
  }

  if (pendingDetach_) {
    if (pendingEvalPromise_) {
      pendingEvalPromise_->setException(NotEnabledException("eval"));
    }

    if (resumeOrStep) {
      resumeOrStep->promise->setValue();
    }

    pendingDetach_->setValue();

    // Send resume so client-side UI doesn't stay stuck at the breakpoint UI
    inspector_.observer_.onResume(inspector_);

    return std::make_pair<NextStatePtr, CommandPtr>(
        InspectorState::RunningDetached::make(inspector_),
        makeContinueCommand());
  }

  if (eval) {
    assert(!pendingEvalPromise_);
    pendingEvalPromise_ = eval->promise;
    pendingEvalResultTransformer_ = std::move(eval->resultTransformer);

    return std::make_pair<NextStatePtr, CommandPtr>(
        nullptr, std::make_unique<debugger::Command>(std::move(eval->command)));
  }

  assert(resumeOrStep);
  resumeOrStep->promise->setValue();

  return std::make_pair<NextStatePtr, CommandPtr>(
      InspectorState::Running::make(inspector_),
      std::make_unique<debugger::Command>(std::move(resumeOrStep->command)));
}

void InspectorState::Paused::detach(
    std::shared_ptr<folly::Promise<Unit>> promise) {
  pushPendingFunc([this, promise] {
    pendingDetach_ = promise;

    inspector_.removeAllBreakpoints();
    inspector_.resetScriptsLoaded();
  });
}

bool InspectorState::Paused::pushPendingFunc(folly::Func func) {
  pendingFuncs_.emplace_back(std::move(func));
  hasPendingWork_.notify_one();

  return true;
}

void InspectorState::Paused::pushPendingEval(
    uint32_t frameIndex,
    const std::string &src,
    std::shared_ptr<folly::Promise<debugger::EvalResult>> promise,
    folly::Function<void(const facebook::hermes::debugger::EvalResult &)>
        resultTransformer) {
  // Shouldn't allow the client to eval if there's already a pending resume/step
  if (pendingCommand_) {
    promise->setException(MultipleCommandsPendingException("eval"));
    return;
  }

  PendingEval pendingEval{
      debugger::Command::eval(src, frameIndex),
      promise,
      std::move(resultTransformer)};
  pendingEvals_.emplace(std::move(pendingEval));
  hasPendingWork_.notify_one();
}

void InspectorState::Paused::setPendingCommand(
    debugger::Command command,
    std::shared_ptr<folly::Promise<Unit>> promise) {
  if (pendingCommand_) {
    promise->setException(MultipleCommandsPendingException("cmd"));
    return;
  }

  pendingCommand_ =
      std::make_unique<PendingCommand>(std::move(command), promise);
  hasPendingWork_.notify_one();
}

} // namespace inspector
} // namespace hermes
} // namespace facebook
