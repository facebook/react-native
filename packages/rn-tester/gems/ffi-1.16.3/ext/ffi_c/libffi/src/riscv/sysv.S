/* -----------------------------------------------------------------------
   ffi.c - Copyright (c) 2015 Michael Knyszek <mknyszek@berkeley.edu>
                         2015 Andrew Waterman <waterman@cs.berkeley.edu>
                         2018 Stef O'Rear <sorear2@gmail.com>

   RISC-V Foreign Function Interface

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

/* Define aliases so that we can handle all ABIs uniformly */

#if __SIZEOF_POINTER__ == 8
#define PTRS 8
#define LARG ld
#define SARG sd
#else
#define PTRS 4
#define LARG lw
#define SARG sw
#endif

#if __riscv_float_abi_double
#define FLTS 8
#define FLARG fld
#define FSARG fsd
#elif __riscv_float_abi_single
#define FLTS 4
#define FLARG flw
#define FSARG fsw
#else
#define FLTS 0
#endif

#define fp s0

    .text
    .globl  ffi_call_asm
    .type   ffi_call_asm, @function
    .hidden ffi_call_asm
/*
  struct call_context {
      floatreg fa[8];
      intreg a[8];
      intreg pad[rv32 ? 2 : 0];
      intreg save_fp, save_ra;
  }
  void ffi_call_asm (size_t *stackargs, struct call_context *regargs,
                     void (*fn) (void), void *closure);
*/

#define FRAME_LEN (8 * FLTS + 8 * PTRS + 16)

ffi_call_asm:
    .cfi_startproc

    /*
      We are NOT going to set up an ordinary stack frame.  In order to pass
      the stacked args to the called function, we adjust our stack pointer to
      a0, which is in the _caller's_ alloca area.  We establish our own stack
      frame at the end of the call_context.

      Anything below the arguments will be freed at this point, although we
      preserve the call_context so that it can be read back in the caller.
    */

    .cfi_def_cfa 11, FRAME_LEN # interim CFA based on a1
    SARG    fp, FRAME_LEN - 2*PTRS(a1)
    .cfi_offset 8, -2*PTRS
    SARG    ra, FRAME_LEN - 1*PTRS(a1)
    .cfi_offset 1, -1*PTRS

    addi    fp, a1, FRAME_LEN
    mv      sp, a0
    .cfi_def_cfa 8, 0 # our frame is fully set up

    # Load arguments
    mv      t1, a2
    mv      t2, a3

#if FLTS
    FLARG   fa0, -FRAME_LEN+0*FLTS(fp)
    FLARG   fa1, -FRAME_LEN+1*FLTS(fp)
    FLARG   fa2, -FRAME_LEN+2*FLTS(fp)
    FLARG   fa3, -FRAME_LEN+3*FLTS(fp)
    FLARG   fa4, -FRAME_LEN+4*FLTS(fp)
    FLARG   fa5, -FRAME_LEN+5*FLTS(fp)
    FLARG   fa6, -FRAME_LEN+6*FLTS(fp)
    FLARG   fa7, -FRAME_LEN+7*FLTS(fp)
#endif

    LARG    a0, -FRAME_LEN+8*FLTS+0*PTRS(fp)
    LARG    a1, -FRAME_LEN+8*FLTS+1*PTRS(fp)
    LARG    a2, -FRAME_LEN+8*FLTS+2*PTRS(fp)
    LARG    a3, -FRAME_LEN+8*FLTS+3*PTRS(fp)
    LARG    a4, -FRAME_LEN+8*FLTS+4*PTRS(fp)
    LARG    a5, -FRAME_LEN+8*FLTS+5*PTRS(fp)
    LARG    a6, -FRAME_LEN+8*FLTS+6*PTRS(fp)
    LARG    a7, -FRAME_LEN+8*FLTS+7*PTRS(fp)

    /* Call */
    jalr    t1

    /* Save return values - only a0/a1 (fa0/fa1) are used */
#if FLTS
    FSARG   fa0, -FRAME_LEN+0*FLTS(fp)
    FSARG   fa1, -FRAME_LEN+1*FLTS(fp)
#endif

    SARG    a0, -FRAME_LEN+8*FLTS+0*PTRS(fp)
    SARG    a1, -FRAME_LEN+8*FLTS+1*PTRS(fp)

    /* Restore and return */
    addi    sp, fp, -FRAME_LEN
    .cfi_def_cfa 2, FRAME_LEN
    LARG    ra, -1*PTRS(fp)
    .cfi_restore 1
    LARG    fp, -2*PTRS(fp)
    .cfi_restore 8
    ret
    .cfi_endproc
    .size   ffi_call_asm, .-ffi_call_asm


/*
  ffi_closure_asm. Expects address of the passed-in ffi_closure in t1.
  void ffi_closure_inner (ffi_cif *cif,
		          void (*fun) (ffi_cif *, void *, void **, void *),
		          void *user_data,
		          size_t *stackargs, struct call_context *regargs)
*/

    .globl ffi_closure_asm
    .hidden ffi_closure_asm
    .type ffi_closure_asm, @function
ffi_closure_asm:
    .cfi_startproc

    addi    sp,  sp, -FRAME_LEN
    .cfi_def_cfa_offset FRAME_LEN

    /* make a frame */
    SARG    fp, FRAME_LEN - 2*PTRS(sp)
    .cfi_offset 8, -2*PTRS
    SARG    ra, FRAME_LEN - 1*PTRS(sp)
    .cfi_offset 1, -1*PTRS
    addi    fp, sp, FRAME_LEN

    /* save arguments */
#if FLTS
    FSARG   fa0, 0*FLTS(sp)
    FSARG   fa1, 1*FLTS(sp)
    FSARG   fa2, 2*FLTS(sp)
    FSARG   fa3, 3*FLTS(sp)
    FSARG   fa4, 4*FLTS(sp)
    FSARG   fa5, 5*FLTS(sp)
    FSARG   fa6, 6*FLTS(sp)
    FSARG   fa7, 7*FLTS(sp)
#endif

    SARG    a0, 8*FLTS+0*PTRS(sp)
    SARG    a1, 8*FLTS+1*PTRS(sp)
    SARG    a2, 8*FLTS+2*PTRS(sp)
    SARG    a3, 8*FLTS+3*PTRS(sp)
    SARG    a4, 8*FLTS+4*PTRS(sp)
    SARG    a5, 8*FLTS+5*PTRS(sp)
    SARG    a6, 8*FLTS+6*PTRS(sp)
    SARG    a7, 8*FLTS+7*PTRS(sp)

    /* enter C */
    LARG    a0, FFI_TRAMPOLINE_SIZE+0*PTRS(t1)
    LARG    a1, FFI_TRAMPOLINE_SIZE+1*PTRS(t1)
    LARG    a2, FFI_TRAMPOLINE_SIZE+2*PTRS(t1)
    addi    a3, sp, FRAME_LEN
    mv      a4, sp

    call    ffi_closure_inner

    /* return values */
#if FLTS
    FLARG   fa0, 0*FLTS(sp)
    FLARG   fa1, 1*FLTS(sp)
#endif

    LARG    a0, 8*FLTS+0*PTRS(sp)
    LARG    a1, 8*FLTS+1*PTRS(sp)

    /* restore and return */
    LARG    ra, FRAME_LEN-1*PTRS(sp)
    .cfi_restore 1
    LARG    fp, FRAME_LEN-2*PTRS(sp)
    .cfi_restore 8
    addi    sp, sp, FRAME_LEN
    .cfi_def_cfa_offset 0
    ret
    .cfi_endproc
    .size ffi_closure_asm, .-ffi_closure_asm

/*
  ffi_go_closure_asm.  Expects address of the passed-in ffi_go_closure in t2.
  void ffi_closure_inner (ffi_cif *cif,
		          void (*fun) (ffi_cif *, void *, void **, void *),
		          void *user_data,
		          size_t *stackargs, struct call_context *regargs)
*/

    .globl ffi_go_closure_asm
    .hidden ffi_go_closure_asm
    .type ffi_go_closure_asm, @function
ffi_go_closure_asm:
    .cfi_startproc

    addi    sp,  sp, -FRAME_LEN
    .cfi_def_cfa_offset FRAME_LEN

    /* make a frame */
    SARG    fp, FRAME_LEN - 2*PTRS(sp)
    .cfi_offset 8, -2*PTRS
    SARG    ra, FRAME_LEN - 1*PTRS(sp)
    .cfi_offset 1, -1*PTRS
    addi    fp, sp, FRAME_LEN

    /* save arguments */
#if FLTS
    FSARG   fa0, 0*FLTS(sp)
    FSARG   fa1, 1*FLTS(sp)
    FSARG   fa2, 2*FLTS(sp)
    FSARG   fa3, 3*FLTS(sp)
    FSARG   fa4, 4*FLTS(sp)
    FSARG   fa5, 5*FLTS(sp)
    FSARG   fa6, 6*FLTS(sp)
    FSARG   fa7, 7*FLTS(sp)
#endif

    SARG    a0, 8*FLTS+0*PTRS(sp)
    SARG    a1, 8*FLTS+1*PTRS(sp)
    SARG    a2, 8*FLTS+2*PTRS(sp)
    SARG    a3, 8*FLTS+3*PTRS(sp)
    SARG    a4, 8*FLTS+4*PTRS(sp)
    SARG    a5, 8*FLTS+5*PTRS(sp)
    SARG    a6, 8*FLTS+6*PTRS(sp)
    SARG    a7, 8*FLTS+7*PTRS(sp)

    /* enter C */
    LARG    a0, 1*PTRS(t2)
    LARG    a1, 2*PTRS(t2)
    mv      a2, t2
    addi    a3, sp, FRAME_LEN
    mv      a4, sp

    call    ffi_closure_inner

    /* return values */
#if FLTS
    FLARG   fa0, 0*FLTS(sp)
    FLARG   fa1, 1*FLTS(sp)
#endif

    LARG    a0, 8*FLTS+0*PTRS(sp)
    LARG    a1, 8*FLTS+1*PTRS(sp)

    /* restore and return */
    LARG    ra, FRAME_LEN-1*PTRS(sp)
    .cfi_restore 1
    LARG    fp, FRAME_LEN-2*PTRS(sp)
    .cfi_restore 8
    addi    sp, sp, FRAME_LEN
    .cfi_def_cfa_offset 0
    ret
    .cfi_endproc
    .size ffi_go_closure_asm, .-ffi_go_closure_asm
