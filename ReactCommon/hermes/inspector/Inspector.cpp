/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Inspector.h"
#include "Exceptions.h"
#include "InspectorState.h"

#include <functional>
#include <string>

#include <glog/logging.h>
#include <hermes/inspector/detail/SerialExecutor.h>
#include <hermes/inspector/detail/Thread.h>

#ifdef HERMES_INSPECTOR_FOLLY_KLUDGE
// <kludge> This is here, instead of linking against
// folly/futures/Future.cpp, to avoid pulling in another pile of
// dependencies, including the separate dependency libevent.  This is
// likely specific to the version of folly RN uses, so may need to be
// changed.  Even better, perhaps folly can be refactored to simplify
// this.  Providing a RN-specific Timekeeper impl may also help.

template class folly::Future<folly::Unit>;
template class folly::Future<bool>;

namespace folly {
namespace futures {

SemiFuture<Unit> sleep(Duration, Timekeeper *) {
  LOG(FATAL) << "folly::futures::sleep() not implemented";
}

} // namespace futures

namespace detail {

std::shared_ptr<Timekeeper> getTimekeeperSingleton() {
  LOG(FATAL) << "folly::detail::getTimekeeperSingleton() not implemented";
}

} // namespace detail
} // namespace folly

// </kludge>
#endif

namespace facebook {
namespace hermes {
namespace inspector {

using folly::Unit;

namespace debugger = ::facebook::hermes::debugger;

/**
 * Threading notes:
 *
 *  1. mutex_ must be held before using state_ or any InspectorState methods.
 *  2. Methods that are callable by the client (like enable, resume, etc.) call
 *     various InspectorState methods via state_. This implies that they must
 *     acquire mutex_.
 *  3. Since some InspectorState methods call back out to the client (e.g. via
 *     fulfilling promises, or via the InspectorObserver callbacks), we have to
 *     be careful about reentrancy from a callback causing a deadlock when (1)
 *     and (2) interact. Consider:
 *
 *       1) Debugger pauses, which causes InspectorObserve::onPause to fire.
 *          onPause is called by InspectorState::Paused::onEnter on the JS
 *          thread with mutex_ held.
 *       2) Client calls setBreakpoint from the onPause callback.
 *       3) If setBreakpoint directly tried to acquire mutex_ here, we would
 *          deadlock since our thread already owns the mutex_ (see 1).
 *
 * For this reason, all client-facing methods are executed on executor_, which
 * runs on its own thread. The pattern is:
 *
 *  1. The client-facing method foo (e.g. enable) enqueues a call to
 *      fooOnExecutor (e.g. enableOnExecutor) on executor_.
 *  2. fooOnExecutor is responsible for acquiring mutex_.
 *
 */

// TODO: read this out of an env variable or config
static constexpr bool kShouldLog = false;

// Logging state transitions is done outside of transition() in a macro so that
// function and line numbers in the log will be accurate.
#define TRANSITION(nextState)                                            \
  do {                                                                   \
    if (kShouldLog) {                                                    \
      if (state_ == nullptr) {                                           \
        LOG(INFO) << "Inspector::" << __func__                           \
                  << " transitioning to initial state " << *(nextState); \
      } else {                                                           \
        LOG(INFO) << "Inspector::" << __func__ << " transitioning from " \
                  << *state_ << " to " << *(nextState);                  \
      }                                                                  \
    }                                                                    \
    transition((nextState));                                             \
  } while (0)

Inspector::Inspector(
    std::shared_ptr<RuntimeAdapter> adapter,
    InspectorObserver &observer,
    bool pauseOnFirstStatement)
    : adapter_(adapter),
      debugger_(adapter->getDebugger()),
      observer_(observer),
      executor_(std::make_unique<detail::SerialExecutor>("hermes-inspector")) {
  // TODO (t26491391): make tickleJs a real Hermes runtime API
  std::string src = "function __tickleJs() { return Math.random(); }";
  adapter->getRuntime().evaluateJavaScript(
      std::make_shared<jsi::StringBuffer>(src), "__tickleJsHackUrl");

  {
    std::lock_guard<std::mutex> lock(mutex_);

    if (pauseOnFirstStatement) {
      awaitingDebuggerOnStart_ = true;
      TRANSITION(std::make_unique<InspectorState::RunningWaitEnable>(*this));
    } else {
      TRANSITION(std::make_unique<InspectorState::RunningDetached>(*this));
    }
  }

  debugger_.setShouldPauseOnScriptLoad(true);
  debugger_.setEventObserver(this);
}

Inspector::~Inspector() {
  debugger_.setEventObserver(nullptr);
}

static bool toBoolean(jsi::Runtime &runtime, const jsi::Value &val) {
  // Based on Operations.cpp:toBoolean in the Hermes VM.
  if (val.isUndefined() || val.isNull()) {
    return false;
  }
  if (val.isBool()) {
    return val.getBool();
  }
  if (val.isNumber()) {
    double m = val.getNumber();
    return m != 0 && !std::isnan(m);
  }
  if (val.isSymbol() || val.isObject()) {
    return true;
  }
  if (val.isString()) {
    std::string s = val.getString(runtime).utf8(runtime);
    return !s.empty();
  }
  assert(false && "All cases should be covered");
  return false;
}

void Inspector::installConsoleFunction(
    jsi::Object &console,
    std::shared_ptr<jsi::Object> &originalConsole,
    const std::string &name,
    const std::string &chromeTypeDefault = "") {
  jsi::Runtime &rt = adapter_->getRuntime();
  auto chromeType = chromeTypeDefault == "" ? name : chromeTypeDefault;
  auto nameID = jsi::PropNameID::forUtf8(rt, name);
  auto weakInspector = std::weak_ptr<Inspector>(shared_from_this());
  console.setProperty(
      rt,
      nameID,
      jsi::Function::createFromHostFunction(
          rt,
          nameID,
          1,
          [weakInspector, originalConsole, name, chromeType](
              jsi::Runtime &runtime,
              const jsi::Value &thisVal,
              const jsi::Value *args,
              size_t count) {
            if (originalConsole) {
              auto val = originalConsole->getProperty(runtime, name.c_str());
              if (val.isObject()) {
                auto obj = val.getObject(runtime);
                if (obj.isFunction(runtime)) {
                  auto func = obj.getFunction(runtime);
                  func.callWithThis(runtime, *originalConsole, args, count);
                }
              }
            }

            if (auto inspector = weakInspector.lock()) {
              if (name != "assert") {
                // All cases other than assert just log a simple message.
                jsi::Array argsArray(runtime, count);
                for (size_t index = 0; index < count; ++index)
                  argsArray.setValueAtIndex(runtime, index, args[index]);
                inspector->logMessage(
                    ConsoleMessageInfo{chromeType, std::move(argsArray)});
                return jsi::Value::undefined();
              }
              // console.assert needs to check the first parameter before
              // logging.
              if (count == 0) {
                // No parameters, throw a blank assertion failed message.
                inspector->logMessage(
                    ConsoleMessageInfo{chromeType, jsi::Array(runtime, 0)});
              } else if (!toBoolean(runtime, args[0])) {
                // Shift the message array down by one to not include the
                // condition.
                jsi::Array argsArray(runtime, count - 1);
                for (size_t index = 1; index < count; ++index)
                  argsArray.setValueAtIndex(runtime, index, args[index]);
                inspector->logMessage(
                    ConsoleMessageInfo{chromeType, std::move(argsArray)});
              }
            }

            return jsi::Value::undefined();
          }));
}

void Inspector::installLogHandler() {
  jsi::Runtime &rt = adapter_->getRuntime();
  auto console = jsi::Object(rt);
  auto val = rt.global().getProperty(rt, "console");
  std::shared_ptr<jsi::Object> originalConsole;
  if (val.isObject()) {
    originalConsole = std::make_shared<jsi::Object>(val.getObject(rt));
  }
  installConsoleFunction(console, originalConsole, "assert");
  installConsoleFunction(console, originalConsole, "clear");
  installConsoleFunction(console, originalConsole, "debug");
  installConsoleFunction(console, originalConsole, "dir");
  installConsoleFunction(console, originalConsole, "dirxml");
  installConsoleFunction(console, originalConsole, "error");
  installConsoleFunction(console, originalConsole, "group", "startGroup");
  installConsoleFunction(
      console, originalConsole, "groupCollapsed", "startGroupCollapsed");
  installConsoleFunction(console, originalConsole, "groupEnd", "endGroup");
  installConsoleFunction(console, originalConsole, "info");
  installConsoleFunction(console, originalConsole, "log");
  installConsoleFunction(console, originalConsole, "profile");
  installConsoleFunction(console, originalConsole, "profileEnd");
  installConsoleFunction(console, originalConsole, "table");
  installConsoleFunction(console, originalConsole, "trace");
  installConsoleFunction(console, originalConsole, "warn", "warning");
  rt.global().setProperty(rt, "console", console);
}

void Inspector::triggerAsyncPause(bool andTickle) {
  // In order to ensure that we pause soon, we both set the async pause flag on
  // the runtime, and we run a bit of dummy JS to ensure we enter the Hermes
  // interpreter loop.
  debugger_.triggerAsyncPause(
      pendingPauseState_ == AsyncPauseState::Implicit
          ? debugger::AsyncPauseKind::Implicit
          : debugger::AsyncPauseKind::Explicit);

  if (andTickle) {
    // We run the dummy JS on a background thread to avoid any reentrancy issues
    // in case this thread is called with the inspector mutex held.
    std::shared_ptr<RuntimeAdapter> adapter = adapter_;
    detail::Thread tickleJsLater(
        "inspectorTickleJs", [adapter]() { adapter->tickleJs(); });
    tickleJsLater.detach();
  }
}

void Inspector::notifyContextCreated() {
  observer_.onContextCreated(*this);
}

ScriptInfo Inspector::getScriptInfoFromTopCallFrame() {
  ScriptInfo info{};
  auto stackTrace = debugger_.getProgramState().getStackTrace();

  if (stackTrace.callFrameCount() > 0) {
    debugger::SourceLocation loc = stackTrace.callFrameForIndex(0).location;

    info.fileId = loc.fileId;
    info.fileName = loc.fileName;
    info.sourceMappingUrl = debugger_.getSourceMappingUrl(info.fileId);
  }

  return info;
}

void Inspector::addCurrentScriptToLoadedScripts() {
  ScriptInfo info = getScriptInfoFromTopCallFrame();

  if (!loadedScripts_.count(info.fileId)) {
    loadedScriptIdByName_[info.fileName] = info.fileId;
    loadedScripts_[info.fileId] = LoadedScriptInfo{std::move(info), false};
  }
}

void Inspector::removeAllBreakpoints() {
  debugger_.deleteAllBreakpoints();
}

void Inspector::resetScriptsLoaded() {
  for (auto &it : loadedScripts_) {
    it.second.notifiedClient = false;
  }
}

void Inspector::notifyScriptsLoaded() {
  for (auto &it : loadedScripts_) {
    LoadedScriptInfo &loadedScriptInfo = it.second;

    if (!loadedScriptInfo.notifiedClient) {
      loadedScriptInfo.notifiedClient = true;
      observer_.onScriptParsed(*this, loadedScriptInfo.info);
    }
  }
}

folly::Future<Unit> Inspector::disable() {
  auto promise = std::make_shared<folly::Promise<Unit>>();

  executor_->add([this, promise] { disableOnExecutor(promise); });

  return promise->getFuture();
}

folly::Future<Unit> Inspector::enable() {
  auto promise = std::make_shared<folly::Promise<Unit>>();

  executor_->add([this, promise] { enableOnExecutor(promise); });

  return promise->getFuture();
}

folly::Future<Unit> Inspector::executeIfEnabled(
    const std::string &description,
    folly::Function<void(const debugger::ProgramState &)> func) {
  auto promise = std::make_shared<folly::Promise<Unit>>();

  executor_->add(
      [this, description, func = std::move(func), promise]() mutable {
        executeIfEnabledOnExecutor(description, std::move(func), promise);
      });

  return promise->getFuture();
}

folly::Future<debugger::BreakpointInfo> Inspector::setBreakpoint(
    debugger::SourceLocation loc,
    folly::Optional<std::string> condition) {
  auto promise = std::make_shared<folly::Promise<debugger::BreakpointInfo>>();
  // Automatically re-enable breakpoints since the user presumably wants this
  // to start triggering.
  breakpointsActive_ = true;

  executor_->add([this, loc, condition, promise] {
    setBreakpointOnExecutor(loc, condition, promise);
  });

  return promise->getFuture();
}

folly::Future<folly::Unit> Inspector::removeBreakpoint(
    debugger::BreakpointID breakpointId) {
  auto promise = std::make_shared<folly::Promise<folly::Unit>>();

  executor_->add([this, breakpointId, promise] {
    removeBreakpointOnExecutor(breakpointId, promise);
  });

  return promise->getFuture();
}

folly::Future<folly::Unit> Inspector::logMessage(ConsoleMessageInfo info) {
  auto promise = std::make_shared<folly::Promise<folly::Unit>>();

  executor_->add([this,
                  pInfo = std::make_unique<ConsoleMessageInfo>(std::move(info)),
                  promise] { logOnExecutor(std::move(*pInfo), promise); });

  return promise->getFuture();
}

folly::Future<Unit> Inspector::setPendingCommand(debugger::Command command) {
  auto promise = std::make_shared<folly::Promise<Unit>>();

  executor_->add([this, promise, cmd = std::move(command)]() mutable {
    setPendingCommandOnExecutor(std::move(cmd), promise);
  });

  return promise->getFuture();
}

folly::Future<Unit> Inspector::resume() {
  return setPendingCommand(debugger::Command::continueExecution());
}

folly::Future<Unit> Inspector::stepIn() {
  return setPendingCommand(debugger::Command::step(debugger::StepMode::Into));
}

folly::Future<Unit> Inspector::stepOver() {
  return setPendingCommand(debugger::Command::step(debugger::StepMode::Over));
}

folly::Future<Unit> Inspector::stepOut() {
  return setPendingCommand(debugger::Command::step(debugger::StepMode::Out));
}

folly::Future<Unit> Inspector::pause() {
  auto promise = std::make_shared<folly::Promise<Unit>>();

  executor_->add([this, promise]() { pauseOnExecutor(promise); });

  return promise->getFuture();
}

folly::Future<debugger::EvalResult> Inspector::evaluate(
    uint32_t frameIndex,
    const std::string &src,
    folly::Function<void(const facebook::hermes::debugger::EvalResult &)>
        resultTransformer) {
  auto promise = std::make_shared<folly::Promise<debugger::EvalResult>>();

  executor_->add([this,
                  frameIndex,
                  src,
                  promise,
                  resultTransformer = std::move(resultTransformer)]() mutable {
    evaluateOnExecutor(frameIndex, src, promise, std::move(resultTransformer));
  });

  return promise->getFuture();
}

folly::Future<folly::Unit> Inspector::setPauseOnExceptions(
    const debugger::PauseOnThrowMode &mode) {
  auto promise = std::make_shared<folly::Promise<Unit>>();

  executor_->add([this, mode, promise]() mutable {
    setPauseOnExceptionsOnExecutor(mode, promise);
  });

  return promise->getFuture();
};

folly::Future<folly::Unit> Inspector::setPauseOnLoads(
    const PauseOnLoadMode mode) {
  // This flag does not touch the runtime, so it doesn't need the executor.
  // Return a future anyways for consistency.
  auto promise = std::make_shared<folly::Promise<Unit>>();
  pauseOnLoadMode_ = mode;
  promise->setValue();
  return promise->getFuture();
};

folly::Future<folly::Unit> Inspector::setBreakpointsActive(bool active) {
  // Same logic as setPauseOnLoads.
  auto promise = std::make_shared<folly::Promise<Unit>>();
  breakpointsActive_ = active;
  promise->setValue();
  return promise->getFuture();
};

bool Inspector::shouldPauseOnThisScriptLoad() {
  switch (pauseOnLoadMode_) {
    case None:
      return false;
    case All:
      return true;
    case Smart:
      // If we don't have active breakpoints, there's nothing to set or update.
      if (debugger_.getBreakpoints().size() == 0) {
        return false;
      }
      // If there's no source map URL, it's probably not a file we care about.
      if (getScriptInfoFromTopCallFrame().sourceMappingUrl.size() == 0) {
        return false;
      }
      return true;
  }
};

debugger::Command Inspector::didPause(debugger::Debugger &debugger) {
  std::unique_lock<std::mutex> lock(mutex_);

  if (kShouldLog) {
    LOG(INFO) << "received didPause for reason: "
              << static_cast<int>(debugger.getProgramState().getPauseReason())
              << " in state: " << *state_;
  }

  while (true) {
    /*
     * Keep sending the onPause event to the current state until we get a
     * command to return. For instance, this handles the transition from
     * Running to Paused to Running:
     *
     * 1) (R => P) We're currently in Running, so we call Running::didPause,
     *    which returns {nextState: Paused, command: null}. There isn't a
     *    command to return yet.
     * 2) (P => R) Now we're in Paused, so we call Paused::didPause, which
     *    returns {nextState: Running, command: someCommand} where someCommand
     *    is non-null (e.g. continue or step over). This terminates the loop.
     */
    auto result = state_->didPause(lock);

    std::unique_ptr<InspectorState> nextState = std::move(result.first);
    if (nextState) {
      TRANSITION(std::move(nextState));
    }

    std::unique_ptr<debugger::Command> command = std::move(result.second);
    if (command) {
      return std::move(*command);
    }
  }
}

void Inspector::breakpointResolved(
    debugger::Debugger &debugger,
    debugger::BreakpointID breakpointId) {
  std::unique_lock<std::mutex> lock(mutex_);

  debugger::BreakpointInfo info = debugger.getBreakpointInfo(breakpointId);
  observer_.onBreakpointResolved(*this, info);
}

void Inspector::transition(std::unique_ptr<InspectorState> nextState) {
  assert(nextState);
  assert(state_ != nextState);

  std::unique_ptr<InspectorState> prevState = std::move(state_);
  state_ = std::move(nextState);
  state_->onEnter(prevState.get());
}

void Inspector::disableOnExecutor(
    std::shared_ptr<folly::Promise<Unit>> promise) {
  std::lock_guard<std::mutex> lock(mutex_);

  debugger_.setIsDebuggerAttached(false);

  state_->detach(promise);
}

void Inspector::enableOnExecutor(
    std::shared_ptr<folly::Promise<Unit>> promise) {
  std::lock_guard<std::mutex> lock(mutex_);

  auto result = state_->enable();

  /**
   * We fulfill the promise before changing state because fulfilling the promise
   * responds to the Debugger.enable request, and changing state could send a
   * notification (like Debugger.paused). It seems like a good idea to respond
   * to enable before sending out any notifications.
   */
  bool enabled = result.second;
  if (enabled) {
    debugger_.setIsDebuggerAttached(true);
    promise->setValue();
  } else {
    promise->setException(AlreadyEnabledException());
  }

  std::unique_ptr<InspectorState> nextState = std::move(result.first);
  if (nextState) {
    TRANSITION(std::move(nextState));
  }
}

void Inspector::executeIfEnabledOnExecutor(
    const std::string &description,
    folly::Function<void(const debugger::ProgramState &)> func,
    std::shared_ptr<folly::Promise<Unit>> promise) {
  std::lock_guard<std::mutex> lock(mutex_);

  if (!state_->isPaused() && !state_->isRunning()) {
    promise->setException(InvalidStateException(
        description, state_->description(), "paused or running"));
    return;
  }

  folly::Func wrappedFunc = [this, func = std::move(func)]() mutable {
    func(debugger_.getProgramState());
  };

  state_->pushPendingFunc(
      [wrappedFunc = std::move(wrappedFunc), promise]() mutable {
        wrappedFunc();
        promise->setValue();
      });
}

void Inspector::setBreakpointOnExecutor(
    debugger::SourceLocation loc,
    folly::Optional<std::string> condition,
    std::shared_ptr<folly::Promise<debugger::BreakpointInfo>> promise) {
  std::lock_guard<std::mutex> lock(mutex_);

  bool pushed = state_->pushPendingFunc([this, loc, condition, promise] {
    debugger::BreakpointID id = debugger_.setBreakpoint(loc);
    debugger::BreakpointInfo info{debugger::kInvalidBreakpoint};
    if (id != debugger::kInvalidBreakpoint) {
      info = debugger_.getBreakpointInfo(id);

      if (condition) {
        debugger_.setBreakpointCondition(id, condition.value());
      }
    }

    promise->setValue(std::move(info));
  });

  if (!pushed) {
    promise->setException(NotEnabledException("setBreakpoint"));
  }
}

void Inspector::removeBreakpointOnExecutor(
    debugger::BreakpointID breakpointId,
    std::shared_ptr<folly::Promise<folly::Unit>> promise) {
  std::lock_guard<std::mutex> lock(mutex_);

  bool pushed = state_->pushPendingFunc([this, breakpointId, promise] {
    debugger_.deleteBreakpoint(breakpointId);
    promise->setValue();
  });

  if (!pushed) {
    promise->setException(NotEnabledException("removeBreakpoint"));
  }
}

void Inspector::logOnExecutor(
    ConsoleMessageInfo info,
    std::shared_ptr<folly::Promise<folly::Unit>> promise) {
  std::lock_guard<std::mutex> lock(mutex_);

  state_->pushPendingFunc([this, info = std::move(info)] {
    observer_.onMessageAdded(*this, info);
  });

  promise->setValue();
}

void Inspector::setPendingCommandOnExecutor(
    debugger::Command command,
    std::shared_ptr<folly::Promise<Unit>> promise) {
  std::lock_guard<std::mutex> lock(mutex_);

  state_->setPendingCommand(std::move(command), promise);
}

void Inspector::pauseOnExecutor(std::shared_ptr<folly::Promise<Unit>> promise) {
  std::lock_guard<std::mutex> lock(mutex_);

  bool canPause = state_->pause();

  if (canPause) {
    promise->setValue();
  } else {
    promise->setException(NotEnabledException("pause"));
  }
}

void Inspector::evaluateOnExecutor(
    uint32_t frameIndex,
    const std::string &src,
    std::shared_ptr<folly::Promise<debugger::EvalResult>> promise,
    folly::Function<void(const facebook::hermes::debugger::EvalResult &)>
        resultTransformer) {
  std::lock_guard<std::mutex> lock(mutex_);

  state_->pushPendingEval(
      frameIndex, src, promise, std::move(resultTransformer));
}

void Inspector::setPauseOnExceptionsOnExecutor(
    const debugger::PauseOnThrowMode &mode,
    std::shared_ptr<folly::Promise<folly::Unit>> promise) {
  std::lock_guard<std::mutex> local(mutex_);

  state_->pushPendingFunc([this, mode, promise] {
    debugger_.setPauseOnThrowMode(mode);
    promise->setValue();
  });
}

static const char *kSuppressionVariable = "_hermes_suppress_superseded_warning";
void Inspector::alertIfPausedInSupersededFile() {
  if (isExecutingSupersededFile() &&
      !shouldSuppressAlertAboutSupersededFiles()) {
    ScriptInfo info = getScriptInfoFromTopCallFrame();
    std::string warning =
        "You have loaded the current file multiple times, and you are "
        "now paused in one of the previous instances. The source "
        "code you see may not correspond to what's being executed "
        "(set JS variable " +
        std::string(kSuppressionVariable) +
        "=true to "
        "suppress this warning. Filename: " +
        info.fileName + ").";
    jsi::Array jsiArray(adapter_->getRuntime(), 1);
    jsiArray.setValueAtIndex(adapter_->getRuntime(), 0, warning);

    ConsoleMessageInfo logMessage("warning", std::move(jsiArray));
    observer_.onMessageAdded(*this, logMessage);
  }
}

bool Inspector::shouldSuppressAlertAboutSupersededFiles() {
  jsi::Runtime &rt = adapter_->getRuntime();
  jsi::Value setting = rt.global().getProperty(rt, kSuppressionVariable);

  if (setting.isUndefined() || !setting.isBool())
    return false;
  return setting.getBool();
}

bool Inspector::isExecutingSupersededFile() {
  ScriptInfo info = getScriptInfoFromTopCallFrame();
  if (info.fileName.empty())
    return false;

  auto it = loadedScriptIdByName_.find(info.fileName);
  if (it != loadedScriptIdByName_.end()) {
    return it->second > info.fileId;
  }
  return false;
}

bool Inspector::isAwaitingDebuggerOnStart() {
  return awaitingDebuggerOnStart_;
}

} // namespace inspector
} // namespace hermes
} // namespace facebook
