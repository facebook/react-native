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
 * vax Foreign Function Interface
 */

#define LIBFFI_ASM	
#include <fficonfig.h>
#include <ffi.h>

	.text

/*
 * void *					%r0
 * ffi_call_elfbsd(extended_cif *ecif,		4(%ap)
 *		   unsigned bytes,		8(%ap)
 *		   unsigned flags,		12(%ap)
 *		   void *rvalue,		16(%ap)
 *		   void (*fn)());		20(%ap)
 */
	.globl	ffi_call_elfbsd
	.type	ffi_call_elfbsd,@function
	.align	2
ffi_call_elfbsd:
	.word	0x00c		# save R2 and R3

	# Allocate stack space for the args
	subl2	8(%ap), %sp

	# Call ffi_prep_args
	pushl	%sp
	pushl	4(%ap)
	calls	$2, ffi_prep_args

	# Get function pointer
	movl	20(%ap), %r1

	# Build a CALLS frame
	ashl	$-2, 8(%ap), %r0
	pushl	%r0		# argument stack usage
	movl	%sp, %r0	# future %ap
	# saved registers
	bbc	$11, 0(%r1), 1f
	pushl	%r11
1:	bbc	$10, 0(%r1), 1f
	pushl	%r10
1:	bbc	$9, 0(%r1), 1f
	pushl	%r9
1:	bbc	$8, 0(%r1), 1f
	pushl	%r8
1:	bbc	$7, 0(%r1), 1f
	pushl	%r7
1:	bbc	$6, 0(%r1), 1f
	pushl	%r6
1:	bbc	$5, 0(%r1), 1f
	pushl	%r5
1:	bbc	$4, 0(%r1), 1f
	pushl	%r4
1:	bbc	$3, 0(%r1), 1f
	pushl	%r3
1:	bbc	$2, 0(%r1), 1f
	pushl	%r2
1:	
	pushal	9f
	pushl	%fp
	pushl	%ap
	movl	16(%ap), %r3	# struct return address, if needed
	movl	%r0, %ap
	movzwl	4(%fp), %r0	# previous PSW, without the saved registers mask
	bisl2	$0x20000000, %r0 # calls frame
	movzwl	0(%r1), %r2
	bicw2	$0xf003, %r2	# only keep R11-R2
	ashl	$16, %r2, %r2
	bisl2	%r2, %r0	# saved register mask of the called function
	pushl	%r0	
	pushl	$0
	movl	%sp, %fp

	# Invoke the function
	pushal	2(%r1)		# skip procedure entry mask
	movl	%r3, %r1
	bicpsw	$0x000f
	rsb

9:
	# Copy return value if necessary
	tstl	16(%ap)
	jeql	9f
	movl	16(%ap), %r2

	bbc	$0, 12(%ap), 1f	# CIF_FLAGS_CHAR
	movb	%r0, 0(%r2)
	brb	9f
1:
	bbc	$1, 12(%ap), 1f	# CIF_FLAGS_SHORT
	movw	%r0, 0(%r2)
	brb	9f
1:
	bbc	$2, 12(%ap), 1f	# CIF_FLAGS_INT
	movl	%r0, 0(%r2)
	brb	9f
1:
	bbc	$3, 12(%ap), 1f	# CIF_FLAGS_DINT
	movq	%r0, 0(%r2)
	brb	9f
1:
	movl	%r1, %r0	# might have been a struct
	#brb	9f

9:
	ret

/*
 * ffi_closure_elfbsd(void);
 * invoked with	%r0: ffi_closure *closure
 */
	.globl	ffi_closure_elfbsd
	.type	ffi_closure_elfbsd, @function
	.align	2
ffi_closure_elfbsd:
	.word	0

	# Allocate room on stack for return value
	subl2	$8, %sp

	# Invoke the closure function
	pushal	4(%ap)		# calling stack
	pushal	4(%sp)		# return value
	pushl	%r0		# closure
	calls	$3, ffi_closure_elfbsd_inner

	# Copy return value if necessary
	bitb	$1, %r0		# CIF_FLAGS_CHAR
	beql	1f
	movb	0(%sp), %r0
	brb	9f
1:
	bitb	$2, %r0		# CIF_FLAGS_SHORT
	beql	1f
	movw	0(%sp), %r0
	brb	9f
1:
	bitb	$4, %r0		# CIF_FLAGS_INT
	beql	1f
	movl	0(%sp), %r0
	brb	9f
1:
	bitb	$8, %r0		# CIF_FLAGS_DINT
	beql	1f
	movq	0(%sp), %r0
	#brb	9f
1:

9:
	ret

/*
 * ffi_closure_struct_elfbsd(void);
 * invoked with	%r0: ffi_closure *closure
 *		%r1: struct return address
 */
	.globl	ffi_closure_struct_elfbsd
	.type	ffi_closure_struct_elfbsd, @function
	.align	2
ffi_closure_struct_elfbsd:
	.word	0

	# Invoke the closure function
	pushal	4(%ap)		# calling stack
	pushl	%r1		# return value
	pushl	%r0		# closure
	calls	$3, ffi_closure_elfbsd_inner

	ret
