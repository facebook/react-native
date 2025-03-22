/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <jsinspector-modern/HostTarget.h>
#include <jsinspector-modern/NetworkIOAgent.h>
#include <jsinspector-modern/ScopedExecutor.h>
#include <react/jni/InspectorNetworkRequestListener.h>
#include <react/jni/JExecutor.h>

namespace facebook::react {

class ReactInstanceManagerInspectorTarget
    : public jni::HybridClass<ReactInstanceManagerInspectorTarget>,
      public jsinspector_modern::HostTargetDelegate {
 private:
  struct TargetDelegate : public facebook::jni::JavaClass<TargetDelegate> {
    static constexpr auto kJavaDescriptor =
        "Lcom/facebook/react/bridge/ReactInstanceManagerInspectorTarget$TargetDelegate;";

    jni::local_ref<jni::JMap<jstring, jstring>> getMetadata() const;
    void onReload() const;
    void onSetPausedInDebuggerMessage(
        const OverlaySetPausedInDebuggerMessageRequest& request) const;
    void loadNetworkResource(
        const std::string& url,
        jni::local_ref<InspectorNetworkRequestListener::javaobject> listener)
        const;
  };

 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/bridge/ReactInstanceManagerInspectorTarget;";

  ReactInstanceManagerInspectorTarget(
      const ReactInstanceManagerInspectorTarget&) = delete;
  ReactInstanceManagerInspectorTarget& operator=(
      const ReactInstanceManagerInspectorTarget&) = delete;

  ~ReactInstanceManagerInspectorTarget() override;

  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jhybridobject> jobj,
      jni::alias_ref<JExecutor::javaobject> javaExecutor,
      jni::alias_ref<
          ReactInstanceManagerInspectorTarget::TargetDelegate::javaobject>
          delegate);

  void sendDebuggerResumeCommand();

  static void registerNatives();

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
  friend HybridBase;

  ReactInstanceManagerInspectorTarget(
      jni::alias_ref<ReactInstanceManagerInspectorTarget::jhybridobject> jobj,
      jni::alias_ref<JExecutor::javaobject> javaExecutor,
      jni::alias_ref<ReactInstanceManagerInspectorTarget::TargetDelegate>
          delegate);

  jni::global_ref<ReactInstanceManagerInspectorTarget::TargetDelegate>
      delegate_;
  jsinspector_modern::VoidExecutor inspectorExecutor_;
  std::shared_ptr<jsinspector_modern::HostTarget> inspectorTarget_;
  std::optional<int> inspectorPageId_;
};

} // namespace facebook::react
