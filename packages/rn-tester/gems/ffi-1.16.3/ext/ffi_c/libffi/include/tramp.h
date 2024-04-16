/* -----------------------------------------------------------------------
   ffi_tramp.h - Copyright (C) 2021  Microsoft, Inc.

   Static trampoline definitions.

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

#ifndef FFI_TRAMP_H
#define FFI_TRAMP_H

#ifdef __cplusplus
extern "C" {
#endif

int ffi_tramp_is_supported(void);
void *ffi_tramp_alloc (int flags);
void ffi_tramp_set_parms (void *tramp, void *data, void *code);
void *ffi_tramp_get_addr (void *tramp);
void ffi_tramp_free (void *tramp);

#ifdef __cplusplus
}
#endif

#endif /* FFI_TRAMP_H */
