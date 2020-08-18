/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>

#include <cxxreact/MessageQueueThread.h>
#include <fbjni/fbjni.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

class JavaMessageQueueThread : public jni::JavaClass<JavaMessageQueueThread> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/bridge/queue/MessageQueueThread;";
};

class JMessageQueueThread : public MessageQueueThread {
 public:
  JMessageQueueThread(alias_ref<JavaMessageQueueThread::javaobject> jobj);

  /**
   * Enqueues the given function to run on this MessageQueueThread.
   */
  void runOnQueue(std::function<void()> &&runnable) override;

  /**
   * Synchronously executes the given function to run on this
   * MessageQueueThread, waiting until it completes.  Can be called from any
   * thread, but will block if not called on this MessageQueueThread.
   */
  void runOnQueueSync(std::function<void()> &&runnable) override;

  /**
   * Synchronously quits the current MessageQueueThread. Can be called from any
   * thread, but will block if not called on this MessageQueueThread.
   */
  void quitSynchronous() override;

  JavaMessageQueueThread::javaobject jobj() {
    return m_jobj.get();
  }

 private:
  global_ref<JavaMessageQueueThread::javaobject> m_jobj;
};

} // namespace react
} // namespace facebook
