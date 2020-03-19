--- "e:\\github\\fb-react-native-forpatch-base\\ReactCommon\\jsi\\V8Platform.h"	1969-12-31 16:00:00.000000000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactCommon\\jsi\\V8Platform.h"	2020-01-29 14:10:09.825892100 -0800
@@ -0,0 +1,137 @@
+#pragma once
+
+#include "v8.h"
+#include "libplatform/libplatform.h"
+#include <chrono>
+#include <map>
+#include <mutex>
+#include <atomic>
+#include <queue>
+#include <condition_variable>
+#include <cstdlib>
+
+#include <jsi/V8Runtime.h>
+
+namespace facebook {
+namespace v8runtime {
+
+class ForegroundTaskRunner : public v8::TaskRunner {
+public:
+
+  ForegroundTaskRunner(std::shared_ptr<facebook::react::MessageQueueThread> queue):queue_(queue){}
+
+  void PostTask(std::unique_ptr<v8::Task> task) override;
+
+  void PostDelayedTask(std::unique_ptr<v8::Task> task, double delay_in_seconds) override { std::abort(); }
+
+  void PostIdleTask(std::unique_ptr<v8::IdleTask> task) override { std::abort(); }
+
+  bool IdleTasksEnabled() override { return false; };
+private:
+
+  std::shared_ptr<facebook::react::MessageQueueThread> queue_;
+};
+
+class WorkerThreadsTaskRunner : public v8::TaskRunner {
+public:
+
+  WorkerThreadsTaskRunner();
+  ~WorkerThreadsTaskRunner();
+
+  void PostTask(std::unique_ptr<v8::Task> task) override;
+
+  void PostDelayedTask(std::unique_ptr<v8::Task> task, double delay_in_seconds) override;
+
+  void PostIdleTask(std::unique_ptr<v8::IdleTask> task) override { std::abort(); }
+
+  bool IdleTasksEnabled() override { return false; };
+
+private:
+  void WorkerFunc();
+  void TimerFunc();
+
+private:
+
+  using DelayedEntry = std::pair<double, std::unique_ptr<v8::Task>>;
+
+  // Define a comparison operator for the delayed_task_queue_ to make sure
+  // that the unique_ptr in the DelayedEntry is not accessed in the priority
+  // queue. This is necessary because we have to reset the unique_ptr when we
+  // remove a DelayedEntry from the priority queue.
+  struct DelayedEntryCompare {
+    bool operator()(DelayedEntry& left, DelayedEntry& right) {
+      return left.first > right.first;
+    }
+  };
+
+  std::priority_queue<DelayedEntry, std::vector<DelayedEntry>, DelayedEntryCompare> delayed_task_queue_;
+  std::queue<std::unique_ptr<v8::Task>> tasks_queue_;
+
+  std::mutex queue_access_mutex_;
+  std::condition_variable tasks_available_cond_;
+
+  std::mutex delayed_queue_access_mutex_;
+  std::condition_variable delayed_tasks_available_cond_;
+
+  std::atomic<bool> stop_requested_{ false };
+
+  // TODO -- This should become a semaphore when we support more than one worker thread.
+  std::mutex worker_stopped_mutex_;
+  std::condition_variable worker_stopped_cond_;
+  bool worker_stopped_{ false };
+
+  std::mutex timer_stopped_mutex_;
+  std::condition_variable timer_stopped_cond_;
+  bool timer_stopped_{ false };
+};
+
+constexpr int ISOLATE_DATA_SLOT = 0;
+class V8Runtime;
+// Platform needs to map every isolate to this data.
+struct IsolateData {
+  IsolateData(std::shared_ptr<facebook::react::MessageQueueThread> queue, V8Runtime* runtime)
+    : jsQueue_(queue), runtimeimpl_(runtime) {}
+  std::shared_ptr<facebook::react::MessageQueueThread> jsQueue_;
+  V8Runtime* runtimeimpl_;
+};
+
+class V8Platform : public v8::Platform {
+public:
+  explicit V8Platform();
+  ~V8Platform() override;
+
+  int NumberOfWorkerThreads() override;
+
+  std::shared_ptr<v8::TaskRunner> GetForegroundTaskRunner(v8::Isolate* isolate) override;
+
+  void CallOnWorkerThread(std::unique_ptr<v8::Task> task) override;
+  void CallDelayedOnWorkerThread(std::unique_ptr<v8::Task> task, double delay_in_seconds) override;
+
+  void CallOnForegroundThread(v8::Isolate* isolate, v8::Task* task) override;
+  void CallDelayedOnForegroundThread(v8::Isolate* isolate, v8::Task* task, double delay_in_seconds) override;
+
+  void CallIdleOnForegroundThread(v8::Isolate* isolate, v8::IdleTask* task) override;
+  bool IdleTasksEnabled(v8::Isolate* isolate) override;
+
+  double MonotonicallyIncreasingTime() override;
+  double CurrentClockTimeMillis() override;
+  v8::TracingController* GetTracingController() override;
+
+
+private:
+  V8Platform(const V8Platform&) = delete;
+  void operator=(const V8Platform&) = delete;
+
+  std::unique_ptr<v8::TracingController> tracing_controller_;
+
+  std::mutex foreground_task_runner_map_access_mutex;
+  std::map<v8::Isolate*, std::shared_ptr<ForegroundTaskRunner>> foreground_task_runner_map_;
+
+  std::unique_ptr<WorkerThreadsTaskRunner> worker_task_runner_;
+
+public:
+
+  static V8Platform& Get();
+};
+
+}}
