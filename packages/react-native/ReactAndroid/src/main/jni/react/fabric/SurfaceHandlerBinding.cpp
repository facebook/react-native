/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SurfaceHandlerBinding.h"
#include <react/renderer/scheduler/Scheduler.h>

namespace facebook {
namespace react {

SurfaceHandlerBinding::SurfaceHandlerBinding(
    SurfaceId surfaceId,
    std::string const &moduleName)
    : surfaceHandler_(moduleName, surfaceId) {}

void SurfaceHandlerBinding::setDisplayMode(jint mode) {
  surfaceHandler_.setDisplayMode(static_cast<DisplayMode>(mode));
}

void SurfaceHandlerBinding::start() {
  std::unique_lock lock(lifecycleMutex_);

  if (surfaceHandler_.getStatus() != SurfaceHandler::Status::Running) {
    surfaceHandler_.start();
  }
}

void SurfaceHandlerBinding::stop() {
  std::unique_lock lock(lifecycleMutex_);

  if (surfaceHandler_.getStatus() == SurfaceHandler::Status::Running) {
    surfaceHandler_.stop();
  }
}

jint SurfaceHandlerBinding::getSurfaceId() {
  return surfaceHandler_.getSurfaceId();
}

void SurfaceHandlerBinding::setSurfaceId(jint surfaceId) {
  surfaceHandler_.setSurfaceId(surfaceId);
}

jboolean SurfaceHandlerBinding::isRunning() {
  return surfaceHandler_.getStatus() == SurfaceHandler::Status::Running;
}

jni::local_ref<jstring> SurfaceHandlerBinding::getModuleName() {
  return jni::make_jstring(surfaceHandler_.getModuleName());
}

jni::local_ref<SurfaceHandlerBinding::jhybriddata>
SurfaceHandlerBinding::initHybrid(
    jni::alias_ref<jclass>,
    jint surfaceId,
    jni::alias_ref<jstring> moduleName) {
  return makeCxxInstance(surfaceId, moduleName->toStdString());
}

void SurfaceHandlerBinding::setLayoutConstraints(
    jfloat minWidth,
    jfloat maxWidth,
    jfloat minHeight,
    jfloat maxHeight,
    jfloat offsetX,
    jfloat offsetY,
    jboolean doLeftAndRightSwapInRTL,
    jboolean isRTL,
    jfloat pixelDensity) {
  LayoutConstraints constraints = {};
  constraints.minimumSize = {minWidth, minHeight};
  constraints.maximumSize = {maxWidth, maxHeight};
  constraints.layoutDirection =
      isRTL ? LayoutDirection::RightToLeft : LayoutDirection::LeftToRight;

  LayoutContext context = {};
  context.swapLeftAndRightInRTL = doLeftAndRightSwapInRTL;
  context.pointScaleFactor = pixelDensity;
  context.viewportOffset = {offsetX, offsetY};

  surfaceHandler_.constraintLayout(constraints, context);
}

void SurfaceHandlerBinding::setProps(NativeMap *props) {
  surfaceHandler_.setProps(props->consume());
}

SurfaceHandler const &SurfaceHandlerBinding::getSurfaceHandler() {
  return surfaceHandler_;
}

void SurfaceHandlerBinding::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", SurfaceHandlerBinding::initHybrid),
      makeNativeMethod(
          "getSurfaceIdNative", SurfaceHandlerBinding::getSurfaceId),
      makeNativeMethod(
          "setSurfaceIdNative", SurfaceHandlerBinding::setSurfaceId),
      makeNativeMethod("isRunningNative", SurfaceHandlerBinding::isRunning),
      makeNativeMethod(
          "getModuleNameNative", SurfaceHandlerBinding::getModuleName),
      makeNativeMethod("startNative", SurfaceHandlerBinding::start),
      makeNativeMethod("stopNative", SurfaceHandlerBinding::stop),
      makeNativeMethod(
          "setLayoutConstraintsNative",
          SurfaceHandlerBinding::setLayoutConstraints),
      makeNativeMethod("setPropsNative", SurfaceHandlerBinding::setProps),
      makeNativeMethod(
          "setDisplayModeNative", SurfaceHandlerBinding::setDisplayMode),
  });
}

} // namespace react
} // namespace facebook
