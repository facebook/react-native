// Copyright 2004-present Facebook. All Rights Reserved.

#include "JMessageQueueThread.h"

#include <fb/log.h>
#include <folly/Memory.h>
#include <fb/fbjni.h>

#include "JNativeRunnable.h"

namespace facebook {
namespace react {

JMessageQueueThread::JMessageQueueThread(alias_ref<JavaMessageQueueThread::javaobject> jobj) :
    m_jobj(make_global(jobj)) {
}

void JMessageQueueThread::runOnQueue(std::function<void()>&& runnable) {
  static auto method = JavaMessageQueueThread::javaClassStatic()->
    getMethod<void(Runnable::javaobject)>("runOnQueue");
  method(m_jobj, JNativeRunnable::newObjectCxxArgs(runnable).get());
}

bool JMessageQueueThread::isOnThread() {
  static auto method = JavaMessageQueueThread::javaClassStatic()->
    getMethod<jboolean()>("isOnThread");
  return method(m_jobj);
}

void JMessageQueueThread::quitSynchronous() {
  static auto method = JavaMessageQueueThread::javaClassStatic()->
    getMethod<void()>("quitSynchronous");
  method(m_jobj);
}

/* static */
std::unique_ptr<JMessageQueueThread> JMessageQueueThread::currentMessageQueueThread() {
  static auto method = MessageQueueThreadRegistry::javaClassStatic()->
      getStaticMethod<JavaMessageQueueThread::javaobject()>("myMessageQueueThread");
  return folly::make_unique<JMessageQueueThread>(method(MessageQueueThreadRegistry::javaClassStatic()));
}

} }

