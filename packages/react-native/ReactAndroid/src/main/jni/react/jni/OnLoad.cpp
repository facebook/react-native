/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <glog/logging.h>

#include <fb/glog_init.h>
#include <fbjni/fbjni.h>

#include "CatalystInstanceImpl.h"
#include "CxxModuleWrapperBase.h"
#include "InspectorNetworkRequestListener.h"
#include "JavaScriptExecutorHolder.h"
#include "ReactInstanceManagerInspectorTarget.h"

#ifndef WITH_GLOGINIT
#define WITH_GLOGINIT 1
#endif

#ifdef WITH_XPLATINIT
#include <fb/xplat_init.h>
#endif

namespace facebook::react {

extern "C" JNIEXPORT jint JNI_OnLoad(JavaVM* vm, void* reserved) {
#ifdef WITH_XPLATINIT
  return facebook::xplat::initialize(vm, [] {
#else
  return jni::initialize(vm, [] {
#endif
#if WITH_GLOGINIT
    gloginit::initialize();
    FLAGS_minloglevel = 0;
#endif
#ifndef RCT_FIT_RM_OLD_RUNTIME
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    CatalystInstanceImpl::registerNatives();
#pragma clang diagnostic pop
#endif
    CxxModuleWrapperBase::registerNatives();
    ReactInstanceManagerInspectorTarget::registerNatives();
    InspectorNetworkRequestListener::registerNatives();
  });
}

} // namespace facebook::react
