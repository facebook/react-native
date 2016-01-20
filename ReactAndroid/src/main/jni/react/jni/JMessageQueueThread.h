// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <functional>

#include <jni/fbjni.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

class MessageQueueThread : public jni::JavaClass<MessageQueueThread> {
public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/queue/MessageQueueThread;";
};

class JMessageQueueThread {
public:
  JMessageQueueThread(alias_ref<MessageQueueThread::javaobject> jobj);

  /**
   * Enqueues the given function to run on this MessageQueueThread.
   */
  void runOnQueue(std::function<void()>&& runnable);

  /**
   * Returns whether the currently executing thread is this MessageQueueThread.
   */
  bool isOnThread();

  /**
   * Synchronously quits the current MessageQueueThread. Can be called from any thread, but will
   * block if not called on this MessageQueueThread.
   */
  void quitSynchronous();

  MessageQueueThread::javaobject jobj() {
    return m_jobj.get();
  }

  /**
   * Returns the current MessageQueueThread that owns this thread.
   */
  static std::unique_ptr<JMessageQueueThread> currentMessageQueueThread();
private:
  global_ref<MessageQueueThread::javaobject> m_jobj;
};

class MessageQueueThreadRegistry : public jni::JavaClass<MessageQueueThreadRegistry> {
public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/queue/MessageQueueThreadRegistry;";
};

} }
