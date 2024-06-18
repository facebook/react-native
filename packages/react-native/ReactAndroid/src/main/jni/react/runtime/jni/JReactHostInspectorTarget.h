/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <jsinspector-modern/HostTarget.h>
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
      jni::alias_ref<JReactHostImpl::javaobject> reactHost,
      jni::alias_ref<JExecutor::javaobject>);

  static void registerNatives();
  void sendDebuggerResumeCommand();

  jsinspector_modern::HostTarget* getInspectorTarget();

  // HostTargetDelegate methods
  jsinspector_modern::HostTargetMetadata getMetadata() override;
  void onReload(const PageReloadRequest& request) override;
  void onSetPausedInDebuggerMessage(
      const OverlaySetPausedInDebuggerMessageRequest&) override;

 private:
  JReactHostInspectorTarget(
      jni::alias_ref<JReactHostImpl::javaobject> reactHostImpl,
      jni::alias_ref<JExecutor::javaobject> executor);
  jni::global_ref<JReactHostImpl::javaobject> javaReactHostImpl_;
  jni::global_ref<JExecutor::javaobject> javaExecutor_;

  std::shared_ptr<jsinspector_modern::HostTarget> inspectorTarget_;
  std::optional<int> inspectorPageId_;

  friend HybridBase;
};
} // namespace facebook::react
