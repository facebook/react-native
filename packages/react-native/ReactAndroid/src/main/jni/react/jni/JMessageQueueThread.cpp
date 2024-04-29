/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JMessageQueueThread.h"

#include <condition_variable>
#include <mutex>

#include <fbjni/NativeRunnable.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

namespace facebook::react {

using namespace jni;

namespace {

std::function<void()> wrapRunnable(std::function<void()>&& runnable) {
  return [runnable = std::move(runnable)]() mutable {
    if (!runnable) {
      // Runnable is empty, nothing to run.
      return;
    }

    auto localRunnable = std::move(runnable);

    // Clearing `runnable` to free all associated resources that stored lambda
    // might retain.
    runnable = nullptr;

    try {
      localRunnable();
    } catch (const jsi::JSError& ex) {
      // We can't do as much parsing here as we do in ExceptionManager.js
      std::string message = ex.getMessage() + ", stack:\n" + ex.getStack();
      throwNewJavaException(
          "com/facebook/react/common/JavascriptException", message.c_str());
    }
  };
}

} // namespace

JMessageQueueThread::JMessageQueueThread(
    alias_ref<JavaMessageQueueThread::javaobject> jobj)
    : m_jobj(make_global(jobj)) {}

void JMessageQueueThread::runOnQueue(std::function<void()>&& runnable) {
  // For C++ modules, this can be called from an arbitrary thread
  // managed by the module, via callJSCallback or callJSFunction.  So,
  // we ensure that it is registered with the JVM.
  jni::ThreadScope guard;
  static auto method =
      JavaMessageQueueThread::javaClassStatic()
          ->getMethod<jboolean(JRunnable::javaobject)>("runOnQueue");
  auto jrunnable =
      JNativeRunnable::newObjectCxxArgs(wrapRunnable(std::move(runnable)));
  method(m_jobj, jrunnable.get());
}

void JMessageQueueThread::runOnQueueSync(std::function<void()>&& runnable) {
  static auto jIsOnThread =
      JavaMessageQueueThread::javaClassStatic()->getMethod<jboolean()>(
          "isOnThread");

  if (jIsOnThread(m_jobj)) {
    wrapRunnable(std::move(runnable))();
  } else {
    std::mutex signalMutex;
    std::condition_variable signalCv;
    bool runnableComplete = false;

    runOnQueue([&]() mutable {
      std::scoped_lock lock(signalMutex);

      runnable();
      runnableComplete = true;

      signalCv.notify_one();
    });

    std::unique_lock<std::mutex> lock(signalMutex);
    signalCv.wait(lock, [&runnableComplete] { return runnableComplete; });
  }
}

void JMessageQueueThread::quitSynchronous() {
  static auto method =
      JavaMessageQueueThread::javaClassStatic()->getMethod<void()>(
          "quitSynchronous");
  method(m_jobj);
}

} // namespace facebook::react
