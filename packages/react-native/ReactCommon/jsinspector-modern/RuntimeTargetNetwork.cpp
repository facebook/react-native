/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsinspector-modern/RuntimeTarget.h>
#include <jsinspector-modern/network/NetworkHandler.h>

#include <boost/uuid/random_generator.hpp>
#include <boost/uuid/uuid.hpp>
#include <boost/uuid/uuid_io.hpp>

using namespace facebook::jsi;
using namespace std::string_literals;

namespace facebook::react::jsinspector_modern {

namespace {

/**
 * JS `Object.create()`
 */
jsi::Object objectCreate(jsi::Runtime& runtime, jsi::Value prototype) {
  auto objectGlobal = runtime.global().getPropertyAsObject(runtime, "Object");
  auto createFn = objectGlobal.getPropertyAsFunction(runtime, "create");
  return createFn.callWithThis(runtime, objectGlobal, prototype)
      .getObject(runtime);
}

/**
 * JS `Object.freeze
 */
jsi::Object objectFreeze(jsi::Runtime& runtime, jsi::Object object) {
  auto objectGlobal = runtime.global().getPropertyAsObject(runtime, "Object");
  auto freezeFn = objectGlobal.getPropertyAsFunction(runtime, "freeze");
  return freezeFn.callWithThis(runtime, objectGlobal, object)
      .getObject(runtime);
}

} // namespace

void RuntimeTarget::installNetworkReporterAPI() {
  jsExecutor_([selfWeak = weak_from_this(),
               selfExecutor = executorFromThis()](jsi::Runtime& runtime) {
    auto globalObj = runtime.global();
    auto networkReporterApi = objectCreate(runtime, nullptr);
    networkReporterApi.setProperty(
        runtime,
        "createDevToolsRequestId",
        Function::createFromHostFunction(
            runtime,
            PropNameID::forAscii(runtime, "createDevToolsRequestId"),
            0,
            [selfWeak](
                Runtime& rt,
                const Value& thisVal,
                const Value* args,
                size_t count) -> Value {
              std::optional<std::string> devToolsRequestId;
              RuntimeTarget::tryRunWithSelfSync(
                  selfWeak, rt, [&](RuntimeTarget& self) {
                    devToolsRequestId = self.createNetworkRequestId();
                    // Q: Why is it safe to use self.delegate_ here?
                    // A: Because the caller of InspectorTarget::registerRuntime
                    // is explicitly required to guarantee that the delegate not
                    // only outlives the target, but also outlives all JS code
                    // execution that occurs on the JS thread.
                    auto stackTrace = self.delegate_.captureStackTrace(rt);
                    // TODO(moti): Instead of checking the singleton state,
                    // directly check whether the current target has a session
                    // with the Network domain enabled.
                    if (NetworkHandler::getInstance().isEnabled()) {
                      auto cdpStackTrace =
                          self.delegate_.serializeStackTrace(*stackTrace);
                      if (cdpStackTrace) {
                        NetworkHandler::getInstance()
                            .recordRequestInitiatorStack(
                                *devToolsRequestId, std::move(*cdpStackTrace));
                      }
                    }
                  });
              if (!devToolsRequestId) {
                throw JSError(rt, "React Native Runtime is shutting down");
              }
              return String::createFromUtf8(rt, *devToolsRequestId);
            }));
    networkReporterApi = objectFreeze(runtime, std::move(networkReporterApi));
    globalObj.setProperty(runtime, "__NETWORK_REPORTER__", networkReporterApi);
  });
}

std::string RuntimeTarget::createNetworkRequestId() {
  return boost::uuids::to_string(boost::uuids::random_generator()());
}

} // namespace facebook::react::jsinspector_modern
