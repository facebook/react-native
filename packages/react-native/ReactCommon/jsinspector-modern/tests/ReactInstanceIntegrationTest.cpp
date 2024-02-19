/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactInstanceIntegrationTest.h"
#include "UniquePtrFactory.h"
#include "prelude.js.h"

#include <folly/json.h>
#include <glog/logging.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#include <react/runtime/hermes/HermesInstance.h>

namespace facebook::react::jsinspector_modern {

class ReactInstanceIntegrationTestFeatureFlagsProvider
    : public ReactNativeFeatureFlagsDefaults {
 private:
  FeatureFlags flags_;

 public:
  explicit ReactInstanceIntegrationTestFeatureFlagsProvider(
      FeatureFlags featureFlags)
      : flags_(featureFlags) {}

  bool inspectorEnableModernCDPRegistry() override {
    return flags_.enableModernCDPRegistry;
  }
  bool inspectorEnableCxxInspectorPackagerConnection() override {
    return flags_.enableCxxInspectorPackagerConnection;
  }
};

ReactInstanceIntegrationTest::ReactInstanceIntegrationTest()
    : runtime(nullptr),
      instance(nullptr),
      messageQueueThread(std::make_shared<MockMessageQueueThread>()),
      errorHandler(std::make_shared<ErrorUtils>()),
      featureFlags(std::make_unique<FeatureFlags>()) {}

void ReactInstanceIntegrationTest::SetUp() {
  ReactNativeFeatureFlags::override(
      std::make_unique<ReactInstanceIntegrationTestFeatureFlagsProvider>(
          *featureFlags));

  auto mockRegistry = std::make_unique<MockTimerRegistry>();
  auto timerManager =
      std::make_shared<react::TimerManager>(std::move(mockRegistry));

  auto jsErrorHandlingFunc = [](react::MapBuffer error) noexcept {
    LOG(INFO) << "Error: \nFile: " << error.getString(react::kFrameFileName)
              << "\nLine: " << error.getInt(react::kFrameLineNumber)
              << "\nColumn: " << error.getInt(react::kFrameColumnNumber)
              << "\nMethod: " << error.getString(react::kFrameMethodName);
  };

  auto jsRuntimeFactory = std::make_unique<react::HermesInstance>();
  std::unique_ptr<react::JSRuntime> runtime_ =
      jsRuntimeFactory->createJSRuntime(nullptr, nullptr, messageQueueThread);
  jsi::Runtime* jsiRuntime = &runtime_->getRuntime();

  // Error handler:
  jsiRuntime->global().setProperty(
      *jsiRuntime,
      "ErrorUtils",
      jsi::Object::createFromHostObject(*jsiRuntime, errorHandler));

  std::shared_ptr<PageTarget> pageTargetIfModernCDP_ = nullptr;

  if (featureFlags->enableModernCDPRegistry) {
    VoidExecutor inspectorExecutor_ = [this](auto callback) {
      immediateExecutor_.add(callback);
    };
    MockPageTargetDelegate pageTargetDelegate_;
    pageTargetIfModernCDP_ =
        PageTarget::create(pageTargetDelegate_, inspectorExecutor_);
  }

  instance = std::make_unique<react::ReactInstance>(
      std::move(runtime_),
      messageQueueThread,
      timerManager,
      std::move(jsErrorHandlingFunc),
      pageTargetIfModernCDP_ == nullptr ? nullptr
                                        : pageTargetIfModernCDP_.get());

  timerManager->setRuntimeExecutor(instance->getBufferedRuntimeExecutor());

  // JS Environment:
  initializeRuntime(preludeJsCode);

  // Inspector:
  auto& inspector = getInspectorInstance();

  int pageId;
  if (pageTargetIfModernCDP_ != nullptr) {
    // Under modern CDP, the React host is responsible for adding its page on
    // startup.
    pageId = inspector.addPage(
        "mock-title",
        "mock-vm",
        [pageTargetIfModernCDP_](std::unique_ptr<IRemoteConnection> remote)
            -> std::unique_ptr<ILocalConnection> {
          auto localConnection = pageTargetIfModernCDP_->connect(
              std::move(remote),
              {
                  .integrationName = "ReactInstanceIntegrationTest",
              });
          return localConnection;
        },
        // TODO: Allow customisation of InspectorTargetCapabilities
        {});
  } else {
    // Under legacy CDP, Hermes' DecoratedRuntime adds its page automatically
    // within ConnectionDemux.enableDebugging.
    auto pages = inspector.getPages();
    assert(pages.size() > 0);
    pageId = pages.back().id;
  }

  clientToVM_ = inspector.connect(pageId, mockRemoteConnections_.make_unique());
}

void ReactInstanceIntegrationTest::TearDown() {
  ReactNativeFeatureFlags::dangerouslyReset();
  clientToVM_->disconnect();
}

void ReactInstanceIntegrationTest::initializeRuntime(std::string_view script) {
  react::ReactInstance::JSRuntimeFlags flags{
      .isProfiling = false,
  };
  instance->initializeRuntime(flags, [](jsi::Runtime&) {});

  messageQueueThread->tick();

  std::string init(script);
  // JS calls no longer buffered after calling loadScript
  instance->loadScript(std::make_unique<react::JSBigStdString>(init), "");

  messageQueueThread->flush();
}

void ReactInstanceIntegrationTest::send(
    const std::string& method,
    const folly::dynamic& params) {
  folly::dynamic request = folly::dynamic::object();

  request["method"] = method;
  request["id"] = id_++;
  request["params"] = params;

  sendJSONString(folly::toJson(request));
}

void ReactInstanceIntegrationTest::sendJSONString(const std::string& message) {
  // The runtime must be initialized and connected to before messaging
  clientToVM_->sendMessage(message);
  messageQueueThread->flush();
}

jsi::Value ReactInstanceIntegrationTest::run(const std::string& script) {
  auto runtimeExecutor = instance->getUnbufferedRuntimeExecutor();
  auto ret = jsi::Value::undefined();

  runtimeExecutor([script, &ret](jsi::Runtime& rt) {
    ret = rt.evaluateJavaScript(
        std::make_unique<jsi::StringBuffer>(script), "<test>");
  });

  messageQueueThread->flush();

  while (verbose_ && errorHandler->size() > 0) {
    LOG(INFO) << "Error: " << errorHandler->getLastError().getMessage();
  }

  return ret;
}

bool ReactInstanceIntegrationTest::verbose(bool isVerbose) {
  const bool previous = verbose_;
  verbose_ = isVerbose;
  return previous;
}

} // namespace facebook::react::jsinspector_modern
