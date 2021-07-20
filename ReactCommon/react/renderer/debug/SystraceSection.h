/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
#endif

namespace facebook {
namespace react {

/**
 * This is a convenience class to avoid lots of verbose profiling
 * #ifdefs.  If WITH_FBSYSTRACE is not defined, the optimizer will
 * remove this completely.  If it is defined, it will behave as
 * FbSystraceSection, with the right tag provided. Use two separate classes to
 * to ensure that the ODR rule isn't violated, that is, if WITH_FBSYSTRACE has
 * different values in different files, there is no inconsistency in the sizes
 * of defined symbols.
 */
#ifdef WITH_FBSYSTRACE
struct ConcreteSystraceSection {
 public:
  template <typename... ConvertsToStringPiece>
  explicit ConcreteSystraceSection(
      const char *name,
      ConvertsToStringPiece &&...args)
      : m_section(TRACE_TAG_REACT_CXX_BRIDGE, name, args...) {}

 private:
  fbsystrace::FbSystraceSection m_section;
};
using SystraceSection = ConcreteSystraceSection;
#else
struct DummySystraceSection {
 public:
  template <typename... ConvertsToStringPiece>
  explicit DummySystraceSection(
      const char *name,
      ConvertsToStringPiece &&...args) {}
};
using SystraceSection = DummySystraceSection;
#endif

} // namespace react
} // namespace facebook
