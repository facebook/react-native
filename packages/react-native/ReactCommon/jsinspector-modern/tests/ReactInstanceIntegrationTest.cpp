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
#include <react/runtime/hermes/HermesInstance.h>

namespace facebook::react::jsinspector_modern {

using namespace ::testing;

ReactInstanceIntegrationTest::ReactInstanceIntegrationTest()
    : runtime(nullptr),
      instance(nullptr),
      messageQueueThread(std::make_shared<MockMessageQueueThread>()),
      errorHandler(std::make_shared<ErrorUtils>()) {}

void ReactInstanceIntegrationTest::SetUp() {
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

  instance = std::make_unique<react::ReactInstance>(
      std::move(runtime_),
      messageQueueThread,
      timerManager,
      std::move(jsErrorHandlingFunc));
  timerManager->setRuntimeExecutor(instance->getBufferedRuntimeExecutor());

  // JS Environment:
  initializeRuntime(preludeJsCode);

  // Inspector:
  auto& inspector = getInspectorInstance();
  auto pages = inspector.getPages();

  // We should now have at least a single page once the above runtime has been
  // initialized.
  assert(pages.size() > 0);
  size_t pageId = pages.back().id;

  clientToVM_ = inspector.connect(pageId, mockRemoteConnections_.make_unique());
}

void ReactInstanceIntegrationTest::TearDown() {
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

TEST_F(ReactInstanceIntegrationTest, ConsoleLogTest) {
  InSequence s;

  EXPECT_CALL(getRemoteConnection(), onMessage(_))
      .Times(2)
      .RetiresOnSaturation();

  EXPECT_CALL(
      getRemoteConnection(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/params/args/0/value", Eq("Hello, World!")),
          AtJsonPtr("/method", Eq("Runtime.consoleAPICalled"))))));

  EXPECT_CALL(getRemoteConnection(), onDisconnect());

  send("Runtime.enable");
  run("console.log('Hello, World!');");
}

} // namespace facebook::react::jsinspector_modern
