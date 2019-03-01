// This file is a helper to allow devmain code to include folly
#include <iostream>
#pragma warning( push )
#pragma warning( disable : 4995 )
#pragma warning( disable : 4068 )
#pragma warning( disable : 4146 )
#pragma warning( disable : 4100 )

#pragma push_macro("_WIN32")
#pragma push_macro("_MSC_VER")
#pragma push_macro("ERROR")
#pragma push_macro("check")
#pragma push_macro("max")
#pragma push_macro("min")
#pragma push_macro("OUT")
#pragma push_macro("IN")

#ifdef __clang__
  #undef _WIN32
  #undef _MSC_VER
#endif

#undef ERROR
#undef Check
#undef max
#undef min
#undef OUT
#undef IN

#include <folly/dynamic.h>

#pragma pop_macro("IN")
#pragma pop_macro("OUT")
#pragma pop_macro("min")
#pragma pop_macro("max")
#pragma pop_macro("check")
#pragma pop_macro("ERROR")
#pragma pop_macro("_WIN32")
#pragma pop_macro("_MSC_VER")
#pragma warning( pop )