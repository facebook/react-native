/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <jsinspector-modern/HostTarget.h>
#include <react/jni/InspectorNetworkRequestListener.h>
#include <react/jni/JExecutor.h>
#include <string>

namespace facebook::react {

struct JTaskInterface : public jni::JavaClass<JTaskInterface> {
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/interfaces/TaskInterface;";
};

struct JReactHostImpl : public jni::JavaClass<JReactHostImpl> {
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/runtime/ReactHostImpl;";

  jni::local_ref<JTaskInterface::javaobject> reload(const std::string& reason) {
    static auto method =
        javaClassStatic()->getMethod<JTaskInterface::javaobject(std::string)>(
            "reload");
    return method(self(), reason);
  }

  void setPausedInDebuggerMessage(std::optional<std::string> message) {
    static auto method =
        javaClassStatic()->getMethod<void(jni::local_ref<jni::JString>)>(
            "setPausedInDebuggerMessage");
    method(self(), message ? jni::make_jstring(*message) : nullptr);
  }

  jni::local_ref<jni::JMap<jstring, jstring>> getHostMetadata() const {
    static auto method =
        javaClassStatic()
            ->getMethod<jni::local_ref<jni::JMap<jstring, jstring>>()>(
                "getHostMetadata");
    return method(self());
  }

  void loadNetworkResource(
      const std::string& url,
      jni::local_ref<InspectorNetworkRequestListener::javaobject> listener)
      const {
    auto method =
        javaClassStatic()
            ->getMethod<void(
                jni::local_ref<jni::JString>,
                jni::local_ref<InspectorNetworkRequestListener::javaobject>)>(
                "loadNetworkResource");
    return method(self(), jni::make_jstring(url), listener);
  }
};

class JReactHostInspectorTarget
    : public jni::HybridClass<JReactHostInspectorTarget>,
      public jsinspector_modern::HostTargetDelegate {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/runtime/ReactHostInspectorTarget;";

  ~JReactHostInspectorTarget() override;

  static jni::local_ref<JReactHostInspectorTarget::jhybriddata> initHybrid(
      jni::alias_ref<JReactHostInspectorTarget::jhybridobject> jThis,
      jni::alias_ref<JReactHostImpl> reactHost,
      jni::alias_ref<JExecutor::javaobject> javaExecutor);

  static void registerNatives();
  void sendDebuggerResumeCommand();

  jsinspector_modern::HostTarget* getInspectorTarget();

  // HostTargetDelegate methods
  jsinspector_modern::HostTargetMetadata getMetadata() override;
  void onReload(const PageReloadRequest& request) override;
  void onSetPausedInDebuggerMessage(
      const OverlaySetPausedInDebuggerMessageRequest&) override;
  void loadNetworkResource(
      const jsinspector_modern::LoadNetworkResourceRequest& params,
      jsinspector_modern::ScopedExecutor<
          jsinspector_modern::NetworkRequestListener> executor) override;

 private:
  JReactHostInspectorTarget(
      jni::alias_ref<JReactHostImpl> reactHostImpl,
      jni::alias_ref<JExecutor::javaobject> javaExecutor);
  // This weak reference breaks the cycle between the C++ HostTarget and the
  // Java ReactHostImpl, preventing memory leaks in apps that create multiple
  // ReactHostImpls over time.
  jni::global_ref<jni::JWeakReference<JReactHostImpl>> javaReactHostImpl_;
  jsinspector_modern::VoidExecutor inspectorExecutor_;

  std::shared_ptr<jsinspector_modern::HostTarget> inspectorTarget_;
  std::optional<int> inspectorPageId_;

  friend HybridBase;
};
} // namespace facebook::react
