/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactInstanceIntegrationTest.h"
#include "FollyDynamicMatchers.h"
#include "UniquePtrFactory.h"
#include "prelude.js.h"

#include <folly/json.h>
#include <glog/logging.h>
#include <jsinspector-modern/InspectorFlags.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#include <react/runtime/hermes/HermesInstance.h>

namespace facebook::react::jsinspector_modern {

using namespace ::testing;

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
  // Reset InspectorFlags to overridden upstream values before creating objects
  // that may access them.
  InspectorFlags::getInstance().dangerouslyResetFlags();

  // Double check that a flag matches our overrides.
  ASSERT_EQ(
      InspectorFlags::getInstance().getEnableModernCDPRegistry(),
      featureFlags->enableModernCDPRegistry);

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

  std::shared_ptr<HostTarget> hostTargetIfModernCDP = nullptr;

  if (featureFlags->enableModernCDPRegistry) {
    VoidExecutor inspectorExecutor = [this](auto callback) {
      immediateExecutor_.add(callback);
    };
    MockHostTargetDelegate hostTargetDelegate;
    hostTargetIfModernCDP =
        HostTarget::create(hostTargetDelegate, inspectorExecutor);
  }

  instance = std::make_unique<react::ReactInstance>(
      std::move(runtime_),
      messageQueueThread,
      timerManager,
      std::move(jsErrorHandlingFunc),
      hostTargetIfModernCDP == nullptr ? nullptr : hostTargetIfModernCDP.get());

  timerManager->setRuntimeExecutor(instance->getBufferedRuntimeExecutor());

  // JS Environment:
  initializeRuntime(preludeJsCode);

  // Inspector:
  auto& inspector = getInspectorInstance();

  if (hostTargetIfModernCDP != nullptr) {
    // Under modern CDP, the React host is responsible for adding itself as
    // the root target on startup.
    pageId_ = inspector.addPage(
        "mock-title",
        "mock-vm",
        [hostTargetIfModernCDP](std::unique_ptr<IRemoteConnection> remote)
            -> std::unique_ptr<ILocalConnection> {
          auto localConnection = hostTargetIfModernCDP->connect(
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
    ASSERT_GT(pages.size(), 0);
    pageId_ = pages.back().id;
  }

  clientToVM_ =
      inspector.connect(pageId_.value(), mockRemoteConnections_.make_unique());

  ASSERT_NE(clientToVM_, nullptr);
}

void ReactInstanceIntegrationTest::TearDown() {
  clientToVM_->disconnect();
  // Destroy the local connection.
  clientToVM_.reset();

  if (pageId_.has_value() && featureFlags->enableModernCDPRegistry) {
    // Under modern CDP, clean up the page we added in SetUp and destroy
    // resources owned by HostTarget.
    getInspectorInstance().removePage(pageId_.value());
  }
  pageId_.reset();

  // Expect the remote connection to have been destroyed.
  EXPECT_EQ(mockRemoteConnections_[0], nullptr);
  ReactNativeFeatureFlags::dangerouslyReset();
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

TEST_F(ReactInstanceIntegrationTest, RuntimeEvalTest) {
  auto val = run("1 + 2");
  EXPECT_EQ(val.asNumber(), 3);
}

TEST_P(ReactInstanceIntegrationTestWithFlags, ConsoleLog) {
  EXPECT_CALL(
      getRemoteConnection(),
      onMessage(JsonParsed(
          AtJsonPtr("/method", Eq("Runtime.executionContextCreated")))));

  EXPECT_CALL(
      getRemoteConnection(), onMessage(JsonParsed(AtJsonPtr("/id", Eq(1)))));

  InSequence s;

  // Hermes console.* interception is currently explicitly disabled under the
  // modern registry, and the runtime does not yet fire these events. When the
  // implementation is more complete we should be able to remove this
  // condition.
  if (!featureFlags->enableModernCDPRegistry) {
    EXPECT_CALL(
        getRemoteConnection(),
        onMessage(JsonParsed(AllOf(
            AtJsonPtr("/params/args/0/value", Eq("Hello, World!")),
            AtJsonPtr("/method", Eq("Runtime.consoleAPICalled"))))));
  }

  EXPECT_CALL(getRemoteConnection(), onDisconnect());

  send("Runtime.enable");
  run("console.log('Hello, World!');");
}

INSTANTIATE_TEST_SUITE_P(
    ReactInstanceVaryingInspectorFlags,
    ReactInstanceIntegrationTestWithFlags,
    ::testing::Values(
        FeatureFlags{
            .enableCxxInspectorPackagerConnection = true,
            .enableModernCDPRegistry = true},
        FeatureFlags{
            .enableCxxInspectorPackagerConnection = false,
            .enableModernCDPRegistry = false},
        FeatureFlags{
            .enableCxxInspectorPackagerConnection = true,
            .enableModernCDPRegistry = false}));

} // namespace facebook::react::jsinspector_modern
