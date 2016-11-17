// Copyright 2004-present Facebook. All Rights Reserved.

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
 * FbSystraceSection, with the right tag provided.
 */
struct SystraceSection {
public:
  template<typename... ConvertsToStringPiece>
  explicit SystraceSection(const char* name, ConvertsToStringPiece&&... args)
#ifdef WITH_FBSYSTRACE
    : m_section(TRACE_TAG_REACT_CXX_BRIDGE, name, args...)
#endif
  {}

private:
#ifdef WITH_FBSYSTRACE
  fbsystrace::FbSystraceSection m_section;
#endif
};

}}
