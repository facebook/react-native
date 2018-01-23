// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#ifdef WITH_INSPECTOR

#include <jsinspector/InspectorInterfaces.h>

#include <fb/fbjni.h>
#include <folly/Memory.h>

namespace facebook {
namespace react {

class JPage : public jni::JavaClass<JPage> {
public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/Inspector$Page;";

  static jni::local_ref<JPage::javaobject> create(int id, const std::string& title);
};

class JRemoteConnection : public jni::JavaClass<JRemoteConnection> {
public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/Inspector$RemoteConnection;";

  void onMessage(const std::string& message) const;
  void onDisconnect() const;
};

class JLocalConnection : public jni::HybridClass<JLocalConnection> {
public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/Inspector$LocalConnection;";

  JLocalConnection(std::unique_ptr<ILocalConnection> connection);

  void sendMessage(std::string message);
  void disconnect();

  static void registerNatives();
private:
  std::unique_ptr<ILocalConnection> connection_;
};

class JInspector : public jni::HybridClass<JInspector> {
public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/Inspector;";

  static jni::global_ref<JInspector::javaobject> instance(jni::alias_ref<jclass>);

  jni::local_ref<jni::JArrayClass<JPage::javaobject>> getPages();
  jni::local_ref<JLocalConnection::javaobject> connect(int pageId, jni::alias_ref<JRemoteConnection::javaobject> remote);

  static void registerNatives();
private:
  friend HybridBase;

  JInspector(IInspector* inspector) : inspector_(inspector) {}

  IInspector* inspector_;
};

}
}

#endif
