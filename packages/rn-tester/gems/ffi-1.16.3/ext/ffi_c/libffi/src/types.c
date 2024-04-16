/* -----------------------------------------------------------------------
   types.c - Copyright (c) 1996, 1998  Red Hat, Inc.
   
   Predefined ffi_types needed by libffi.

   Permission is hereby granted, free of charge, to any person obtaining
   a copy of this software and associated documentation files (the
   ``Software''), to deal in the Software without restriction, including
   without limitation the rights to use, copy, modify, merge, publish,
   distribute, sublicense, and/or sell copies of the Software, and to
   permit persons to whom the Software is furnished to do so, subject to
   the following conditions:

   The above copyright notice and this permission notice shall be included
   in all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED ``AS IS'', WITHOUT WARRANTY OF ANY KIND,
   EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
   NONINFRINGEMENT.  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
   HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
   WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
   DEALINGS IN THE SOFTWARE.
   ----------------------------------------------------------------------- */

/* Hide the basic type definitions from the header file, so that we
   can redefine them here as "const".  */
#define LIBFFI_HIDE_BASIC_TYPES

#include <ffi.h>
#include <ffi_common.h>

/* Type definitions */

#define FFI_TYPEDEF(name, type, id, maybe_const)\
struct struct_align_##name {			\
  char c;					\
  type x;					\
};						\
FFI_EXTERN					\
maybe_const ffi_type ffi_type_##name = {	\
  sizeof(type),					\
  offsetof(struct struct_align_##name, x),	\
  id, NULL					\
}

#define FFI_COMPLEX_TYPEDEF(name, type, maybe_const)	\
static ffi_type *ffi_elements_complex_##name [2] = {	\
	(ffi_type *)(&ffi_type_##name), NULL		\
};							\
struct struct_align_complex_##name {			\
  char c;						\
  _Complex type x;					\
};							\
FFI_EXTERN						\
maybe_const ffi_type ffi_type_complex_##name = {	\
  sizeof(_Complex type),				\
  offsetof(struct struct_align_complex_##name, x),	\
  FFI_TYPE_COMPLEX,					\
  (ffi_type **)ffi_elements_complex_##name		\
}

/* Size and alignment are fake here. They must not be 0. */
FFI_EXTERN const ffi_type ffi_type_void = {
  1, 1, FFI_TYPE_VOID, NULL
};

FFI_TYPEDEF(uint8, UINT8, FFI_TYPE_UINT8, const);
FFI_TYPEDEF(sint8, SINT8, FFI_TYPE_SINT8, const);
FFI_TYPEDEF(uint16, UINT16, FFI_TYPE_UINT16, const);
FFI_TYPEDEF(sint16, SINT16, FFI_TYPE_SINT16, const);
FFI_TYPEDEF(uint32, UINT32, FFI_TYPE_UINT32, const);
FFI_TYPEDEF(sint32, SINT32, FFI_TYPE_SINT32, const);
FFI_TYPEDEF(uint64, UINT64, FFI_TYPE_UINT64, const);
FFI_TYPEDEF(sint64, SINT64, FFI_TYPE_SINT64, const);

FFI_TYPEDEF(pointer, void*, FFI_TYPE_POINTER, const);

FFI_TYPEDEF(float, float, FFI_TYPE_FLOAT, const);
FFI_TYPEDEF(double, double, FFI_TYPE_DOUBLE, const);

#if !defined HAVE_LONG_DOUBLE_VARIANT || defined __alpha__
#define FFI_LDBL_CONST const
#else
#define FFI_LDBL_CONST
#endif

#ifdef __alpha__
/* Even if we're not configured to default to 128-bit long double, 
   maintain binary compatibility, as -mlong-double-128 can be used
   at any time.  */
/* Validate the hard-coded number below.  */
# if defined(__LONG_DOUBLE_128__) && FFI_TYPE_LONGDOUBLE != 4
#  error FFI_TYPE_LONGDOUBLE out of date
# endif
const ffi_type ffi_type_longdouble = { 16, 16, 4, NULL };
#elif FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
FFI_TYPEDEF(longdouble, long double, FFI_TYPE_LONGDOUBLE, FFI_LDBL_CONST);
#endif

#ifdef FFI_TARGET_HAS_COMPLEX_TYPE
FFI_COMPLEX_TYPEDEF(float, float, const);
FFI_COMPLEX_TYPEDEF(double, double, const);
#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
FFI_COMPLEX_TYPEDEF(longdouble, long double, FFI_LDBL_CONST);
#endif
#endif
