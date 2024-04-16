/* -----------------------------------------------------------------------
   sysv.S - Copyright (c) 2012, 2013 Xilinx, Inc

   MicroBlaze Foreign Function Interface

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

	/*
	 * arg[0] (r5)  = ffi_prep_args,
	 * arg[1] (r6)  = &ecif,
	 * arg[2] (r7)  = cif->bytes,
	 * arg[3] (r8)  = cif->flags,
	 * arg[4] (r9)  = ecif.rvalue,
	 * arg[5] (r10) = fn
	 * arg[6] (sp[0]) = cif->rtype->type
	 * arg[7] (sp[4]) = cif->rtype->size
	 */
	.text
	.globl ffi_call_SYSV
	.type ffi_call_SYSV, @function
ffi_call_SYSV:
	/* push callee saves */
	addik r1, r1, -20
	swi r19, r1, 0 /* Frame Pointer */
	swi r20, r1, 4 /* PIC register */
	swi r21, r1, 8 /* PIC register */
	swi r22, r1, 12 /* save for locals */
	swi r23, r1, 16 /* save for locals */
	
	/* save the r5-r10 registers in the stack */
	addik r1, r1, -24 /* increment sp to store 6x 32-bit words */
	swi r5, r1, 0
	swi r6, r1, 4
	swi r7, r1, 8
	swi r8, r1, 12
	swi r9, r1, 16
	swi r10, r1, 20

	/* save function pointer */
	addik r3, r5, 0 /* copy ffi_prep_args into r3 */
	addik r22, r1, 0 /* save sp for unallocated args into r22 (callee-saved) */
	addik r23, r10, 0 /* save function address into r23 (callee-saved) */

	/* prepare stack with allocation for n (bytes = r7) args */
	rsub r1, r7, r1 /* subtract bytes from sp */

	/* prep args for ffi_prep_args call */
	addik r5, r1, 0 /* store stack pointer into arg[0] */
	/* r6 still holds ecif for arg[1] */

	/* Call ffi_prep_args(stack, &ecif). */
	addik r1, r1, -4
	swi r15, r1, 0 /* store the link register in the frame */
	brald r15, r3
	nop /* branch has delay slot */
	lwi r15, r1, 0
	addik r1, r1, 4 /* restore the link register from the frame */
	/* returns calling stack pointer location */

	/* prepare args for fn call, prep_args populates them onto the stack */
	lwi r5, r1, 0 /* arg[0] */
	lwi r6, r1, 4 /* arg[1] */
	lwi r7, r1, 8 /* arg[2] */
	lwi r8, r1, 12 /* arg[3] */
	lwi r9, r1, 16 /* arg[4] */
	lwi r10, r1, 20 /* arg[5] */

	/* call (fn) (...). */
	addik r1, r1, -4
	swi r15, r1, 0 /* store the link register in the frame */
	brald r15, r23
	nop /* branch has delay slot */
	lwi r15, r1, 0
	addik r1, r1, 4 /* restore the link register from the frame */

	/* Remove the space we pushed for the args. */
	addik r1, r22, 0 /* restore old SP */

	/* restore this functions parameters */
	lwi r5, r1, 0 /* arg[0] */
	lwi r6, r1, 4 /* arg[1] */
	lwi r7, r1, 8 /* arg[2] */
	lwi r8, r1, 12 /* arg[3] */
	lwi r9, r1, 16 /* arg[4] */
	lwi r10, r1, 20 /* arg[5] */
	addik r1, r1, 24 /* decrement sp to de-allocate 6x 32-bit words */

	/* If the return value pointer is NULL, assume no return value. */
	beqi r9, ffi_call_SYSV_end

	lwi r22, r1, 48 /* get return type (20 for locals + 28 for arg[6]) */
	lwi r23, r1, 52 /* get return size (20 for locals + 32 for arg[7])  */
	
	/* Check if return type is actually a struct, do nothing */
	rsubi r11, r22, FFI_TYPE_STRUCT
	beqi r11, ffi_call_SYSV_end

	/* Return 8bit */
	rsubi r11, r23, 1
	beqi r11, ffi_call_SYSV_store8

	/* Return 16bit */
	rsubi r11, r23, 2
	beqi r11, ffi_call_SYSV_store16

	/* Return 32bit */
	rsubi r11, r23, 4
	beqi r11, ffi_call_SYSV_store32

	/* Return 64bit */
	rsubi r11, r23, 8
	beqi r11, ffi_call_SYSV_store64

	/* Didn't match anything */
	bri ffi_call_SYSV_end

ffi_call_SYSV_store64:
	swi r3, r9, 0 /* store word r3 into return value */
	swi r4, r9, 4 /* store word r4 into return value */
	bri ffi_call_SYSV_end

ffi_call_SYSV_store32:
	swi r3, r9, 0 /* store word r3 into return value */
	bri ffi_call_SYSV_end

ffi_call_SYSV_store16:
#ifdef __BIG_ENDIAN__
	shi r3, r9, 2 /* store half-word r3 into return value */
#else
	shi r3, r9, 0 /* store half-word r3 into return value */
#endif
	bri ffi_call_SYSV_end

ffi_call_SYSV_store8:
#ifdef __BIG_ENDIAN__
	sbi r3, r9, 3 /* store byte r3 into return value */
#else
	sbi r3, r9, 0 /* store byte r3 into return value */
#endif
	bri ffi_call_SYSV_end

ffi_call_SYSV_end:
	/* callee restores */
	lwi r19, r1, 0 /* frame pointer */
	lwi r20, r1, 4 /* PIC register */
	lwi r21, r1, 8 /* PIC register */
	lwi r22, r1, 12
	lwi r23, r1, 16
	addik r1, r1, 20

	/* return from sub-routine (with delay slot) */
	rtsd r15, 8
	nop

	.size ffi_call_SYSV, . - ffi_call_SYSV

/* ------------------------------------------------------------------------- */

	/*
	 * args passed into this function, are passed down to the callee.
	 * this function is the target of the closure trampoline, as such r12 is 
	 * a pointer to the closure object.
	 */
	.text
	.globl ffi_closure_SYSV
	.type ffi_closure_SYSV, @function
ffi_closure_SYSV:
	/* push callee saves */
	addik r11, r1, 28 /* save stack args start location (excluding regs/link) */
	addik r1, r1, -12
	swi r19, r1, 0 /* Frame Pointer */
	swi r20, r1, 4 /* PIC register */
	swi r21, r1, 8 /* PIC register */

	/* store register args on stack */
	addik r1, r1, -24
	swi r5, r1, 0
	swi r6, r1, 4
	swi r7, r1, 8
	swi r8, r1, 12
	swi r9, r1, 16
	swi r10, r1, 20

	/* setup args */
	addik r5, r1, 0 /* register_args */
	addik r6, r11, 0 /* stack_args */
	addik r7, r12, 0 /* closure object */
	addik r1, r1, -8 /* allocate return value */
	addik r8, r1, 0 /* void* rvalue */
	addik r1, r1, -8 /* allocate for return type/size values */
	addik r9, r1, 0 /* void* rtype */
	addik r10, r1, 4 /* void* rsize */

	/* call the wrap_call function */
	addik r1, r1, -28 /* allocate args + link reg */
	swi r15, r1, 0 /* store the link register in the frame */
	brald r15, r3
	nop /* branch has delay slot */
	lwi r15, r1, 0
	addik r1, r1, 28 /* restore the link register from the frame */

ffi_closure_SYSV_prepare_return:
	lwi r9, r1, 0 /* rtype */
	lwi r10, r1, 4 /* rsize */
	addik r1, r1, 8 /* de-allocate return info values */

	/* Check if return type is actually a struct, store 4 bytes */
	rsubi r11, r9, FFI_TYPE_STRUCT
	beqi r11, ffi_closure_SYSV_store32

	/* Return 8bit */
	rsubi r11, r10, 1
	beqi r11, ffi_closure_SYSV_store8

	/* Return 16bit */
	rsubi r11, r10, 2
	beqi r11, ffi_closure_SYSV_store16

	/* Return 32bit */
	rsubi r11, r10, 4
	beqi r11, ffi_closure_SYSV_store32

	/* Return 64bit */
	rsubi r11, r10, 8
	beqi r11, ffi_closure_SYSV_store64

	/* Didn't match anything */
	bri ffi_closure_SYSV_end

ffi_closure_SYSV_store64:
	lwi r3, r1, 0 /* store word r3 into return value */
	lwi r4, r1, 4 /* store word r4 into return value */
	/* 64 bits == 2 words, no sign extend occurs */
	bri ffi_closure_SYSV_end

ffi_closure_SYSV_store32:
	lwi r3, r1, 0 /* store word r3 into return value */
	/* 32 bits == 1 word, no sign extend occurs */
	bri ffi_closure_SYSV_end

ffi_closure_SYSV_store16:
#ifdef __BIG_ENDIAN__
	lhui r3, r1, 2 /* store half-word r3 into return value */
#else
	lhui r3, r1, 0 /* store half-word r3 into return value */
#endif
	rsubi r11, r9, FFI_TYPE_SINT16
	bnei r11, ffi_closure_SYSV_end
	sext16 r3, r3 /* fix sign extend of sint8 */
	bri ffi_closure_SYSV_end

ffi_closure_SYSV_store8:
#ifdef __BIG_ENDIAN__
	lbui r3, r1, 3 /* store byte r3 into return value */
#else
	lbui r3, r1, 0 /* store byte r3 into return value */
#endif
	rsubi r11, r9, FFI_TYPE_SINT8
	bnei r11, ffi_closure_SYSV_end
	sext8 r3, r3 /* fix sign extend of sint8 */
	bri ffi_closure_SYSV_end

ffi_closure_SYSV_end:
	addik r1, r1, 8 /* de-allocate return value */

	/* de-allocate stored args */
	addik r1, r1, 24

	/* callee restores */
	lwi r19, r1, 0 /* frame pointer */
	lwi r20, r1, 4 /* PIC register */
	lwi r21, r1, 8 /* PIC register */
	addik r1, r1, 12

	/* return from sub-routine (with delay slot) */
	rtsd r15, 8
	nop

	.size ffi_closure_SYSV, . - ffi_closure_SYSV
