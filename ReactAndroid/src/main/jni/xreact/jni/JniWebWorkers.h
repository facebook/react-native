// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>

#include <jni.h>
#include <folly/Memory.h>

#include "JMessageQueueThread.h"
#include <react/MessageQueue.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

class JniWebWorkers : public JavaClass<JniWebWorkers> {
public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/webworkers/WebWorkers;";

  static std::unique_ptr<MessageQueue> createWebWorkerQueue(int id, MessageQueue* ownerMessageQueue) {
    static auto method = JniWebWorkers::javaClassStatic()->
        getStaticMethod<MessageQueueThread::javaobject(jint, MessageQueueThread::javaobject)>("createWebWorkerThread");

    JMessageQueueThread* ownerMessageQueueThread = static_cast<JMessageQueueThread*>(ownerMessageQueue);
    auto res = method(JniWebWorkers::javaClassStatic(), id, ownerMessageQueueThread->jobj());
    return folly::make_unique<JMessageQueueThread>(res);
  }
};

} }
