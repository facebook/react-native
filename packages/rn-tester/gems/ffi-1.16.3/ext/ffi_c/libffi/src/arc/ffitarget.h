/* -----------------------------------------------------------------------
   ffitarget.h - Copyright (c) 2012  Anthony Green
                 Copyright (c) 2013  Synopsys, Inc. (www.synopsys.com)
   Target configuration macros for ARC.

   Permission is hereby granted, free of charge, to any person obtaining
   a copy of this software and associated documentation files (the
   ``Software''), to deal in the Software without restriction, including
   without limitation the rights to use, copy, modify, merge, publish,
   distribute, sublicense, and/or sell copies of the Software, and to
   permit persons to whom the Software is furnished to do so, subject to
   the following conditions:

   The above copyright notice and this permission notice shall be included
   in all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED ``AS IS'', WITHOUT WARRANTY OF ANY KIND, EXPRESS
   OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
   IN NO EVENT SHALL RENESAS TECHNOLOGY BE LIABLE FOR ANY CLAIM, DAMAGES OR
   OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
   ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
   OTHER DEALINGS IN THE SOFTWARE.

   ----------------------------------------------------------------------- */

#ifndef LIBFFI_TARGET_H
#define LIBFFI_TARGET_H

#ifndef LIBFFI_H
#error "Please do not include ffitarget.h directly into your source.  Use ffi.h instead."
#endif

/* ---- Generic type definitions ----------------------------------------- */

#ifndef LIBFFI_ASM
typedef unsigned long ffi_arg;
typedef signed long ffi_sarg;

typedef enum ffi_abi
{
  FFI_FIRST_ABI = 0,
#if __SIZEOF_POINTER__ == 8
  FFI_ARC64,
#else
  FFI_ARCOMPACT,
#endif
  FFI_LAST_ABI,
#if __SIZEOF_POINTER__ == 8
  FFI_DEFAULT_ABI = FFI_ARC64
#else
  FFI_DEFAULT_ABI = FFI_ARCOMPACT
#endif
} ffi_abi;
#endif

#define FFI_CLOSURES 		1
#define FFI_GO_CLOSURES 1
#if __SIZEOF_POINTER__ == 8
#define FFI_TRAMPOLINE_SIZE	24
#else
#define FFI_TRAMPOLINE_SIZE	12
#endif

#define FFI_NATIVE_RAW_API 	0

#endif
