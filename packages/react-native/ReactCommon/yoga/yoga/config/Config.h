/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/Yoga.h>
#include <yoga/bits/EnumBitset.h>

// Tag struct used to form the opaque YGConfigRef for the public C API
struct YGConfig {};

namespace facebook::yoga {

class Config;

// Whether moving a node from config "a" to config "b" should dirty previously
// calculated layout results.
bool configUpdateInvalidatesLayout(Config* a, Config* b);

// Internal variants of log functions, currently used only by JNI bindings.
// TODO: Reconcile this with the public API
using LogWithContextFn = int (*)(
    YGConfigRef config,
    YGNodeRef node,
    YGLogLevel level,
    void* context,
    const char* format,
    va_list args);
using CloneWithContextFn = YGNodeRef (*)(
    YGNodeRef node,
    YGNodeRef owner,
    int childIndex,
    void* cloneContext);

#pragma pack(push)
#pragma pack(1)
// Packed structure of <32-bit options to miminize size per node.
struct ConfigFlags {
  bool useWebDefaults : 1;
  bool printTree : 1;
  bool cloneNodeUsesContext : 1;
  bool loggerUsesContext : 1;
};
#pragma pack(pop)

class YOGA_EXPORT Config : public ::YGConfig {
public:
  Config(YGLogger logger);

  void setUseWebDefaults(bool useWebDefaults);
  bool useWebDefaults() const;

  void setShouldPrintTree(bool printTree);
  bool shouldPrintTree() const;

  void setExperimentalFeatureEnabled(
      YGExperimentalFeature feature,
      bool enabled);
  bool isExperimentalFeatureEnabled(YGExperimentalFeature feature) const;
  EnumBitset<YGExperimentalFeature> getEnabledExperiments() const;

  void setErrata(YGErrata errata);
  void addErrata(YGErrata errata);
  void removeErrata(YGErrata errata);
  YGErrata getErrata() const;
  bool hasErrata(YGErrata errata) const;

  void setPointScaleFactor(float pointScaleFactor);
  float getPointScaleFactor() const;

  void setContext(void* context);
  void* getContext() const;

  void setLogger(YGLogger logger);
  void setLogger(LogWithContextFn logger);
  void setLogger(std::nullptr_t);
  void log(YGNodeRef, YGLogLevel, void*, const char*, va_list);

  void setCloneNodeCallback(YGCloneNodeFunc cloneNode);
  void setCloneNodeCallback(CloneWithContextFn cloneNode);
  void setCloneNodeCallback(std::nullptr_t);
  YGNodeRef cloneNode(
      YGNodeRef node,
      YGNodeRef owner,
      int childIndex,
      void* cloneContext) const;

private:
  union {
    CloneWithContextFn withContext;
    YGCloneNodeFunc noContext;
  } cloneNodeCallback_;
  union {
    LogWithContextFn withContext;
    YGLogger noContext;
  } logger_;

  ConfigFlags flags_{};
  EnumBitset<YGExperimentalFeature> experimentalFeatures_{};
  YGErrata errata_ = YGErrataNone;
  float pointScaleFactor_ = 1.0f;
  void* context_ = nullptr;
};

} // namespace facebook::yoga
