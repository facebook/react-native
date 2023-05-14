/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "YGConfig.h"

using namespace facebook::yoga;

namespace facebook {
namespace yoga {
bool configUpdateInvalidatesLayout(YGConfigRef a, YGConfigRef b) {
  return a->getErrata() != b->getErrata() ||
      a->getEnabledExperiments() != b->getEnabledExperiments() ||
      a->getPointScaleFactor() != b->getPointScaleFactor() ||
      a->useWebDefaults() != b->useWebDefaults();
}
} // namespace yoga
} // namespace facebook

YGConfig::YGConfig(YGLogger logger) : cloneNodeCallback_{nullptr} {
  setLogger(logger);
}

void YGConfig::setUseWebDefaults(bool useWebDefaults) {
  flags_.useWebDefaults = useWebDefaults;
}

bool YGConfig::useWebDefaults() const {
  return flags_.useWebDefaults;
}

void YGConfig::setShouldPrintTree(bool printTree) {
  flags_.printTree = printTree;
}

bool YGConfig::shouldPrintTree() const {
  return flags_.printTree;
}

void YGConfig::setExperimentalFeatureEnabled(
    YGExperimentalFeature feature,
    bool enabled) {
  experimentalFeatures_.set(feature, enabled);
}

bool YGConfig::isExperimentalFeatureEnabled(
    YGExperimentalFeature feature) const {
  return experimentalFeatures_.test(feature);
}

ExperimentalFeatureSet YGConfig::getEnabledExperiments() const {
  return experimentalFeatures_;
}

void YGConfig::setErrata(YGErrata errata) {
  errata_ = errata;
}

void YGConfig::addErrata(YGErrata errata) {
  errata_ |= errata;
}

void YGConfig::removeErrata(YGErrata errata) {
  errata_ &= (~errata);
}

YGErrata YGConfig::getErrata() const {
  return errata_;
}

bool YGConfig::hasErrata(YGErrata errata) const {
  return (errata_ & errata) != YGErrataNone;
}

void YGConfig::setPointScaleFactor(float pointScaleFactor) {
  pointScaleFactor_ = pointScaleFactor;
}

float YGConfig::getPointScaleFactor() const {
  return pointScaleFactor_;
}

void YGConfig::setContext(void* context) {
  context_ = context;
}

void* YGConfig::getContext() const {
  return context_;
}

void YGConfig::setLogger(YGLogger logger) {
  logger_.noContext = logger;
  flags_.loggerUsesContext = false;
}

void YGConfig::setLogger(LogWithContextFn logger) {
  logger_.withContext = logger;
  flags_.loggerUsesContext = true;
}

void YGConfig::setLogger(std::nullptr_t) {
  setLogger(YGLogger{nullptr});
}

void YGConfig::log(
    YGConfig* config,
    YGNode* node,
    YGLogLevel logLevel,
    void* logContext,
    const char* format,
    va_list args) const {
  if (flags_.loggerUsesContext) {
    logger_.withContext(config, node, logLevel, logContext, format, args);
  } else {
    logger_.noContext(config, node, logLevel, format, args);
  }
}

void YGConfig::setCloneNodeCallback(YGCloneNodeFunc cloneNode) {
  cloneNodeCallback_.noContext = cloneNode;
  flags_.cloneNodeUsesContext = false;
}

void YGConfig::setCloneNodeCallback(CloneWithContextFn cloneNode) {
  cloneNodeCallback_.withContext = cloneNode;
  flags_.cloneNodeUsesContext = true;
}

void YGConfig::setCloneNodeCallback(std::nullptr_t) {
  setCloneNodeCallback(YGCloneNodeFunc{nullptr});
}

YGNodeRef YGConfig::cloneNode(
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
