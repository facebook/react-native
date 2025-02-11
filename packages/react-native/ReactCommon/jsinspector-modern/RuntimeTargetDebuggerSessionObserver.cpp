/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsinspector-modern/RuntimeTarget.h>

namespace facebook::react::jsinspector_modern {

void RuntimeTarget::installDebuggerSessionObserver() {
  jsExecutor_([](jsi::Runtime& runtime) {
    auto globalObj = runtime.global();
    try {
      auto observer = jsi::Object(runtime);

      observer.setProperty(runtime, "hasActiveSession", jsi::Value(false));

      auto setFunction = globalObj.getPropertyAsFunction(runtime, "Set");
      auto set = setFunction.callAsConstructor(runtime);
      observer.setProperty(runtime, "subscribers", set);

      observer.setProperty(
          runtime,
          "onSessionStatusChange",
          jsi::Function::createFromHostFunction(
              runtime,
              jsi::PropNameID::forAscii(runtime, "onSessionStatusChange"),
              1,
              [](jsi::Runtime& onSessionStatusChangeRuntime,
                 const jsi::Value& /* onSessionStatusChangeThisVal */,
                 const jsi::Value* onSessionStatusChangeArgs,
                 size_t onSessionStatusChangeArgsCount) {
                if (onSessionStatusChangeArgsCount != 1 ||
                    !onSessionStatusChangeArgs[0].isBool()) {
                  throw jsi::JSError(
                      onSessionStatusChangeRuntime,
                      "Invalid arguments: onSessionStatusChange expects 1 boolean argument");
                }

                bool updatedStatus = onSessionStatusChangeArgs[0].getBool();

                auto observerInstanceFromOnSessionStatusChange =
                    onSessionStatusChangeRuntime.global().getPropertyAsObject(
                        onSessionStatusChangeRuntime,
                        "__DEBUGGER_SESSION_OBSERVER__");
                auto subscribersToNotify =
                    observerInstanceFromOnSessionStatusChange
                        .getPropertyAsObject(
                            onSessionStatusChangeRuntime, "subscribers");

                observerInstanceFromOnSessionStatusChange.setProperty(
                    onSessionStatusChangeRuntime,
                    "hasActiveSession",
                    updatedStatus);

                if (subscribersToNotify
                        .getProperty(onSessionStatusChangeRuntime, "size")
                        .asNumber() == 0) {
                  return jsi::Value::undefined();
                }

                auto forEachSubscriber =
                    subscribersToNotify.getPropertyAsFunction(
                        onSessionStatusChangeRuntime, "forEach");
                auto forEachSubscriberCallback =
                    jsi::Function::createFromHostFunction(
                        onSessionStatusChangeRuntime,
                        jsi::PropNameID::forAscii(
                            onSessionStatusChangeRuntime, "forEachCallback"),
                        1,
                        [updatedStatus](
                            jsi::Runtime& forEachCallbackRuntime,
                            const jsi::Value& /* forEachCallbackThisVal */,
                            const jsi::Value* forEachCallbackArgs,
                            size_t forEachCallbackArgsCount) {
                          if (forEachCallbackArgsCount < 1 ||
                              !forEachCallbackArgs[0].isObject() ||
                              !forEachCallbackArgs[0]
                                   .getObject(forEachCallbackRuntime)
                                   .isFunction(forEachCallbackRuntime)) {
                            throw jsi::JSError(
                                forEachCallbackRuntime,
                                "Invalid arguments: forEachSubscriberCallback expects function as a first argument");
                          }

                          forEachCallbackArgs[0]
                              .getObject(forEachCallbackRuntime)
                              .asFunction(forEachCallbackRuntime)
                              .call(forEachCallbackRuntime, updatedStatus);

                          return jsi::Value::undefined();
                        });

                forEachSubscriber.callWithThis(
                    onSessionStatusChangeRuntime,
                    subscribersToNotify,
                    forEachSubscriberCallback);

                return jsi::Value::undefined();
              }));

      globalObj.setProperty(runtime, "__DEBUGGER_SESSION_OBSERVER__", observer);
    } catch (jsi::JSError&) {
      // Suppress any errors, they should not be visible to the user
      // and should not affect runtime.
    }
  });
}

} // namespace facebook::react::jsinspector_modern
