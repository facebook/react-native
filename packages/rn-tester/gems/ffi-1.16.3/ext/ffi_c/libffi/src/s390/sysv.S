/* -----------------------------------------------------------------------
   sysv.S - Copyright (c) 2000 Software AG
            Copyright (c) 2008 Red Hat, Inc.

   S390 Foreign Function Interface

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

	.text

#ifndef __s390x__

	# r2:	frame
	# r3:	ret_type
	# r4:	ret_addr
	# r5:	fun
	# r6:	closure

	# This assumes we are using gas.
	.balign	8
	.globl	ffi_call_SYSV
	FFI_HIDDEN(ffi_call_SYSV)
	.type	ffi_call_SYSV,%function
ffi_call_SYSV:
	.cfi_startproc
	st	%r6,44(%r2)			# Save registers
	stm	%r12,%r14,48(%r2)
	lr	%r13,%r2			# Install frame pointer
	.cfi_rel_offset r6, 44
	.cfi_rel_offset r12, 48
	.cfi_rel_offset r13, 52
	.cfi_rel_offset r14, 56
	.cfi_def_cfa_register r13
	st	%r2,0(%r15)			# Set up back chain
	sla	%r3,3				# ret_type *= 8
	lr	%r12,%r4			# Save ret_addr
	lr	%r1,%r5				# Save fun
	lr	%r0,%r6				# Install static chain

	# Set return address, so that there is only one indirect jump.
#ifdef HAVE_AS_S390_ZARCH
	larl	%r14,.Ltable
	ar	%r14,%r3
#else
	basr	%r14,0
0:	la	%r14,.Ltable-0b(%r14,%r3)
#endif

	lm	%r2,%r6,8(%r13)			# Load arguments
	ld	%f0,64(%r13)
	ld	%f2,72(%r13)
	br	%r1				# ... and call function

	.balign	8
.Ltable:
# FFI390_RET_DOUBLE
	std	%f0,0(%r12)
	j	.Ldone

	.balign	8
# FFI390_RET_FLOAT
	ste	%f0,0(%r12)
	j	.Ldone

	.balign	8
# FFI390_RET_INT64
	st	%r3,4(%r12)
	nop
	# fallthru

	.balign	8
# FFI390_RET_INT32
	st	%r2,0(%r12)
	nop
	# fallthru

	.balign	8
# FFI390_RET_VOID
.Ldone:
	l	%r14,56(%r13)
	l	%r12,48(%r13)
	l	%r6,44(%r13)
	l	%r13,52(%r13)
	.cfi_restore 14
	.cfi_restore 13
	.cfi_restore 12
	.cfi_restore 6
	.cfi_def_cfa r15, 96
	br	%r14
	.cfi_endproc
	.size	 ffi_call_SYSV,.-ffi_call_SYSV


	.balign	8
	.globl	ffi_go_closure_SYSV
	FFI_HIDDEN(ffi_go_closure_SYSV)
	.type	ffi_go_closure_SYSV,%function
ffi_go_closure_SYSV:
	.cfi_startproc
	stm	%r2,%r6,8(%r15)			# Save arguments
	lr	%r4,%r0				# Load closure -> user_data
	l	%r2,4(%r4)			#   ->cif
	l	%r3,8(%r4)			#   ->fun
	j	.Ldoclosure
	.cfi_endproc

	.balign	8
	.globl	ffi_closure_SYSV
	FFI_HIDDEN(ffi_closure_SYSV)
	.type	ffi_closure_SYSV,%function
ffi_closure_SYSV:
	.cfi_startproc
	stm	%r2,%r6,8(%r15)			# Save arguments
	lr	%r4,%r0				# Closure
	l	%r2,16(%r4)			#   ->cif
	l	%r3,20(%r4)			#   ->fun
	l	%r4,24(%r4)			#   ->user_data
.Ldoclosure:
	stm	%r12,%r15,48(%r15)		# Save registers
	lr	%r12,%r15
	.cfi_def_cfa_register r12
	.cfi_rel_offset r6, 24
	.cfi_rel_offset r12, 48
	.cfi_rel_offset r13, 52
	.cfi_rel_offset r14, 56
	.cfi_rel_offset r15, 60
#ifndef HAVE_AS_S390_ZARCH
	basr	%r13,0				# Set up base register
.Lcbase:
	l	%r1,.Lchelper-.Lcbase(%r13)	# Get helper function
#endif
	ahi	%r15,-96-8			# Set up stack frame
	st	%r12,0(%r15)			# Set up back chain

	std	%f0,64(%r12)			# Save fp arguments
	std	%f2,72(%r12)

	la	%r5,96(%r12)			# Overflow
	st	%r5,96(%r15)
	la	%r6,64(%r12)			# FPRs
	la	%r5,8(%r12)			# GPRs
#ifdef HAVE_AS_S390_ZARCH
	brasl	%r14,ffi_closure_helper_SYSV
#else
	bas	%r14,0(%r1,%r13)		# Call helper
#endif

	lr	%r15,%r12
	.cfi_def_cfa_register r15
	lm	%r12,%r14,48(%r12)		# Restore saved registers
	l	%r6,24(%r15)
	ld	%f0,64(%r15)			# Load return registers
	lm	%r2,%r3,8(%r15)
	br	%r14
	.cfi_endproc

#ifndef HAVE_AS_S390_ZARCH
	.align 4
.Lchelper:
	.long	ffi_closure_helper_SYSV-.Lcbase
#endif

	.size	 ffi_closure_SYSV,.-ffi_closure_SYSV

#else

	# r2:	frame
	# r3:	ret_type
	# r4:	ret_addr
	# r5:	fun
	# r6:	closure

	# This assumes we are using gas.
	.balign	8
	.globl	ffi_call_SYSV
	FFI_HIDDEN(ffi_call_SYSV)
	.type	ffi_call_SYSV,%function
ffi_call_SYSV:
	.cfi_startproc
	stg	%r6,88(%r2)			# Save registers
	stmg	%r12,%r14,96(%r2)
	lgr	%r13,%r2			# Install frame pointer
	.cfi_rel_offset r6, 88
	.cfi_rel_offset r12, 96
	.cfi_rel_offset r13, 104
	.cfi_rel_offset r14, 112
	.cfi_def_cfa_register r13
	stg	%r2,0(%r15)			# Set up back chain
	larl	%r14,.Ltable			# Set up return address
	slag	%r3,%r3,3			# ret_type *= 8
	lgr	%r12,%r4			# Save ret_addr
	lgr	%r1,%r5				# Save fun
	lgr	%r0,%r6				# Install static chain
	agr	%r14,%r3
	lmg	%r2,%r6,16(%r13)		# Load arguments
	ld	%f0,128(%r13)
	ld	%f2,136(%r13)
	ld	%f4,144(%r13)
	ld	%f6,152(%r13)
	br	%r1				# ... and call function

	.balign	8
.Ltable:
# FFI390_RET_DOUBLE
	std	%f0,0(%r12)
	j	.Ldone

	.balign	8
# FFI390_RET_DOUBLE
	ste	%f0,0(%r12)
	j	.Ldone

	.balign	8
# FFI390_RET_INT64
	stg	%r2,0(%r12)

	.balign	8
# FFI390_RET_INT32
	# Never used, as we always store type ffi_arg.
	# But the stg above is 6 bytes and we cannot
	# jump around this case, so fall through.
	nop
	nop

	.balign	8
# FFI390_RET_VOID
.Ldone:
	lg	%r14,112(%r13)
	lg	%r12,96(%r13)
	lg	%r6,88(%r13)
	lg	%r13,104(%r13)
	.cfi_restore r14
	.cfi_restore r13
	.cfi_restore r12
	.cfi_restore r6
	.cfi_def_cfa r15, 160
	br	%r14
	.cfi_endproc
	.size	 ffi_call_SYSV,.-ffi_call_SYSV


	.balign	8
	.globl	ffi_go_closure_SYSV
	FFI_HIDDEN(ffi_go_closure_SYSV)
	.type	ffi_go_closure_SYSV,%function
ffi_go_closure_SYSV:
	.cfi_startproc
	stmg	%r2,%r6,16(%r15)		# Save arguments
	lgr	%r4,%r0				# Load closure -> user_data
	lg	%r2,8(%r4)			#   ->cif
	lg	%r3,16(%r4)			#   ->fun
	j	.Ldoclosure
	.cfi_endproc
	.size	 ffi_go_closure_SYSV,.-ffi_go_closure_SYSV


	.balign	8
	.globl	ffi_closure_SYSV
	FFI_HIDDEN(ffi_closure_SYSV)
	.type	ffi_closure_SYSV,%function
ffi_closure_SYSV:
	.cfi_startproc
	stmg	%r2,%r6,16(%r15)		# Save arguments
	lgr	%r4,%r0				# Load closure
	lg	%r2,32(%r4)			#   ->cif
	lg	%r3,40(%r4)			#   ->fun
	lg	%r4,48(%r4)			#   ->user_data
.Ldoclosure:
	stmg	%r13,%r15,104(%r15)		# Save registers
	lgr	%r13,%r15
	.cfi_def_cfa_register r13
	.cfi_rel_offset r6, 48
	.cfi_rel_offset r13, 104
	.cfi_rel_offset r14, 112
	.cfi_rel_offset r15, 120
	aghi	%r15,-160-16			# Set up stack frame
	stg	%r13,0(%r15)			# Set up back chain

	std	%f0,128(%r13)			# Save fp arguments
	std	%f2,136(%r13)
	std	%f4,144(%r13)
	std	%f6,152(%r13)
	la	%r5,160(%r13)			# Overflow
	stg	%r5,160(%r15)
	la	%r6,128(%r13)			# FPRs
	la	%r5,16(%r13)			# GPRs
	brasl	%r14,ffi_closure_helper_SYSV	# Call helper

	lgr	%r15,%r13
	.cfi_def_cfa_register r15
	lmg	%r13,%r14,104(%r13)		# Restore saved registers
	lg	%r6,48(%r15)
	ld	%f0,128(%r15)			# Load return registers
	lg	%r2,16(%r15)
	br	%r14
	.cfi_endproc
	.size	 ffi_closure_SYSV,.-ffi_closure_SYSV
#endif /* !s390x */

#if defined __ELF__ && defined __linux__
	.section	.note.GNU-stack,"",@progbits
#endif
