// Copyright 2004-present Facebook. All Rights Reserved.

#include "JInspector.h"

#ifdef WITH_INSPECTOR

namespace facebook {
namespace react {

namespace {

class RemoteConnection : public Inspector::RemoteConnection {
public:
  RemoteConnection(jni::alias_ref<JRemoteConnection::javaobject> connection)
      : connection_(jni::make_global(connection)) {}

  void onMessage(std::string message) override {
    connection_->onMessage(message);
  }

  void onDisconnect() override {
    connection_->onDisconnect();
  }
private:
  jni::global_ref<JRemoteConnection::javaobject> connection_;
};

}

jni::local_ref<JPage::javaobject> JPage::create(int id, const std::string& title) {
  static auto constructor = javaClassStatic()->getConstructor<JPage::javaobject(jint, jni::local_ref<jni::JString>)>();
  return javaClassStatic()->newObject(constructor, id, jni::make_jstring(title));
}

void JRemoteConnection::onMessage(const std::string& message) const {
  static auto method = javaClassStatic()->getMethod<void(jni::local_ref<jstring>)>("onMessage");
  method(self(), jni::make_jstring(message));
}

void JRemoteConnection::onDisconnect() const {
  static auto method = javaClassStatic()->getMethod<void()>("onDisconnect");
  method(self());
}

JLocalConnection::JLocalConnection(std::unique_ptr<Inspector::LocalConnection> connection)
  : connection_(std::move(connection)) {}

void JLocalConnection::sendMessage(std::string message) {
  connection_->sendMessage(std::move(message));
}

void JLocalConnection::disconnect() {
  connection_->disconnect();
}

void JLocalConnection::registerNatives() {
  javaClassStatic()->registerNatives({
      makeNativeMethod("sendMessage", JLocalConnection::sendMessage),
      makeNativeMethod("disconnect", JLocalConnection::disconnect),
  });
}

jni::global_ref<JInspector::javaobject> JInspector::instance(jni::alias_ref<jclass>) {
  static auto instance = jni::make_global(newObjectCxxArgs(&Inspector::instance()));
  return instance;
}

jni::local_ref<jni::JArrayClass<JPage::javaobject>> JInspector::getPages() {
  std::vector<Inspector::Page> pages = inspector_->getPages();
  auto array = jni::JArrayClass<JPage::javaobject>::newArray(pages.size());
  for (size_t i = 0; i < pages.size(); i++) {
    (*array)[i] = JPage::create(pages[i].id, pages[i].title);
  }
  return array;
}

jni::local_ref<JLocalConnection::javaobject> JInspector::connect(int pageId, jni::alias_ref<JRemoteConnection::javaobject> remote) {
  auto localConnection = inspector_->connect(pageId, folly::make_unique<RemoteConnection>(std::move(remote)));
  return JLocalConnection::newObjectCxxArgs(std::move(localConnection));
}

void JInspector::registerNatives() {
  JLocalConnection::registerNatives();
  javaClassStatic()->registerNatives({
      makeNativeMethod("instance", JInspector::instance),
      makeNativeMethod("getPagesNative", JInspector::getPages),
      makeNativeMethod("connectNative", JInspector::connect),
  });
}

}
}

#endif
