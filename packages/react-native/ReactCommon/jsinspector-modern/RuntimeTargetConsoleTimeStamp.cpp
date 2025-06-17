/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsinspector-modern/RuntimeTarget.h>
#include <jsinspector-modern/tracing/PerformanceTracer.h>

namespace facebook::react::jsinspector_modern {

// https://developer.chrome.com/docs/devtools/performance/extension#inject_your_data_with_consoletimestamp
void RuntimeTarget::installConsoleTimeStamp() {
  jsExecutor_([](jsi::Runtime& runtime) {
    auto globalObj = runtime.global();
    auto console = globalObj.getPropertyAsObject(runtime, "console");

    auto handler = jsi::Function::createFromHostFunction(
        runtime,
        jsi::PropNameID::forAscii(runtime, "timeStamp"),
        6, // label, ?start, ?end, ?trackName, ?trackGroup, ?color
        [](jsi::Runtime& runtime,
           const jsi::Value& /* thisContext */,
           const jsi::Value* args,
           size_t argsCount) {
          auto& performanceTracer = tracing::PerformanceTracer::getInstance();
          if (!performanceTracer.isTracing()) {
            // If not tracing, just early return to avoid the cost of parsing.
            return jsi::Value::undefined();
          }

          if (argsCount == 0 || !args[0].isString()) {
            return jsi::Value::undefined();
          }
          auto label = args[0].asString(runtime).utf8(runtime);
          if (argsCount == 1) {
            performanceTracer.reportTimeStamp(label, HighResTimeStamp::now());
            return jsi::Value::undefined();
          }

          auto now = HighResTimeStamp::now();
          tracing::TimeStampEntry start;
          if (args[1].isNumber()) {
            start =
                HighResTimeStamp::fromDOMHighResTimeStamp(args[1].asNumber());
          } else if (args[1].isString()) {
            start = args[1].asString(runtime).utf8(runtime);
          } else if (args[1].isUndefined()) {
            start = now;
          } else {
            return jsi::Value::undefined();
          }

          tracing::TimeStampEntry end;
          if (args[2].isNumber()) {
            end = HighResTimeStamp::fromDOMHighResTimeStamp(args[2].asNumber());
          } else if (args[2].isString()) {
            end = args[2].asString(runtime).utf8(runtime);
          } else if (args[2].isUndefined()) {
            end = now;
          } else {
            return jsi::Value::undefined();
          }

          std::optional<std::string> trackName;
          std::optional<std::string> trackGroup;
          std::optional<tracing::TimeStampColor> color;
          if (args[3].isString()) {
            trackName = args[3].asString(runtime).utf8(runtime);
          }
          if (args[4].isString()) {
            trackGroup = args[4].asString(runtime).utf8(runtime);
          }
          if (args[5].isString()) {
            color = tracing::getTimeStampColorFromString(
                args[5].asString(runtime).utf8(runtime));
          }

          performanceTracer.reportTimeStamp(
              label, start, end, trackName, trackGroup, color);
          return jsi::Value::undefined();
        });

    console.setProperty(runtime, "timeStamp", handler);
  });
}

} // namespace facebook::react::jsinspector_modern
