/* -----------------------------------------------------------------------
   tile.S - Copyright (c) 2011 Tilera Corp.

   Tilera TILEPro and TILE-Gx Foreign Function Interface

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

/* Number of bytes in a register. */
#define REG_SIZE FFI_SIZEOF_ARG

/* Number of bytes in stack linkage area for backtracing.

   A note about the ABI: on entry to a procedure, sp points to a stack
   slot where it must spill the return address if it's not a leaf.
   REG_SIZE bytes beyond that is a slot owned by the caller which
   contains the sp value that the caller had when it was originally
   entered (i.e. the caller's frame pointer). */
#define LINKAGE_SIZE (2 * REG_SIZE)

/* The first 10 registers are used to pass arguments and return values. */
#define NUM_ARG_REGS 10

#ifdef __tilegx__
#define SW st
#define LW ld
#define BGZT bgtzt
#else
#define SW sw
#define LW lw
#define BGZT bgzt
#endif


/* void ffi_call_tile (int_reg_t reg_args[NUM_ARG_REGS],
                       const int_reg_t *stack_args,
                       unsigned long stack_args_bytes,
                       void (*fnaddr)(void));

        On entry, REG_ARGS contain the outgoing register values,
        and STACK_ARGS contains STACK_ARG_BYTES of additional values
        to be passed on the stack. If STACK_ARG_BYTES is zero, then
        STACK_ARGS is ignored.

        When the invoked function returns, the values of r0-r9 are
        blindly stored back into REG_ARGS for the caller to examine. */

        .section .text.ffi_call_tile, "ax", @progbits
        .align  8
        .globl  ffi_call_tile
        FFI_HIDDEN(ffi_call_tile)
ffi_call_tile:

/* Incoming arguments. */
#define REG_ARGS                r0
#define INCOMING_STACK_ARGS     r1
#define STACK_ARG_BYTES         r2
#define ORIG_FNADDR             r3

/* Temporary values. */
#define FRAME_SIZE              r10
#define TMP                     r11
#define TMP2                    r12
#define OUTGOING_STACK_ARGS     r13
#define REG_ADDR_PTR            r14
#define RETURN_REG_ADDR         r15
#define FNADDR                  r16

        .cfi_startproc
        {
         /* Save return address. */
         SW     sp, lr
         .cfi_offset lr, 0
         /* Prepare to spill incoming r52. */
         addi   TMP, sp, -REG_SIZE
         /* Increase frame size to have room to spill r52 and REG_ARGS.
            The +7 is to round up mod 8. */
         addi   FRAME_SIZE, STACK_ARG_BYTES, \
                REG_SIZE + REG_SIZE + LINKAGE_SIZE + 7
        }
        {
         /* Round stack frame size to a multiple of 8 to satisfy ABI. */
         andi   FRAME_SIZE, FRAME_SIZE, -8
         /* Compute where to spill REG_ARGS value. */
         addi   TMP2, sp, -(REG_SIZE * 2)
        }
        {
         /* Spill incoming r52. */
         SW     TMP, r52
         .cfi_offset r52, -REG_SIZE
         /* Set up our frame pointer. */
         move   r52, sp
         .cfi_def_cfa_register r52
         /* Push stack frame. */
         sub    sp, sp, FRAME_SIZE
        }
        {
         /* Prepare to set up stack linkage. */
         addi   TMP, sp, REG_SIZE
         /* Prepare to memcpy stack args. */
         addi   OUTGOING_STACK_ARGS, sp, LINKAGE_SIZE
         /* Save REG_ARGS which we will need after we call the subroutine. */
         SW     TMP2, REG_ARGS
        }
        {
         /* Set up linkage info to hold incoming stack pointer. */
         SW     TMP, r52
        }
        {
         /* Skip stack args memcpy if we don't have any stack args (common). */
         blezt  STACK_ARG_BYTES, .Ldone_stack_args_memcpy
        }

.Lmemcpy_stack_args:
        {
         /* Load incoming argument from stack_args. */
         LW     TMP, INCOMING_STACK_ARGS
         addi   INCOMING_STACK_ARGS, INCOMING_STACK_ARGS, REG_SIZE
        }
        {
         /* Store stack argument into outgoing stack argument area. */
         SW     OUTGOING_STACK_ARGS, TMP
         addi   OUTGOING_STACK_ARGS, OUTGOING_STACK_ARGS, REG_SIZE
         addi   STACK_ARG_BYTES, STACK_ARG_BYTES, -REG_SIZE
        }
        {
         BGZT   STACK_ARG_BYTES, .Lmemcpy_stack_args
        }
.Ldone_stack_args_memcpy:

        {
         /* Copy aside ORIG_FNADDR so we can overwrite its register. */
         move   FNADDR, ORIG_FNADDR
         /* Prepare to load argument registers. */
         addi   REG_ADDR_PTR, r0, REG_SIZE
         /* Load outgoing r0. */
         LW     r0, r0
        }

        /* Load up argument registers from the REG_ARGS array. */
#define LOAD_REG(REG, PTR) \
        { \
         LW     REG, PTR ; \
         addi   PTR, PTR, REG_SIZE \
        }

        LOAD_REG(r1, REG_ADDR_PTR)
        LOAD_REG(r2, REG_ADDR_PTR)
        LOAD_REG(r3, REG_ADDR_PTR)
        LOAD_REG(r4, REG_ADDR_PTR)
        LOAD_REG(r5, REG_ADDR_PTR)
        LOAD_REG(r6, REG_ADDR_PTR)
        LOAD_REG(r7, REG_ADDR_PTR)
        LOAD_REG(r8, REG_ADDR_PTR)
        LOAD_REG(r9, REG_ADDR_PTR)

        {
         /* Call the subroutine. */
         jalr   FNADDR
        }

        {
         /* Restore original lr. */
         LW     lr, r52
         /* Prepare to recover ARGS, which we spilled earlier. */
         addi   TMP, r52, -(2 * REG_SIZE)
        }
        {
         /* Restore ARGS, so we can fill it in with the return regs r0-r9. */
         LW     RETURN_REG_ADDR, TMP
         /* Prepare to restore original r52. */
         addi   TMP, r52, -REG_SIZE
        }

        {
         /* Pop stack frame. */
         move   sp, r52
         /* Restore original r52. */
         LW     r52, TMP
        }

#define STORE_REG(REG, PTR) \
        { \
         SW     PTR, REG ; \
         addi   PTR, PTR, REG_SIZE \
        }

        /* Return all register values by reference. */
        STORE_REG(r0, RETURN_REG_ADDR)
        STORE_REG(r1, RETURN_REG_ADDR)
        STORE_REG(r2, RETURN_REG_ADDR)
        STORE_REG(r3, RETURN_REG_ADDR)
        STORE_REG(r4, RETURN_REG_ADDR)
        STORE_REG(r5, RETURN_REG_ADDR)
        STORE_REG(r6, RETURN_REG_ADDR)
        STORE_REG(r7, RETURN_REG_ADDR)
        STORE_REG(r8, RETURN_REG_ADDR)
        STORE_REG(r9, RETURN_REG_ADDR)

        {
         jrp    lr
        }

        .cfi_endproc
        .size ffi_call_tile, .-ffi_call_tile

/* ffi_closure_tile(...)

   On entry, lr points to the closure plus 8 bytes, and r10
   contains the actual return address.

   This function simply dumps all register parameters into a stack array
   and passes the closure, the registers array, and the stack arguments
   to C code that does all of the actual closure processing. */

        .section .text.ffi_closure_tile, "ax", @progbits
        .align  8
        .globl  ffi_closure_tile
        FFI_HIDDEN(ffi_closure_tile)

        .cfi_startproc
/* Room to spill all NUM_ARG_REGS incoming registers, plus frame linkage. */
#define CLOSURE_FRAME_SIZE (((NUM_ARG_REGS * REG_SIZE * 2 + LINKAGE_SIZE) + 7) & -8)
ffi_closure_tile:
        {
#ifdef __tilegx__
         st     sp, lr
         .cfi_offset lr, 0
#else
         /* Save return address (in r10 due to closure stub wrapper). */
         SW     sp, r10
         .cfi_return_column r10
         .cfi_offset r10, 0
#endif
         /* Compute address for stack frame linkage. */
         addli   r10, sp, -(CLOSURE_FRAME_SIZE - REG_SIZE)
        }
        {
         /* Save incoming stack pointer in linkage area. */
         SW     r10, sp
         .cfi_offset sp, -(CLOSURE_FRAME_SIZE - REG_SIZE)
         /* Push a new stack frame. */
         addli   sp, sp, -CLOSURE_FRAME_SIZE
         .cfi_adjust_cfa_offset CLOSURE_FRAME_SIZE
        }

        {
         /* Create pointer to where to start spilling registers. */
         addi   r10, sp, LINKAGE_SIZE
        }

        /* Spill all the incoming registers. */
        STORE_REG(r0, r10)
        STORE_REG(r1, r10)
        STORE_REG(r2, r10)
        STORE_REG(r3, r10)
        STORE_REG(r4, r10)
        STORE_REG(r5, r10)
        STORE_REG(r6, r10)
        STORE_REG(r7, r10)
        STORE_REG(r8, r10)
        {
         /* Save r9. */
         SW     r10, r9
#ifdef __tilegx__
         /* Pointer to closure is passed in r11. */
         move  r0, r11
#else
         /* Compute pointer to the closure object. Because the closure
            starts with a "jal ffi_closure_tile", we can just take the
            value of lr (a phony return address pointing into the closure)
            and subtract 8. */
         addi   r0, lr, -8
#endif
         /* Compute a pointer to the register arguments we just spilled. */
         addi   r1, sp, LINKAGE_SIZE
        }
        {
         /* Compute a pointer to the extra stack arguments (if any). */
         addli   r2, sp, CLOSURE_FRAME_SIZE + LINKAGE_SIZE
         /* Call C code to deal with all of the grotty details. */
         jal    ffi_closure_tile_inner
        }
        {
         addli   r10, sp, CLOSURE_FRAME_SIZE
        }
        {
         /* Restore the return address. */
         LW     lr, r10
         /* Compute pointer to registers array. */
         addli   r10, sp, LINKAGE_SIZE + (NUM_ARG_REGS * REG_SIZE)
        }
        /* Return all the register values, which C code may have set. */
        LOAD_REG(r0, r10)
        LOAD_REG(r1, r10)
        LOAD_REG(r2, r10)
        LOAD_REG(r3, r10)
        LOAD_REG(r4, r10)
        LOAD_REG(r5, r10)
        LOAD_REG(r6, r10)
        LOAD_REG(r7, r10)
        LOAD_REG(r8, r10)
        LOAD_REG(r9, r10)
        {
         /* Pop the frame. */
         addli   sp, sp, CLOSURE_FRAME_SIZE
         jrp    lr
        }

        .cfi_endproc
        .size   ffi_closure_tile, . - ffi_closure_tile


/* What follows are code template instructions that get copied to the
   closure trampoline by ffi_prep_closure_loc.  The zeroed operands
   get replaced by their proper values at runtime. */

        .section .text.ffi_template_tramp_tile, "ax", @progbits
        .align  8
        .globl  ffi_template_tramp_tile
        FFI_HIDDEN(ffi_template_tramp_tile)
ffi_template_tramp_tile:
#ifdef __tilegx__
        {
          moveli r11, 0 /* backpatched to address of containing closure. */
          moveli r10, 0 /* backpatched to ffi_closure_tile. */
        }
        /* Note: the following bundle gets generated multiple times
           depending on the pointer value (esp. useful for -m32 mode). */
        { shl16insli r11, r11, 0 ; shl16insli r10, r10, 0 }
        { info 2+8 /* for backtracer: -> pc in lr, frame size 0 */ ; jr r10 }
#else
        /* 'jal .' yields a PC-relative offset of zero so we can OR in the
           right offset at runtime. */
        { move r10, lr ; jal . /* ffi_closure_tile */ }
#endif

        .size   ffi_template_tramp_tile, . - ffi_template_tramp_tile
