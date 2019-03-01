// TODO: Use actual glog
// TODO: Using actual glog non-trivial as it uses Desktop only APIs
// TODO: Maybe implement glog header in terms of Windows' TraceLoggingProvider.h?

#pragma once
#include <iostream>

#define CHECK(b) !(b) && (std::abort(), true) && std::cerr
#define DCHECK(b) !(b) && (std::abort(), true) && std::cerr

#ifdef DEBUG
#define DCHECK_GT(v1, v2) CHECK((v1) > (v2))
#else
#define DCHECK_GT(v1, v2)
#endif

#ifdef DEBUG
#define DCHECK_EQ(v1, v2) CHECK((v1) == (v2))
#else
#define DCHECK_EQ(v1, v2)
#endif

#ifndef LOG
#define LOG(b) std::cerr
#endif
