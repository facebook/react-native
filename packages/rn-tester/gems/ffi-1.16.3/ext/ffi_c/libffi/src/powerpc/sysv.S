/* -----------------------------------------------------------------------
   sysv.S - Copyright (c) 1998 Geoffrey Keating
   Copyright (C) 2007 Free Software Foundation, Inc

   PowerPC Assembly glue.

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
#include <powerpc/asm.h>

#ifndef POWERPC64
FFI_HIDDEN(ffi_call_SYSV)
ENTRY(ffi_call_SYSV)
	.cfi_startproc
	/* Save the old stack pointer as AP.  */
	mr	%r10,%r1
	.cfi_def_cfa_register 10

	/* Allocate the stack space we need.  */
	stwux	%r1,%r1,%r8
	/* Save registers we use.  */
	mflr	%r9
	stw	%r28,-16(%r10)
	stw	%r29,-12(%r10)
	stw	%r30, -8(%r10)
	stw	%r31, -4(%r10)
	stw	%r9,   4(%r10)
	.cfi_offset 65, 4
	.cfi_offset 31, -4
	.cfi_offset 30, -8
	.cfi_offset 29, -12
	.cfi_offset 28, -16

	/* Save arguments over call...  */
	stw	%r7,   -20(%r10)	/* closure, */
	mr	%r31,%r6		/* flags, */
	mr	%r30,%r5		/* rvalue, */
	mr	%r29,%r4		/* function address, */
	mr	%r28,%r10		/* our AP. */
	.cfi_def_cfa_register 28

	/* Call ffi_prep_args_SYSV.  */
	mr	%r4,%r1
	bl	ffi_prep_args_SYSV@local

	/* Now do the call.  */
	/* Set up cr1 with bits 4-7 of the flags.  */
	mtcrf	0x40,%r31
	/* Get the address to call into CTR.  */
	mtctr	%r29
	/* Load all those argument registers.  */
	lwz	%r3,-24-(8*4)(%r28)
	lwz	%r4,-24-(7*4)(%r28)
	lwz	%r5,-24-(6*4)(%r28)
	lwz	%r6,-24-(5*4)(%r28)
	bf-	5,1f
	nop
	lwz	%r7,-24-(4*4)(%r28)
	lwz	%r8,-24-(3*4)(%r28)
	lwz	%r9,-24-(2*4)(%r28)
	lwz	%r10,-24-(1*4)(%r28)
	nop
1:

#ifndef __NO_FPRS__
	/* Load all the FP registers.  */
	bf-	6,2f
	lfd	%f1,-24-(8*4)-(8*8)(%r28)
	lfd	%f2,-24-(8*4)-(7*8)(%r28)
	lfd	%f3,-24-(8*4)-(6*8)(%r28)
	lfd	%f4,-24-(8*4)-(5*8)(%r28)
	nop
	lfd	%f5,-24-(8*4)-(4*8)(%r28)
	lfd	%f6,-24-(8*4)-(3*8)(%r28)
	lfd	%f7,-24-(8*4)-(2*8)(%r28)
	lfd	%f8,-24-(8*4)-(1*8)(%r28)
#endif
2:

	/* Make the call.  */
	lwz	%r11, -20(%r28)
	bctrl

	/* Now, deal with the return value.  */
	mtcrf	0x03,%r31 /* cr6-cr7  */
	bt-	31,L(small_struct_return_value)
	bt-	30,L(done_return_value)
#ifndef __NO_FPRS__
	bt-	29,L(fp_return_value)
#endif
	stw	%r3,0(%r30)
	bf+	27,L(done_return_value)
	stw	%r4,4(%r30)
	bf	26,L(done_return_value)
	stw     %r5,8(%r30)
	stw	%r6,12(%r30)
	/* Fall through...  */

L(done_return_value):
	/* Restore the registers we used and return.  */
	lwz	%r9,   4(%r28)
	lwz	%r31, -4(%r28)
	mtlr	%r9
	lwz	%r30, -8(%r28)
	lwz	%r29,-12(%r28)
	lwz	%r28,-16(%r28)
	.cfi_remember_state
	/* At this point we don't have a cfa register.  Say all our
	   saved regs have been restored.  */
	.cfi_same_value 65
	.cfi_same_value 31
	.cfi_same_value 30
	.cfi_same_value 29
	.cfi_same_value 28
	/* Hopefully this works..  */
	.cfi_def_cfa_register 1
	.cfi_offset 1, 0
	lwz	%r1,0(%r1)
	.cfi_same_value 1
	blr

#ifndef __NO_FPRS__
L(fp_return_value):
	.cfi_restore_state
	bf	27,L(float_return_value)
	stfd	%f1,0(%r30)
	bf	26,L(done_return_value)
	stfd	%f2,8(%r30)
	b	L(done_return_value)
L(float_return_value):
	stfs	%f1,0(%r30)
	b	L(done_return_value)
#endif

L(small_struct_return_value):
	/*
	 * The C code always allocates a properly-aligned 8-byte bounce
	 * buffer to make this assembly code very simple.  Just write out
	 * r3 and r4 to the buffer to allow the C code to handle the rest.
	 */
	stw %r3, 0(%r30)
	stw %r4, 4(%r30)
	b L(done_return_value)
	.cfi_endproc

END(ffi_call_SYSV)

#if defined __ELF__ && defined __linux__
	.section	.note.GNU-stack,"",@progbits
#endif
#endif
