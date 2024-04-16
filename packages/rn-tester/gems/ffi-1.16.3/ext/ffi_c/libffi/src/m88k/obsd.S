/*
 * Copyright (c) 2013 Miodrag Vallat.  <miod@openbsd.org>
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * ``Software''), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED ``AS IS'', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/*
 * m88k Foreign Function Interface
 */

#define LIBFFI_ASM	
#include <fficonfig.h>
#include <ffi.h>

	.text

/*
 * ffi_cacheflush_OBSD(unsigned int addr,	%r2
 *		       unsigned int size);	%r3
 */
	.align	4
	.globl	ffi_cacheflush_OBSD
	.type	ffi_cacheflush_OBSD,@function
ffi_cacheflush_OBSD:
	tb0	0,   %r0, 451
	or	%r0, %r0, %r0
	jmp	%r1
	.size	ffi_cacheflush_OBSD, . - ffi_cacheflush_OBSD

/*
 * ffi_call_OBSD(unsigned bytes,		%r2
 *		 extended_cif *ecif,		%r3
 *		 unsigned flags,		%r4
 *		 void *rvalue,			%r5
 *		 void (*fn)());			%r6
 */
	.align	4
	.globl	ffi_call_OBSD
	.type	ffi_call_OBSD,@function
ffi_call_OBSD:
	subu	%r31, %r31, 32
	st	%r30, %r31, 4
	st	%r1,  %r31, 0
	addu	%r30, %r31, 32

	| Save the few arguments we'll need after ffi_prep_args()
	st.d	%r4, %r31, 8
	st	%r6, %r31, 16

	| Allocate room for the image of r2-r9, and the stack space for
	| the args (rounded to a 16-byte boundary)
	addu	%r2,  %r2,  (8 * 4) + 15
	clr	%r2,  %r2,  4<0>
	subu	%r31, %r31, %r2

	| Fill register and stack image
	or	%r2, %r31, %r0
#ifdef PIC
	bsr	ffi_prep_args#plt
#else
	bsr	ffi_prep_args
#endif

	| Save pointer to return struct address, if any
	or	%r12, %r2, %r0

	| Get function pointer
	subu	%r4,  %r30, 32
	ld	%r1,  %r4,  16

	| Fetch the register arguments
	ld.d	%r2, %r31, (0 * 4)
	ld.d	%r4, %r31, (2 * 4)
	ld.d	%r6, %r31, (4 * 4)
	ld.d	%r8, %r31, (6 * 4)
	addu	%r31, %r31, (8 * 4)

	| Invoke the function
	jsr	%r1

	| Restore stack now that we don't need the args anymore
	subu	%r31, %r30, 32

	| Figure out what to return as the function's return value
	ld	%r5, %r31, 12		| rvalue
	ld	%r4, %r31, 8		| flags

	bcnd	eq0, %r5, 9f

	bb0	0, %r4, 1f		| CIF_FLAGS_INT
	st	%r2, %r5, 0
	br	9f

1:
	bb0	1, %r4, 1f		| CIF_FLAGS_DINT
	st.d	%r2, %r5, 0
	br	9f

1:
9:
	ld	%r1,  %r31, 0
	ld	%r30, %r31, 4
	jmp.n	%r1
	 addu	%r31, %r31, 32
	.size	ffi_call_OBSD, . - ffi_call_OBSD

/*
 * ffi_closure_OBSD(ffi_closure *closure);	%r13
 */
	.align	4
	.globl	ffi_closure_OBSD
	.type	ffi_closure_OBSD, @function
ffi_closure_OBSD:
	subu	%r31, %r31, 16
	st	%r30, %r31, 4
	st	%r1,  %r31, 0
	addu	%r30, %r31, 16

	| Make room on the stack for saved register arguments and return
	| value
	subu	%r31, %r31, (8 * 4) + (2 * 4)
	st.d	%r2,  %r31, (0 * 4)
	st.d	%r4,  %r31, (2 * 4)
	st.d	%r6,  %r31, (4 * 4)
	st.d	%r8,  %r31, (6 * 4)

	| Invoke the closure function
	or	%r5,  %r30, 0			| calling stack
	addu	%r4,  %r31, 0			| saved registers
	addu	%r3,  %r31, (8 * 4)		| return value
	or	%r2,  %r13, %r0			| closure
#ifdef PIC
	bsr	ffi_closure_OBSD_inner#plt
#else
	bsr	ffi_closure_OBSD_inner
#endif

	| Figure out what to return as the function's return value
	bb0	0, %r2, 1f		| CIF_FLAGS_INT
	ld	%r2, %r31, (8 * 4)
	br	9f

1:
	bb0	1, %r2, 1f		| CIF_FLAGS_DINT
	ld.d	%r2, %r31, (8 * 4)
	br	9f

1:
9:
	subu	%r31, %r30, 16
	ld	%r1,  %r31, 0
	ld	%r30, %r31, 4
	jmp.n	%r1
	 addu	%r31, %r31, 16
	.size	ffi_closure_OBSD,.-ffi_closure_OBSD

/*
 * ffi_closure_struct_OBSD(ffi_closure *closure);	%r13
 */
	.align	4
	.globl	ffi_closure_struct_OBSD
	.type	ffi_closure_struct_OBSD, @function
ffi_closure_struct_OBSD:
	subu	%r31, %r31, 16
	st	%r30, %r31, 4
	st	%r1,  %r31, 0
	addu	%r30, %r31, 16

	| Make room on the stack for saved register arguments
	subu	%r31, %r31, (8 * 4)
	st.d	%r2,  %r31, (0 * 4)
	st.d	%r4,  %r31, (2 * 4)
	st.d	%r6,  %r31, (4 * 4)
	st.d	%r8,  %r31, (6 * 4)

	| Invoke the closure function
	or	%r5,  %r30, 0			| calling stack
	addu	%r4,  %r31, 0			| saved registers
	or	%r3,  %r12, 0			| return value
	or	%r2,  %r13, %r0			| closure
#ifdef PIC
	bsr	ffi_closure_OBSD_inner#plt
#else
	bsr	ffi_closure_OBSD_inner
#endif

	subu	%r31, %r30, 16
	ld	%r1,  %r31, 0
	ld	%r30, %r31, 4
	jmp.n	%r1
	 addu	%r31, %r31, 16
	.size	ffi_closure_struct_OBSD,.-ffi_closure_struct_OBSD
