/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <bitset>

#include <yoga/Yoga.h>
#include <yoga/enums/Errata.h>
#include <yoga/enums/ExperimentalFeature.h>
#include <yoga/enums/LogLevel.h>

// Tag struct used to form the opaque YGConfigRef for the public C API
struct YGConfig {};

namespace facebook::yoga {

class Config;
class Node;

using ExperimentalFeatureSet = std::bitset<ordinalCount<ExperimentalFeature>()>;

// Whether moving a node from an old to new config should dirty previously
// calculated layout results.
bool configUpdateInvalidatesLayout(
    const Config& oldConfig,
    const Config& newConfig);

class YG_EXPORT Config : public ::YGConfig {
 public:
  Config(YGLogger logger);

  void setUseWebDefaults(bool useWebDefaults);
  bool useWebDefaults() const;

  void setExperimentalFeatureEnabled(ExperimentalFeature feature, bool enabled);
  bool isExperimentalFeatureEnabled(ExperimentalFeature feature) const;
  ExperimentalFeatureSet getEnabledExperiments() const;

  void setErrata(Errata errata);
  void addErrata(Errata errata);
  void removeErrata(Errata errata);
  Errata getErrata() const;
  bool hasErrata(Errata errata) const;

  void setPointScaleFactor(float pointScaleFactor);
  float getPointScaleFactor() const;

  void setContext(void* context);
  void* getContext() const;

  void setLogger(YGLogger logger);
  void log(
      const yoga::Node* node,
      LogLevel logLevel,
      const char* format,
      va_list args) const;

  void setCloneNodeCallback(YGCloneNodeFunc cloneNode);
  YGNodeRef
  cloneNode(YGNodeConstRef node, YGNodeConstRef owner, size_t childIndex) const;

  static const Config& getDefault();

 private:
  YGCloneNodeFunc cloneNodeCallback_;
  YGLogger logger_;

  bool useWebDefaults_ : 1 = false;

  ExperimentalFeatureSet experimentalFeatures_{};
  Errata errata_ = Errata::None;
  float pointScaleFactor_ = 1.0f;
  void* context_ = nullptr;
};

inline Config* resolveRef(const YGConfigRef ref) {
  return static_cast<Config*>(ref);
}

inline const Config* resolveRef(const YGConfigConstRef ref) {
  return static_cast<const Config*>(ref);
}

} // namespace facebook::yoga
