/* -----------------------------------------------------------------------
   n32.S - Copyright (c) 1996, 1998, 2005, 2007, 2009, 2010  Red Hat, Inc.
   
   MIPS Foreign Function Interface 

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

/* Only build this code if we are compiling for n32 */	

#if defined(FFI_MIPS_N32)

#define callback a0
#define bytes	 a2
#define flags	 a3
#define raddr    a4
#define fn       a5
#define closure  a6

/* Note: to keep stack 16 byte aligned we need even number slots 
   used 9 slots here
*/
#define SIZEOF_FRAME	( 10 * FFI_SIZEOF_ARG )

#ifdef __GNUC__
	.abicalls
#endif
#if !defined(__mips_isa_rev) || (__mips_isa_rev<6)
	.set mips4
#endif
	.text
	.align	2
	.globl	ffi_call_N32
	.ent	ffi_call_N32
ffi_call_N32:	
.LFB0:
	.frame	$fp, SIZEOF_FRAME, ra
	.mask	0xc0000000,-FFI_SIZEOF_ARG
	.fmask	0x00000000,0

	# Prologue
	SUBU	$sp, SIZEOF_FRAME			# Frame size
.LCFI00:
	REG_S	$fp, SIZEOF_FRAME - 2*FFI_SIZEOF_ARG($sp)	# Save frame pointer
	REG_S	ra, SIZEOF_FRAME - 1*FFI_SIZEOF_ARG($sp)	# Save return address
.LCFI01:
	move	$fp, $sp
.LCFI02:
	move	t9, callback	# callback function pointer
	REG_S	bytes, 2*FFI_SIZEOF_ARG($fp) # bytes
	REG_S	flags, 3*FFI_SIZEOF_ARG($fp) # flags
	REG_S	raddr, 4*FFI_SIZEOF_ARG($fp) # raddr
	REG_S	fn,    5*FFI_SIZEOF_ARG($fp) # fn
	REG_S	closure, 6*FFI_SIZEOF_ARG($fp) # closure

	# Allocate at least 4 words in the argstack
	move	v0, bytes
	bge	bytes, 4 * FFI_SIZEOF_ARG, bigger	
	LI	v0, 4 * FFI_SIZEOF_ARG
	b	sixteen

	bigger:	
	ADDU	t4, v0, 2 * FFI_SIZEOF_ARG -1	# make sure it is aligned 
	and	v0, t4, -2 * FFI_SIZEOF_ARG		# to a proper boundry.

sixteen:
	SUBU	$sp, $sp, v0	# move the stack pointer to reflect the
				# arg space

	move	a0, $sp         # 4 * FFI_SIZEOF_ARG
	ADDU	a3, $fp, 3 * FFI_SIZEOF_ARG

	# Call ffi_prep_args
	jal	t9
	
	# Copy the stack pointer to t9
	move	t9, $sp
	
	# Fix the stack if there are more than 8 64bit slots worth
	# of arguments.

	# Load the number of bytes
	REG_L	t6, 2*FFI_SIZEOF_ARG($fp)

	# Is it bigger than 8 * FFI_SIZEOF_ARG?
	daddiu	t8, t6, -(8 * FFI_SIZEOF_ARG)
	bltz	t8, loadregs

	ADDU	t9, t9, t8
	
loadregs:	

	REG_L	t6, 3*FFI_SIZEOF_ARG($fp)  # load the flags word into t6.

	# when retval is _Complex long double, $f12/$a0, $f13/$a1 will be skipped
	# no idea why, but gcc does it.
	SRL	t4, t6, 8*FFI_FLAG_BITS
	move	t8, t6
	bne	t4, FFI_TYPE_COMPLEX_LDLD, loadregs1

	SLL	t8, t6, 2*FFI_FLAG_BITS


loadregs1:
#ifdef __mips_soft_float
	REG_L	a0, 0*FFI_SIZEOF_ARG(t9)
	REG_L	a1, 1*FFI_SIZEOF_ARG(t9)
	REG_L	a2, 2*FFI_SIZEOF_ARG(t9)
	REG_L	a3, 3*FFI_SIZEOF_ARG(t9)
	REG_L	a4, 4*FFI_SIZEOF_ARG(t9)
	REG_L	a5, 5*FFI_SIZEOF_ARG(t9)
	REG_L	a6, 6*FFI_SIZEOF_ARG(t9)
	REG_L	a7, 7*FFI_SIZEOF_ARG(t9)
#else
	and	t4, t8, ((1<<FFI_FLAG_BITS)-1)
	REG_L	a0, 0*FFI_SIZEOF_ARG(t9)
	beqz	t4, arg1_next
	bne	t4, FFI_TYPE_FLOAT, arg1_doublep
	l.s	$f12, 0*FFI_SIZEOF_ARG(t9)
	b	arg1_next
arg1_doublep:	
	l.d	$f12, 0*FFI_SIZEOF_ARG(t9)
arg1_next:	
	
	SRL	t4, t8, 1*FFI_FLAG_BITS
	and	t4, ((1<<FFI_FLAG_BITS)-1)
	REG_L	a1, 1*FFI_SIZEOF_ARG(t9)
	beqz	t4, arg2_next
	bne	t4, FFI_TYPE_FLOAT, arg2_doublep
	l.s	$f13, 1*FFI_SIZEOF_ARG(t9)	
	b	arg2_next
arg2_doublep:	
	l.d	$f13, 1*FFI_SIZEOF_ARG(t9)	
arg2_next:	
	
	SRL	t4, t8, 2*FFI_FLAG_BITS
	and	t4, ((1<<FFI_FLAG_BITS)-1)
	REG_L	a2, 2*FFI_SIZEOF_ARG(t9)
	beqz	t4, arg3_next
	bne	t4, FFI_TYPE_FLOAT, arg3_doublep
	l.s	$f14, 2*FFI_SIZEOF_ARG(t9)	
	b	arg3_next
arg3_doublep:	
	l.d	$f14, 2*FFI_SIZEOF_ARG(t9)	
arg3_next:	
	
	SRL	t4, t8, 3*FFI_FLAG_BITS
	and	t4, ((1<<FFI_FLAG_BITS)-1)
	REG_L	a3, 3*FFI_SIZEOF_ARG(t9)
	beqz	t4, arg4_next
	bne	t4, FFI_TYPE_FLOAT, arg4_doublep
	l.s	$f15, 3*FFI_SIZEOF_ARG(t9)	
	b	arg4_next
arg4_doublep:	
	l.d	$f15, 3*FFI_SIZEOF_ARG(t9)	
arg4_next:	
	
	SRL	t4, t8, 4*FFI_FLAG_BITS
	and	t4, ((1<<FFI_FLAG_BITS)-1)
	REG_L	a4, 4*FFI_SIZEOF_ARG(t9)
	beqz	t4, arg5_next
	bne	t4, FFI_TYPE_FLOAT, arg5_doublep
	l.s	$f16, 4*FFI_SIZEOF_ARG(t9)	
	b	arg5_next
arg5_doublep:	
	l.d	$f16, 4*FFI_SIZEOF_ARG(t9)	
arg5_next:	
	
	SRL	t4, t8, 5*FFI_FLAG_BITS
	and	t4, ((1<<FFI_FLAG_BITS)-1)
	REG_L	a5, 5*FFI_SIZEOF_ARG(t9)
	beqz	t4, arg6_next
	bne	t4, FFI_TYPE_FLOAT, arg6_doublep
	l.s	$f17, 5*FFI_SIZEOF_ARG(t9)	
	b	arg6_next
arg6_doublep:	
	l.d	$f17, 5*FFI_SIZEOF_ARG(t9)	
arg6_next:	
	
	SRL	t4, t8, 6*FFI_FLAG_BITS
	and	t4, ((1<<FFI_FLAG_BITS)-1)
	REG_L	a6, 6*FFI_SIZEOF_ARG(t9)
	beqz	t4, arg7_next
	bne	t4, FFI_TYPE_FLOAT, arg7_doublep
	l.s	$f18, 6*FFI_SIZEOF_ARG(t9)	
	b	arg7_next
arg7_doublep:	
	l.d	$f18, 6*FFI_SIZEOF_ARG(t9)	
arg7_next:	
	
	SRL	t4, t8, 7*FFI_FLAG_BITS
	and	t4, ((1<<FFI_FLAG_BITS)-1)
	REG_L	a7, 7*FFI_SIZEOF_ARG(t9)
	beqz	t4, arg8_next
	bne	t4, FFI_TYPE_FLOAT, arg8_doublep
 	l.s	$f19, 7*FFI_SIZEOF_ARG(t9)	
	b	arg8_next
arg8_doublep:	
 	l.d	$f19, 7*FFI_SIZEOF_ARG(t9)	
arg8_next:	
#endif

callit:
	# Load the function pointer
	REG_L	t9, 5*FFI_SIZEOF_ARG($fp)

	# install the static chain(t7=$15)
	REG_L	t7, 6*FFI_SIZEOF_ARG($fp)

	# If the return value pointer is NULL, assume no return value.
	REG_L	t5, 4*FFI_SIZEOF_ARG($fp)
	beqz	t5, noretval

	# Shift the return type flag over
	SRL	t6, 8*FFI_FLAG_BITS

	beq	t6, FFI_TYPE_SINT32, retint
	bne     t6, FFI_TYPE_INT, retuint32
retint:
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	REG_S	v0, 0(t4)
	b	epilogue

retuint32:
	bne     t6, FFI_TYPE_UINT32, retfloat
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	sw	v0, 0(t4)
	b	epilogue

retfloat:
#ifndef __mips_soft_float
	bne     t6, FFI_TYPE_FLOAT, retdouble
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	s.s	$f0, 0(t4)
	b	epilogue

retdouble:	
	bne	t6, FFI_TYPE_DOUBLE, retstruct_d
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	s.d	$f0, 0(t4)
	b	epilogue

retstruct_d:
	bne	t6, FFI_TYPE_STRUCT_D, retstruct_f
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	s.d	$f0, 0(t4)
	b	epilogue
	
retstruct_f:	
	bne	t6, FFI_TYPE_STRUCT_F, retstruct_d_d
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	s.s	$f0, 0(t4)
	b	epilogue
	
retstruct_d_d:
	bne	t6, FFI_TYPE_STRUCT_DD, retcomplex_d_d
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	s.d	$f0, 0(t4)
	s.d	$f2, 8(t4)
	b	epilogue

retcomplex_d_d:
	bne	t6, FFI_TYPE_COMPLEX_DD, retcomplex_ld_ld
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	s.d	$f0, 0(t4)
	s.d	$f2, 8(t4)
	b	epilogue

retcomplex_ld_ld:
	bne	t6, FFI_TYPE_COMPLEX_LDLD, retstruct_f_f
	jal	t9
	b	epilogue
	
retstruct_f_f:
	bne	t6, FFI_TYPE_STRUCT_FF, retcomplex_f_f
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	s.s	$f0, 0(t4)
	s.s	$f2, 4(t4)
	b	epilogue

retcomplex_f_f:
	bne	t6, FFI_TYPE_COMPLEX_FF, retstruct_d_f
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	s.s	$f0, 0(t4)
	s.s	$f2, 4(t4)
	b	epilogue
	
retstruct_d_f:	
	bne	t6, FFI_TYPE_STRUCT_DF, retstruct_f_d
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	s.d	$f0, 0(t4)
	s.s	$f2, 8(t4)
	b	epilogue
	
retstruct_f_d:	
	bne	t6, FFI_TYPE_STRUCT_FD, retstruct_d_soft
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	s.s	$f0, 0(t4)
	s.d	$f2, 8(t4)
	b	epilogue
#endif

retstruct_d_soft:
	bne	t6, FFI_TYPE_STRUCT_D_SOFT, retstruct_f_soft
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	sd	v0, 0(t4)
	b	epilogue
	
retstruct_f_soft:	
	bne	t6, FFI_TYPE_STRUCT_F_SOFT, retstruct_d_d_soft
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	sw	v0, 0(t4)
	b	epilogue
	
retstruct_d_d_soft:	
	bne	t6, FFI_TYPE_STRUCT_DD_SOFT, retstruct_f_f_soft
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	sd	v0, 0(t4)
	sd	a0, 8(t4) # not typo, it is a0, I have no idea, gcc does do it
	b	epilogue
	
retstruct_f_f_soft:	
	bne	t6, FFI_TYPE_STRUCT_FF_SOFT, retstruct_d_f_soft
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	sw	v0, 0(t4)
	sw	v1, 4(t4)
	b	epilogue
	
retstruct_d_f_soft:	
	bne	t6, FFI_TYPE_STRUCT_DF_SOFT, retstruct_f_d_soft
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	sd	v0, 0(t4)
	sw	v1, 8(t4)
	b	epilogue
	
retstruct_f_d_soft:	
	bne	t6, FFI_TYPE_STRUCT_FD_SOFT, retstruct_small
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	sw	v0, 0(t4)
	sd	a0, 8(t4) # not typo, it is a0, I have no idea, gcc does do it
	b	epilogue
	
retstruct_small:	
	bne	t6, FFI_TYPE_STRUCT_SMALL, retstruct_small2
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	REG_S	v0, 0(t4)
	b	epilogue
	
retstruct_small2:	
	bne	t6, FFI_TYPE_STRUCT_SMALL2, retlongdouble_soft
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	REG_S	v0, 0(t4)
	REG_S	v1, 8(t4)
	b	epilogue
	
retlongdouble_soft:
	bne	t6, FFI_TYPE_LONGDOUBLE, retcomplex_small
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	REG_S	v0, 0(t4)
	REG_S	a0, 8(t4) # not typo, it is a0, I have no idea, gcc does do it
	b	epilogue

retcomplex_small:
	bne	t6, FFI_TYPE_COMPLEX_SMALL, retcomplex_small2
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	REG_S	v0, 0(t4)
	b	epilogue

retcomplex_small2:
	bne	t6, FFI_TYPE_COMPLEX_SMALL2, retstruct
	jal	t9
	REG_L	t4, 4*FFI_SIZEOF_ARG($fp)
	REG_S	v0, 0(t4)
	REG_S	v1, 8(t4)
	b	epilogue

retstruct:
noretval:	
	jal	t9
	
	# Epilogue
epilogue:	
	move	$sp, $fp	
	REG_L	$fp, SIZEOF_FRAME - 2*FFI_SIZEOF_ARG($sp) # Restore frame pointer
	REG_L	ra, SIZEOF_FRAME - 1*FFI_SIZEOF_ARG($sp)  # Restore return address
	ADDU	$sp, SIZEOF_FRAME		      # Fix stack pointer
	j	ra

.LFE0:
	.end	ffi_call_N32

/* ffi_closure_N32. Expects address of the passed-in ffi_closure in t0
   ($12). Stores any arguments passed in registers onto the stack,
   then calls ffi_closure_mips_inner_N32, which then decodes
   them.
	
	Stack layout:

	20 - Start of parameters, original sp
	19 - Called function a7 save
	18 - Called function a6 save
	17 - Called function a5 save
	16 - Called function a4 save
	15 - Called function a3 save
	14 - Called function a2 save
	13 - Called function a1 save
	12 - Called function a0 save
	11 - Called function f19
	10 - Called function f18
	 9 - Called function f17
	 8 - Called function f16
	 7 - Called function f15
         6 - Called function f14
         5 - Called function f13
         4 - Called function f12
	 3 - return value high (v1 or $f2)
	 2 - return value low (v0 or $f0)
	 1 - ra save
	 0 - gp save our sp  points here
	 */

#define SIZEOF_FRAME2	(20 * FFI_SIZEOF_ARG)

#define A7_OFF2		(19 * FFI_SIZEOF_ARG)
#define A6_OFF2		(18 * FFI_SIZEOF_ARG)
#define A5_OFF2		(17 * FFI_SIZEOF_ARG)
#define A4_OFF2		(16 * FFI_SIZEOF_ARG)
#define A3_OFF2		(15 * FFI_SIZEOF_ARG)
#define A2_OFF2		(14 * FFI_SIZEOF_ARG)
#define A1_OFF2		(13 * FFI_SIZEOF_ARG)
#define A0_OFF2		(12 * FFI_SIZEOF_ARG)	

#define F19_OFF2	(11 * FFI_SIZEOF_ARG)
#define F18_OFF2	(10 * FFI_SIZEOF_ARG)
#define F17_OFF2	(9  * FFI_SIZEOF_ARG)
#define F16_OFF2	(8  * FFI_SIZEOF_ARG)
#define F15_OFF2	(7  * FFI_SIZEOF_ARG)
#define F14_OFF2	(6  * FFI_SIZEOF_ARG)
#define F13_OFF2	(5  * FFI_SIZEOF_ARG)
#define F12_OFF2	(4  * FFI_SIZEOF_ARG)

#define V1_OFF2		(3  * FFI_SIZEOF_ARG)
#define V0_OFF2		(2  * FFI_SIZEOF_ARG)

#define RA_OFF2		(1  * FFI_SIZEOF_ARG)
#define GP_OFF2		(0  * FFI_SIZEOF_ARG)

	.align	2
	.globl	ffi_go_closure_N32
	.ent	ffi_go_closure_N32
ffi_go_closure_N32:
.LFB1:
	.frame	$sp, SIZEOF_FRAME2, ra
	.mask	0x90000000,-(SIZEOF_FRAME2 - RA_OFF2)
	.fmask	0x00000000,0
	SUBU	$sp, SIZEOF_FRAME2
.LCFI10:
	.cpsetup t9, GP_OFF2, ffi_go_closure_N32
	REG_S	ra, RA_OFF2($sp)	# Save return address
.LCFI11:

	REG_S	a0, A0_OFF2($sp)
	REG_S	a1, A1_OFF2($sp)
	REG_S	a2, A2_OFF2($sp)
	REG_S	a3, A3_OFF2($sp)
	REG_S	a4, A4_OFF2($sp)
	REG_S	a5, A5_OFF2($sp)

	# Call ffi_closure_mips_inner_N32 to do the real work.
	LA	t9, ffi_closure_mips_inner_N32
#if _MIPS_SIM==_ABIN32
	lw	a0, 4($15)   # cif
	lw	a1, 8($15) # fun
#else
	REG_L	a0, 8($15)   # cif
	REG_L	a1, 16($15) # fun
#endif
	move	a2, t7                     # userdata=closure
	ADDU	a3, $sp, V0_OFF2           # rvalue
	ADDU	a4, $sp, A0_OFF2           # ar
	ADDU	a5, $sp, F12_OFF2          # fpr

	b	$do_closure

.LFE1:	
	.end	ffi_go_closure_N32

	.align	2
	.globl	ffi_closure_N32
	.ent	ffi_closure_N32
ffi_closure_N32:
.LFB2:
	.frame	$sp, SIZEOF_FRAME2, ra
	.mask	0x90000000,-(SIZEOF_FRAME2 - RA_OFF2)
	.fmask	0x00000000,0
	SUBU	$sp, SIZEOF_FRAME2
.LCFI20:
	.cpsetup t9, GP_OFF2, ffi_closure_N32
	REG_S	ra, RA_OFF2($sp)	# Save return address
.LCFI21:
	REG_S	a0, A0_OFF2($sp)
	REG_S	a1, A1_OFF2($sp)
	REG_S	a2, A2_OFF2($sp)
	REG_S	a3, A3_OFF2($sp)
	REG_S	a4, A4_OFF2($sp)
	REG_S	a5, A5_OFF2($sp)

	# Call ffi_closure_mips_inner_N32 to do the real work.
	LA	t9, ffi_closure_mips_inner_N32
#if _MIPS_SIM==_ABIN32
	lw	a0, 20($12)   # cif
	lw	a1, 24($12)   # fun
	lw	a2, 28($12) # user_data
#else
	REG_L	a0, 56($12)   # cif
	REG_L	a1, 64($12)   # fun
	REG_L	a2, 72($12) # user_data
#endif
	ADDU	a3, $sp, V0_OFF2
	# FIXME: a4 does work, while if ret is _Complex long double, it will overwrite Fn_OFF2
	ADDU	a4, $sp, A0_OFF2
	ADDU	a5, $sp, F12_OFF2

$do_closure:
	# Store all possible argument registers. If there are more than
	# fit in registers, then they were stored on the stack.
	REG_S	a6, A6_OFF2($sp)
	REG_S	a7, A7_OFF2($sp)

#ifndef __mips_soft_float
	# Store all possible float/double registers.
	s.d	$f12, F12_OFF2($sp)
	s.d	$f13, F13_OFF2($sp)
	s.d	$f14, F14_OFF2($sp)
	s.d	$f15, F15_OFF2($sp)
	s.d	$f16, F16_OFF2($sp)
	s.d	$f17, F17_OFF2($sp)
	s.d	$f18, F18_OFF2($sp)
	s.d	$f19, F19_OFF2($sp)
#endif

	jalr	t9

	# Return flags are in v0
	bne     v0, FFI_TYPE_SINT32, cls_retuint32
	lw	v0, V0_OFF2($sp)
	b	cls_epilogue

cls_retuint32:
	bne     v0, FFI_TYPE_UINT32, cls_retint
	lwu	v0, V0_OFF2($sp)
	b	cls_epilogue

cls_retint:
	bne     v0, FFI_TYPE_INT, cls_retfloat
	REG_L	v0, V0_OFF2($sp)
	b	cls_epilogue

cls_retfloat:
#ifndef __mips_soft_float
	bne     v0, FFI_TYPE_FLOAT, cls_retdouble
	l.s	$f0, V0_OFF2($sp)
	b	cls_epilogue

cls_retdouble:	
	bne	v0, FFI_TYPE_DOUBLE, cls_retstruct_d
	l.d	$f0, V0_OFF2($sp)
	b	cls_epilogue

cls_retstruct_d:	
	bne	v0, FFI_TYPE_STRUCT_D, cls_retstruct_f
	l.d	$f0, V0_OFF2($sp)
	b	cls_epilogue
	
cls_retstruct_f:	
	bne	v0, FFI_TYPE_STRUCT_F, cls_retstruct_d_d
	l.s	$f0, V0_OFF2($sp)
	b	cls_epilogue
	
cls_retstruct_d_d:	
	bne	v0, FFI_TYPE_STRUCT_DD, cls_retcomplex_d_d
	l.d	$f0, V0_OFF2($sp)
	l.d	$f2, V1_OFF2($sp)
	b	cls_epilogue

cls_retcomplex_d_d:
	bne	v0, FFI_TYPE_COMPLEX_DD, cls_retcomplex_f_f
	l.d	$f0, V0_OFF2($sp)
	l.d	$f2, V1_OFF2($sp)
	b	cls_epilogue
	
cls_retstruct_f_f:
	bne	v0, FFI_TYPE_STRUCT_FF, cls_retcomplex_f_f
	l.s	$f0, V0_OFF2($sp)
	l.s	$f2, V1_OFF2($sp)
	b	cls_epilogue
	
cls_retcomplex_f_f:
	bne	v0, FFI_TYPE_COMPLEX_FF, cls_retstruct_d_f
	l.s	$f0, V0_OFF2($sp)
	l.s	$f2, (V0_OFF2+4)($sp)
	b	cls_epilogue

cls_retstruct_d_f:	
	bne	v0, FFI_TYPE_STRUCT_DF, cls_retstruct_f_d
	l.d	$f0, V0_OFF2($sp)
	l.s	$f2, V1_OFF2($sp)
	b	cls_epilogue
	
cls_retstruct_f_d:	
	bne	v0, FFI_TYPE_STRUCT_FD, cls_retcomplex_ld_ld
	l.s	$f0, V0_OFF2($sp)
	l.d	$f2, V1_OFF2($sp)
	b	cls_epilogue
#else
cls_longdouble_soft:
	bne	v0, FFI_TYPE_LONGDOUBLE, cls_retcomplex_ld_ld
	REG_L	v0, V0_OFF2($sp)
	REG_L	a0, V1_OFF2($sp) # not typo, it is a0, I have no idea, gcc does do it
	b	cls_epilogue
#endif

cls_retcomplex_ld_ld:
	bne	v0, FFI_TYPE_COMPLEX_LDLD, cls_retstruct_small2
	REG_L	t8, A0_OFF2($sp)
	REG_L	t9, 16($sp)
	REG_S	t9, 0(t8)
	REG_L	t9, 24($sp)
	REG_S	t9, 8(t8)
	REG_L	t9, 32($sp)
	REG_S	t9, 16(t8)
	REG_L	t9, 40($sp)
	REG_S	t9, 24(t8)
	b	cls_epilogue

cls_retstruct_small2:	
	REG_L	v0, V0_OFF2($sp)
	REG_L	v1, V1_OFF2($sp)
	
	# Epilogue
cls_epilogue:	
	REG_L	ra,  RA_OFF2($sp)	 # Restore return address
	.cpreturn
	ADDU	$sp, SIZEOF_FRAME2
	j	ra
.LFE2:	
	.end	ffi_closure_N32

#ifdef __GNUC__
        .section        .eh_frame,EH_FRAME_FLAGS,@progbits
.Lframe1:
        .4byte  .LECIE1-.LSCIE1		# length
.LSCIE1:
        .4byte  0x0			# CIE
        .byte   0x1			# Version 1
        .ascii  "\000"			# Augmentation
        .uleb128 0x1			# Code alignment 1
        .sleb128 -4			# Data alignment -4
        .byte   0x1f			# Return Address $31
        .byte   0xc			# DW_CFA_def_cfa
        .uleb128 0x1d			# in $sp
        .uleb128 0x0			# offset 0
        .align  EH_FRAME_ALIGN
.LECIE1:

.LSFDE0:
        .4byte  .LEFDE0-.LASFDE0	# length.
.LASFDE0:
        .4byte  .LASFDE0-.Lframe1	# CIE_pointer.
        FDE_ADDR_BYTES  .LFB0		# initial_location.
        FDE_ADDR_BYTES  .LFE0-.LFB0	# address_range.
        .byte   0x4			# DW_CFA_advance_loc4
        .4byte  .LCFI00-.LFB0		# to .LCFI00
        .byte   0xe			# DW_CFA_def_cfa_offset
        .uleb128 SIZEOF_FRAME		# adjust stack.by SIZEOF_FRAME
        .byte   0x4			# DW_CFA_advance_loc4
        .4byte  .LCFI01-.LCFI00		# to .LCFI01
        .byte   0x9e			# DW_CFA_offset of $fp
        .uleb128 2*FFI_SIZEOF_ARG/4	# 
        .byte   0x9f			# DW_CFA_offset of ra
        .uleb128 1*FFI_SIZEOF_ARG/4	# 
        .byte   0x4			# DW_CFA_advance_loc4
        .4byte  .LCFI02-.LCFI01		# to .LCFI02
        .byte   0xd			# DW_CFA_def_cfa_register
        .uleb128 0x1e			# in $fp
        .align  EH_FRAME_ALIGN
.LEFDE0:

.LSFDE1:
	.4byte	.LEFDE1-.LASFDE1	# length
.LASFDE1:
	.4byte	.LASFDE1-.Lframe1	# CIE_pointer.
	FDE_ADDR_BYTES	.LFB1		# initial_location.
	FDE_ADDR_BYTES	.LFE1-.LFB1	# address_range.
	.byte	0x4			# DW_CFA_advance_loc4
	.4byte	.LCFI10-.LFB1		# to .LCFI10
	.byte	0xe			# DW_CFA_def_cfa_offset
	.uleb128 SIZEOF_FRAME2		# adjust stack.by SIZEOF_FRAME
	.byte	0x4			# DW_CFA_advance_loc4
	.4byte	.LCFI11-.LCFI10		# to .LCFI11
	.byte	0x9c			# DW_CFA_offset of $gp ($28)
	.uleb128 (SIZEOF_FRAME2 - GP_OFF2)/4
	.byte	0x9f			# DW_CFA_offset of ra ($31)
	.uleb128 (SIZEOF_FRAME2 - RA_OFF2)/4
	.align	EH_FRAME_ALIGN
.LEFDE1:

.LSFDE2:
	.4byte	.LEFDE2-.LASFDE2	# length
.LASFDE2:
	.4byte	.LASFDE2-.Lframe1	# CIE_pointer.
	FDE_ADDR_BYTES	.LFB2		# initial_location.
	FDE_ADDR_BYTES	.LFE2-.LFB2	# address_range.
	.byte	0x4			# DW_CFA_advance_loc4
	.4byte	.LCFI20-.LFB2		# to .LCFI20
	.byte	0xe			# DW_CFA_def_cfa_offset
	.uleb128 SIZEOF_FRAME2		# adjust stack.by SIZEOF_FRAME
	.byte	0x4			# DW_CFA_advance_loc4
	.4byte	.LCFI21-.LCFI20		# to .LCFI21
	.byte	0x9c			# DW_CFA_offset of $gp ($28)
	.uleb128 (SIZEOF_FRAME2 - GP_OFF2)/4
	.byte	0x9f			# DW_CFA_offset of ra ($31)
	.uleb128 (SIZEOF_FRAME2 - RA_OFF2)/4
	.align	EH_FRAME_ALIGN
.LEFDE2:
#endif /* __GNUC__ */	
	
#endif
