diff --git a/ReactAndroid/src/main/java/com/facebook/react/v8executor/V8ExecutorFactory.h b/ReactAndroid/src/main/java/com/facebook/react/v8executor/V8ExecutorFactory.h
new file mode 100644
index 0000000000..0606103d3a
--- /dev/null
+++ b/ReactAndroid/src/main/java/com/facebook/react/v8executor/V8ExecutorFactory.h
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
