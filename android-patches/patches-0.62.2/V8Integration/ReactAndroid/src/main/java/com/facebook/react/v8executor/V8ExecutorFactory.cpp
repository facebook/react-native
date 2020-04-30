--- "D:\\code\\work\\rn-62-db\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\v8executor\\V8ExecutorFactory.cpp"	1969-12-31 16:00:00.000000000 -0800
+++ "D:\\code\\work\\rn-62-d\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\v8executor\\V8ExecutorFactory.cpp"	2020-04-30 15:36:09.257835900 -0700
@@ -0,0 +1,41 @@
+#include <jsi/jsi.h>
+#include <jsi/V8Runtime.h>
+#include <jsireact/JSIExecutor.h>
+#include <react/jni/JSLoader.h>
+#include <react/jni/JSLogging.h>
+
+#include "V8ExecutorFactory.h"
+
+namespace facebook { namespace react { namespace jsi {
+
+V8ExecutorFactory::V8ExecutorFactory(folly::dynamic&& v8Config) :
+    m_v8Config(std::move(v8Config)) {}
+
+std::unique_ptr<JSExecutor> V8ExecutorFactory::createJSExecutor(
+      std::shared_ptr<ExecutorDelegate> delegate,
+      std::shared_ptr<MessageQueueThread> jsQueue) {
+
+    auto logger = std::make_shared<Logger>([](const std::string& message, unsigned int logLevel) {
+                    reactAndroidLoggingHook(message, logLevel);
+    });
+
+    auto installBindings = [](facebook::jsi::Runtime &runtime) {
+      react::Logger androidLogger =
+          static_cast<void (*)(const std::string &, unsigned int)>(
+              &reactAndroidLoggingHook);
+      react::bindNativeLogger(runtime, androidLogger);
+    };
+
+                  try {
+                      throw std::runtime_error("Error");
+                    } catch(...) {
+                      std::string what = "abcd";
+                    }
+
+    return folly::make_unique<JSIExecutor>(
+      facebook::v8runtime::makeV8Runtime(m_v8Config, logger),
+      delegate,
+      JSIExecutor::defaultTimeoutInvoker,
+      installBindings);
+  }
+  }}} // namespace facebook::react::jsi
