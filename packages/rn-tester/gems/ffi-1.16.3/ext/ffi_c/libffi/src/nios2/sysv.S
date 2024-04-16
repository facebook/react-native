/* Low-level libffi support for Altera Nios II.

   Copyright (c) 2013 Mentor Graphics.

   Permission is hereby granted, free of charge, to any person obtaining
   a copy of this software and associated documentation files (the
   ``Software''), to deal in the Software without restriction, including
   without limitation the rights to use, copy, modify, merge, publish,
   distribute, sublicense, and/or sell copies of the Software, and to
   permit persons to whom the Software is furnished to do so, subject to
   the following conditions:
   
   The above copyright notice and this permission notice shall be
   included in all copies or substantial portions of the Software.
   
   THE SOFTWARE IS PROVIDED ``AS IS'', WITHOUT WARRANTY OF ANY KIND,
   EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
   IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
   CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
   TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
   SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.  */

/* This function is declared on the C side as 

   extern UINT64 ffi_call_sysv (void (*arghook) (char *, extended_cif *),
	  		        extended_cif *ecif,
				unsigned nbytes, 
				void (*fn) (void));
	
   On input, the arguments appear as
	r4 = arghook
	r5 = ecif
	r6 = nbytes
	r7 = fn
*/

	.section	.text
	.align	2
	.global	ffi_call_sysv
	.type	ffi_call_sysv, @function

ffi_call_sysv:
	.cfi_startproc

	/* Create the stack frame, saving r16 so we can use it locally.  */
	addi	sp, sp, -12
	.cfi_def_cfa_offset 12
	stw	ra, 8(sp)
	stw	fp, 4(sp)
	stw	r16, 0(sp)
	.cfi_offset 31, -4
	.cfi_offset 28, -8
	.cfi_offset 16, -12
	mov	fp, sp
	.cfi_def_cfa_register 28
	mov	r16, r7

	/* Adjust the stack pointer to create the argument buffer
	   nbytes long.  */
	sub	sp, sp, r6

	/* Call the arghook function.  */
	mov	r2, r4		/* fn */
	mov	r4, sp		/* argbuffer */
	callr	r2		/* r5 already contains ecif */

	/* Pop off the first 16 bytes of the argument buffer on the stack,
	   transferring the contents to the argument registers.  */
	ldw	r4, 0(sp)
	ldw	r5, 4(sp)
	ldw	r6, 8(sp)
	ldw	r7, 12(sp)
	addi	sp, sp, 16

	/* Call the user function, which leaves its result in r2 and r3.  */
	callr	r16

	/* Pop off the stack frame.  */
	mov	sp, fp
	ldw	ra, 8(sp)
	ldw	fp, 4(sp)
	ldw	r16, 0(sp)
	addi	sp, sp, 12
	ret
	.cfi_endproc
	.size	ffi_call_sysv, .-ffi_call_sysv


/* Closure trampolines jump here after putting the C helper address
   in r9 and the closure pointer in r10.  The user-supplied arguments
   to the closure are in the normal places, in r4-r7 and on the
   stack.  Push the register arguments on the stack too and then call the
   C helper function to deal with them.  */
   
	.section	.text
	.align	2
	.global	ffi_closure_sysv
	.type	ffi_closure_sysv, @function

ffi_closure_sysv:
	.cfi_startproc

	/* Create the stack frame, pushing the register args on the stack
	   just below the stack args.  This is the same trick illustrated
	   in Figure 7-3 in the Nios II Processor Reference Handbook, used
	   for variable arguments and structures passed by value.  */
	addi	sp, sp, -20
	.cfi_def_cfa_offset 20
	stw	ra, 0(sp)
	.cfi_offset 31, -20
	stw	r4, 4(sp)
	.cfi_offset 4, -16
	stw	r5, 8(sp)
	.cfi_offset 5, -12
	stw	r6, 12(sp)
	.cfi_offset 6, -8
	stw	r7, 16(sp)
	.cfi_offset 7, -4

	/* Call the helper.
	   r4 = pointer to arguments on stack
	   r5 = closure pointer (loaded in r10 by the trampoline)
	   r9 = address of helper function (loaded by trampoline) */
	addi	r4, sp, 4
	mov	r5, r10
	callr	r9
	
	/* Pop the stack and return.  */
	ldw	ra, 0(sp)
	addi	sp, sp, 20
	.cfi_def_cfa_offset -20
	ret
	.cfi_endproc
	.size	ffi_closure_sysv, .-ffi_closure_sysv

