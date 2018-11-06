#pragma once

// packing uses a push/pop mechanic in msvc
#ifdef _MSC_VER
# define RN_PACK_ATTR /**/
# define RN_PACK_PUSH __pragma(pack(push, 1))
# define RN_PACK_POP __pragma(pack(pop))
#elif defined(__clang__) || defined(__GNUC__)
# define RN_PACK_ATTR __attribute__((__packed__))
# define RN_PACK_PUSH /**/
# define RN_PACK_POP /**/
#else
# define RN_PACK_ATTR /**/
# define RN_PACK_PUSH /**/
# define RN_PACK_POP /**/
#endif


