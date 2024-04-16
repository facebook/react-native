#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <fcntl.h>
#include <ffi.h>
#include "fficonfig.h"

#include <float.h>
#include <math.h>

#if defined HAVE_STDINT_H
#include <stdint.h>
#endif

#if defined HAVE_INTTYPES_H
#include <inttypes.h>
#endif

#define MAX_ARGS 256

#define CHECK(x) \
   do { \
      if(!(x)){ \
         printf("Check failed:\n%s\n", #x); \
         abort(); \
      } \
   } while(0)

#define CHECK_FLOAT_EQ(x, y) \
   do { \
      if(fabs((x) - (y)) > FLT_EPSILON){ \
         printf("Check failed CHECK_FLOAT_EQ(%s, %s)\n", #x, #y); \
         abort(); \
      } \
   } while(0)

#define CHECK_DOUBLE_EQ(x, y) \
   do { \
      if(fabs((x) - (y)) > DBL_EPSILON){ \
         printf("Check failed CHECK_FLOAT_EQ(%s, %s)\n", #x, #y); \
         abort(); \
      } \
   } while(0)

/* Define macros so that compilers other than gcc can run the tests.  */
#undef __UNUSED__
#if defined(__GNUC__)
#define __UNUSED__ __attribute__((__unused__))
#define __STDCALL__ __attribute__((stdcall))
#define __THISCALL__ __attribute__((thiscall))
#define __FASTCALL__ __attribute__((fastcall))
#define __MSABI__ __attribute__((ms_abi))
#else
#define __UNUSED__
#define __STDCALL__ __stdcall
#define __THISCALL__ __thiscall
#define __FASTCALL__ __fastcall
#endif

#ifndef ABI_NUM
#define ABI_NUM FFI_DEFAULT_ABI
#define ABI_ATTR
#endif

/* Prefer MAP_ANON(YMOUS) to /dev/zero, since we don't need to keep a
   file open.  */
#ifdef HAVE_MMAP_ANON
# undef HAVE_MMAP_DEV_ZERO

# include <sys/mman.h>
# ifndef MAP_FAILED
#  define MAP_FAILED -1
# endif
# if !defined (MAP_ANONYMOUS) && defined (MAP_ANON)
#  define MAP_ANONYMOUS MAP_ANON
# endif
# define USING_MMAP

#endif

#ifdef HAVE_MMAP_DEV_ZERO

# include <sys/mman.h>
# ifndef MAP_FAILED
#  define MAP_FAILED -1
# endif
# define USING_MMAP

#endif

/* msvc kludge.  */
#if defined(_MSC_VER)
#define PRIdLL "I64d"
#define PRIuLL "I64u"
#else
#define PRIdLL "lld"
#define PRIuLL "llu"
#endif

/* Tru64 UNIX kludge.  */
#if defined(__alpha__) && defined(__osf__)
/* Tru64 UNIX V4.0 doesn't support %lld/%lld, but long is 64-bit.  */
#undef PRIdLL
#define PRIdLL "ld"
#undef PRIuLL
#define PRIuLL "lu"
#define PRId8 "hd"
#define PRIu8 "hu"
#define PRId64 "ld"
#define PRIu64 "lu"
#define PRIuPTR "lu"
#endif

/* PA HP-UX kludge.  */
#if defined(__hppa__) && defined(__hpux__) && !defined(PRIuPTR)
#define PRIuPTR "lu"
#endif

/* IRIX kludge.  */
#if defined(__sgi)
/* IRIX 6.5 <inttypes.h> provides all definitions, but only for C99
   compilations.  */
#define PRId8 "hhd"
#define PRIu8 "hhu"
#if (_MIPS_SZLONG == 32)
#define PRId64 "lld"
#define PRIu64 "llu"
#endif
/* This doesn't match <inttypes.h>, which always has "lld" here, but the
   arguments are uint64_t, int64_t, which are unsigned long, long for
   64-bit in <sgidefs.h>.  */
#if (_MIPS_SZLONG == 64)
#define PRId64 "ld"
#define PRIu64 "lu"
#endif
/* This doesn't match <inttypes.h>, which has "u" here, but the arguments
   are uintptr_t, which is always unsigned long.  */
#define PRIuPTR "lu"
#endif

/* Solaris < 10 kludge.  */
#if defined(__sun__) && defined(__svr4__) && !defined(PRIuPTR)
#if defined(__arch64__) || defined (__x86_64__)
#define PRIuPTR "lu"
#else
#define PRIuPTR "u"
#endif
#endif

/* MSVC kludge.  */
#if defined _MSC_VER
#if !defined(__cplusplus) || defined(__STDC_FORMAT_MACROS)
#define PRIuPTR "lu"
#define PRIu8 "u"
#define PRId8 "d"
#define PRIu64 "I64u"
#define PRId64 "I64d"
#endif
#endif

#ifndef PRIuPTR
#define PRIuPTR "u"
#endif
