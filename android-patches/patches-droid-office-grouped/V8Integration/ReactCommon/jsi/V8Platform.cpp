--- "e:\\github\\fb-react-native-forpatch-base\\ReactCommon\\jsi\\V8Platform.cpp"	1969-12-31 16:00:00.000000000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactCommon\\jsi\\V8Platform.cpp"	2020-01-29 14:10:09.825892100 -0800
@@ -0,0 +1,196 @@
+// Copyright 2013 the V8 project authors. All rights reserved.
+// Use of this source code is governed by a BSD-style license that can be
+// found in the LICENSE file.
+
+#include "V8Platform.h"
+
+#include <algorithm>
+#include <queue>
+#include <thread>
+#include <chrono>
+#include <jsi/V8Runtime.h>
+
+#include <cxxreact/MessageQueueThread.h>
+
+namespace facebook {
+namespace v8runtime {
+
+/*static*/ V8Platform& V8Platform::Get() {
+  static V8Platform platform;
+  return platform;
+}
+
+WorkerThreadsTaskRunner::~WorkerThreadsTaskRunner() {
+  stop_requested_ = true;
+  tasks_available_cond_.notify_all();
+  delayed_tasks_available_cond_.notify_all();
+
+  // Wait until both worker and timer threads are dranined.
+  std::unique_lock<std::mutex> worker_stopped_lock(worker_stopped_mutex_);
+  worker_stopped_cond_.wait(worker_stopped_lock, [this]() {return worker_stopped_; });
+
+  std::unique_lock<std::mutex> timer_stopped_lock(timer_stopped_mutex_);
+  timer_stopped_cond_.wait(timer_stopped_lock, [this]() {return timer_stopped_; });
+}
+
+WorkerThreadsTaskRunner::WorkerThreadsTaskRunner() {
+  std::thread(&WorkerThreadsTaskRunner::WorkerFunc, this).detach();
+  std::thread(&WorkerThreadsTaskRunner::TimerFunc, this).detach();
+}
+
+void WorkerThreadsTaskRunner::PostTask(std::unique_ptr<v8::Task> task) {
+  {
+    std::lock_guard<std::mutex> lock(queue_access_mutex_);
+    tasks_queue_.push(std::move(task));
+  }
+
+  tasks_available_cond_.notify_all();
+}
+
+void WorkerThreadsTaskRunner::PostDelayedTask(std::unique_ptr<v8::Task> task, double delay_in_seconds) {
+  {
+    if (delay_in_seconds == 0) {
+      PostTask(std::move(task));
+      return;
+    }
+
+    double deadline = std::chrono::steady_clock::now().time_since_epoch().count() + delay_in_seconds * std::chrono::duration_cast<std::chrono::nanoseconds>(std::chrono::seconds(1)).count();
+
+    std::lock_guard<std::mutex> lock(delayed_queue_access_mutex_);
+    delayed_task_queue_.push(std::make_pair(deadline, std::move(task)));
+    delayed_tasks_available_cond_.notify_all();
+  }
+}
+
+void WorkerThreadsTaskRunner::WorkerFunc() {
+  while (true) {
+    std::unique_lock<std::mutex> lock(queue_access_mutex_);
+    tasks_available_cond_.wait(lock, [this]() {return !tasks_queue_.empty() || stop_requested_; });
+
+    if (stop_requested_)
+      break;
+    if (tasks_queue_.empty()) continue;
+
+    std::unique_ptr<v8::Task> nexttask = std::move(tasks_queue_.front());
+    tasks_queue_.pop();
+
+    lock.unlock();
+
+    nexttask->Run();
+  }
+
+  worker_stopped_ = true;
+  worker_stopped_cond_.notify_all();
+}
+
+void WorkerThreadsTaskRunner::TimerFunc() {
+  while (true) {
+
+    std::unique_lock<std::mutex> delayed_lock(delayed_queue_access_mutex_);
+    delayed_tasks_available_cond_.wait(delayed_lock, [this]() {return !delayed_task_queue_.empty() || stop_requested_; });
+
+    if (stop_requested_)
+      break;
+
+    if (delayed_task_queue_.empty())
+      continue; // Loop back and block the thread.
+
+    std::queue<std::unique_ptr<v8::Task>> new_ready_tasks;
+
+    do {
+      const DelayedEntry& delayed_entry = delayed_task_queue_.top();
+      if (delayed_entry.first < std::chrono::steady_clock::now().time_since_epoch().count()) {
+        new_ready_tasks.push(std::move(const_cast<DelayedEntry&>(delayed_entry).second));
+        delayed_task_queue_.pop();
+      }
+      else
+      {
+        // The rest are not ready ..
+        break;
+      }
+
+    } while (!delayed_task_queue_.empty());
+
+    delayed_lock.unlock();
+
+    if (!new_ready_tasks.empty()) {
+      std::lock_guard<std::mutex> lock(queue_access_mutex_);
+
+      do {
+        tasks_queue_.push(std::move(new_ready_tasks.front()));
+        new_ready_tasks.pop();
+      } while (!new_ready_tasks.empty());
+
+      tasks_available_cond_.notify_all();
+    }
+
+    if (!delayed_task_queue_.empty()) {
+      std::this_thread::sleep_for(std::chrono::seconds(1)); // Wait for a second and loop back and recompute again.
+    } // else loop back and block the thread.
+
+  }
+
+  timer_stopped_ = true;
+  timer_stopped_cond_.notify_all();
+}
+
+void ForegroundTaskRunner::PostTask(std::unique_ptr<v8::Task> task) {
+  // Note :: We assume that the underlying message queue implementation is properly syncronized.
+  std::shared_ptr<v8::Task> s_task(task.release());
+  queue_->runOnQueue([s_task2=std::move(s_task)]() { s_task2->Run(); });
+}
+
+V8Platform::V8Platform() : tracing_controller_(std::make_unique<v8::TracingController>()), worker_task_runner_(std::make_unique<WorkerThreadsTaskRunner>()) {}
+
+V8Platform::~V8Platform() {}
+
+std::shared_ptr<v8::TaskRunner> V8Platform::GetForegroundTaskRunner(v8::Isolate* isolate) {
+  std::lock_guard<std::mutex> lock(foreground_task_runner_map_access_mutex);
+
+  if (foreground_task_runner_map_.find(isolate) == foreground_task_runner_map_.end()) {
+    facebook::v8runtime::IsolateData* isolate_data = reinterpret_cast<facebook::v8runtime::IsolateData*>(isolate->GetData(facebook::v8runtime::ISOLATE_DATA_SLOT));
+    foreground_task_runner_map_.insert(std::make_pair(isolate, std::make_shared<ForegroundTaskRunner>(isolate_data->jsQueue_)));
+  }
+
+  return foreground_task_runner_map_[isolate];
+}
+
+void V8Platform::CallOnWorkerThread(std::unique_ptr<v8::Task> task) {
+  worker_task_runner_->PostTask(std::move(task));
+}
+
+void V8Platform::CallDelayedOnWorkerThread(std::unique_ptr<v8::Task> task, double delay_in_seconds) {
+  worker_task_runner_->PostDelayedTask(std::move(task), delay_in_seconds);
+}
+
+void V8Platform::CallOnForegroundThread(v8::Isolate* isolate, v8::Task* task) {
+  GetForegroundTaskRunner(isolate)->PostTask(std::unique_ptr<v8::Task>(task));
+}
+
+void V8Platform::CallDelayedOnForegroundThread(v8::Isolate* isolate, v8::Task* task, double delay_in_seconds) {
+  // We don't need it as of now.
+  std::abort();
+}
+
+void V8Platform::CallIdleOnForegroundThread(v8::Isolate* isolate, v8::IdleTask* task) {
+  std::abort();
+}
+
+bool V8Platform::IdleTasksEnabled(v8::Isolate* isolate) { return false; }
+
+
+int V8Platform::NumberOfWorkerThreads() { return 1; }
+
+double V8Platform::MonotonicallyIncreasingTime() {
+  return static_cast<double>(std::chrono::steady_clock::now().time_since_epoch().count());
+}
+
+double V8Platform::CurrentClockTimeMillis() {
+  return static_cast<double>(std::chrono::system_clock::now().time_since_epoch().count());
+}
+
+v8::TracingController* V8Platform::GetTracingController() {
+  return tracing_controller_.get();
+}
+
+}}
