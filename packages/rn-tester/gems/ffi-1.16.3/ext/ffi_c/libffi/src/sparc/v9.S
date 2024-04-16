/* -----------------------------------------------------------------------
   v9.S - Copyright (c) 2000, 2003, 2004, 2008 Red Hat, Inc.
   
   SPARC 64-bit Foreign Function Interface 

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
#include "internal.h"

#ifdef SPARC64

#define C2(X, Y)  X ## Y
#define C1(X, Y)  C2(X, Y)

#ifdef __USER_LABEL_PREFIX__
# define C(Y)	C1(__USER_LABEL_PREFIX__, Y)
#else
# define C(Y)	Y
#endif
#define L(Y)	C1(.L, Y)

#if defined(__sun__) && defined(__svr4__)
# define E(INDEX)	.align 16
#else
# define E(INDEX)	.align 16; .org 2b + INDEX * 16
#endif

#define STACK_BIAS 2047

	.text
        .align 8
	.globl	C(ffi_call_v9)
	.type	C(ffi_call_v9),#function
	FFI_HIDDEN(C(ffi_call_v9))

C(ffi_call_v9):
.LUW0:
	save	%sp, %o4, %sp
.LUW1:
	mov	%i0, %o0			! copy cif
	add	%sp, STACK_BIAS+128+48, %o1	! load args area
	mov	%i2, %o2			! copy rvalue
	call	C(ffi_prep_args_v9)
	 mov	%i3, %o3			! copy avalue

	andcc	%o0, SPARC_FLAG_FP_ARGS, %g0	! need fp regs?
	add	%sp, 48, %sp			! deallocate prep frame
	be,pt	%xcc, 1f
	 mov	%o0, %l0			! save flags

	ldd	[%sp+STACK_BIAS+128], %f0	! load all fp arg regs
	ldd	[%sp+STACK_BIAS+128+8], %f2
	ldd	[%sp+STACK_BIAS+128+16], %f4
	ldd	[%sp+STACK_BIAS+128+24], %f6
	ldd	[%sp+STACK_BIAS+128+32], %f8
	ldd	[%sp+STACK_BIAS+128+40], %f10
	ldd	[%sp+STACK_BIAS+128+48], %f12
	ldd	[%sp+STACK_BIAS+128+56], %f14
	ldd	[%sp+STACK_BIAS+128+64], %f16
	ldd	[%sp+STACK_BIAS+128+72], %f18
	ldd	[%sp+STACK_BIAS+128+80], %f20
	ldd	[%sp+STACK_BIAS+128+88], %f22
	ldd	[%sp+STACK_BIAS+128+96], %f24
	ldd	[%sp+STACK_BIAS+128+104], %f26
	ldd	[%sp+STACK_BIAS+128+112], %f28
	ldd	[%sp+STACK_BIAS+128+120], %f30

1:	ldx	[%sp+STACK_BIAS+128], %o0	! load all int arg regs
	ldx	[%sp+STACK_BIAS+128+8], %o1
	ldx	[%sp+STACK_BIAS+128+16], %o2
	ldx	[%sp+STACK_BIAS+128+24], %o3
	ldx	[%sp+STACK_BIAS+128+32], %o4
	ldx	[%sp+STACK_BIAS+128+40], %o5
	call	%i1
	 mov	%i5, %g5			! load static chain

0:	call	1f		! load pc in %o7
	 and	%l0, SPARC_FLAG_RET_MASK, %l1
1:	sll	%l1, 4, %l1
	add	%o7, %l1, %o7	! o7 = 0b + ret_type*16
	jmp	%o7+(2f-0b)
	 nop

	.align	16
2:
E(SPARC_RET_VOID)
	return	%i7+8
	 nop
E(SPARC_RET_STRUCT)
	add	%sp, STACK_BIAS-64+128+48, %l2
	sub	%sp, 64, %sp
	b	8f
	 stx	%o0, [%l2]
E(SPARC_RET_UINT8)
	and	%o0, 0xff, %i0
	return	%i7+8
	  stx	%o0, [%o2]
E(SPARC_RET_SINT8)
	sll	%o0, 24, %o0
	sra	%o0, 24, %i0
	return	%i7+8
	 stx	%o0, [%o2]
E(SPARC_RET_UINT16)
	sll	%o0, 16, %o0
	srl	%o0, 16, %i0
	return	%i7+8
	 stx	%o0, [%o2]
E(SPARC_RET_SINT16)
	sll	%o0, 16, %o0
	sra	%o0, 16, %i0
	return	%i7+8
	 stx	%o0, [%o2]
E(SPARC_RET_UINT32)
	srl	%o0, 0, %i0
	return	%i7+8
	 stx	%o0, [%o2]
E(SP_V9_RET_SINT32)
	sra	%o0, 0, %i0
	return	%i7+8
	 stx	%o0, [%o2]
E(SPARC_RET_INT64)
	stx	%o0, [%i2]
	return	%i7+8
	 nop
E(SPARC_RET_INT128)
	stx	%o0, [%i2]
	stx	%o1, [%i2+8]
	return	%i7+8
	 nop
E(SPARC_RET_F_8)
	st	%f7, [%i2+7*4]
	nop
	st	%f6, [%i2+6*4]
	nop
E(SPARC_RET_F_6)
	st	%f5, [%i2+5*4]
	nop
	st	%f4, [%i2+4*4]
	nop
E(SPARC_RET_F_4)
	std	%f2, [%i2+2*4]
	return	%i7+8
	 std	%f0, [%o2]
E(SPARC_RET_F_2)
	return	%i7+8
	 std	%f0, [%o2]
E(SP_V9_RET_F_3)
	st	%f2, [%i2+2*4]
	nop
	st	%f1, [%i2+1*4]
	nop
E(SPARC_RET_F_1)
	return	%i7+8
	 st	%f0, [%o2]

	! Finish the SPARC_RET_STRUCT sequence.
	.align	8
8:	stx	%o1, [%l2+8]
	stx	%o2, [%l2+16]
	stx	%o3, [%l2+24]
	std	%f0, [%l2+32]
	std	%f2, [%l2+40]
	std	%f4, [%l2+48]
	std	%f6, [%l2+56]

	! Copy the structure into place.
	srl	%l0, SPARC_SIZEMASK_SHIFT, %o0	! load size_mask
	mov	%i2, %o1			! load dst
	mov	%l2, %o2			! load src_gp
	call	C(ffi_struct_float_copy)
	 add	%l2, 32, %o3			! load src_fp

	return	%i7+8
	 nop

.LUW2:
	.size	C(ffi_call_v9), . - C(ffi_call_v9)


#undef STACKFRAME
#define	STACKFRAME	 336	/* 16*8 register window +
				   6*8 args backing store +
				   20*8 locals */
#define	FP		%fp+STACK_BIAS

/* ffi_closure_v9(...)

   Receives the closure argument in %g1.   */

	.align 8
	.globl	C(ffi_go_closure_v9)
	.type	C(ffi_go_closure_v9),#function
	FFI_HIDDEN(C(ffi_go_closure_v9))

C(ffi_go_closure_v9):
.LUW3:
	save	%sp, -STACKFRAME, %sp
.LUW4:
	ldx	[%g5+8], %o0
	ldx	[%g5+16], %o1
	b	0f
	 mov	%g5, %o2

.LUW5:
	.size	C(ffi_go_closure_v9), . - C(ffi_go_closure_v9)

	.align 8
	.globl	C(ffi_closure_v9)
	.type	C(ffi_closure_v9),#function
	FFI_HIDDEN(C(ffi_closure_v9))

C(ffi_closure_v9):
.LUW6:
	save	%sp, -STACKFRAME, %sp
.LUW7:
	ldx	[%g1+FFI_TRAMPOLINE_SIZE], %o0
	ldx	[%g1+FFI_TRAMPOLINE_SIZE+8], %o1
	ldx	[%g1+FFI_TRAMPOLINE_SIZE+16], %o2
0:
	! Store all of the potential argument registers in va_list format.
	stx	%i0, [FP+128+0]
	stx	%i1, [FP+128+8]
	stx	%i2, [FP+128+16]
	stx	%i3, [FP+128+24]
	stx	%i4, [FP+128+32]
	stx	%i5, [FP+128+40]

	! Store possible floating point argument registers too.
	std	%f0,  [FP-128]
	std	%f2,  [FP-120]
	std	%f4,  [FP-112]
	std	%f6,  [FP-104]
	std	%f8,  [FP-96]
	std	%f10, [FP-88]
	std     %f12, [FP-80]
	std     %f14, [FP-72]
	std     %f16, [FP-64]
	std     %f18, [FP-56]
	std     %f20, [FP-48]
	std     %f22, [FP-40]
	std     %f24, [FP-32]
	std     %f26, [FP-24]
	std     %f28, [FP-16]
	std     %f30, [FP-8]

	! Call ffi_closure_sparc_inner to do the bulk of the work.
	add	%fp, STACK_BIAS-160, %o3
	add	%fp, STACK_BIAS+128, %o4
	call	C(ffi_closure_sparc_inner_v9)
	 add	%fp, STACK_BIAS-128, %o5

0:	call	1f		! load pc in %o7
	 and	%o0, SPARC_FLAG_RET_MASK, %o0
1:	sll	%o0, 4, %o0	! o2 = i2 * 16
	add	%o7, %o0, %o7	! o7 = 0b + i2*16
	jmp	%o7+(2f-0b)
	 nop

	! Note that we cannot load the data in the delay slot of
	! the return insn because the data is in the stack frame
	! that is deallocated by the return.
	.align	16
2:
E(SPARC_RET_VOID)
	return	%i7+8
	 nop
E(SPARC_RET_STRUCT)
	ldx	[FP-160], %i0
	ldd	[FP-160], %f0
	b	8f
	 ldx	[FP-152], %i1
E(SPARC_RET_UINT8)
	ldub	[FP-160+7], %i0
	return	%i7+8
	 nop
E(SPARC_RET_SINT8)
	ldsb	[FP-160+7], %i0
	return	%i7+8
	 nop
E(SPARC_RET_UINT16)
	lduh	[FP-160+6], %i0
	return	%i7+8
	 nop
E(SPARC_RET_SINT16)
	ldsh	[FP-160+6], %i0
	return	%i7+8
	 nop
E(SPARC_RET_UINT32)
	lduw	[FP-160+4], %i0
	return	%i7+8
	 nop
E(SP_V9_RET_SINT32)
	ldsw	[FP-160+4], %i0
	return	%i7+8
	 nop
E(SPARC_RET_INT64)
	ldx	[FP-160], %i0
	return	%i7+8
	 nop
E(SPARC_RET_INT128)
	ldx	[FP-160], %i0
	ldx	[FP-160+8], %i1
	return	%i7+8
	 nop
E(SPARC_RET_F_8)
	ld	[FP-160+7*4], %f7
	nop
	ld	[FP-160+6*4], %f6
	nop
E(SPARC_RET_F_6)
	ld	[FP-160+5*4], %f5
	nop
	ld	[FP-160+4*4], %f4
	nop
E(SPARC_RET_F_4)
	ldd	[FP-160], %f0
	ldd	[FP-160+8], %f2
	return	%i7+8
	 nop
E(SPARC_RET_F_2)
	ldd	[FP-160], %f0
	return	%i7+8
	 nop
E(SP_V9_RET_F_3)
	ld	[FP-160+2*4], %f2
	nop
	ld	[FP-160+1*4], %f1
	nop
E(SPARC_RET_F_1)
	ld	[FP-160], %f0
	return	%i7+8
	 nop

	! Finish the SPARC_RET_STRUCT sequence.
	.align	8
8:	ldd	[FP-152], %f2
	ldx	[FP-144], %i2
	ldd	[FP-144], %f4
	ldx	[FP-136], %i3
	ldd	[FP-136], %f6
	return	%i7+8
	 nop

.LUW8:
	.size	C(ffi_closure_v9), . - C(ffi_closure_v9)

#ifdef HAVE_RO_EH_FRAME
        .section        ".eh_frame",#alloc
#else
        .section        ".eh_frame",#alloc,#write
#endif

#ifdef HAVE_AS_SPARC_UA_PCREL
# define FDE_RANGE(B, E)  .long %r_disp32(B), E - B
#else
# define FDE_RANGE(B, E)  .align 8; .xword B, E - B
#endif

	.align 8
.LCIE:
	.long	.LECIE - .LSCIE		! CIE Length
.LSCIE:
	.long	0			! CIE Identifier Tag
	.byte	1			! CIE Version
	.ascii	"zR\0"			! CIE Augmentation
	.byte	4			! CIE Code Alignment Factor
	.byte	0x78			! CIE Data Alignment Factor
	.byte	15			! CIE RA Column
	.byte	1			! Augmentation size
#ifdef HAVE_AS_SPARC_UA_PCREL
	.byte	0x1b			! FDE Encoding (pcrel sdata4)
#else
	.byte	0x50			! FDE Encoding (aligned absolute)
#endif
	.byte	0xc, 14, 0xff, 0xf	! DW_CFA_def_cfa, %o6, offset 0x7ff
	.align	8
.LECIE:

	.long	.LEFDE1 - .LSFDE1	! FDE Length
.LSFDE1:
	.long	.LSFDE1 - .LCIE		! FDE CIE offset
	FDE_RANGE(.LUW0, .LUW2)
	.byte	0			! Augmentation size
	.byte	0x40+1			! DW_CFA_advance_loc 4
	.byte	0xd, 30			! DW_CFA_def_cfa_register, %i6
	.byte	0x2d			! DW_CFA_GNU_window_save
	.byte	0x9, 15, 31		! DW_CFA_register, %o7, %i7
	.align	8
.LEFDE1:

	.long	.LEFDE2 - .LSFDE2	! FDE Length
.LSFDE2:
	.long	.LSFDE2 - .LCIE		! FDE CIE offset
	FDE_RANGE(.LUW3, .LUW5)
	.byte	0			! Augmentation size
	.byte	0x40+1			! DW_CFA_advance_loc 4
	.byte	0xd, 30			! DW_CFA_def_cfa_register, %i6
	.byte	0x2d			! DW_CFA_GNU_window_save
	.byte	0x9, 15, 31		! DW_CFA_register, %o7, %i7
	.align	8
.LEFDE2:

	.long	.LEFDE3 - .LSFDE3	! FDE Length
.LSFDE3:
	.long	.LSFDE3 - .LCIE		! FDE CIE offset
	FDE_RANGE(.LUW6, .LUW8)
	.byte	0			! Augmentation size
	.byte	0x40+1			! DW_CFA_advance_loc 4
	.byte	0xd, 30			! DW_CFA_def_cfa_register, %i6
	.byte	0x2d			! DW_CFA_GNU_window_save
	.byte	0x9, 15, 31		! DW_CFA_register, %o7, %i7
	.align	8
.LEFDE3:

#endif /* SPARC64 */
#ifdef __linux__
	.section	.note.GNU-stack,"",@progbits
#endif
