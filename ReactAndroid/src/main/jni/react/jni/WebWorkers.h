// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>

#include <jni.h>
#include <folly/Memory.h>

#include "JMessageQueueThread.h"

using namespace facebook::jni;

namespace facebook {
namespace react {

class WebWorkers : public JavaClass<WebWorkers> {
public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/webworkers/WebWorkers;";

  static std::unique_ptr<JMessageQueueThread> createWebWorkerThread(int id, JMessageQueueThread *ownerMessageQueueThread) {
    static auto method = WebWorkers::javaClassStatic()->
        getStaticMethod<MessageQueueThread::javaobject(jint, MessageQueueThread::javaobject)>("createWebWorkerThread");
    auto res = method(WebWorkers::javaClassStatic(), id, ownerMessageQueueThread->jobj());
    return folly::make_unique<JMessageQueueThread>(res);
  }
};

} }
