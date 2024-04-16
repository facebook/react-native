/* -----------------------------------------------------------------------
   sysv.S - Copyright (c) 2009  Bradley Smith <brad@brad-smith.co.uk>

   AVR32 Foreign Function Interface

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
   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
   IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
   CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
   TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
   SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
   --------------------------------------------------------------------- */

#define LIBFFI_ASM
#include <fficonfig.h>
#include <ffi.h>

    /* r12:  ffi_prep_args
     * r11:  &ecif
     * r10:  size
     * r9:   cif->flags
     * r8:   ecif.rvalue
     * sp+0: cif->rstruct_flag
     * sp+4: fn */

    .text
    .align  1
    .globl  ffi_call_SYSV
    .type   ffi_call_SYSV, @function
ffi_call_SYSV:
    stm     --sp, r0,r1,lr
    stm     --sp, r8-r12
    mov     r0, sp

    /* Make room for all of the new args. */
    sub     sp, r10
    /* Pad to make way for potential skipped registers */
    sub     sp, 20

    /* Call ffi_prep_args(stack, &ecif). */
    /* r11 already set */
    mov     r1, r12
    mov     r12, sp
    icall   r1

    /* Save new argument size */
    mov     r1, r12

    /* Move first 5 parameters in registers. */
    ldm     sp++, r8-r12

    /* call (fn) (...). */
    ld.w    r1, r0[36]
    icall   r1

    /* Remove the space we pushed for the args. */
    mov     sp, r0

    /* Load r1 with the rstruct flag. */
    ld.w    r1, sp[32]

    /* Load r9 with the return type code. */
    ld.w    r9, sp[12]

    /* Load r8 with the return value pointer. */
    ld.w    r8, sp[16]

    /* If the return value pointer is NULL, assume no return value. */
    cp.w    r8, 0
    breq    .Lend

    /* Check if return type is actually a struct */
    cp.w    r1, 0
    breq    1f

    /* Return 8bit */
    cp.w    r9, FFI_TYPE_UINT8
    breq    .Lstore8

    /* Return 16bit */
    cp.w    r9, FFI_TYPE_UINT16
    breq    .Lstore16

1:
    /* Return 32bit */
    cp.w    r9, FFI_TYPE_UINT32
    breq    .Lstore32
    cp.w    r9, FFI_TYPE_UINT16
    breq    .Lstore32
    cp.w    r9, FFI_TYPE_UINT8
    breq    .Lstore32

    /* Return 64bit */
    cp.w    r9, FFI_TYPE_UINT64
    breq    .Lstore64

    /* Didn't match anything */
    bral    .Lend

.Lstore64:
    st.w    r8[0], r11
    st.w    r8[4], r10
    bral    .Lend

.Lstore32:
    st.w    r8[0], r12
    bral    .Lend

.Lstore16:
    st.h    r8[0], r12
    bral    .Lend

.Lstore8:
    st.b    r8[0], r12
    bral    .Lend

.Lend:
    sub     sp, -20
    ldm     sp++, r0,r1,pc

    .size   ffi_call_SYSV, . - ffi_call_SYSV


    /* r12:  __ctx
     * r11:  __rstruct_flag
     * r10:  __inner */

    .align  1
    .globl  ffi_closure_SYSV
    .type   ffi_closure_SYSV, @function
ffi_closure_SYSV:
    stm     --sp, r0,lr
    mov     r0, r11
    mov     r8, r10
    sub     r10, sp, -8
    sub     sp, 12
    st.w    sp[8], sp
    sub     r11, sp, -8
    icall   r8

    /* Check if return type is actually a struct */
    cp.w    r0, 0
    breq    1f

    /* Return 8bit */
    cp.w    r12, FFI_TYPE_UINT8
    breq    .Lget8

    /* Return 16bit */
    cp.w    r12, FFI_TYPE_UINT16
    breq    .Lget16

1:
    /* Return 32bit */
    cp.w    r12, FFI_TYPE_UINT32
    breq    .Lget32
    cp.w    r12, FFI_TYPE_UINT16
    breq    .Lget32
    cp.w    r12, FFI_TYPE_UINT8
    breq    .Lget32

    /* Return 64bit */
    cp.w    r12, FFI_TYPE_UINT64
    breq    .Lget64

    /* Didn't match anything */
    bral    .Lclend

.Lget64:
    ld.w    r11, sp[0]
    ld.w    r10, sp[4]
    bral    .Lclend

.Lget32:
    ld.w    r12, sp[0]
    bral    .Lclend

.Lget16:
    ld.uh   r12, sp[0]
    bral    .Lclend

.Lget8:
    ld.ub   r12, sp[0]
    bral    .Lclend

.Lclend:
    sub     sp, -12
    ldm     sp++, r0,lr
    sub     sp, -20
    mov     pc, lr

    .size   ffi_closure_SYSV, . - ffi_closure_SYSV

#if defined __ELF__ && defined __linux__
    .section    .note.GNU-stack,"",@progbits
#endif
