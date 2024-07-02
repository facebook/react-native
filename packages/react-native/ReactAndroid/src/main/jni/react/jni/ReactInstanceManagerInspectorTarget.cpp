/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactInstanceManagerInspectorTarget.h"
#include "SafeReleaseJniRef.h"

#include <fbjni/NativeRunnable.h>
#include <jsinspector-modern/InspectorFlags.h>

using namespace facebook::jni;
using namespace facebook::react::jsinspector_modern;

namespace facebook::react {

void ReactInstanceManagerInspectorTarget::TargetDelegate::onReload() const {
  auto method = javaClassStatic()->getMethod<void()>("onReload");
  method(self());
}

void ReactInstanceManagerInspectorTarget::TargetDelegate::
    onSetPausedInDebuggerMessage(
        const OverlaySetPausedInDebuggerMessageRequest& request) const {
  auto method = javaClassStatic()->getMethod<void(local_ref<JString>)>(
      "onSetPausedInDebuggerMessage");
  method(self(), request.message ? make_jstring(*request.message) : nullptr);
}

jni::local_ref<jni::JMap<jstring, jstring>>
ReactInstanceManagerInspectorTarget::TargetDelegate::getMetadata() const {
  auto method = javaClassStatic()
                    ->getMethod<jni::local_ref<jni::JMap<jstring, jstring>>()>(
                        "getMetadata");
  return method(self());
}

ReactInstanceManagerInspectorTarget::ReactInstanceManagerInspectorTarget(
    jni::alias_ref<ReactInstanceManagerInspectorTarget::jhybridobject> jobj,
    jni::alias_ref<JExecutor::javaobject> javaExecutor,
    jni::alias_ref<ReactInstanceManagerInspectorTarget::TargetDelegate>
        delegate)
    : delegate_(make_global(delegate)),
      inspectorExecutor_([javaExecutor =
                              // Use a SafeReleaseJniRef because this lambda may
                              // be copied to arbitrary threads.
                          SafeReleaseJniRef(make_global(javaExecutor))](
                             auto callback) mutable {
        auto jrunnable = JNativeRunnable::newObjectCxxArgs(std::move(callback));
        javaExecutor->execute(jrunnable);
      }) {
  auto& inspectorFlags = InspectorFlags::getInstance();

  if (inspectorFlags.getFuseboxEnabled()) {
    inspectorTarget_ = HostTarget::create(*this, inspectorExecutor_);

    inspectorPageId_ = getInspectorInstance().addPage(
        "React Native Bridge (Experimental)",
        /* vm */ "",
        [inspectorTarget =
             inspectorTarget_](std::unique_ptr<IRemoteConnection> remote)
            -> std::unique_ptr<ILocalConnection> {
          return inspectorTarget->connect(std::move(remote));
        },
        {.nativePageReloads = true, .prefersFuseboxFrontend = true});
  }
}

ReactInstanceManagerInspectorTarget::~ReactInstanceManagerInspectorTarget() {
  if (inspectorPageId_.has_value()) {
    // Remove the page (terminating all sessions) and destroy the target, both
    // on the inspector queue.
    inspectorExecutor_([inspectorPageId = *inspectorPageId_,
                        inspectorTarget = std::move(inspectorTarget_)]() {
      getInspectorInstance().removePage(inspectorPageId);
      (void)inspectorTarget;
    });
  }
}

jni::local_ref<ReactInstanceManagerInspectorTarget::jhybriddata>
ReactInstanceManagerInspectorTarget::initHybrid(
    jni::alias_ref<jhybridobject> jobj,
    jni::alias_ref<JExecutor::javaobject> javaExecutor,
    jni::alias_ref<
        ReactInstanceManagerInspectorTarget::TargetDelegate::javaobject>
        delegate) {
  return makeCxxInstance(jobj, javaExecutor, delegate);
}

void ReactInstanceManagerInspectorTarget::sendDebuggerResumeCommand() {
  if (inspectorTarget_) {
    inspectorTarget_->sendCommand(HostCommand::DebuggerResume);
  } else {
    jni::throwNewJavaException(
        "java/lang/IllegalStateException",
        "Cannot send command while the Fusebox backend is not enabled");
  }
}

void ReactInstanceManagerInspectorTarget::registerNatives() {
  registerHybrid({
      makeNativeMethod(
          "initHybrid", ReactInstanceManagerInspectorTarget::initHybrid),
      makeNativeMethod(
          "sendDebuggerResumeCommand",
          ReactInstanceManagerInspectorTarget::sendDebuggerResumeCommand),
  });
}

jsinspector_modern::HostTargetMetadata
ReactInstanceManagerInspectorTarget::getMetadata() {
  auto mapClass = findClassLocal("java/util/Map");
  auto getMethod = mapClass->getMethod<jobject(jobject)>("get");

  auto metadata = delegate_->getMetadata();

  auto appIdentifier = getMethod(metadata, make_jstring("appIdentifier").get());
  auto deviceName = getMethod(metadata, make_jstring("deviceName").get());
  auto platform = getMethod(metadata, make_jstring("platform").get());
  auto reactNativeVersion =
      getMethod(metadata, make_jstring("reactNativeVersion").get());

  return {
      .appIdentifier = appIdentifier ? appIdentifier->toString() : nullptr,
      .deviceName = deviceName ? deviceName->toString() : nullptr,
      .integrationName = "Android Bridge (ReactInstanceManagerInspectorTarget)",
      .platform = platform ? platform->toString() : nullptr,
      .reactNativeVersion =
          reactNativeVersion ? reactNativeVersion->toString() : nullptr,
  };
}

void ReactInstanceManagerInspectorTarget::onReload(
    const PageReloadRequest& /*request*/) {
  delegate_->onReload();
}

void ReactInstanceManagerInspectorTarget::onSetPausedInDebuggerMessage(
    const OverlaySetPausedInDebuggerMessageRequest& request) {
  delegate_->onSetPausedInDebuggerMessage(request);
}

HostTarget* ReactInstanceManagerInspectorTarget::getInspectorTarget() {
  return inspectorTarget_.get();
}

} // namespace facebook::react
