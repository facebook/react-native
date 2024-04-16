/* -----------------------------------------------------------------------
   sysv.S

   CSKY Foreign Function Interface

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

#define LIBFFI_ASM
#include <fficonfig.h>
#include <ffi.h>

.macro CSKY_FUNC_START name
 .text
 .align 2
 .globl \name
 .type \name, @function
 \name:
.endm

#ifdef __CSKYABIV2__

 /*
  * a0:   fn
  * a1:   &ecif
  * a2:   cif->bytes
  * a3:   fig->flags
  * sp+0: ecif.rvalue
  */
CSKY_FUNC_START ffi_call_SYSV
 /* Save registers */
 .cfi_startproc
 subi sp, 28
 .cfi_def_cfa_offset 28
 stw a0, (sp, 0x0)
 .cfi_offset 0, -28
 stw a1, (sp, 0x4)
 .cfi_offset 1, -24
 stw a2, (sp, 0x8)
 .cfi_offset 2, -20
 stw a3, (sp, 0xC)
 .cfi_offset 3, -16
 stw l0, (sp, 0x10)
 .cfi_offset 4, -12
 stw l1, (sp, 0x14)
 .cfi_offset 5, -8
 stw lr, (sp, 0x18)
 .cfi_offset 15, -4

 mov l0, sp
 .cfi_def_cfa_register 4

 /* Make room for all of the new args. */
 subu sp, sp, a2

 /* Place all of the ffi_prep_args in position */
 mov a0, sp
 /*     a1 already set */

 /* Call ffi_prep_args(stack, &ecif) */
 jsri ffi_prep_args

 /* move first 4 parameters in registers */
 ldw a0, (sp, 0x0)
 ldw a1, (sp, 0x4)
 ldw a2, (sp, 0x8)
 ldw a3, (sp, 0xC)

 /* and adjust stack */
 subu lr, l0, sp /* cif->bytes == l0 - sp */
 cmphsi lr, 16
 movi l1, 16
 movt lr, l1
 addu sp, sp, lr

 ldw l1, (l0, 0) /* load fn() in advance */

 /* call (fn) (...) */
 jsr l1

 /* Remove the space we pushed for the args */
 mov sp, l0

 /* Load r2 with the pointer to storage for the return value */
 ldw a2, (sp, 0x1C)

 /* Load r3 with the return type code */
 ldw a3, (sp, 0xC)

 /* If the return value pointer is NULL, assume no return value. */
 cmpnei a2, 0
 bf .Lepilogue

 cmpnei a3, FFI_TYPE_STRUCT
 bf .Lepilogue

 /* return INT64 */
 cmpnei a3, FFI_TYPE_SINT64
 bt .Lretint
 /* stw a0, (a2, 0x0) at .Lretint */
 stw a1, (a2, 0x4)

.Lretint:
 /* return INT */
 stw a0, (a2, 0x0)

.Lepilogue:
 ldw a0, (sp, 0x0)
 ldw a1, (sp, 0x4)
 ldw a2, (sp, 0x8)
 ldw a3, (sp, 0xC)
 ldw l0, (sp, 0x10)
 ldw l1, (sp, 0x14)
 ldw lr, (sp, 0x18)
 addi sp, sp, 28
 rts
 .cfi_endproc
        .size    ffi_call_SYSV, .-ffi_call_SYSV


 /*
  * unsigned int FFI_HIDDEN
  * ffi_closure_SYSV_inner (closure, respp, args)
  *      ffi_closure *closure;
  *      void **respp;
  *      void *args;
  */
CSKY_FUNC_START ffi_closure_SYSV
 .cfi_startproc
 mov a2, sp
 addi a1, sp, 16
 subi sp, sp, 24
 .cfi_def_cfa_offset 40
 stw a1, (sp, 0x10)
 .cfi_offset 1, -24
 stw lr, (sp, 0x14)
 .cfi_offset 15, -20
 stw sp, (sp, 0x8)
 addi a1, sp, 8
 jsri ffi_closure_SYSV_inner
 ldw a0, (sp, 0x0)
 /*
  * if FFI_TYPE_SINT64, need a1.
  * if FFI_TYPE_INT, ignore a1.
  */
 ldw a1, (sp, 0x4)

 ldw lr, (sp, 0x14)
 addi sp, sp, 40
 rts
 .cfi_endproc
        .size    ffi_closure_SYSV, .-ffi_closure_SYSV

CSKY_FUNC_START ffi_csky_trampoline
 subi sp, sp, 16
 stw a0, (sp, 0x0)
 stw a1, (sp, 0x4)
 stw a2, (sp, 0x8)
 stw a3, (sp, 0xC)
 lrw a0, [.Lctx]
 lrw a1, [.Lfun]
 jmp a1
.Lctx:
 mov a0, a0
 mov a0, a0
.Lfun:

        .size    ffi_csky_trampoline, .-ffi_csky_trampoline

CSKY_FUNC_START ffi_csky_cacheflush
 mov t0, r7
 movi r7, 123
 trap 0
 mov r7, t0
 rts

        .size    ffi_csky_cacheflush, .-ffi_csky_cacheflush

#else /* !__CSKYABIV2__ */

 /*
  * a0:   fn
  * a1:   &ecif
  * a2:   cif->bytes
  * a3:   fig->flags
  * a4:   ecif.rvalue
  */
CSKY_FUNC_START ffi_call_SYSV
 /* Save registers */
 .cfi_startproc
 subi sp, 32
 subi sp, 8
 .cfi_def_cfa_offset 40
 stw a0, (sp, 0x0)
 .cfi_offset 2, -40
 stw a1, (sp, 0x4)
 .cfi_offset 3, -36
 stw a2, (sp, 0x8)
 .cfi_offset 4, -32
 stw a3, (sp, 0xC)
 .cfi_offset 5, -28
 stw a4, (sp, 0x10)
 .cfi_offset 6, -24
 stw a5, (sp, 0x14)
 .cfi_offset 7, -20
 stw l0, (sp, 0x18)
 .cfi_offset 8, -16
 stw l1, (sp, 0x1C)
 .cfi_offset 9, -12
 stw lr, (sp, 0x20)
 .cfi_offset 15, -8

 mov l0, sp
 .cfi_def_cfa_register 8

 /* Make room for all of the new args. */
 subu sp, sp, a2

 /* Place all of the ffi_prep_args in position */
 mov a0, sp
 /*     a1 already set */

 /* Call ffi_prep_args(stack, &ecif) */
 jsri ffi_prep_args

 /* move first 4 parameters in registers */
 ldw a0, (sp, 0x0)
 ldw a1, (sp, 0x4)
 ldw a2, (sp, 0x8)
 ldw a3, (sp, 0xC)
 ldw a4, (sp, 0x10)
 ldw a5, (sp, 0x14)

 /* and adjust stack */
 mov lr, l0
 subu lr, sp  /* cif->bytes == l0 - sp */
 movi l1, 24
 cmphs lr, l1
 movt lr, l1
 addu sp, sp, lr

 ldw l1, (l0, 0) /* load fn() in advance */

 /* call (fn) (...) */
 jsr l1

 /* Remove the space we pushed for the args */
 mov sp, l0

 /* Load r2 with the pointer to storage for the return value */
 ldw a2, (sp, 0x10)

 /* Load r3 with the return type code */
 ldw a3, (sp, 0xC)

 /* If the return value pointer is NULL, assume no return value. */
 cmpnei a2, 0
 bf .Lepilogue

 cmpnei a3, FFI_TYPE_STRUCT
 bf .Lepilogue

 /* return INT64 */
 cmpnei a3, FFI_TYPE_SINT64
 bt .Lretint
 /* stw a0, (a2, 0x0) at .Lretint */
 stw a1, (a2, 0x4)

.Lretint:
 /* return INT */
 stw a0, (a2, 0x0)

.Lepilogue:
 ldw a0, (sp, 0x0)
 ldw a1, (sp, 0x4)
 ldw a2, (sp, 0x8)
 ldw a3, (sp, 0xC)
 ldw a4, (sp, 0x10)
 ldw a5, (sp, 0x14)
 ldw l0, (sp, 0x18)
 ldw l1, (sp, 0x1C)
 ldw lr, (sp, 0x20)
 addi sp, sp, 32
 addi sp, sp, 8
 rts
 .cfi_endproc

        .size    ffi_call_SYSV, .-ffi_call_SYSV


 /*
  * unsigned int FFI_HIDDEN
  * ffi_closure_SYSV_inner (closure, respp, args)
  *      ffi_closure *closure;
  *      void **respp;
  *      void *args;
  */
CSKY_FUNC_START ffi_closure_SYSV
 .cfi_startproc
 mov a2, sp
 mov a1, sp
 addi a1, 24
 subi sp, sp, 24
 .cfi_def_cfa_offset 48
 stw a1, (sp, 0x10)
 .cfi_offset 3, -32
 stw lr, (sp, 0x14)
 .cfi_offset 15, -28
 stw sp, (sp, 0x8)
 mov a1, sp
 addi a1, 8
 jsri ffi_closure_SYSV_inner
 ldw a0, (sp, 0x0)
 /*
  * if FFI_TYPE_SINT64, need a1.
  * if FFI_TYPE_INT, ignore a1.
  */
 ldw a1, (sp, 0x4)

 ldw lr, (sp, 0x14)
 addi sp, sp, 24
 addi sp, sp, 24
 rts
 .cfi_endproc

        .size    ffi_closure_SYSV, .-ffi_closure_SYSV

CSKY_FUNC_START ffi_csky_trampoline
 subi sp, 24
 stw a0, (sp, 0x0)
 stw a1, (sp, 0x4)
 stw a2, (sp, 0x8)
 stw a3, (sp, 0xC)
 stw a4, (sp, 0x10)
 stw a5, (sp, 0x14)
 lrw a0, [.Lctx]
 lrw a1, [.Lfun]
 jmp a1
.Lctx:
 mov a0, a0
 mov a0, a0
.Lfun:

        .size    ffi_csky_trampoline, .-ffi_csky_trampoline

CSKY_FUNC_START ffi_csky_cacheflush
 lrw r1, 123
 trap 0
 rts

        .size    ffi_csky_cacheflush, .-ffi_csky_cacheflush

#endif /* __CSKYABIV2__ */
