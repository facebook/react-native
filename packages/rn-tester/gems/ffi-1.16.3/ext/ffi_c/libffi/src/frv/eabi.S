/* -----------------------------------------------------------------------
   eabi.S - Copyright (c) 2004  Anthony Green
   
   FR-V Assembly glue.

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
   IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY CLAIM, DAMAGES OR
   OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
   ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
   OTHER DEALINGS IN THE SOFTWARE.
   ----------------------------------------------------------------------- */

#define LIBFFI_ASM	
#include <fficonfig.h>
#include <ffi.h>

	.globl ffi_prep_args_EABI

	.text
	.p2align 4
	.globl ffi_call_EABI
	.type ffi_call_EABI, @function

	# gr8 :   ffi_prep_args
	# gr9 :   &ecif
	# gr10:   cif->bytes
	# gr11:   fig->flags
	# gr12:   ecif.rvalue
	# gr13:   fn
	
ffi_call_EABI:	
	addi	sp, #-80, sp
	sti	fp, @(sp, #24)
	addi	sp, #24, fp
	movsg	lr, gr5

	/* Make room for the new arguments.  */
	/* subi	sp, fp, gr10 */
	
	/* Store return address and incoming args on stack.  */
	sti	gr5, @(fp, #8)
	sti	gr8, @(fp, #-4)
	sti	gr9, @(fp, #-8)
	sti	gr10, @(fp, #-12)
	sti	gr11, @(fp, #-16)
	sti	gr12, @(fp, #-20)
	sti	gr13, @(fp, #-24)

	sub     sp, gr10, sp
	
	/* Call ffi_prep_args.  */
	ldi	@(fp, #-4), gr4
	addi	sp, #0, gr8
	ldi	@(fp, #-8), gr9
#ifdef __FRV_FDPIC__
	ldd	@(gr4, gr0), gr14
	calll	@(gr14, gr0)
#else
	calll	@(gr4, gr0)
#endif	

	/* ffi_prep_args returns the new stack pointer.  */
	mov	gr8, gr4
		
	ldi	@(sp, #0), gr8
	ldi	@(sp, #4), gr9
	ldi	@(sp, #8), gr10
	ldi	@(sp, #12), gr11
	ldi	@(sp, #16), gr12
	ldi	@(sp, #20), gr13

	/* Always copy the return value pointer into the hidden
	   parameter register.  This is only strictly necessary
	   when we're returning an aggregate type, but it doesn't
	   hurt to do this all the time, and it saves a branch.  */
	ldi	@(fp, #-20), gr3

	/* Use the ffi_prep_args return value for the new sp.  */
	mov	gr4, sp
	
	/* Call the target function.  */
	ldi	@(fp, -24), gr4
#ifdef __FRV_FDPIC__
	ldd	@(gr4, gr0), gr14
	calll	@(gr14, gr0)
#else
	calll	@(gr4, gr0)
#endif	

	/* Store the result. */
	ldi	@(fp, #-16), gr10  /* fig->flags */
	ldi	@(fp, #-20), gr4   /* ecif.rvalue */

	/* Is the return value stored in two registers?  */
	cmpi	gr10, #8, icc0
	bne	icc0, 0, .L2
	/*   Yes, save them.  */
	sti	gr8, @(gr4, #0)
	sti	gr9, @(gr4, #4)
	bra	.L3
.L2:
	/* Is the return value a structure?  */
	cmpi	gr10, #-1, icc0
	beq	icc0, 0, .L3
	/*   No, save a 4 byte return value.  */
	sti	gr8, @(gr4, #0)
.L3:	

	/* Restore the stack, and return.  */
	ldi	@(fp, 8), gr5
	ld	@(fp, gr0), fp
	addi	sp,#80,sp
	jmpl	@(gr5,gr0)
	.size ffi_call_EABI, .-ffi_call_EABI
	
