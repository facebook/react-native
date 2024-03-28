/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactInstanceManagerInspectorTarget.h"

#include <fbjni/NativeRunnable.h>
#include <jsinspector-modern/InspectorFlags.h>

using namespace facebook::jni;
using namespace facebook::react::jsinspector_modern;

namespace facebook::react {

void ReactInstanceManagerInspectorTarget::TargetDelegate::onReload() const {
  auto method = javaClassStatic()->getMethod<void()>("onReload");
  method(self());
}

ReactInstanceManagerInspectorTarget::ReactInstanceManagerInspectorTarget(
    jni::alias_ref<ReactInstanceManagerInspectorTarget::jhybridobject> jobj,
    jni::alias_ref<JExecutor::javaobject> executor,
    jni::alias_ref<
        ReactInstanceManagerInspectorTarget::TargetDelegate::javaobject>
        delegate)
    : delegate_(make_global(delegate)) {
  auto& inspectorFlags = InspectorFlags::getInstance();

  if (inspectorFlags.getEnableModernCDPRegistry()) {
    inspectorTarget_ = HostTarget::create(
        *this, [javaExecutor = make_global(executor)](auto callback) mutable {
          auto jrunnable =
              JNativeRunnable::newObjectCxxArgs(std::move(callback));
          javaExecutor->execute(jrunnable);
        });

    inspectorPageId_ = getInspectorInstance().addPage(
        "React Native Bridge (Experimental)",
        /* vm */ "",
        [inspectorTarget =
             inspectorTarget_](std::unique_ptr<IRemoteConnection> remote)
            -> std::unique_ptr<ILocalConnection> {
          return inspectorTarget->connect(
              std::move(remote),
              {
                  .integrationName =
                      "Android Bridge (ReactInstanceManagerInspectorTarget)",
              });
        },
        {.nativePageReloads = true, .prefersFuseboxFrontend = true});
  }
}

ReactInstanceManagerInspectorTarget::~ReactInstanceManagerInspectorTarget() {
  if (inspectorPageId_.has_value()) {
    getInspectorInstance().removePage(*inspectorPageId_);
  }
}

jni::local_ref<ReactInstanceManagerInspectorTarget::jhybriddata>
ReactInstanceManagerInspectorTarget::initHybrid(
    jni::alias_ref<jhybridobject> jobj,
    jni::alias_ref<JExecutor::javaobject> executor,
    jni::alias_ref<
        ReactInstanceManagerInspectorTarget::TargetDelegate::javaobject>
        delegate) {
  return makeCxxInstance(jobj, executor, delegate);
}

void ReactInstanceManagerInspectorTarget::registerNatives() {
  registerHybrid({
      makeNativeMethod(
          "initHybrid", ReactInstanceManagerInspectorTarget::initHybrid),
  });
}

void ReactInstanceManagerInspectorTarget::onReload(
    const PageReloadRequest& /*request*/) {
  delegate_->onReload();
}

HostTarget* ReactInstanceManagerInspectorTarget::getInspectorTarget() {
  return inspectorTarget_.get();
}

} // namespace facebook::react
