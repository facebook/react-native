/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "Yoga-internal.h"
#include "Yoga.h"
#include "BitUtils.h"

namespace facebook {
namespace yoga {
namespace detail {

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
struct YGConfigFlags {
  bool useWebDefaults : 1;
  bool printTree : 1;
  bool cloneNodeUsesContext : 1;
  bool loggerUsesContext : 1;
};
#pragma pack(pop)

} // namespace detail
} // namespace yoga
} // namespace facebook

struct YOGA_EXPORT YGConfig {
  YGConfig(YGLogger logger);

  void setUseWebDefaults(bool useWebDefaults);
  bool useWebDefaults() const;

  void setShouldPrintTree(bool printTree);
  bool shouldPrintTree() const;

  void setExperimentalFeatureEnabled(
      YGExperimentalFeature feature,
      bool enabled);
  bool isExperimentalFeatureEnabled(YGExperimentalFeature feature) const;

  void setErrata(YGErrata errata);
  YGErrata getErrata() const;

  void setPointScaleFactor(float pointScaleFactor);
  float getPointScaleFactor() const;

  void setContext(void* context);
  void* getContext() const;

  void setLogger(YGLogger logger);
  void setLogger(facebook::yoga::detail::LogWithContextFn logger);
  void setLogger(std::nullptr_t);
  void log(YGConfig*, YGNode*, YGLogLevel, void*, const char*, va_list) const;

  void setCloneNodeCallback(YGCloneNodeFunc cloneNode);
  void setCloneNodeCallback(
      facebook::yoga::detail::CloneWithContextFn cloneNode);
  void setCloneNodeCallback(std::nullptr_t);
  YGNodeRef cloneNode(
      YGNodeRef node,
      YGNodeRef owner,
      int childIndex,
      void* cloneContext) const;

private:
  union {
    facebook::yoga::detail::CloneWithContextFn withContext;
    YGCloneNodeFunc noContext;
  } cloneNodeCallback_;
  union {
    facebook::yoga::detail::LogWithContextFn withContext;
    YGLogger noContext;
  } logger_;

  facebook::yoga::detail::YGConfigFlags flags_{};
  facebook::yoga::detail::EnumBitset<YGExperimentalFeature>
      experimentalFeatures_{};
  YGErrata errata_ = YGErrataNone;
  float pointScaleFactor_ = 1.0f;
  void* context_ = nullptr;
};
