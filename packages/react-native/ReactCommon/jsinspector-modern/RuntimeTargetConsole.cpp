/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsinspector-modern/RuntimeTarget.h>
#include <jsinspector-modern/tracing/PerformanceTracer.h>

#include <concepts>
#include <deque>
#include <string>

using namespace facebook::jsi;
using namespace std::string_literals;

namespace facebook::react::jsinspector_modern {

namespace {

struct ConsoleState {
  /**
   * https://console.spec.whatwg.org/#counting
   */
  std::unordered_map<std::string, int> countMap;

  /**
   * https://console.spec.whatwg.org/#timing
   */
  std::unordered_map<std::string, double> timerTable;

  ConsoleState() = default;
  ConsoleState(const ConsoleState&) = delete;
  ConsoleState& operator=(const ConsoleState&) = delete;
  ConsoleState(ConsoleState&&) = delete;
  ConsoleState& operator=(ConsoleState&&) = delete;
  ~ConsoleState() = default;
};

/**
 * JS `Object.create()`
 */
jsi::Object objectCreate(jsi::Runtime& runtime, jsi::Value prototype) {
  auto objectGlobal = runtime.global().getPropertyAsObject(runtime, "Object");
  auto createFn = objectGlobal.getPropertyAsFunction(runtime, "create");
  return createFn.callWithThis(runtime, objectGlobal, prototype)
      .getObject(runtime);
}

bool toBoolean(jsi::Runtime& runtime, const jsi::Value& val) {
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

/**
 * Get the current time in milliseconds as a double.
 */
double getTimestampMs() {
  return std::chrono::duration_cast<std::chrono::duration<double, std::milli>>(
             std::chrono::system_clock::now().time_since_epoch())
      .count();
}

template <typename T>
concept ConsoleMethodBody = std::invocable<
    T,
    jsi::Runtime& /*runtime*/,
    const jsi::Value* /*args*/,
    size_t /*count*/,
    RuntimeTargetDelegate& /*runtimeTargetDelegate*/,
    ConsoleState& /*state*/,
    double /*timestampMs*/,
    std::unique_ptr<StackTrace> /*stackTrace*/>;

template <typename T>
concept CallableAsHostFunction = std::invocable<
    T,
    jsi::Runtime& /*runtime*/,
    const jsi::Value& /*thisVal*/,
    const jsi::Value* /*args*/,
    size_t /*count*/>;

void consoleCount(
    jsi::Runtime& runtime,
    const jsi::Value* args,
    size_t count,
    RuntimeTargetDelegate& runtimeTargetDelegate,
    ConsoleState& state,
    double timestampMs,
    std::unique_ptr<StackTrace> stackTrace) {
  std::string label = "default";
  if (count > 0 && !args[0].isUndefined()) {
    label = args[0].toString(runtime).utf8(runtime);
  }
  auto it = state.countMap.find(label);
  if (it == state.countMap.end()) {
    it = state.countMap.insert({label, 1}).first;
  } else {
    it->second++;
  }
  std::vector<jsi::Value> vec;
  vec.emplace_back(jsi::String::createFromUtf8(
      runtime, label + ": "s + std::to_string(it->second)));
  runtimeTargetDelegate.addConsoleMessage(
      runtime,
      {timestampMs,
       ConsoleAPIType::kCount,
       std::move(vec),
       std::move(stackTrace)});
}

void consoleCountReset(
    jsi::Runtime& runtime,
    const jsi::Value* args,
    size_t count,
    RuntimeTargetDelegate& runtimeTargetDelegate,
    ConsoleState& state,
    double timestampMs,
    std::unique_ptr<StackTrace> stackTrace) {
  std::string label = "default";
  if (count > 0 && !args[0].isUndefined()) {
    label = args[0].toString(runtime).utf8(runtime);
  }
  auto it = state.countMap.find(label);
  if (it == state.countMap.end()) {
    std::vector<jsi::Value> vec;
    vec.emplace_back(jsi::String::createFromUtf8(
        runtime, "Count for '"s + label + "' does not exist"));
    runtimeTargetDelegate.addConsoleMessage(
        runtime,
        {timestampMs,
         ConsoleAPIType::kWarning,
         std::move(vec),
         std::move(stackTrace)});
  } else {
    it->second = 0;
  }
}

void consoleTime(
    jsi::Runtime& runtime,
    const jsi::Value* args,
    size_t count,
    RuntimeTargetDelegate& runtimeTargetDelegate,
    ConsoleState& state,
    double timestampMs,
    std::unique_ptr<StackTrace> stackTrace) {
  std::string label = "default";
  if (count > 0 && !args[0].isUndefined()) {
    label = args[0].toString(runtime).utf8(runtime);
  }
  auto it = state.timerTable.find(label);
  if (it == state.timerTable.end()) {
    state.timerTable.insert({label, timestampMs});
  } else {
    std::vector<jsi::Value> vec;
    vec.emplace_back(jsi::String::createFromUtf8(
        runtime, "Timer '"s + label + "' already exists"));
    runtimeTargetDelegate.addConsoleMessage(
        runtime,
        {timestampMs,
         ConsoleAPIType::kWarning,
         std::move(vec),
         std::move(stackTrace)});
  }
}

void consoleTimeEnd(
    jsi::Runtime& runtime,
    const jsi::Value* args,
    size_t count,
    RuntimeTargetDelegate& runtimeTargetDelegate,
    ConsoleState& state,
    double timestampMs,
    std::unique_ptr<StackTrace> stackTrace) {
  std::string label = "default";
  if (count > 0 && !args[0].isUndefined()) {
    label = args[0].toString(runtime).utf8(runtime);
  }
  auto it = state.timerTable.find(label);
  if (it == state.timerTable.end()) {
    std::vector<jsi::Value> vec;
    vec.emplace_back(jsi::String::createFromUtf8(
        runtime, "Timer '"s + label + "' does not exist"));
    runtimeTargetDelegate.addConsoleMessage(
        runtime,
        {timestampMs,
         ConsoleAPIType::kWarning,
         std::move(vec),
         std::move(stackTrace)});
  } else {
    std::vector<jsi::Value> vec;
    vec.emplace_back(jsi::String::createFromUtf8(
        runtime,
        label + ": "s + std::to_string(timestampMs - it->second) + " ms"));
    state.timerTable.erase(it);
    runtimeTargetDelegate.addConsoleMessage(
        runtime,
        {timestampMs,
         ConsoleAPIType::kTimeEnd,
         std::move(vec),
         std::move(stackTrace)});
  }
}

void consoleTimeLog(
    jsi::Runtime& runtime,
    const jsi::Value* args,
    size_t count,
    RuntimeTargetDelegate& runtimeTargetDelegate,
    ConsoleState& state,
    double timestampMs,
    std::unique_ptr<StackTrace> stackTrace) {
  std::string label = "default";
  if (count > 0 && !args[0].isUndefined()) {
    label = args[0].toString(runtime).utf8(runtime);
  }
  auto it = state.timerTable.find(label);
  if (it == state.timerTable.end()) {
    std::vector<jsi::Value> vec;
    vec.emplace_back(jsi::String::createFromUtf8(
        runtime, "Timer '"s + label + "' does not exist"));
    runtimeTargetDelegate.addConsoleMessage(
        runtime,
        {timestampMs,
         ConsoleAPIType::kWarning,
         std::move(vec),
         std::move(stackTrace)});
  } else {
    std::vector<jsi::Value> vec;
    vec.emplace_back(jsi::String::createFromUtf8(
        runtime,
        label + ": "s + std::to_string(timestampMs - it->second) + " ms"));
    if (count > 1) {
      for (size_t i = 1; i != count; ++i) {
        vec.emplace_back(runtime, args[i]);
      }
    }
    runtimeTargetDelegate.addConsoleMessage(
        runtime,
        {timestampMs,
         ConsoleAPIType::kLog,
         std::move(vec),
         std::move(stackTrace)});
  }
}

void consoleAssert(
    jsi::Runtime& runtime,
    const jsi::Value* args,
    size_t count,
    RuntimeTargetDelegate& runtimeTargetDelegate,
    ConsoleState& /*state*/,
    double timestampMs,
    std::unique_ptr<StackTrace> stackTrace) {
  if (count >= 1 && toBoolean(runtime, args[0])) {
    return;
  }
  std::deque<jsi::Value> data;

  if (count > 1) {
    for (size_t i = 1; i != count; ++i) {
      data.emplace_back(runtime, args[i]);
    }
  }
  if (data.empty()) {
    data.emplace_back(jsi::String::createFromUtf8(runtime, "Assertion failed"));
  } else if (data.front().isString()) {
    data.front() = jsi::String::createFromUtf8(
        runtime,
        "Assertion failed: "s + data.front().asString(runtime).utf8(runtime));
  } else {
    data.emplace_front(
        jsi::String::createFromUtf8(runtime, "Assertion failed"));
  }
  runtimeTargetDelegate.addConsoleMessage(
      runtime,
      {timestampMs,
       ConsoleAPIType::kAssert,
       std::vector<jsi::Value>(
           make_move_iterator(data.begin()), make_move_iterator(data.end())),
       std::move(stackTrace)});
}

/**
 * `console` methods that have no behaviour other than emitting a
 * Runtime.consoleAPICalled message.
 */
#define FORWARDING_CONSOLE_METHOD(name, type)                            \
  void console_##name(                                                   \
      jsi::Runtime& runtime,                                             \
      const jsi::Value* args,                                            \
      size_t count,                                                      \
      RuntimeTargetDelegate& runtimeTargetDelegate,                      \
      ConsoleState& state,                                               \
      double timestampMs,                                                \
      std::unique_ptr<StackTrace> stackTrace) {                          \
    std::vector<jsi::Value> argsVec;                                     \
    for (size_t i = 0; i != count; ++i) {                                \
      argsVec.emplace_back(runtime, args[i]);                            \
    }                                                                    \
    runtimeTargetDelegate.addConsoleMessage(                             \
        runtime,                                                         \
        {timestampMs, type, std::move(argsVec), std::move(stackTrace)}); \
  }
#include "ForwardingConsoleMethods.def"
#undef FORWARDING_CONSOLE_METHOD

/*
 * Attempt to call String() on the given value.
 */
std::optional<std::string> stringifyJsiValue(
    const jsi::Value& value,
    jsi::Runtime& runtime) {
  auto String = runtime.global().getPropertyAsFunction(runtime, "String");
  return String.call(runtime, value).asString(runtime).utf8(runtime);
};

/**
 * Call innerFn and forward any arguments to the original console method
 * named methodName, if possible.
 */
auto forwardToOriginalConsole(
    std::shared_ptr<jsi::Object> originalConsole,
    const char* methodName,
    CallableAsHostFunction auto innerFn) {
  return [originalConsole = std::move(originalConsole),
          innerFn = std::move(innerFn),
          methodName](
             jsi::Runtime& runtime,
             const jsi::Value& thisVal,
             const jsi::Value* args,
             size_t count) {
    jsi::Value retVal = innerFn(runtime, thisVal, args, count);
    if (originalConsole) {
      auto val = originalConsole->getProperty(runtime, methodName);
      if (val.isObject()) {
        auto obj = val.getObject(runtime);
        if (obj.isFunction(runtime)) {
          auto func = obj.getFunction(runtime);
          func.callWithThis(runtime, *originalConsole, args, count);
        }
      }
    }
    return std::move(retVal);
  };
};

/**
 * Recording a marker on a timeline of the Performance instrumentation.
 * No actual logging is provided by definition.
 * https://developer.mozilla.org/en-US/docs/Web/API/console/timeStamp_static
 * https://developer.chrome.com/docs/devtools/performance/extension#inject_your_data_with_consoletimestamp
 */
void consoleTimeStamp(
    jsi::Runtime& runtime,
    const jsi::Value* arguments,
    size_t argumentsCount) {
  auto& performanceTracer = tracing::PerformanceTracer::getInstance();
  if (!performanceTracer.isTracing() || argumentsCount == 0) {
    // If not tracing, just early return to avoid the cost of parsing.
    return;
  }

  const jsi::Value& labelArgument = arguments[0];
  std::string label;
  if (labelArgument.isString()) {
    label = labelArgument.asString(runtime).utf8(runtime);
  } else {
    auto maybeStringifiedLabel = stringifyJsiValue(labelArgument, runtime);
    if (maybeStringifiedLabel) {
      label = std::move(*maybeStringifiedLabel);
    } else {
      // Do not record this entry: unable to reliably stringify the label.
      return;
    }
  }

  auto now = HighResTimeStamp::now();
  std::optional<tracing::ConsoleTimeStampEntry> start;
  if (argumentsCount >= 2) {
    const jsi::Value& startArgument = arguments[1];
    if (startArgument.isNumber()) {
      start =
          HighResTimeStamp::fromDOMHighResTimeStamp(startArgument.asNumber());
    } else if (startArgument.isString()) {
      start = startArgument.asString(runtime).utf8(runtime);
    } else if (startArgument.isUndefined()) {
      start = now;
    }
  }

  std::optional<tracing::ConsoleTimeStampEntry> end;
  if (argumentsCount >= 3) {
    const jsi::Value& endArgument = arguments[2];
    if (endArgument.isNumber()) {
      end = HighResTimeStamp::fromDOMHighResTimeStamp(endArgument.asNumber());
    } else if (endArgument.isString()) {
      end = endArgument.asString(runtime).utf8(runtime);
    } else if (endArgument.isUndefined()) {
      end = now;
    }
  }

  std::optional<std::string> trackName;
  std::optional<std::string> trackGroup;
  std::optional<tracing::ConsoleTimeStampColor> color;
  if (argumentsCount >= 4) {
    const jsi::Value& trackNameArgument = arguments[3];
    if (trackNameArgument.isString()) {
      trackName = trackNameArgument.asString(runtime).utf8(runtime);
    }
  }
  if (argumentsCount >= 5) {
    const jsi::Value& trackGroupArgument = arguments[4];
    if (trackGroupArgument.isString()) {
      trackGroup = trackGroupArgument.asString(runtime).utf8(runtime);
    }
  }
  if (argumentsCount >= 6) {
    const jsi::Value& colorArgument = arguments[5];
    if (colorArgument.isString()) {
      color = tracing::getConsoleTimeStampColorFromString(
          colorArgument.asString(runtime).utf8(runtime));
    }
  }

  performanceTracer.reportTimeStamp(
      label, start, end, trackName, trackGroup, color);
}

/*
 * Installs console.timeStamp and manages the forwarding to the original console
 * object, if available.
 */
void installConsoleTimeStamp(
    jsi::Runtime& runtime,
    std::shared_ptr<jsi::Object> originalConsole,
    jsi::Object& consoleObject) {
  consoleObject.setProperty(
      runtime,
      "timeStamp",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "timeStamp"),
          0,
          forwardToOriginalConsole(
              originalConsole,
              "timeStamp",
              [](jsi::Runtime& runtime,
                 const jsi::Value& /*thisVal*/,
                 const jsi::Value* args,
                 size_t count) {
                consoleTimeStamp(runtime, args, count);
                return jsi::Value::undefined();
              })));
}

} // namespace

void RuntimeTarget::installConsoleHandler() {
  auto delegateSupportsConsole = delegate_.supportsConsole();
  jsExecutor_([selfWeak = weak_from_this(),
               selfExecutor = executorFromThis(),
               delegateSupportsConsole](jsi::Runtime& runtime) {
    jsi::Value consolePrototype = jsi::Value::null();
    auto originalConsoleVal = runtime.global().getProperty(runtime, "console");
    std::shared_ptr<jsi::Object> originalConsole;
    if (originalConsoleVal.isObject()) {
      originalConsole =
          std::make_shared<jsi::Object>(originalConsoleVal.getObject(runtime));
      consolePrototype = std::move(originalConsoleVal);
    } else {
      consolePrototype = jsi::Object(runtime);
    }
    auto console = objectCreate(runtime, std::move(consolePrototype));
    auto state = std::make_shared<ConsoleState>();

    /**
     * An executor that runs synchronously and provides a safe reference to our
     * RuntimeTargetDelegate for use on the JS thread.
     * \see RuntimeTargetDelegate for information on which methods are safe to
     * call on the JS thread.
     * \warning The callback will not run if the RuntimeTarget has been
     * destroyed.
     */
    auto delegateExecutorSync =
        [selfWeak,
         selfExecutor](std::invocable<RuntimeTargetDelegate&> auto func) {
          if (auto self = selfWeak.lock()) {
            // Q: Why is it safe to use self->delegate_ here?
            // A: Because the caller of InspectorTarget::registerRuntime
            // is explicitly required to guarantee that the delegate not
            // only outlives the target, but also outlives all JS code
            // execution that occurs on the JS thread.
            func(self->delegate_);
            // To ensure we never destroy `self` on the JS thread, send
            // our shared_ptr back to the inspector thread.
            selfExecutor([self = std::move(self)](auto&) { (void)self; });
          }
        };

    /**
     * Install a console method with the given name and body. The body receives
     * the usual JSI host function parameters plus a ConsoleState reference, a
     * reference to the RuntimeTargetDelegate for sending messages to the
     * client, and the timestamp of the call. After the body runs (or is skipped
     * due to RuntimeTarget having been destroyed), the method of the same name
     * is also called on originalConsole (if it exists).
     */
    auto installConsoleMethod = [&](const char* methodName,
                                    ConsoleMethodBody auto body) {
      console.setProperty(
          runtime,
          methodName,
          jsi::Function::createFromHostFunction(
              runtime,
              jsi::PropNameID::forAscii(runtime, methodName),
              0,
              forwardToOriginalConsole(
                  originalConsole,
                  methodName,
                  [body = std::move(body), state, delegateExecutorSync](
                      jsi::Runtime& runtime,
                      const jsi::Value& /*thisVal*/,
                      const jsi::Value* args,
                      size_t count) {
                    auto timestampMs = getTimestampMs();
                    delegateExecutorSync([&](auto& runtimeTargetDelegate) {
                      auto stackTrace = runtimeTargetDelegate.captureStackTrace(
                          runtime, /* framesToSkip */ 1);
                      body(
                          runtime,
                          args,
                          count,
                          runtimeTargetDelegate,
                          *state,
                          timestampMs,
                          std::move(stackTrace));
                    });
                    return jsi::Value::undefined();
                  })));
    };

    /**
     * console.count
     */
    installConsoleMethod("count", consoleCount);

    /**
     * console.countReset
     */
    installConsoleMethod("countReset", consoleCountReset);

    /**
     * console.time
     */
    installConsoleMethod("time", consoleTime);

    /**
     * console.timeEnd
     */
    installConsoleMethod("timeEnd", consoleTimeEnd);

    /**
     * console.timeLog
     */
    installConsoleMethod("timeLog", consoleTimeLog);

    /**
     * console.assert
     */
    installConsoleMethod("assert", consoleAssert);

    /**
     * console.timeStamp
     */
    installConsoleTimeStamp(runtime, originalConsole, console);

    // Install forwarding console methods.
#define FORWARDING_CONSOLE_METHOD(name, type) \
  installConsoleMethod(#name, console_##name);
#include "ForwardingConsoleMethods.def"
#undef FORWARDING_CONSOLE_METHOD

    runtime.global().setProperty(runtime, "console", console);
    if (delegateSupportsConsole) {
      // NOTE: If the delegate doesn't report console support, we'll still
      // install the console handler for consistency of the runtime environment,
      // but not claim that it has full console support.
      runtime.global().setProperty(
          runtime, "__FUSEBOX_HAS_FULL_CONSOLE_SUPPORT__", true);
    }
  });
}

} // namespace facebook::react::jsinspector_modern
