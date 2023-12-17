/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/config/Config.h>
#include <yoga/debug/Log.h>
#include <yoga/node/Node.h>

namespace facebook::yoga {

bool configUpdateInvalidatesLayout(
    const Config& oldConfig,
    const Config& newConfig) {
  return oldConfig.getErrata() != newConfig.getErrata() ||
      oldConfig.getEnabledExperiments() != newConfig.getEnabledExperiments() ||
      oldConfig.getPointScaleFactor() != newConfig.getPointScaleFactor() ||
      oldConfig.useWebDefaults() != newConfig.useWebDefaults();
}

Config::Config(YGLogger logger) : cloneNodeCallback_{nullptr} {
  setLogger(logger);
}

void Config::setUseWebDefaults(bool useWebDefaults) {
  useWebDefaults_ = useWebDefaults;
}

bool Config::useWebDefaults() const {
  return useWebDefaults_;
}

void Config::setShouldPrintTree(bool printTree) {
  printTree_ = printTree;
}

bool Config::shouldPrintTree() const {
  return printTree_;
}

void Config::setExperimentalFeatureEnabled(
    ExperimentalFeature feature,
    bool enabled) {
  experimentalFeatures_.set(static_cast<size_t>(feature), enabled);
}

bool Config::isExperimentalFeatureEnabled(ExperimentalFeature feature) const {
  return experimentalFeatures_.test(static_cast<size_t>(feature));
}

ExperimentalFeatureSet Config::getEnabledExperiments() const {
  return experimentalFeatures_;
}

void Config::setErrata(Errata errata) {
  errata_ = errata;
}

void Config::addErrata(Errata errata) {
  errata_ |= errata;
}

void Config::removeErrata(Errata errata) {
  errata_ &= (~errata);
}

Errata Config::getErrata() const {
  return errata_;
}

bool Config::hasErrata(Errata errata) const {
  return (errata_ & errata) != Errata::None;
}

void Config::setPointScaleFactor(float pointScaleFactor) {
  pointScaleFactor_ = pointScaleFactor;
}

float Config::getPointScaleFactor() const {
  return pointScaleFactor_;
}

void Config::setContext(void* context) {
  context_ = context;
}

void* Config::getContext() const {
  return context_;
}

void Config::setLogger(YGLogger logger) {
  logger_ = logger;
}

void Config::log(
    const yoga::Node* node,
    LogLevel logLevel,
    const char* format,
    va_list args) const {
  logger_(this, node, unscopedEnum(logLevel), format, args);
}

void Config::setCloneNodeCallback(YGCloneNodeFunc cloneNode) {
  cloneNodeCallback_ = cloneNode;
}

YGNodeRef Config::cloneNode(
    YGNodeConstRef node,
    YGNodeConstRef owner,
    size_t childIndex) const {
  YGNodeRef clone = nullptr;
  if (cloneNodeCallback_ != nullptr) {
    clone = cloneNodeCallback_(node, owner, childIndex);
  }
  if (clone == nullptr) {
    clone = YGNodeClone(node);
  }
  return clone;
}

/*static*/ const Config& Config::getDefault() {
  static Config config{getDefaultLogger()};
  return config;
}

} // namespace facebook::yoga
