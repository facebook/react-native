--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\v8executor\\V8ExecutorFactory.h"	1969-12-31 16:00:00.000000000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\v8executor\\V8ExecutorFactory.h"	2020-01-29 14:10:09.469888200 -0800
@@ -0,0 +1,17 @@
+#include <folly/dynamic.h>
+#include <jsiexecutor/jsireact/JSIExecutor.h>
+
+namespace facebook { namespace react { namespace jsi {
+
+class V8ExecutorFactory : public JSExecutorFactory {
+public:
+  V8ExecutorFactory(folly::dynamic&& v8Config);
+
+  std::unique_ptr<JSExecutor> createJSExecutor(
+      std::shared_ptr<ExecutorDelegate> delegate,
+      std::shared_ptr<MessageQueueThread> jsQueue) override;
+
+private:
+  folly::dynamic m_v8Config;
+};
+}}} // namespace facebook::react::jsi
