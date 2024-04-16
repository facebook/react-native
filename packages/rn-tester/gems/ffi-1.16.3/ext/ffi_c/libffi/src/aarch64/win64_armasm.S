/* Copyright (c) 2009, 2010, 2011, 2012 ARM Ltd.
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

#define LIBFFI_ASM
#include <fficonfig.h>
#include <ffi.h>
#include <ffi_cfi.h>
#include "internal.h"

	OPT	2 /*disable listing */
/* For some macros to add unwind information */
#include "ksarm64.h"
	OPT	1 /*re-enable listing */

#define BE(X)	0
#define PTR_REG(n)      x##n
#define PTR_SIZE	8

	IMPORT ffi_closure_SYSV_inner
	EXPORT	ffi_call_SYSV
	EXPORT	ffi_closure_SYSV_V
	EXPORT	ffi_closure_SYSV
	EXPORT	extend_hfa_type
	EXPORT	compress_hfa_type
#ifdef FFI_GO_CLOSURES
	EXPORT	ffi_go_closure_SYSV_V
	EXPORT	ffi_go_closure_SYSV
#endif

	TEXTAREA, ALIGN=8

/* ffi_call_SYSV
   extern void ffi_call_SYSV (void *stack, void *frame,
			      void (*fn)(void), void *rvalue,
			      int flags, void *closure);
   Therefore on entry we have:
   x0 stack
   x1 frame
   x2 fn
   x3 rvalue
   x4 flags
   x5 closure
*/

	NESTED_ENTRY ffi_call_SYSV_fake

	/* For unwind information, Windows has to store fp and lr  */
	PROLOG_SAVE_REG_PAIR	x29, x30, #-32!

	ALTERNATE_ENTRY ffi_call_SYSV
	/* Use a stack frame allocated by our caller. */
	stp	x29, x30, [x1]
	mov	x29, x1
	mov	sp, x0

	mov	x9, x2			/* save fn */
	mov	x8, x3			/* install structure return */
#ifdef FFI_GO_CLOSURES
	/*mov	x18, x5			install static chain */
#endif
	stp	x3, x4, [x29, #16]	/* save rvalue and flags */
	
	/* Load the vector argument passing registers, if necessary.  */
	tbz	x4, #AARCH64_FLAG_ARG_V_BIT, ffi_call_SYSV_L1
	ldp	q0, q1, [sp, #0]
	ldp	q2, q3, [sp, #32]
	ldp	q4, q5, [sp, #64]
	ldp	q6, q7, [sp, #96]

ffi_call_SYSV_L1
	/* Load the core argument passing registers, including
	   the structure return pointer.  */
	ldp     x0, x1, [sp, #16*N_V_ARG_REG + 0]
	ldp     x2, x3, [sp, #16*N_V_ARG_REG + 16]
	ldp     x4, x5, [sp, #16*N_V_ARG_REG + 32]
	ldp     x6, x7, [sp, #16*N_V_ARG_REG + 48]

	/* Deallocate the context, leaving the stacked arguments.  */
	add	sp, sp, #CALL_CONTEXT_SIZE	

	blr     x9			/* call fn */

	ldp	x3, x4, [x29, #16]	/* reload rvalue and flags */

	/* Partially deconstruct the stack frame. */
	mov     sp, x29 
	ldp     x29, x30, [x29]

	/* Save the return value as directed.  */
	adr	x5, ffi_call_SYSV_return
	and	w4, w4, #AARCH64_RET_MASK
	add	x5, x5, x4, lsl #3
	br	x5
	
	/* Note that each table entry is 2 insns, and thus 8 bytes.
	   For integer data, note that we're storing into ffi_arg
	   and therefore we want to extend to 64 bits; these types
	   have two consecutive entries allocated for them.  */
	ALIGN 4
ffi_call_SYSV_return
	ret				/* VOID */
	nop
	str	x0, [x3]		/* INT64 */
	ret
	stp	x0, x1, [x3]		/* INT128 */
	ret
	brk	#1000			/* UNUSED */
	ret
	brk	#1000			/* UNUSED */
	ret
	brk	#1000			/* UNUSED */
	ret
	brk	#1000			/* UNUSED */
	ret
	brk	#1000			/* UNUSED */
	ret
	st4	{ v0.s, v1.s, v2.s, v3.s }[0], [x3]	/* S4 */
	ret
	st3	{ v0.s, v1.s, v2.s }[0], [x3]	/* S3 */
	ret
	stp	s0, s1, [x3]		/* S2 */
	ret
	str	s0, [x3]		/* S1 */
	ret
	st4	{ v0.d, v1.d, v2.d, v3.d }[0], [x3]	/* D4 */
	ret
	st3	{ v0.d, v1.d, v2.d }[0], [x3]	/* D3 */
	ret
	stp	d0, d1, [x3]		/* D2 */
	ret
	str	d0, [x3]		/* D1 */
	ret
	str	q3, [x3, #48]		/* Q4 */
	nop
	str	q2, [x3, #32]		/* Q3 */
	nop
	stp	q0, q1, [x3]		/* Q2 */
	ret
	str	q0, [x3]		/* Q1 */
	ret
	uxtb	w0, w0			/* UINT8 */
	str	x0, [x3]
	ret				/* reserved */
	nop
	uxth	w0, w0			/* UINT16 */
	str	x0, [x3]
	ret				/* reserved */
	nop
	mov	w0, w0			/* UINT32 */
	str	x0, [x3]
	ret				/* reserved */
	nop
	sxtb	x0, w0			/* SINT8 */
	str	x0, [x3]
	ret				/* reserved */
	nop
	sxth	x0, w0			/* SINT16 */
	str	x0, [x3]
	ret				/* reserved */
	nop
	sxtw	x0, w0			/* SINT32 */
	str	x0, [x3]
	ret				/* reserved */
	nop
	
	
	NESTED_END ffi_call_SYSV_fake
	

/* ffi_closure_SYSV
   Closure invocation glue. This is the low level code invoked directly by
   the closure trampoline to setup and call a closure.
   On entry x17 points to a struct ffi_closure, x16 has been clobbered
   all other registers are preserved.
   We allocate a call context and save the argument passing registers,
   then invoked the generic C ffi_closure_SYSV_inner() function to do all
   the real work, on return we load the result passing registers back from
   the call context.
*/

#define ffi_closure_SYSV_FS (8*2 + CALL_CONTEXT_SIZE + 64)

	NESTED_ENTRY	ffi_closure_SYSV_V
	PROLOG_SAVE_REG_PAIR	x29, x30, #-ffi_closure_SYSV_FS!

	/* Save the argument passing vector registers.  */
	stp	q0, q1, [sp, #16 + 0]
	stp	q2, q3, [sp, #16 + 32]
	stp	q4, q5, [sp, #16 + 64]
	stp	q6, q7, [sp, #16 + 96]

	b	ffi_closure_SYSV_save_argument
	NESTED_END	ffi_closure_SYSV_V

	NESTED_ENTRY	ffi_closure_SYSV
	PROLOG_SAVE_REG_PAIR	x29, x30, #-ffi_closure_SYSV_FS!

ffi_closure_SYSV_save_argument
	/* Save the argument passing core registers.  */
	stp     x0, x1, [sp, #16 + 16*N_V_ARG_REG + 0]
	stp     x2, x3, [sp, #16 + 16*N_V_ARG_REG + 16]
	stp     x4, x5, [sp, #16 + 16*N_V_ARG_REG + 32]
	stp     x6, x7, [sp, #16 + 16*N_V_ARG_REG + 48]

	/* Load ffi_closure_inner arguments.  */
	ldp	PTR_REG(0), PTR_REG(1), [x17, #FFI_TRAMPOLINE_CLOSURE_OFFSET]	/* load cif, fn */
	ldr	PTR_REG(2), [x17, #FFI_TRAMPOLINE_CLOSURE_OFFSET+PTR_SIZE*2]	/* load user_data */

do_closure
	add	x3, sp, #16							/* load context */
	add	x4, sp, #ffi_closure_SYSV_FS		/* load stack */
	add	x5, sp, #16+CALL_CONTEXT_SIZE		/* load rvalue */
	mov	x6, x8					/* load struct_rval */

	bl	ffi_closure_SYSV_inner

	/* Load the return value as directed.  */
	adr	x1, ffi_closure_SYSV_return_base
	and	w0, w0, #AARCH64_RET_MASK
	add	x1, x1, x0, lsl #3
	add	x3, sp, #16+CALL_CONTEXT_SIZE
	br	x1

	/* Note that each table entry is 2 insns, and thus 8 bytes.  */
	ALIGN	8
ffi_closure_SYSV_return_base
	b	ffi_closure_SYSV_epilog			/* VOID */
	nop
	ldr	x0, [x3]		/* INT64 */
	b	ffi_closure_SYSV_epilog
	ldp	x0, x1, [x3]		/* INT128 */
	b	ffi_closure_SYSV_epilog
	brk	#1000			/* UNUSED */
	nop
	brk	#1000			/* UNUSED */
	nop
	brk	#1000			/* UNUSED */
	nop
	brk	#1000			/* UNUSED */
	nop
	brk	#1000			/* UNUSED */
	nop
	ldr	s3, [x3, #12]		/* S4 */
	nop
	ldr	s2, [x3, #8]		/* S3 */
	nop
	ldp	s0, s1, [x3]		/* S2 */
	b	ffi_closure_SYSV_epilog
	ldr	s0, [x3]		/* S1 */
	b	ffi_closure_SYSV_epilog
	ldr	d3, [x3, #24]		/* D4 */
	nop
	ldr	d2, [x3, #16]		/* D3 */
	nop
	ldp	d0, d1, [x3]		/* D2 */
	b	ffi_closure_SYSV_epilog
	ldr	d0, [x3]		/* D1 */
	b	ffi_closure_SYSV_epilog
	ldr	q3, [x3, #48]		/* Q4 */
	nop
	ldr	q2, [x3, #32]		/* Q3 */
	nop
	ldp	q0, q1, [x3]		/* Q2 */
	b	ffi_closure_SYSV_epilog
	ldr	q0, [x3]		/* Q1 */
	b	ffi_closure_SYSV_epilog
	ldrb	w0, [x3, #BE(7)]	/* UINT8 */
	b	ffi_closure_SYSV_epilog
	brk	#1000			/* reserved */
	nop
	ldrh	w0, [x3, #BE(6)]	/* UINT16 */
	b	ffi_closure_SYSV_epilog
	brk	#1000			/* reserved */
	nop
	ldr	w0, [x3, #BE(4)]	/* UINT32 */
	b	ffi_closure_SYSV_epilog
	brk	#1000			/* reserved */
	nop
	ldrsb	x0, [x3, #BE(7)]	/* SINT8 */
	b	ffi_closure_SYSV_epilog
	brk	#1000			/* reserved */
	nop
	ldrsh	x0, [x3, #BE(6)]	/* SINT16 */
	b	ffi_closure_SYSV_epilog
	brk	#1000			/* reserved */
	nop
	ldrsw	x0, [x3, #BE(4)]	/* SINT32 */
	nop
					/* reserved */

ffi_closure_SYSV_epilog
	EPILOG_RESTORE_REG_PAIR	x29, x30, #ffi_closure_SYSV_FS!
	EPILOG_RETURN
	NESTED_END	ffi_closure_SYSV


#ifdef FFI_GO_CLOSURES
	NESTED_ENTRY	ffi_go_closure_SYSV_V
	PROLOG_SAVE_REG_PAIR	x29, x30, #-ffi_closure_SYSV_FS!

	/* Save the argument passing vector registers.  */
	stp	q0, q1, [sp, #16 + 0]
	stp	q2, q3, [sp, #16 + 32]
	stp	q4, q5, [sp, #16 + 64]
	stp	q6, q7, [sp, #16 + 96]
	b	ffi_go_closure_SYSV_save_argument
	NESTED_END	ffi_go_closure_SYSV_V

	NESTED_ENTRY	ffi_go_closure_SYSV
	PROLOG_SAVE_REG_PAIR	x29, x30, #-ffi_closure_SYSV_FS!

ffi_go_closure_SYSV_save_argument
	/* Save the argument passing core registers.  */
	stp     x0, x1, [sp, #16 + 16*N_V_ARG_REG + 0]
	stp     x2, x3, [sp, #16 + 16*N_V_ARG_REG + 16]
	stp     x4, x5, [sp, #16 + 16*N_V_ARG_REG + 32]
	stp     x6, x7, [sp, #16 + 16*N_V_ARG_REG + 48]

	/* Load ffi_closure_inner arguments.  */
	ldp	PTR_REG(0), PTR_REG(1), [x18, #PTR_SIZE]/* load cif, fn */
	mov	x2, x18					/* load user_data */
	b	do_closure
	NESTED_END	ffi_go_closure_SYSV

#endif /* FFI_GO_CLOSURES */


/* void extend_hfa_type (void *dest, void *src, int h) */

	LEAF_ENTRY	extend_hfa_type

	adr	x3, extend_hfa_type_jump_base
	and	w2, w2, #AARCH64_RET_MASK
	sub	x2, x2, #AARCH64_RET_S4
	add	x3, x3, x2, lsl #4
	br	x3

	ALIGN	4
extend_hfa_type_jump_base
	ldp	s16, s17, [x1]		/* S4 */
	ldp	s18, s19, [x1, #8]
	b	extend_hfa_type_store_4
	nop

	ldp	s16, s17, [x1]		/* S3 */
	ldr	s18, [x1, #8]
	b	extend_hfa_type_store_3
	nop

	ldp	s16, s17, [x1]		/* S2 */
	b	extend_hfa_type_store_2
	nop
	nop

	ldr	s16, [x1]		/* S1 */
	b	extend_hfa_type_store_1
	nop
	nop

	ldp	d16, d17, [x1]		/* D4 */
	ldp	d18, d19, [x1, #16]
	b       extend_hfa_type_store_4
	nop

	ldp     d16, d17, [x1]		/* D3 */
	ldr     d18, [x1, #16]
	b	extend_hfa_type_store_3
	nop

	ldp	d16, d17, [x1]		/* D2 */
	b	extend_hfa_type_store_2
	nop
	nop

	ldr	d16, [x1]		/* D1 */
	b	extend_hfa_type_store_1
	nop
	nop

	ldp	q16, q17, [x1]		/* Q4 */
	ldp	q18, q19, [x1, #16]
	b	extend_hfa_type_store_4
	nop

	ldp	q16, q17, [x1]		/* Q3 */
	ldr	q18, [x1, #16]
	b	extend_hfa_type_store_3
	nop

	ldp	q16, q17, [x1]		/* Q2 */
	b	extend_hfa_type_store_2
	nop
	nop

	ldr	q16, [x1]		/* Q1 */
	b	extend_hfa_type_store_1

extend_hfa_type_store_4
	str	q19, [x0, #48]
extend_hfa_type_store_3
	str	q18, [x0, #32]
extend_hfa_type_store_2
	str	q17, [x0, #16]
extend_hfa_type_store_1
	str	q16, [x0]
	ret

	LEAF_END	extend_hfa_type


/* void compress_hfa_type (void *dest, void *reg, int h) */

	LEAF_ENTRY	compress_hfa_type

	adr	x3, compress_hfa_type_jump_base
	and	w2, w2, #AARCH64_RET_MASK
	sub	x2, x2, #AARCH64_RET_S4
	add	x3, x3, x2, lsl #4
	br	x3

	ALIGN	4
compress_hfa_type_jump_base
	ldp	q16, q17, [x1]		/* S4 */
	ldp	q18, q19, [x1, #32]
	st4	{ v16.s, v17.s, v18.s, v19.s }[0], [x0]
	ret

	ldp	q16, q17, [x1]		/* S3 */
	ldr	q18, [x1, #32]
	st3	{ v16.s, v17.s, v18.s }[0], [x0]
	ret

	ldp	q16, q17, [x1]		/* S2 */
	st2	{ v16.s, v17.s }[0], [x0]
	ret
	nop

	ldr	q16, [x1]		/* S1 */
	st1	{ v16.s }[0], [x0]
	ret
	nop

	ldp	q16, q17, [x1]		/* D4 */
	ldp	q18, q19, [x1, #32]
	st4	{ v16.d, v17.d, v18.d, v19.d }[0], [x0]
	ret

	ldp	q16, q17, [x1]		/* D3 */
	ldr	q18, [x1, #32]
	st3	{ v16.d, v17.d, v18.d }[0], [x0]
	ret

	ldp	q16, q17, [x1]		/* D2 */
	st2	{ v16.d, v17.d }[0], [x0]
	ret
	nop

	ldr	q16, [x1]		/* D1 */
	st1	{ v16.d }[0], [x0]
	ret
	nop

	ldp	q16, q17, [x1]		/* Q4 */
	ldp	q18, q19, [x1, #32]
	b	compress_hfa_type_store_q4
	nop

	ldp	q16, q17, [x1]		/* Q3 */
	ldr	q18, [x1, #32]
	b	compress_hfa_type_store_q3
	nop

	ldp	q16, q17, [x1]		/* Q2 */
	stp	q16, q17, [x0]
	ret
	nop

	ldr	q16, [x1]		/* Q1 */
	str	q16, [x0]
	ret

compress_hfa_type_store_q4
	str	q19, [x0, #48]
compress_hfa_type_store_q3
	str	q18, [x0, #32]
	stp	q16, q17, [x0]
	ret

	LEAF_END	compress_hfa_type

	END