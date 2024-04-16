/* -----------------------------------------------------------------------
   ffi_common.h - Copyright (C) 2011, 2012, 2013  Anthony Green
                  Copyright (C) 2007  Free Software Foundation, Inc
                  Copyright (c) 1996  Red Hat, Inc.
                  
   Common internal definitions and macros. Only necessary for building
   libffi.

   Permission is hereby granted, free of charge, to any person
   obtaining a copy of this software and associated documentation
   files (the ``Software''), to deal in the Software without
   restriction, including without limitation the rights to use, copy,
   modify, merge, publish, distribute, sublicense, and/or sell copies
   of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be
   included in all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED ``AS IS'', WITHOUT WARRANTY OF ANY KIND,
   EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
   NONINFRINGEMENT.  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
   HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
   WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
   DEALINGS IN THE SOFTWARE.

   ----------------------------------------------------------------------- */

#ifndef FFI_COMMON_H
#define FFI_COMMON_H

#ifdef __cplusplus
extern "C" {
#endif

#include <fficonfig.h>

/* Do not move this. Some versions of AIX are very picky about where
   this is positioned. */
#ifdef __GNUC__
# if HAVE_ALLOCA_H
#  include <alloca.h>
# else
  /* mingw64 defines this already in malloc.h. */
#  ifndef alloca
#    define alloca __builtin_alloca
#  endif
# endif
# define MAYBE_UNUSED __attribute__((__unused__))
#else
# define MAYBE_UNUSED
# if HAVE_ALLOCA_H
#  include <alloca.h>
# else
#  ifdef _AIX
#   pragma alloca
#  else
#   ifndef alloca /* predefined by HP cc +Olibcalls */
#    ifdef _MSC_VER
#     define alloca _alloca
#    else
char *alloca ();
#   endif
#  endif
# endif
# endif
#endif

/* Check for the existence of memcpy. */
#if STDC_HEADERS
# include <string.h>
#else
# ifndef HAVE_MEMCPY
#  define memcpy(d, s, n) bcopy ((s), (d), (n))
# endif
#endif

#if defined(FFI_DEBUG)
#include <stdio.h>
#endif

#ifdef FFI_DEBUG
void ffi_assert(char *expr, char *file, int line);
void ffi_stop_here(void);
void ffi_type_test(ffi_type *a, char *file, int line);

#define FFI_ASSERT(x) ((x) ? (void)0 : ffi_assert(#x, __FILE__,__LINE__))
#define FFI_ASSERT_AT(x, f, l) ((x) ? 0 : ffi_assert(#x, (f), (l)))
#define FFI_ASSERT_VALID_TYPE(x) ffi_type_test (x, __FILE__, __LINE__)
#else
#define FFI_ASSERT(x)
#define FFI_ASSERT_AT(x, f, l)
#define FFI_ASSERT_VALID_TYPE(x)
#endif

/* v cast to size_t and aligned up to a multiple of a */
#define FFI_ALIGN(v, a)  (((((size_t) (v))-1) | ((a)-1))+1)
/* v cast to size_t and aligned down to a multiple of a */
#define FFI_ALIGN_DOWN(v, a) (((size_t) (v)) & -a)

/* Perform machine dependent cif processing */
ffi_status ffi_prep_cif_machdep(ffi_cif *cif);
ffi_status ffi_prep_cif_machdep_var(ffi_cif *cif,
	 unsigned int nfixedargs, unsigned int ntotalargs);


#if HAVE_LONG_DOUBLE_VARIANT
/* Used to adjust size/alignment of ffi types.  */
void ffi_prep_types (ffi_abi abi);
#endif

/* Used internally, but overridden by some architectures */
ffi_status ffi_prep_cif_core(ffi_cif *cif,
			     ffi_abi abi,
			     unsigned int isvariadic,
			     unsigned int nfixedargs,
			     unsigned int ntotalargs,
			     ffi_type *rtype,
			     ffi_type **atypes);

/* Translate a data pointer to a code pointer.  Needed for closures on
   some targets.  */
void *ffi_data_to_code_pointer (void *data) FFI_HIDDEN;

/* The arch code calls this to determine if a given closure has a
   static trampoline. */
int ffi_tramp_is_present (void *closure) FFI_HIDDEN;

/* Return a file descriptor of a temporary zero-sized file in a
   writable and executable filesystem. */
int open_temp_exec_file(void) FFI_HIDDEN;

/* Extended cif, used in callback from assembly routine */
typedef struct
{
  ffi_cif *cif;
  void *rvalue;
  void **avalue;
} extended_cif;

/* Terse sized type definitions.  */
#if defined(_MSC_VER) || defined(__sgi) || defined(__SUNPRO_C)
typedef unsigned char UINT8;
typedef signed char   SINT8;
typedef unsigned short UINT16;
typedef signed short   SINT16;
typedef unsigned int UINT32;
typedef signed int   SINT32;
# ifdef _MSC_VER
typedef unsigned __int64 UINT64;
typedef signed __int64   SINT64;
# else
# include <inttypes.h>
typedef uint64_t UINT64;
typedef int64_t  SINT64;
# endif
#else
typedef unsigned int UINT8  __attribute__((__mode__(__QI__)));
typedef signed int   SINT8  __attribute__((__mode__(__QI__)));
typedef unsigned int UINT16 __attribute__((__mode__(__HI__)));
typedef signed int   SINT16 __attribute__((__mode__(__HI__)));
typedef unsigned int UINT32 __attribute__((__mode__(__SI__)));
typedef signed int   SINT32 __attribute__((__mode__(__SI__)));
typedef unsigned int UINT64 __attribute__((__mode__(__DI__)));
typedef signed int   SINT64 __attribute__((__mode__(__DI__)));
#endif

typedef float FLOAT32;

#ifndef __GNUC__
#define __builtin_expect(x, expected_value) (x)
#endif
#define LIKELY(x)    __builtin_expect(!!(x),1)
#define UNLIKELY(x)  __builtin_expect((x)!=0,0)

#ifdef __cplusplus
}
#endif

#endif
