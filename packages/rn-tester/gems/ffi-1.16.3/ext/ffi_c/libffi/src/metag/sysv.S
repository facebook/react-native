/* -----------------------------------------------------------------------
   sysv.S - Copyright (c) 2013 Imagination Technologies Ltd.

   Meta Foreign Function Interface

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
#ifdef HAVE_MACHINE_ASM_H
#include <machine/asm.h>
#else
#ifdef __USER_LABEL_PREFIX__
#define CONCAT1(a, b) CONCAT2(a, b)
#define CONCAT2(a, b) a ## b

/* Use the right prefix for global labels. */
#define CNAME(x) CONCAT1 (__USER_LABEL_PREFIX__, x)
#else
#define CNAME(x) x
#endif
#define ENTRY(x) .globl CNAME(x); .type CNAME(x), %function; CNAME(x):
#endif

#ifdef __ELF__
#define LSYM(x) .x
#else
#define LSYM(x) x
#endif

.macro call_reg x=
	.text
	.balign 4
	mov D1RtP, \x
	swap D1RtP, PC
.endm

! Save register arguments
.macro SAVE_ARGS
	.text
	.balign 4
	setl	[A0StP++], D0Ar6, D1Ar5
	setl	[A0StP++], D0Ar4, D1Ar3
	setl	[A0StP++], D0Ar2, D1Ar1
.endm

! Save retrun, frame pointer and other regs
.macro SAVE_REGS regs=
	.text
	.balign 4
	setl	[A0StP++], D0FrT, D1RtP
	! Needs to be a pair of regs
	.ifnc "\regs",""
	setl	[A0StP++], \regs
	.endif
.endm

! Declare a global function
.macro METAG_FUNC_START name
	.text
	.balign 4
	ENTRY(\name)
.endm

! Return registers from the stack. Reverse SAVE_REGS operation
.macro RET_REGS regs=, cond=
	.ifnc "\regs", ""
	getl	\regs, [--A0StP]
	.endif
	getl	D0FrT, D1RtP, [--A0StP]
.endm

! Return arguments
.macro RET_ARGS
	getl	D0Ar2, D1Ar1, [--A0StP]
	getl	D0Ar4, D1Ar3, [--A0StP]
	getl	D0Ar6, D1Ar5, [--A0StP]
.endm


	! D1Ar1:	fn
	! D0Ar2:	&ecif
	! D1Ar3:	cif->bytes
	! D0Ar4:	fig->flags
	! D1Ar5:	ecif.rvalue

	! This assumes we are using GNU as
METAG_FUNC_START ffi_call_SYSV
	! Save argument registers

	SAVE_ARGS

	! new frame
	mov	D0FrT, A0FrP
	add     A0FrP, A0StP, #0

	! Preserve the old frame pointer
	SAVE_REGS "D1.5, D0.5"

	! Make room for new args. cifs->bytes is the total space for input
	! and return arguments

	add	A0StP, A0StP, D1Ar3

	! Preserve cifs->bytes & fn
	mov	D0.5, D1Ar3
	mov	D1.5, D1Ar1

	! Place all of the ffi_prep_args in position
	mov	D1Ar1, A0StP

	! Call ffi_prep_args(stack, &ecif)
#ifdef __PIC__
	callr  D1RtP, CNAME(ffi_prep_args@PLT)
#else
	callr  D1RtP, CNAME(ffi_prep_args)
#endif

	! Restore fn pointer

	! The foreign stack should look like this
	! XXXXX XXXXXX <--- stack pointer
	! FnArgN rvalue
	! FnArgN+2 FnArgN+1
	! FnArgN+4 FnArgN+3
	! ....
	!

	! A0StP now points to the first (or return) argument + 4

	! Preserve cif->bytes
	getl	D0Ar2, D1Ar1, [--A0StP]
	getl	D0Ar4, D1Ar3, [--A0StP]
	getl	D0Ar6, D1Ar5, [--A0StP]

	! Place A0StP to the first argument again
	add	A0StP, A0StP, #24 ! That's because we loaded 6 regs x 4 byte each

	! A0FrP points to the initial stack without the reserved space for the
	! cifs->bytes, whilst A0StP points to the stack after the space allocation

	! fn was the first argument of ffi_call_SYSV.
	! The stack at this point looks like this:
	!
	! A0StP(on entry to _SYSV) ->	Arg6	Arg5     | low
	!				Arg4	Arg3     |
	! 				Arg2	Arg1     |
	! A0FrP ---->			D0FrtP	D1RtP    |
	!				D1.5	D0.5	 |
	! A0StP(bf prep_args) ->	FnArgn	FnArgn-1 |
	!				FnArgn-2FnArgn-3 |
	!				................ | <= cifs->bytes
	!				FnArg4  FnArg3	 |
	! A0StP (prv_A0StP+cifs->bytes) FnArg2  FnArg1   | high
	!
	! fn was in Arg1 so it's located in in A0FrP+#-0xC
	!

	! D0Re0 contains the size of arguments stored in registers
	sub	A0StP, A0StP, D0Re0

	! Arg1 is the function pointer for the foreign call. This has been
	! preserved in D1.5

	! Time to call (fn). Arguments should be like this:
	! Arg1-Arg6 are loaded to regs
	! The rest of the arguments are stored in stack pointed by A0StP

	call_reg D1.5

	! Reset stack.

	mov	A0StP, A0FrP

	! Load Arg1 with the pointer to storage for the return type
	! This was stored in Arg5

	getd	D1Ar1, [A0FrP+#-20]

	! Load D0Ar2 with the return type code. This was stored in Arg4 (flags)

	getd	D0Ar2, [A0FrP+#-16]

	! We are ready to start processing the return value
	! D0Re0 (and D1Re0) hold the return value

	! If the return value is NULL, assume no return value
	cmp	D1Ar1, #0
	beq	LSYM(Lepilogue)

	! return INT
	cmp		D0Ar2, #FFI_TYPE_INT
	! Sadly, there is no setd{cc} instruction so we need to workaround that
	bne	.INT64
	setd	[D1Ar1], D0Re0
	b	LSYM(Lepilogue)

	! return INT64
.INT64:
	cmp	D0Ar2, #FFI_TYPE_SINT64
	setleq	[D1Ar1], D0Re0, D1Re0

	! return DOUBLE
	cmp	D0Ar2, #FFI_TYPE_DOUBLE
	setl	[D1AR1++], D0Re0, D1Re0

LSYM(Lepilogue):
	! At this point, the stack pointer points right after the argument
	! saved area. We need to restore 4 regs, therefore we need to move
	! 16 bytes ahead.
	add     A0StP, A0StP, #16
	RET_REGS "D1.5, D0.5"
	RET_ARGS
	getd	D0Re0, [A0StP]
	mov     A0FrP, D0FrT
	swap	D1RtP, PC

.ffi_call_SYSV_end:
       .size   CNAME(ffi_call_SYSV),.ffi_call_SYSV_end-CNAME(ffi_call_SYSV)


/*
	(called by ffi_metag_trampoline)
	void ffi_closure_SYSV (ffi_closure*)

	(called by ffi_closure_SYSV)
	unsigned int FFI_HIDDEN
	ffi_closure_SYSV_inner (closure,respp, args)
		ffi_closure *closure;
		void **respp;
		void *args;
*/

METAG_FUNC_START ffi_closure_SYSV
	! We assume that D1Ar1 holds the address of the
	! ffi_closure struct. We will use that to fetch the
	! arguments. The stack pointer points to an empty space
	! and it is ready to store more data.

	! D1Ar1 is ready
	! Allocate stack space for return value
	add A0StP, A0StP, #8
	! Store it to D0Ar2
	sub D0Ar2, A0StP, #8

	sub D1Ar3, A0FrP, #4

	! D1Ar3 contains the address of the original D1Ar1 argument
	! We need to subtract #4 later on

	! Preverve D0Ar2
	mov D0.5, D0Ar2

#ifdef __PIC__
	callr D1RtP, CNAME(ffi_closure_SYSV_inner@PLT)
#else
	callr D1RtP, CNAME(ffi_closure_SYSV_inner)
#endif

	! Check the return value and store it to D0.5
	cmp D0Re0, #FFI_TYPE_INT
	beq .Lretint
	cmp D0Re0, #FFI_TYPE_DOUBLE
	beq .Lretdouble
.Lclosure_epilogue:
	sub A0StP, A0StP, #8
	RET_REGS "D1.5, D0.5"
	RET_ARGS
	swap	D1RtP, PC

.Lretint:
	setd [D0.5], D0Re0
	b .Lclosure_epilogue
.Lretdouble:
	setl [D0.5++], D0Re0, D1Re0
	b .Lclosure_epilogue
.ffi_closure_SYSV_end:
.size CNAME(ffi_closure_SYSV),.ffi_closure_SYSV_end-CNAME(ffi_closure_SYSV)


ENTRY(ffi_metag_trampoline)
	SAVE_ARGS
	! New frame
	mov A0FrP, A0StP
	SAVE_REGS "D1.5, D0.5"
	mov D0.5, PC
	! Load D1Ar1 the value of ffi_metag_trampoline
	getd D1Ar1, [D0.5 + #8]
	! Jump to ffi_closure_SYSV
	getd PC, [D0.5 + #12]
