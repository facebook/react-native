/* -----------------------------------------------------------------------
   o32.S - Copyright (c) 1996, 1998, 2005  Red Hat, Inc.
   
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

/* Only build this code if we are compiling for o32 */	

#if defined(FFI_MIPS_O32)
	
#define callback a0
#define bytes	 a2
#define flags	 a3
		
#define SIZEOF_FRAME	(4 * FFI_SIZEOF_ARG + 2 * FFI_SIZEOF_ARG)
#define A3_OFF		(SIZEOF_FRAME + 3 * FFI_SIZEOF_ARG)
#define FP_OFF		(SIZEOF_FRAME - 2 * FFI_SIZEOF_ARG)
#define RA_OFF		(SIZEOF_FRAME - 1 * FFI_SIZEOF_ARG)

	.abicalls
	.text
	.align	2
	.globl	ffi_call_O32
	.ent	ffi_call_O32
ffi_call_O32:	
$LFB0:
	# Prologue
	SUBU	$sp, SIZEOF_FRAME	# Frame size
$LCFI00:
	REG_S	$fp, FP_OFF($sp)	# Save frame pointer
$LCFI01:
	REG_S	ra, RA_OFF($sp)		# Save return address
$LCFI02:
	move	$fp, $sp

$LCFI03:
	move	t9, callback		# callback function pointer
	REG_S	flags, A3_OFF($fp)	# flags

	# Allocate at least 4 words in the argstack
	LI	v0, 4 * FFI_SIZEOF_ARG
	blt	bytes, v0, sixteen

	ADDU	v0, bytes, 7	# make sure it is aligned 
	and	v0, -8		# to an 8 byte boundry

sixteen:
	SUBU	$sp, v0		# move the stack pointer to reflect the
				# arg space

	ADDU	a0, $sp, 4 * FFI_SIZEOF_ARG

	jalr	t9
	
	REG_L	t0, A3_OFF($fp)		# load the flags word
	SRL	t2, t0, 4		# shift our arg info
	and     t0, ((1<<4)-1)          # mask out the return type
		
	ADDU	$sp, 4 * FFI_SIZEOF_ARG		# adjust $sp to new args

#ifndef __mips_soft_float
	bnez	t0, pass_d			# make it quick for int
#endif
	REG_L	a0, 0*FFI_SIZEOF_ARG($sp)	# just go ahead and load the
	REG_L	a1, 1*FFI_SIZEOF_ARG($sp)	# four regs.
	REG_L	a2, 2*FFI_SIZEOF_ARG($sp)
	REG_L	a3, 3*FFI_SIZEOF_ARG($sp)
	b	call_it

#ifndef __mips_soft_float
pass_d:
	bne	t0, FFI_ARGS_D, pass_f
	l.d	$f12, 0*FFI_SIZEOF_ARG($sp)	# load $fp regs from args
	REG_L	a2,   2*FFI_SIZEOF_ARG($sp)	# passing a double
	REG_L	a3,   3*FFI_SIZEOF_ARG($sp)
	b	call_it

pass_f:	
	bne	t0, FFI_ARGS_F, pass_d_d
	l.s	$f12, 0*FFI_SIZEOF_ARG($sp)	# load $fp regs from args
	REG_L	a1,   1*FFI_SIZEOF_ARG($sp)	# passing a float
	REG_L	a2,   2*FFI_SIZEOF_ARG($sp)
	REG_L	a3,   3*FFI_SIZEOF_ARG($sp)
	b	call_it		

pass_d_d:		
	bne	t0, FFI_ARGS_DD, pass_f_f
	l.d	$f12, 0*FFI_SIZEOF_ARG($sp)	# load $fp regs from args
	l.d	$f14, 2*FFI_SIZEOF_ARG($sp)	# passing two doubles
	b	call_it

pass_f_f:	
	bne	t0, FFI_ARGS_FF, pass_d_f
	l.s	$f12, 0*FFI_SIZEOF_ARG($sp)	# load $fp regs from args
	l.s	$f14, 1*FFI_SIZEOF_ARG($sp)	# passing two floats
	REG_L	a2,   2*FFI_SIZEOF_ARG($sp)
	REG_L	a3,   3*FFI_SIZEOF_ARG($sp)
	b	call_it

pass_d_f:		
	bne	t0, FFI_ARGS_DF, pass_f_d
	l.d	$f12, 0*FFI_SIZEOF_ARG($sp)	# load $fp regs from args
	l.s	$f14, 2*FFI_SIZEOF_ARG($sp)	# passing double and float
	REG_L	a3,   3*FFI_SIZEOF_ARG($sp)
	b	call_it

pass_f_d:		
 # assume that the only other combination must be float then double
 #	bne	t0, FFI_ARGS_F_D, call_it
	l.s	$f12, 0*FFI_SIZEOF_ARG($sp)	# load $fp regs from args
	l.d	$f14, 2*FFI_SIZEOF_ARG($sp)	# passing double and float

#endif

call_it:	
	# Load the static chain pointer
	REG_L	t7, SIZEOF_FRAME + 6*FFI_SIZEOF_ARG($fp)

	# Load the function pointer
	REG_L	t9, SIZEOF_FRAME + 5*FFI_SIZEOF_ARG($fp)

	# If the return value pointer is NULL, assume no return value.
	REG_L	t1, SIZEOF_FRAME + 4*FFI_SIZEOF_ARG($fp)
	beqz	t1, noretval

	and     t1, t2, ((1<<4)-1)
	bne     t1, FFI_TYPE_INT, retlonglong
	jalr	t9
	REG_L	t0, SIZEOF_FRAME + 4*FFI_SIZEOF_ARG($fp)
	REG_S	v0, 0(t0)
	b	epilogue

retlonglong:
	# Really any 64-bit int, signed or not.
	bne	t1, FFI_TYPE_UINT64, retfloat
	jalr	t9
	REG_L	t0, SIZEOF_FRAME + 4*FFI_SIZEOF_ARG($fp)
	REG_S	v1, 4(t0)
	REG_S	v0, 0(t0)
	b	epilogue

retfloat:
	bne     t1, FFI_TYPE_FLOAT, retdouble
	jalr	t9
	REG_L	t0, SIZEOF_FRAME + 4*FFI_SIZEOF_ARG($fp)
#ifndef __mips_soft_float
	s.s	$f0, 0(t0)
#else
	REG_S	v0, 0(t0)
#endif
	b	epilogue

retdouble:	
	bne	t1, FFI_TYPE_DOUBLE, retcomplex
	jalr	t9
	REG_L	t0, SIZEOF_FRAME + 4*FFI_SIZEOF_ARG($fp)
#ifndef __mips_soft_float
	s.d	$f0, 0(t0)
#else
	REG_S	v1, 4(t0)
	REG_S	v0, 0(t0)
#endif
	b	epilogue
	
retcomplex:
	# mask out the complex elements type.
	# the struct of flags (bits):
	# 0-1: arg0
	# 2-3: arg1
	# 4-7: return type
	# 8-11: rtype elements type: for complex
	# Note here: t2 is flags>>4
	bne	t1, FFI_TYPE_COMPLEX, noretval
	jalr	t9
	REG_L	t0, SIZEOF_FRAME + 4*FFI_SIZEOF_ARG($fp)
	REG_L	t1, A3_OFF($fp)		# load the flags word
	SRL	t1, t1, 8
	li	t3, 3
	beq	t1, t3, 3f # double
	li	t3, 2
	beq	t1, t3, 2f # float
	# FIXME: long double
	slti	t3, t1, 5
	beqz	t3, 5f     # (u)int8/16/32/64
2:
#ifndef __mips_soft_float
	s.s	$f0, 0(t0)
	s.s	$f2, 4(t0)
#else
	# FIXME: do nothing can pass all of the testsuite
#endif
	b	epilogue
3:
#ifndef __mips_soft_float
	s.d	$f0, 0(t0)
	s.d	$f2, 8(t0)
#else
	# FIXME: do nothing can pass all of the testsuite
#endif
	b	epilogue

5:
	REG_S	v1, 4(t0)
	REG_S	v0, 0(t0)
	b	epilogue

noretval:	
	jalr	t9
	
	# Epilogue
epilogue:	
	move	$sp, $fp	
	REG_L	$fp, FP_OFF($sp)	# Restore frame pointer
	REG_L	ra, RA_OFF($sp)		# Restore return address
	ADDU	$sp, SIZEOF_FRAME	# Fix stack pointer
	j	ra

$LFE0:
	.end	ffi_call_O32


/* ffi_closure_O32. Expects address of the passed-in ffi_closure
	in t4 ($12). Stores any arguments passed in registers onto the
	stack, then calls ffi_closure_mips_inner_O32, which
	then decodes them.
	
	Stack layout:

	 3 - a3 save
	 2 - a2 save
	 1 - a1 save
	 0 - a0 save, original sp
	-1 - ra save
	-2 - fp save
	-3 - $16 (s0) save
	-4 - cprestore
	-5 - return value high (v1)
	-6 - return value low (v0)
	-7 - f14 (le high, be low)
	-8 - f14 (le low, be high)
	-9 - f12 (le high, be low)
       -10 - f12 (le low, be high)
       -11 - Called function a5 save
       -12 - Called function a4 save
       -13 - Called function a3 save
       -14 - Called function a2 save
       -15 - Called function a1 save
       -16 - Called function a0 save, our sp and fp point here
	 */
	
#define SIZEOF_FRAME2	(16 * FFI_SIZEOF_ARG)
#define A3_OFF2		(SIZEOF_FRAME2 + 3 * FFI_SIZEOF_ARG)
#define A2_OFF2		(SIZEOF_FRAME2 + 2 * FFI_SIZEOF_ARG)
#define A1_OFF2		(SIZEOF_FRAME2 + 1 * FFI_SIZEOF_ARG)
#define A0_OFF2		(SIZEOF_FRAME2 + 0 * FFI_SIZEOF_ARG)
#define RA_OFF2		(SIZEOF_FRAME2 - 1 * FFI_SIZEOF_ARG)
#define FP_OFF2		(SIZEOF_FRAME2 - 2 * FFI_SIZEOF_ARG)
#define S0_OFF2		(SIZEOF_FRAME2 - 3 * FFI_SIZEOF_ARG)
#define GP_OFF2		(SIZEOF_FRAME2 - 4 * FFI_SIZEOF_ARG)
#define V1_OFF2		(SIZEOF_FRAME2 - 5 * FFI_SIZEOF_ARG)
#define V0_OFF2		(SIZEOF_FRAME2 - 6 * FFI_SIZEOF_ARG)
#define FA_1_1_OFF2	(SIZEOF_FRAME2 - 7 * FFI_SIZEOF_ARG)
#define FA_1_0_OFF2	(SIZEOF_FRAME2 - 8 * FFI_SIZEOF_ARG)
#define FA_0_1_OFF2	(SIZEOF_FRAME2 - 9 * FFI_SIZEOF_ARG)
#define FA_0_0_OFF2	(SIZEOF_FRAME2 - 10 * FFI_SIZEOF_ARG)
#define CALLED_A5_OFF2  (SIZEOF_FRAME2 - 11 * FFI_SIZEOF_ARG)
#define CALLED_A4_OFF2  (SIZEOF_FRAME2 - 12 * FFI_SIZEOF_ARG)

	.text

	.align	2
	.globl	ffi_go_closure_O32
	.ent	ffi_go_closure_O32
ffi_go_closure_O32:
$LFB1:
	# Prologue
	.frame	$fp, SIZEOF_FRAME2, ra
	.set	noreorder
	.cpload	t9
	.set	reorder
	SUBU	$sp, SIZEOF_FRAME2
	.cprestore GP_OFF2
$LCFI10:

	REG_S	$16, S0_OFF2($sp)	 # Save s0
	REG_S	$fp, FP_OFF2($sp)	 # Save frame pointer
	REG_S	ra, RA_OFF2($sp)	 # Save return address
$LCFI11:

	move	$fp, $sp
$LCFI12:

	REG_S	a0, A0_OFF2($fp)
	REG_S	a1, A1_OFF2($fp)
	REG_S	a2, A2_OFF2($fp)
	REG_S	a3, A3_OFF2($fp)

	# Load ABI enum to s0
	REG_L	$16, 4($15)	# cif 
	REG_L	$16, 0($16)	# abi is first member.

	li	$13, 1		# FFI_O32
	bne	$16, $13, 1f	# Skip fp save if FFI_O32_SOFT_FLOAT
	
#ifndef __mips_soft_float
	# Store all possible float/double registers.
	s.d	$f12, FA_0_0_OFF2($fp)
	s.d	$f14, FA_1_0_OFF2($fp)
#endif
1:
	# prepare arguments for ffi_closure_mips_inner_O32
	REG_L	a0, 4($15)	 # cif 
	REG_L	a1, 8($15)	 # fun
	move	a2, $15		 # user_data = go closure
	addu	a3, $fp, V0_OFF2 # rvalue

	addu	t9, $fp, A0_OFF2 # ar
	REG_S   t9, CALLED_A4_OFF2($fp)

	addu	t9, $fp, FA_0_0_OFF2 #fpr
	REG_S   t9, CALLED_A5_OFF2($fp)

	b $do_closure

$LFE1:
	.end ffi_go_closure_O32

	.align	2
	.globl	ffi_closure_O32
	.ent	ffi_closure_O32
ffi_closure_O32:
$LFB2:
	# Prologue
	.frame	$fp, SIZEOF_FRAME2, ra
	.set	noreorder
	.cpload	t9
	.set	reorder
	SUBU	$sp, SIZEOF_FRAME2
	.cprestore GP_OFF2
$LCFI20:
	REG_S	$16, S0_OFF2($sp)	 # Save s0
	REG_S	$fp, FP_OFF2($sp)	 # Save frame pointer
	REG_S	ra, RA_OFF2($sp)	 # Save return address
$LCFI21:
	move	$fp, $sp

$LCFI22:
	# Store all possible argument registers. If there are more than
	# four arguments, then they are stored above where we put a3.
	REG_S	a0, A0_OFF2($fp)
	REG_S	a1, A1_OFF2($fp)
	REG_S	a2, A2_OFF2($fp)
	REG_S	a3, A3_OFF2($fp)

	# Load ABI enum to s0
	REG_L	$16, 20($12)	# cif pointer follows tramp.
	REG_L	$16, 0($16)	# abi is first member.

	li	$13, 1		# FFI_O32
	bne	$16, $13, 1f	# Skip fp save if FFI_O32_SOFT_FLOAT
	
#ifndef __mips_soft_float
	# Store all possible float/double registers.
	s.d	$f12, FA_0_0_OFF2($fp)
	s.d	$f14, FA_1_0_OFF2($fp)
#endif
1:	
	# prepare arguments for ffi_closure_mips_inner_O32
	REG_L	a0, 20($12)	 # cif pointer follows tramp.
	REG_L	a1, 24($12)	 # fun
	REG_L	a2, 28($12)	 # user_data
	addu	a3, $fp, V0_OFF2 # rvalue

	addu	t9, $fp, A0_OFF2 # ar
	REG_S   t9, CALLED_A4_OFF2($fp)

	addu	t9, $fp, FA_0_0_OFF2 #fpr
	REG_S   t9, CALLED_A5_OFF2($fp)

$do_closure:
	la	t9, ffi_closure_mips_inner_O32
	# Call ffi_closure_mips_inner_O32 to do the work.
	jalr	t9

	# Load the return value into the appropriate register.
	move	$8, $2
	li	$9, FFI_TYPE_VOID
	beq	$8, $9, closure_done

	li	$13, 1		# FFI_O32
	bne	$16, $13, 1f	# Skip fp restore if FFI_O32_SOFT_FLOAT

#ifndef __mips_soft_float
	li	$9, FFI_TYPE_FLOAT
	l.s	$f0, V0_OFF2($fp)
	beq	$8, $9, closure_done

	li	$9, FFI_TYPE_DOUBLE
	l.d	$f0, V0_OFF2($fp)
	beq	$8, $9, closure_done

	li      $9, FFI_TYPE_COMPLEX
	bne     $8, $9, 1f

	li      $9, 8
	l.s	$f0, V0_OFF2($fp)
	l.s	$f2, V1_OFF2($fp)
	beq     $3, $9, closure_done

	li      $9, 16
	l.d	$f0, V0_OFF2($fp)
	l.d	$f2, (V0_OFF2+8)($fp)
	beq     $3, $9, closure_done
#endif
1:	
	REG_L	$3, V1_OFF2($fp)
	REG_L	$2, V0_OFF2($fp)

closure_done:
	# Epilogue
	move	$sp, $fp
	REG_L	$16, S0_OFF2($sp)	 # Restore s0
	REG_L	$fp, FP_OFF2($sp)	 # Restore frame pointer
	REG_L	ra,  RA_OFF2($sp)	 # Restore return address
	ADDU	$sp, SIZEOF_FRAME2
	j	ra
$LFE2:
	.end	ffi_closure_O32

/* DWARF-2 unwind info. */

	.section	.eh_frame,"a",@progbits
$Lframe0:
	.4byte	$LECIE0-$LSCIE0	 # Length of Common Information Entry
$LSCIE0:
	.4byte	0x0	 # CIE Identifier Tag
	.byte	0x1	 # CIE Version
	.ascii "zR\0"	 # CIE Augmentation
	.uleb128 0x1	 # CIE Code Alignment Factor
	.sleb128 4	 # CIE Data Alignment Factor
	.byte	0x1f	 # CIE RA Column
	.uleb128 0x1	 # Augmentation size
	.byte	0x00	 # FDE Encoding (absptr)
	.byte	0xc	 # DW_CFA_def_cfa
	.uleb128 0x1d
	.uleb128 0x0
	.align	2
$LECIE0:

$LSFDE0:
	.4byte	$LEFDE0-$LASFDE0	 # FDE Length
$LASFDE0:
	.4byte	$LASFDE0-$Lframe0	 # FDE CIE offset
	.4byte	$LFB0	 # FDE initial location
	.4byte	$LFE0-$LFB0	 # FDE address range
	.uleb128 0x0	 # Augmentation size
	.byte	0x4	 # DW_CFA_advance_loc4
	.4byte	$LCFI00-$LFB0
	.byte	0xe	 # DW_CFA_def_cfa_offset
	.uleb128 0x18
	.byte	0x4	 # DW_CFA_advance_loc4
	.4byte	$LCFI01-$LCFI00
	.byte	0x11	 # DW_CFA_offset_extended_sf
	.uleb128 0x1e	 # $fp
	.sleb128 -2	 # SIZEOF_FRAME2 - 2*FFI_SIZEOF_ARG($sp)
	.byte	0x11	 # DW_CFA_offset_extended_sf
	.uleb128 0x1f	 # $ra
	.sleb128 -1	 # SIZEOF_FRAME2 - 1*FFI_SIZEOF_ARG($sp)
	.byte	0x4	 # DW_CFA_advance_loc4
	.4byte	$LCFI02-$LCFI01
	.byte	0xc	 # DW_CFA_def_cfa
	.uleb128 0x1e
	.uleb128 0x18
	.align	2
$LEFDE0:

$LSFDE1:
	.4byte	$LEFDE1-$LASFDE1	 # FDE Length
$LASFDE1:
	.4byte	$LASFDE1-$Lframe0	 # FDE CIE offset
	.4byte	$LFB1	 # FDE initial location
	.4byte	$LFE1-$LFB1	 # FDE address range
	.uleb128 0x0	 # Augmentation size
	.byte	0x4	 # DW_CFA_advance_loc4
	.4byte	$LCFI10-$LFB1
	.byte	0xe	 # DW_CFA_def_cfa_offset
	.uleb128 SIZEOF_FRAME2
	.byte	0x4	 # DW_CFA_advance_loc4
	.4byte	$LCFI11-$LCFI10
	.byte	0x11	 # DW_CFA_offset_extended_sf
	.uleb128 0x10	 # $16
	.sleb128 -3	 # SIZEOF_FRAME2 - 3*FFI_SIZEOF_ARG($sp)
	.byte	0x11	 # DW_CFA_offset_extended_sf
	.uleb128 0x1e	 # $fp
	.sleb128 -2	 # SIZEOF_FRAME2 - 2*FFI_SIZEOF_ARG($sp)
	.byte	0x11	 # DW_CFA_offset_extended_sf
	.uleb128 0x1f	 # $ra
	.sleb128 -1	 # SIZEOF_FRAME2 - 1*FFI_SIZEOF_ARG($sp)
	.byte	0x4	 # DW_CFA_advance_loc4
	.4byte	$LCFI12-$LCFI11
	.byte	0xc	 # DW_CFA_def_cfa
	.uleb128 0x1e
	.uleb128 SIZEOF_FRAME2
	.align	2
$LEFDE1:

$LSFDE2:
	.4byte	$LEFDE2-$LASFDE2	 # FDE Length
$LASFDE2:
	.4byte	$LASFDE2-$Lframe0	 # FDE CIE offset
	.4byte	$LFB2	 # FDE initial location
	.4byte	$LFE2-$LFB2	 # FDE address range
	.uleb128 0x0	 # Augmentation size
	.byte	0x4	 # DW_CFA_advance_loc4
	.4byte	$LCFI20-$LFB2
	.byte	0xe	 # DW_CFA_def_cfa_offset
	.uleb128 SIZEOF_FRAME2
	.byte	0x4	 # DW_CFA_advance_loc4
	.4byte	$LCFI21-$LCFI20
	.byte	0x11	 # DW_CFA_offset_extended_sf
	.uleb128 0x10	 # $16
	.sleb128 -3	 # SIZEOF_FRAME2 - 3*FFI_SIZEOF_ARG($sp)
	.byte	0x11	 # DW_CFA_offset_extended_sf
	.uleb128 0x1e	 # $fp
	.sleb128 -2	 # SIZEOF_FRAME2 - 2*FFI_SIZEOF_ARG($sp)
	.byte	0x11	 # DW_CFA_offset_extended_sf
	.uleb128 0x1f	 # $ra
	.sleb128 -1	 # SIZEOF_FRAME2 - 1*FFI_SIZEOF_ARG($sp)
	.byte	0x4	 # DW_CFA_advance_loc4
	.4byte	$LCFI22-$LCFI21
	.byte	0xc	 # DW_CFA_def_cfa
	.uleb128 0x1e
	.uleb128 SIZEOF_FRAME2
	.align	2
$LEFDE2:

#endif
