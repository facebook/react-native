/* -----------------------------------------------------------------------
   arcompact.S - Copyright (c) 2013 Synposys, Inc. (www.synopsys.com)
   
   ARCompact Foreign Function Interface 

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

#define LIBFFI_ASM
#include <fficonfig.h>
#include <ffi.h>
#ifdef HAVE_MACHINE_ASM_H
#include <machine/asm.h>
#else
#define CNAME(x) x
#define ENTRY(x) .globl CNAME(x)` .type CNAME(x),%function` CNAME(x):
#endif

#if __SIZEOF_POINTER__ == 8
#define PTRS 8
#define FLTS 8
#define LARG ldl
#define SARG stl
#define ADDPTR addl
#define MOVPTR movl_s
#else
#define PTRS 4
#define FLTS 4
#define LARG ld
#define SARG st
#define ADDPTR add
#define MOVPTR mov_s
#endif

#define FRAME_LEN (8 * PTRS + 16)

.text

ENTRY(ffi_call_asm)
        .cfi_startproc

        /* Save registers.  */
        .cfi_def_cfa r1, FRAME_LEN
        SARG    fp, [r1, FRAME_LEN - 2*PTRS]
        .cfi_offset fp, -2*PTRS
        SARG    blink, [r1, FRAME_LEN - 1*PTRS]
        .cfi_offset blink, -1*PTRS
        ADDPTR  fp, r1, FRAME_LEN
        MOVPTR  sp, r0
        .cfi_def_cfa fp, 0

        /* Load arguments.  */
        MOVPTR  r11, r2      /* fn */
        MOVPTR  r12, r3      /* closure */

        /* Save arguments.  */
        LARG    r0, [fp, -FRAME_LEN+0*PTRS]
        LARG    r1, [fp, -FRAME_LEN+1*PTRS]
        LARG    r2, [fp, -FRAME_LEN+2*PTRS]
        LARG    r3, [fp, -FRAME_LEN+3*PTRS]
        LARG    r4, [fp, -FRAME_LEN+4*PTRS]
        LARG    r5, [fp, -FRAME_LEN+5*PTRS]
        LARG    r6, [fp, -FRAME_LEN+6*PTRS]
        LARG    r7, [fp, -FRAME_LEN+7*PTRS]

        /* Call the function.  */
        jl         [r11] 

        /* Save return value (r0/r1)  */
        SARG    r0, [fp, -FRAME_LEN+0*PTRS]
        SARG    r1, [fp, -FRAME_LEN+1*PTRS]

        /* Restore and return.  */
        add     sp, fp, -FRAME_LEN
        .cfi_def_cfa sp, FRAME_LEN
        LARG    blink, [fp, -1*PTRS]
        .cfi_restore blink
        LARG    fp, [fp, -2*PTRS]
        .cfi_restore fp
        j_s     [blink]
        .cfi_endproc
        .size   ffi_call_asm, .-ffi_call_asm

/*
  ffi_closure_asm. Expects address of the passed-in ffi_closure in r8.
  void ffi_closure_inner (ffi_cif *cif,
		          void (*fun) (ffi_cif *, void *, void **, void *),
		          void *user_data,
		          size_t *stackargs, struct call_context *regargs)
*/

ENTRY(ffi_closure_asm)
        .cfi_startproc

        ADDPTR  sp, sp, -FRAME_LEN
        .cfi_def_cfa_offset FRAME_LEN

        /* Make a frame.  */
        SARG    fp, [sp, FRAME_LEN-2*PTRS]
        .cfi_offset fp, -2*PTRS
        SARG    blink, [sp, FRAME_LEN-1*PTRS]
        .cfi_offset blink, -1*PTRS
        ADDPTR  fp, sp, FRAME_LEN

        /* Save arguments.  */
        SARG    r0, [sp, 0*PTRS]
        SARG    r1, [sp, 1*PTRS]
        SARG    r2, [sp, 2*PTRS]
        SARG    r3, [sp, 3*PTRS]
        SARG    r4, [sp, 4*PTRS]
        SARG    r5, [sp, 5*PTRS]
        SARG    r6, [sp, 6*PTRS]
        SARG    r7, [sp, 7*PTRS]

        /* Enter C.  */
        LARG    r0, [r8, FFI_TRAMPOLINE_SIZE+0*PTRS]
        LARG    r1, [r8, FFI_TRAMPOLINE_SIZE+1*PTRS]
        LARG    r2, [r8, FFI_TRAMPOLINE_SIZE+2*PTRS]
        ADDPTR  r3, sp, FRAME_LEN
        MOVPTR  r4, sp

        /* Call the C code.  */
        bl      ffi_closure_inner
        
        /* Return values.  */
        LARG    r0, [sp, 0*PTRS]
        LARG    r1, [sp, 1*PTRS]

        /* Restore and return.  */
        LARG    blink, [sp, FRAME_LEN-1*PTRS]
        .cfi_restore blink
        LARG    fp, [sp, FRAME_LEN-2*PTRS]
        .cfi_restore fp
        ADDPTR  sp, sp, FRAME_LEN
        .cfi_def_cfa_offset 0
        j_s     [blink]
        .cfi_endproc
        .size ffi_closure_asm, .-ffi_closure_asm

/*
  ffi_go_closure_asm.  Expects address of the passed-in ffi_go_closure in r12.
  void ffi_closure_inner (ffi_cif *cif,
		          void (*fun) (ffi_cif *, void *, void **, void *),
		          void *user_data,
		          size_t *stackargs, struct call_context *regargs)
*/

ENTRY(ffi_go_closure_asm)
        .cfi_startproc

        ADDPTR  sp, sp, -FRAME_LEN
        .cfi_def_cfa_offset FRAME_LEN

        /* make a frame */
        SARG    fp, [sp, FRAME_LEN-2*PTRS]
        .cfi_offset fp, -2*PTRS
        SARG    blink, [sp, FRAME_LEN-1*PTRS]
        .cfi_offset blink, -1*PTRS
        ADDPTR  fp, sp, FRAME_LEN

        /* save arguments */
        SARG    r0, [sp, 0*PTRS]
        SARG    r1, [sp, 1*PTRS]
        SARG    r2, [sp, 2*PTRS]
        SARG    r3, [sp, 3*PTRS]
        SARG    r4, [sp, 4*PTRS]
        SARG    r5, [sp, 5*PTRS]
        SARG    r6, [sp, 6*PTRS]
        SARG    r7, [sp, 7*PTRS]

        /* enter C */
        LARG    r0, [r12, 1*PTRS]
        LARG    r1, [r12, 2*PTRS]
        MOVPTR  r2, r12
        ADDPTR  r3, sp, FRAME_LEN
        MOVPTR  r4, sp

        bl      ffi_closure_inner

        /* Return values. */
        LARG    r0, [sp, 0*PTRS]
        LARG    r1, [sp, 1*PTRS]


        LARG    blink, [sp, FRAME_LEN-1*PTRS]
        .cfi_restore blink
        LARG    fp, [sp, FRAME_LEN-2*PTRS]
        .cfi_restore fp
        ADDPTR  sp, sp, FRAME_LEN
        .cfi_def_cfa_offset 0
        j_s     [blink]
        .cfi_endproc
        .size ffi_go_closure_asm, .-ffi_go_closure_asm
