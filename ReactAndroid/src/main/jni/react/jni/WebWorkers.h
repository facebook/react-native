// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <fstream>
#include <memory>
#include <string>
#include <sstream>

#include <jni.h>
#include <folly/Memory.h>

#include "JMessageQueueThread.h"

using namespace facebook::jni;

namespace facebook {
namespace react {

class WebWorkers : public JavaClass<WebWorkers> {
public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/webworkers/WebWorkers;";

  static std::unique_ptr<JMessageQueueThread> createWebWorkerThread(int id, MessageQueueThread *ownerMessageQueueThread) {
    static auto method = WebWorkers::javaClassStatic()->
        getStaticMethod<JavaMessageQueueThread::javaobject(jint, JavaMessageQueueThread::javaobject)>("createWebWorkerThread");
    auto res = method(WebWorkers::javaClassStatic(), id, static_cast<JMessageQueueThread*>(ownerMessageQueueThread)->jobj());
    return folly::make_unique<JMessageQueueThread>(res);
  }

  static std::string loadScriptFromNetworkSync(const std::string& url, const std::string& tempfileName) {
    static auto method = WebWorkers::javaClassStatic()->
        getStaticMethod<void(jstring, jstring)>("downloadScriptToFileSync");
    method(
        WebWorkers::javaClassStatic(),
        jni::make_jstring(url).get(),
        jni::make_jstring(tempfileName).get());

    std::ifstream tempFile(tempfileName);
    if (!tempFile.good()) {
      throw std::runtime_error("Didn't find worker script file at " + tempfileName);
    }
    std::stringstream buffer;
    buffer << tempFile.rdbuf();
    std::remove(tempfileName.c_str());
    return buffer.str();
  }
};

} }
