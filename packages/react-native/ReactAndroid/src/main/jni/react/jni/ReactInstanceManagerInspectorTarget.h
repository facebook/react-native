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

namespace facebook::react {

class ReactInstanceManagerInspectorTarget
    : public jni::HybridClass<ReactInstanceManagerInspectorTarget>,
      public jsinspector_modern::HostTargetDelegate {
 private:
  struct TargetDelegate : public facebook::jni::JavaClass<TargetDelegate> {
    static constexpr auto kJavaDescriptor =
        "Lcom/facebook/react/bridge/ReactInstanceManagerInspectorTarget$TargetDelegate;";

    void onReload() const;
    void onSetPausedInDebuggerMessage(
        const OverlaySetPausedInDebuggerMessageRequest& request) const;
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
      jni::alias_ref<JExecutor::javaobject> executor,
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

 private:
  friend HybridBase;

  ReactInstanceManagerInspectorTarget(
      jni::alias_ref<ReactInstanceManagerInspectorTarget::jhybridobject> jobj,
      jni::alias_ref<JExecutor::javaobject> executor,
      jni::alias_ref<
          ReactInstanceManagerInspectorTarget::TargetDelegate::javaobject>
          delegate);

  jni::global_ref<
      ReactInstanceManagerInspectorTarget::TargetDelegate::javaobject>
      delegate_;
  std::shared_ptr<jsinspector_modern::HostTarget> inspectorTarget_;
  std::optional<int> inspectorPageId_;
};

} // namespace facebook::react
