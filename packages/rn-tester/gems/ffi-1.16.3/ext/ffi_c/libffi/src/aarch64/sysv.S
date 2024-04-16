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

#if defined(__aarch64__) || defined(__arm64__)
#define LIBFFI_ASM
#include <fficonfig.h>
#include <ffi.h>
#include <ffi_cfi.h>
#include "internal.h"

#ifdef HAVE_MACHINE_ASM_H
#include <machine/asm.h>
#else
#ifdef __USER_LABEL_PREFIX__
#define CONCAT1(a, b) CONCAT2(a, b)
#define CONCAT2(a, b) a ## b

/* Use the right prefix for global labels.  */
#define CNAME(x) CONCAT1 (__USER_LABEL_PREFIX__, x)
#else
#define CNAME(x) x
#endif
#endif

#ifdef __APPLE__
# define L(X)     CONCAT1(L, X)
#else
# define L(X)     CONCAT1(.L, X)
#endif

#ifdef __AARCH64EB__
# define BE(X)	X
#else
# define BE(X)	0
#endif

#ifdef __ILP32__
#define PTR_REG(n)      w##n
#else
#define PTR_REG(n)      x##n
#endif

#ifdef __ILP32__
#define PTR_SIZE	4
#else
#define PTR_SIZE	8
#endif

	.text
	.align 4

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

	cfi_startproc
CNAME(ffi_call_SYSV):
	/* Sign the lr with x1 since that is where it will be stored */
	SIGN_LR_WITH_REG(x1)

	/* Use a stack frame allocated by our caller.  */
#if defined(HAVE_PTRAUTH) && defined(__APPLE__)
	/* darwin's libunwind assumes that the cfa is the sp and that's the data
	 * used to sign the lr.  In order to allow unwinding through this
	 * function it is necessary to point the cfa at the signing register.
	 */
	cfi_def_cfa(x1, 0);
#else
	cfi_def_cfa(x1, 40);
#endif
	stp	x29, x30, [x1]
	mov	x9, sp
	str	x9, [x1, #32]
	mov	x29, x1
	mov	sp, x0
	cfi_def_cfa_register(x29)
	cfi_rel_offset (x29, 0)
	cfi_rel_offset (x30, 8)

	mov	x9, x2			/* save fn */
	mov	x8, x3			/* install structure return */
#ifdef FFI_GO_CLOSURES
	mov	x18, x5			/* install static chain */
#endif
	stp	x3, x4, [x29, #16]	/* save rvalue and flags */

	/* Load the vector argument passing registers, if necessary.  */
	tbz	w4, #AARCH64_FLAG_ARG_V_BIT, 1f
	ldp     q0, q1, [sp, #0]
	ldp     q2, q3, [sp, #32]
	ldp     q4, q5, [sp, #64]
	ldp     q6, q7, [sp, #96]
1:
	/* Load the core argument passing registers, including
	   the structure return pointer.  */
	ldp     x0, x1, [sp, #16*N_V_ARG_REG + 0]
	ldp     x2, x3, [sp, #16*N_V_ARG_REG + 16]
	ldp     x4, x5, [sp, #16*N_V_ARG_REG + 32]
	ldp     x6, x7, [sp, #16*N_V_ARG_REG + 48]

	/* Deallocate the context, leaving the stacked arguments.  */
	add	sp, sp, #CALL_CONTEXT_SIZE

	BRANCH_AND_LINK_TO_REG     x9			/* call fn */

	ldp	x3, x4, [x29, #16]	/* reload rvalue and flags */

	/* Partially deconstruct the stack frame.  */
	ldr	x9, [x29, #32]
	mov	sp, x9
	cfi_def_cfa_register (sp)
	mov	x2, x29			/* Preserve for auth */
	ldp     x29, x30, [x29]

	/* Save the return value as directed.  */
	adr	x5, 0f
	and	w4, w4, #AARCH64_RET_MASK
	add	x5, x5, x4, lsl #3
	br	x5

	/* Note that each table entry is 2 insns, and thus 8 bytes.
	   For integer data, note that we're storing into ffi_arg
	   and therefore we want to extend to 64 bits; these types
	   have two consecutive entries allocated for them.  */
	.align	4
0:	b 99f				/* VOID */
	nop
1:	str	x0, [x3]		/* INT64 */
	b 99f
2:	stp	x0, x1, [x3]		/* INT128 */
	b 99f
3:	brk	#1000			/* UNUSED */
	b 99f
4:	brk	#1000			/* UNUSED */
	b 99f
5:	brk	#1000			/* UNUSED */
	b 99f
6:	brk	#1000			/* UNUSED */
	b 99f
7:	brk	#1000			/* UNUSED */
	b 99f
8:	st4	{ v0.s, v1.s, v2.s, v3.s }[0], [x3]	/* S4 */
	b 99f
9:	st3	{ v0.s, v1.s, v2.s }[0], [x3]	/* S3 */
	b 99f
10:	stp	s0, s1, [x3]		/* S2 */
	b 99f
11:	str	s0, [x3]		/* S1 */
	b 99f
12:	st4	{ v0.d, v1.d, v2.d, v3.d }[0], [x3]	/* D4 */
	b 99f
13:	st3	{ v0.d, v1.d, v2.d }[0], [x3]	/* D3 */
	b 99f
14:	stp	d0, d1, [x3]		/* D2 */
	b 99f
15:	str	d0, [x3]		/* D1 */
	b 99f
16:	str	q3, [x3, #48]		/* Q4 */
	nop
17:	str	q2, [x3, #32]		/* Q3 */
	nop
18:	stp	q0, q1, [x3]		/* Q2 */
	b 99f
19:	str	q0, [x3]		/* Q1 */
	b 99f
20:	uxtb	w0, w0			/* UINT8 */
	str	x0, [x3]
21:	b 99f				/* reserved */
	nop
22:	uxth	w0, w0			/* UINT16 */
	str	x0, [x3]
23:	b 99f				/* reserved */
	nop
24:	mov	w0, w0			/* UINT32 */
	str	x0, [x3]
25:	b 99f				/* reserved */
	nop
26:	sxtb	x0, w0			/* SINT8 */
	str	x0, [x3]
27:	b 99f				/* reserved */
	nop
28:	sxth	x0, w0			/* SINT16 */
	str	x0, [x3]
29:	b 99f				/* reserved */
	nop
30:	sxtw	x0, w0			/* SINT32 */
	str	x0, [x3]
31:	b 99f				/* reserved */
	nop

	/* Return now that result has been populated. */
99:
	AUTH_LR_WITH_REG(x2)
	ret

	cfi_endproc

	.globl	CNAME(ffi_call_SYSV)
	FFI_HIDDEN(CNAME(ffi_call_SYSV))
#ifdef __ELF__
	.type	CNAME(ffi_call_SYSV), #function
	.size CNAME(ffi_call_SYSV), .-CNAME(ffi_call_SYSV)
#endif

#if FFI_CLOSURES

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

	.align 4
CNAME(ffi_closure_SYSV_V):
	cfi_startproc
	SIGN_LR
	stp     x29, x30, [sp, #-ffi_closure_SYSV_FS]!
	cfi_adjust_cfa_offset (ffi_closure_SYSV_FS)
	cfi_rel_offset (x29, 0)
	cfi_rel_offset (x30, 8)

	/* Save the argument passing vector registers.  */
	stp     q0, q1, [sp, #16 + 0]
	stp     q2, q3, [sp, #16 + 32]
	stp     q4, q5, [sp, #16 + 64]
	stp     q6, q7, [sp, #16 + 96]
	b	0f
	cfi_endproc

	.globl	CNAME(ffi_closure_SYSV_V)
	FFI_HIDDEN(CNAME(ffi_closure_SYSV_V))
#ifdef __ELF__
	.type	CNAME(ffi_closure_SYSV_V), #function
	.size	CNAME(ffi_closure_SYSV_V), . - CNAME(ffi_closure_SYSV_V)
#endif

	.align	4
	cfi_startproc
CNAME(ffi_closure_SYSV):
	SIGN_LR
	stp     x29, x30, [sp, #-ffi_closure_SYSV_FS]!
	cfi_adjust_cfa_offset (ffi_closure_SYSV_FS)
	cfi_rel_offset (x29, 0)
	cfi_rel_offset (x30, 8)
0:
	mov     x29, sp

	/* Save the argument passing core registers.  */
	stp     x0, x1, [sp, #16 + 16*N_V_ARG_REG + 0]
	stp     x2, x3, [sp, #16 + 16*N_V_ARG_REG + 16]
	stp     x4, x5, [sp, #16 + 16*N_V_ARG_REG + 32]
	stp     x6, x7, [sp, #16 + 16*N_V_ARG_REG + 48]

	/* Load ffi_closure_inner arguments.  */
	ldp	PTR_REG(0), PTR_REG(1), [x17, #FFI_TRAMPOLINE_CLOSURE_OFFSET]	/* load cif, fn */
	ldr	PTR_REG(2), [x17, #FFI_TRAMPOLINE_CLOSURE_OFFSET+PTR_SIZE*2]	/* load user_data */
#ifdef FFI_GO_CLOSURES
L(do_closure):
#endif
	add	x3, sp, #16				/* load context */
	add	x4, sp, #ffi_closure_SYSV_FS		/* load stack */
	add	x5, sp, #16+CALL_CONTEXT_SIZE		/* load rvalue */
	mov	x6, x8					/* load struct_rval */
	bl      CNAME(ffi_closure_SYSV_inner)

	/* Load the return value as directed.  */
	adr	x1, 0f
	and	w0, w0, #AARCH64_RET_MASK
	add	x1, x1, x0, lsl #3
	add	x3, sp, #16+CALL_CONTEXT_SIZE
	br	x1

	/* Note that each table entry is 2 insns, and thus 8 bytes.  */
	.align	4
0:	b	99f			/* VOID */
	nop
1:	ldr	x0, [x3]		/* INT64 */
	b	99f
2:	ldp	x0, x1, [x3]		/* INT128 */
	b	99f
3:	brk	#1000			/* UNUSED */
	nop
4:	brk	#1000			/* UNUSED */
	nop
5:	brk	#1000			/* UNUSED */
	nop
6:	brk	#1000			/* UNUSED */
	nop
7:	brk	#1000			/* UNUSED */
	nop
8:	ldr	s3, [x3, #12]		/* S4 */
	nop
9:	ldr	s2, [x3, #8]		/* S3 */
	nop
10:	ldp	s0, s1, [x3]		/* S2 */
	b	99f
11:	ldr	s0, [x3]		/* S1 */
	b	99f
12:	ldr	d3, [x3, #24]		/* D4 */
	nop
13:	ldr	d2, [x3, #16]		/* D3 */
	nop
14:	ldp	d0, d1, [x3]		/* D2 */
	b	99f
15:	ldr	d0, [x3]		/* D1 */
	b	99f
16:	ldr	q3, [x3, #48]		/* Q4 */
	nop
17:	ldr	q2, [x3, #32]		/* Q3 */
	nop
18:	ldp	q0, q1, [x3]		/* Q2 */
	b	99f
19:	ldr	q0, [x3]		/* Q1 */
	b	99f
20:	ldrb	w0, [x3, #BE(7)]	/* UINT8 */
	b	99f
21:	brk	#1000			/* reserved */
	nop
22:	ldrh	w0, [x3, #BE(6)]	/* UINT16 */
	b	99f
23:	brk	#1000			/* reserved */
	nop
24:	ldr	w0, [x3, #BE(4)]	/* UINT32 */
	b	99f
25:	brk	#1000			/* reserved */
	nop
26:	ldrsb	x0, [x3, #BE(7)]	/* SINT8 */
	b	99f
27:	brk	#1000			/* reserved */
	nop
28:	ldrsh	x0, [x3, #BE(6)]	/* SINT16 */
	b	99f
29:	brk	#1000			/* reserved */
	nop
30:	ldrsw	x0, [x3, #BE(4)]	/* SINT32 */
	nop
31:					/* reserved */
99:	ldp     x29, x30, [sp], #ffi_closure_SYSV_FS
	cfi_adjust_cfa_offset (-ffi_closure_SYSV_FS)
	cfi_restore (x29)
	cfi_restore (x30)
	AUTH_LR_AND_RET
	cfi_endproc

	.globl	CNAME(ffi_closure_SYSV)
	FFI_HIDDEN(CNAME(ffi_closure_SYSV))
#ifdef __ELF__
	.type	CNAME(ffi_closure_SYSV), #function
	.size	CNAME(ffi_closure_SYSV), . - CNAME(ffi_closure_SYSV)
#endif

#if defined(FFI_EXEC_STATIC_TRAMP)
	.align 4
CNAME(ffi_closure_SYSV_V_alt):
	/* See the comments above trampoline_code_table. */
	ldr	x17, [sp, #8]			/* Load closure in x17 */
	add	sp, sp, #16			/* Restore the stack */
	b	CNAME(ffi_closure_SYSV_V)

	.globl	CNAME(ffi_closure_SYSV_V_alt)
	FFI_HIDDEN(CNAME(ffi_closure_SYSV_V_alt))
#ifdef __ELF__
	.type	CNAME(ffi_closure_SYSV_V_alt), #function
	.size	CNAME(ffi_closure_SYSV_V_alt), . - CNAME(ffi_closure_SYSV_V_alt)
#endif

	.align 4
CNAME(ffi_closure_SYSV_alt):
	/* See the comments above trampoline_code_table. */
	ldr	x17, [sp, #8]			/* Load closure in x17 */
	add	sp, sp, #16			/* Restore the stack */
	b	CNAME(ffi_closure_SYSV)

	.globl	CNAME(ffi_closure_SYSV_alt)
	FFI_HIDDEN(CNAME(ffi_closure_SYSV_alt))
#ifdef __ELF__
	.type	CNAME(ffi_closure_SYSV_alt), #function
	.size	CNAME(ffi_closure_SYSV_alt), . - CNAME(ffi_closure_SYSV_alt)
#endif

/*
 * Below is the definition of the trampoline code table. Each element in
 * the code table is a trampoline.
 */
/*
 * The trampoline uses register x17. It saves the original value of x17 on
 * the stack.
 *
 * The trampoline has two parameters - target code to jump to and data for
 * the target code. The trampoline extracts the parameters from its parameter
 * block (see tramp_table_map()). The trampoline saves the data address on
 * the stack. Finally, it jumps to the target code.
 *
 * The target code can choose to:
 *
 * - restore the value of x17
 * - load the data address in a register
 * - restore the stack pointer to what it was when the trampoline was invoked.
 */
	.align	AARCH64_TRAMP_MAP_SHIFT
CNAME(trampoline_code_table):
	.rept	AARCH64_TRAMP_MAP_SIZE / AARCH64_TRAMP_SIZE
	sub	sp, sp, #16		/* Make space on the stack */
	str	x17, [sp]		/* Save x17 on stack */
	adr	x17, #16376		/* Get data address */
	ldr	x17, [x17]		/* Copy data into x17 */
	str	x17, [sp, #8]		/* Save data on stack */
	adr	x17, #16372		/* Get code address */
	ldr	x17, [x17]		/* Load code address into x17 */
	br	x17			/* Jump to code */
	.endr

	.globl CNAME(trampoline_code_table)
	FFI_HIDDEN(CNAME(trampoline_code_table))
#ifdef __ELF__
	.type	CNAME(trampoline_code_table), #function
	.size	CNAME(trampoline_code_table), . - CNAME(trampoline_code_table)
#endif
	.align	AARCH64_TRAMP_MAP_SHIFT
#endif /* FFI_EXEC_STATIC_TRAMP */

#if FFI_EXEC_TRAMPOLINE_TABLE

#ifdef __MACH__
#include <mach/machine/vm_param.h>
    .align PAGE_MAX_SHIFT
CNAME(ffi_closure_trampoline_table_page):
    .rept PAGE_MAX_SIZE / FFI_TRAMPOLINE_SIZE
    adr x16, -PAGE_MAX_SIZE
    ldp x17, x16, [x16]
    br x16
	nop		/* each entry in the trampoline config page is 2*sizeof(void*) so the trampoline itself cannot be smaller than 16 bytes */
    .endr

    .globl CNAME(ffi_closure_trampoline_table_page)
    FFI_HIDDEN(CNAME(ffi_closure_trampoline_table_page))
    #ifdef __ELF__
    	.type	CNAME(ffi_closure_trampoline_table_page), #function
    	.size	CNAME(ffi_closure_trampoline_table_page), . - CNAME(ffi_closure_trampoline_table_page)
    #endif
#endif

#endif /* FFI_EXEC_TRAMPOLINE_TABLE */

#ifdef FFI_GO_CLOSURES
	.align 4
CNAME(ffi_go_closure_SYSV_V):
	cfi_startproc
	stp     x29, x30, [sp, #-ffi_closure_SYSV_FS]!
	cfi_adjust_cfa_offset (ffi_closure_SYSV_FS)
	cfi_rel_offset (x29, 0)
	cfi_rel_offset (x30, 8)

	/* Save the argument passing vector registers.  */
	stp     q0, q1, [sp, #16 + 0]
	stp     q2, q3, [sp, #16 + 32]
	stp     q4, q5, [sp, #16 + 64]
	stp     q6, q7, [sp, #16 + 96]
	b	0f
	cfi_endproc

	.globl	CNAME(ffi_go_closure_SYSV_V)
	FFI_HIDDEN(CNAME(ffi_go_closure_SYSV_V))
#ifdef __ELF__
	.type	CNAME(ffi_go_closure_SYSV_V), #function
	.size	CNAME(ffi_go_closure_SYSV_V), . - CNAME(ffi_go_closure_SYSV_V)
#endif

	.align	4
	cfi_startproc
CNAME(ffi_go_closure_SYSV):
	stp     x29, x30, [sp, #-ffi_closure_SYSV_FS]!
	cfi_adjust_cfa_offset (ffi_closure_SYSV_FS)
	cfi_rel_offset (x29, 0)
	cfi_rel_offset (x30, 8)
0:
	mov     x29, sp

	/* Save the argument passing core registers.  */
	stp     x0, x1, [sp, #16 + 16*N_V_ARG_REG + 0]
	stp     x2, x3, [sp, #16 + 16*N_V_ARG_REG + 16]
	stp     x4, x5, [sp, #16 + 16*N_V_ARG_REG + 32]
	stp     x6, x7, [sp, #16 + 16*N_V_ARG_REG + 48]

	/* Load ffi_closure_inner arguments.  */
	ldp	PTR_REG(0), PTR_REG(1), [x18, #PTR_SIZE]/* load cif, fn */
	mov	x2, x18					/* load user_data */
	b	L(do_closure)
	cfi_endproc

	.globl	CNAME(ffi_go_closure_SYSV)
	FFI_HIDDEN(CNAME(ffi_go_closure_SYSV))
#ifdef __ELF__
	.type	CNAME(ffi_go_closure_SYSV), #function
	.size	CNAME(ffi_go_closure_SYSV), . - CNAME(ffi_go_closure_SYSV)
#endif
#endif /* FFI_GO_CLOSURES */
#endif /* FFI_CLOSURES */
#endif /* __arm64__ */

#if defined __ELF__ && defined __linux__
	.section .note.GNU-stack,"",%progbits
#endif

