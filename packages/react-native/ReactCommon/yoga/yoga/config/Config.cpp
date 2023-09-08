/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/config/Config.h>

namespace facebook::yoga {

bool configUpdateInvalidatesLayout(Config* a, Config* b) {
  return a->getErrata() != b->getErrata() ||
      a->getEnabledExperiments() != b->getEnabledExperiments() ||
      a->getPointScaleFactor() != b->getPointScaleFactor() ||
      a->useWebDefaults() != b->useWebDefaults();
}

Config::Config(YGLogger logger) : cloneNodeCallback_{nullptr} {
  setLogger(logger);
}

void Config::setUseWebDefaults(bool useWebDefaults) {
  flags_.useWebDefaults = useWebDefaults;
}

bool Config::useWebDefaults() const {
  return flags_.useWebDefaults;
}

void Config::setShouldPrintTree(bool printTree) {
  flags_.printTree = printTree;
}

bool Config::shouldPrintTree() const {
  return flags_.printTree;
}

void Config::setExperimentalFeatureEnabled(
    YGExperimentalFeature feature,
    bool enabled) {
  experimentalFeatures_.set(feature, enabled);
}

bool Config::isExperimentalFeatureEnabled(YGExperimentalFeature feature) const {
  return experimentalFeatures_.test(feature);
}

EnumBitset<YGExperimentalFeature> Config::getEnabledExperiments() const {
  return experimentalFeatures_;
}

void Config::setErrata(YGErrata errata) {
  errata_ = errata;
}

void Config::addErrata(YGErrata errata) {
  errata_ |= errata;
}

void Config::removeErrata(YGErrata errata) {
  errata_ &= (~errata);
}

YGErrata Config::getErrata() const {
  return errata_;
}

bool Config::hasErrata(YGErrata errata) const {
  return (errata_ & errata) != YGErrataNone;
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
  logger_.noContext = logger;
  flags_.loggerUsesContext = false;
}

void Config::setLogger(LogWithContextFn logger) {
  logger_.withContext = logger;
  flags_.loggerUsesContext = true;
}

void Config::setLogger(std::nullptr_t) {
  setLogger(YGLogger{nullptr});
}

void Config::log(
    YGNodeRef node,
    YGLogLevel logLevel,
    void* logContext,
    const char* format,
    va_list args) {
  if (flags_.loggerUsesContext) {
    logger_.withContext(this, node, logLevel, logContext, format, args);
  } else {
    logger_.noContext(this, node, logLevel, format, args);
  }
}

void Config::setCloneNodeCallback(YGCloneNodeFunc cloneNode) {
  cloneNodeCallback_.noContext = cloneNode;
  flags_.cloneNodeUsesContext = false;
}

void Config::setCloneNodeCallback(CloneWithContextFn cloneNode) {
  cloneNodeCallback_.withContext = cloneNode;
  flags_.cloneNodeUsesContext = true;
}

void Config::setCloneNodeCallback(std::nullptr_t) {
  setCloneNodeCallback(YGCloneNodeFunc{nullptr});
}

YGNodeRef Config::cloneNode(
    YGNodeRef node,
    YGNodeRef owner,
    int childIndex,
    void* cloneContext) const {
  YGNodeRef clone = nullptr;
  if (cloneNodeCallback_.noContext != nullptr) {
    clone = flags_.cloneNodeUsesContext
        ? cloneNodeCallback_.withContext(node, owner, childIndex, cloneContext)
        : cloneNodeCallback_.noContext(node, owner, childIndex);
  }
  if (clone == nullptr) {
    clone = YGNodeClone(node);
  }
  return clone;
}

} // namespace facebook::yoga
