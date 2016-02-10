// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <functional>

#include <react/MessageQueueThread.h>

#include <jni/fbjni.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

class JavaMessageQueueThread : public jni::JavaClass<JavaMessageQueueThread> {
public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/queue/MessageQueueThread;";
};

class JMessageQueueThread : public MessageQueueThread {
public:
  JMessageQueueThread(alias_ref<JavaMessageQueueThread::javaobject> jobj);

  /**
   * Enqueues the given function to run on this MessageQueueThread.
   */
  void runOnQueue(std::function<void()>&& runnable) override;

  /**
   * Returns whether the currently executing thread is this MessageQueueThread.
   */
  bool isOnThread() override;

  /**
   * Synchronously quits the current MessageQueueThread. Can be called from any thread, but will
   * block if not called on this MessageQueueThread.
   */
  void quitSynchronous() override;

  JavaMessageQueueThread::javaobject jobj() {
    return m_jobj.get();
  }

  /**
   * Returns the current MessageQueueThread that owns this thread.
   */
  static std::unique_ptr<JMessageQueueThread> currentMessageQueueThread();
private:
  global_ref<JavaMessageQueueThread::javaobject> m_jobj;
};

class MessageQueueThreadRegistry : public jni::JavaClass<MessageQueueThreadRegistry> {
public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/queue/MessageQueueThreadRegistry;";
};

} }
