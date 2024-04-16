/* -----------------------------------------------------------------------
   v8.S - Copyright (c) 2013  The Written Word, Inc.
	  Copyright (c) 1996, 1997, 2003, 2004, 2008  Red Hat, Inc.

   SPARC Foreign Function Interface

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

#ifndef SPARC64

#define C2(X, Y)  X ## Y
#define C1(X, Y)  C2(X, Y)

#ifdef __USER_LABEL_PREFIX__
# define C(Y)	C1(__USER_LABEL_PREFIX__, Y)
#else
# define C(Y)	Y
#endif
#define L(Y)	C1(.L, Y)

	.text

#ifndef __GNUC__
        .align 8
	.globl	C(ffi_flush_icache)
	.type	C(ffi_flush_icache),#function
	FFI_HIDDEN(C(ffi_flush_icache))

C(ffi_flush_icache):
1:	iflush %o0
	iflush %o+8
	nop
	nop
	nop
	nop
	nop
	retl
	 nop
	.size	C(ffi_flush_icache), . - C(ffi_flush_icache)
#endif

#if defined(__sun__) && defined(__svr4__)
# define E(INDEX)	.align 16
#else
# define E(INDEX)	.align 16; .org 2b + INDEX * 16
#endif

        .align 8
	.globl	C(ffi_call_v8)
	.type	C(ffi_call_v8),#function
	FFI_HIDDEN(C(ffi_call_v8))

C(ffi_call_v8):
.LUW0:
	! Allocate a stack frame sized by ffi_call.
	save	%sp, %o4, %sp
.LUW1:
	mov	%i0, %o0		! copy cif
	add	%sp, 64+32, %o1		! load args area
	mov	%i2, %o2		! copy rvalue
	call	C(ffi_prep_args_v8)
	 mov	%i3, %o3		! copy avalue

	add	%sp, 32, %sp		! deallocate prep frame
	and	%o0, SPARC_FLAG_RET_MASK, %l0	! save return type
	srl	%o0, SPARC_SIZEMASK_SHIFT, %l1	! save return size
	ld	[%sp+64+4], %o0		! load all argument registers
	ld	[%sp+64+8], %o1
	ld	[%sp+64+12], %o2
	ld	[%sp+64+16], %o3
	cmp	%l0, SPARC_RET_STRUCT	! struct return needs an unimp 4
	ld	[%sp+64+20], %o4
	be	8f
	 ld	[%sp+64+24], %o5

	! Call foreign function
	call	%i1
	 mov	%i5, %g2		! load static chain

0:	call	1f		! load pc in %o7
	 sll	%l0, 4, %l0
1:	add	%o7, %l0, %o7	! o7 = 0b + ret_type*16
	jmp	%o7+(2f-0b)
	 nop

	! Note that each entry is 4 insns, enforced by the E macro.
	.align	16
2:
E(SPARC_RET_VOID)
	ret
	 restore
E(SPARC_RET_STRUCT)
	unimp
E(SPARC_RET_UINT8)
	and	%o0, 0xff, %o0
	st	%o0, [%i2]
	ret
	 restore
E(SPARC_RET_SINT8)
	sll	%o0, 24, %o0
	b	7f
	 sra	%o0, 24, %o0
E(SPARC_RET_UINT16)
	sll	%o0, 16, %o0
	b	7f
	 srl	%o0, 16, %o0
E(SPARC_RET_SINT16)
	sll	%o0, 16, %o0
	b	7f
	 sra	%o0, 16, %o0
E(SPARC_RET_UINT32)
7:	st	%o0, [%i2]
	ret
	 restore
E(SP_V8_RET_CPLX16)
	sth	%o0, [%i2+2]
	b	9f
	 srl	%o0, 16, %o0
E(SPARC_RET_INT64)
	st	%o0, [%i2]
	st	%o1, [%i2+4]
	ret
	 restore
E(SPARC_RET_INT128)
	std	%o0, [%i2]
	std	%o2, [%i2+8]
	ret
	 restore
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
	st	%f3, [%i2+3*4]
	nop
	st	%f2, [%i2+2*4]
	nop
E(SPARC_RET_F_2)
	st	%f1, [%i2+4]
	st	%f0, [%i2]
	ret
	 restore
E(SP_V8_RET_CPLX8)
	stb	%o0, [%i2+1]
	b	0f
	 srl	%o0, 8, %o0
E(SPARC_RET_F_1)
	st	%f0, [%i2]
	ret
	 restore

	.align	8
9:	sth	%o0, [%i2]
	ret
	 restore
	.align	8
0:	stb	%o0, [%i2]
	ret
	 restore

	! Struct returning functions expect and skip the unimp here.
	! To make it worse, conforming callees examine the unimp and
	! make sure the low 12 bits of the unimp match the size of
	! the struct being returned.
	.align	8
8:	call	1f				! load pc in %o7
	 sll	%l1, 2, %l0			! size * 4
1:	sll	%l1, 4, %l1			! size * 16
	add	%l0, %l1, %l0			! size * 20
	add	%o7, %l0, %o7			! o7 = 8b + size*20
	jmp	%o7+(2f-8b)
	 mov	%i5, %g2			! load static chain
2:

/* The Sun assembler doesn't understand .rept 0x1000.  */
#define rept1			\
	call	%i1;		\
	 nop;			\
	unimp	(. - 2b) / 20;	\
	ret;			\
	 restore

#define rept16				\
	rept1; rept1; rept1; rept1;	\
	rept1; rept1; rept1; rept1;	\
	rept1; rept1; rept1; rept1;	\
	rept1; rept1; rept1; rept1

#define rept256				\
	rept16; rept16; rept16; rept16;	\
	rept16; rept16; rept16; rept16;	\
	rept16; rept16; rept16; rept16;	\
	rept16; rept16; rept16; rept16

	rept256; rept256; rept256; rept256
	rept256; rept256; rept256; rept256
	rept256; rept256; rept256; rept256
	rept256; rept256; rept256; rept256

.LUW2:
	.size	C(ffi_call_v8),. - C(ffi_call_v8)


/* 16*4 register window + 1*4 struct return + 6*4 args backing store
   + 8*4 return storage + 1*4 alignment.  */
#define	STACKFRAME	(16*4 + 4 + 6*4 + 8*4 + 4)

/* ffi_closure_v8(...)

   Receives the closure argument in %g2.   */

#ifdef HAVE_AS_REGISTER_PSEUDO_OP
	.register	%g2, #scratch
#endif

	.align 8
	.globl	C(ffi_go_closure_v8)
	.type	C(ffi_go_closure_v8),#function
	FFI_HIDDEN(C(ffi_go_closure_v8))

C(ffi_go_closure_v8):
.LUW3:
	save	%sp, -STACKFRAME, %sp
.LUW4:
	ld	[%g2+4], %o0			! load cif
	ld	[%g2+8], %o1			! load fun
	b	0f
	 mov	%g2, %o2			! load user_data
.LUW5:
	.size	C(ffi_go_closure_v8), . - C(ffi_go_closure_v8)

	.align 8
	.globl	C(ffi_closure_v8)
	.type	C(ffi_closure_v8),#function
	FFI_HIDDEN(C(ffi_closure_v8))

C(ffi_closure_v8):
.LUW6:
	save	%sp, -STACKFRAME, %sp
.LUW7:
	ld	[%g2+FFI_TRAMPOLINE_SIZE], %o0		! load cif
	ld	[%g2+FFI_TRAMPOLINE_SIZE+4], %o1	! load fun
	ld	[%g2+FFI_TRAMPOLINE_SIZE+8], %o2	! load user_data
0:
	! Store all of the potential argument registers in va_list format.
	st	%i0, [%fp+68+0]
	st	%i1, [%fp+68+4]
	st	%i2, [%fp+68+8]
	st	%i3, [%fp+68+12]
	st	%i4, [%fp+68+16]
	st	%i5, [%fp+68+20]

	! Call ffi_closure_sparc_inner to do the bulk of the work.
	add	%fp, -8*4, %o3
	call	ffi_closure_sparc_inner_v8
	 add	%fp,  64, %o4

0:	call	1f
	 and	%o0, SPARC_FLAG_RET_MASK, %o0
1:	sll	%o0, 4, %o0	! o0 = o0 * 16
	add	%o7, %o0, %o7	! o7 = 0b + o0*16
	jmp	%o7+(2f-0b)
	 add	%fp, -8*4, %i2
	 
	! Note that each entry is 4 insns, enforced by the E macro.
	.align	16
2:
E(SPARC_RET_VOID)
	ret
	 restore
E(SPARC_RET_STRUCT)
	ld	[%i2], %i0
	jmp	%i7+12
	 restore
E(SPARC_RET_UINT8)
	ldub	[%i2+3], %i0
	ret
	 restore
E(SPARC_RET_SINT8)
	ldsb	[%i2+3], %i0
	ret
	 restore
E(SPARC_RET_UINT16)
	lduh	[%i2+2], %i0
	ret
	 restore
E(SPARC_RET_SINT16)
	ldsh	[%i2+2], %i0
	ret
	 restore
E(SPARC_RET_UINT32)
	ld	[%i2], %i0
	ret
	 restore
E(SP_V8_RET_CPLX16)
	ld	[%i2], %i0
	ret
	 restore
E(SPARC_RET_INT64)
	ldd	[%i2], %i0
	ret
	 restore
E(SPARC_RET_INT128)
	ldd	[%i2], %i0
	ldd	[%i2+8], %i2
	ret
	 restore
E(SPARC_RET_F_8)
	ld	[%i2+7*4], %f7
	nop
	ld	[%i2+6*4], %f6
	nop
E(SPARC_RET_F_6)
	ld	[%i2+5*4], %f5
	nop
	ld	[%i2+4*4], %f4
	nop
E(SPARC_RET_F_4)
	ld	[%i2+3*4], %f3
	nop
	ld	[%i2+2*4], %f2
	nop
E(SPARC_RET_F_2)
	ldd	[%i2], %f0
	ret
	 restore
E(SP_V8_RET_CPLX8)
	lduh	[%i2], %i0
	ret
	 restore
E(SPARC_RET_F_1)
	ld	[%i2], %f0
	ret
	 restore

.LUW8:
	.size	C(ffi_closure_v8), . - C(ffi_closure_v8)

#ifdef HAVE_RO_EH_FRAME
        .section        ".eh_frame",#alloc
#else
        .section        ".eh_frame",#alloc,#write
#endif

#ifdef HAVE_AS_SPARC_UA_PCREL
# define FDE_ADDR(X)	%r_disp32(X)
#else
# define FDE_ADDR(X)	X
#endif

	.align 4
.LCIE:
	.long	.LECIE - .LSCIE		! CIE Length
.LSCIE:
	.long	0			! CIE Identifier Tag
	.byte	1			! CIE Version
	.ascii	"zR\0"			! CIE Augmentation
	.byte	4			! CIE Code Alignment Factor
	.byte	0x7c			! CIE Data Alignment Factor
	.byte	15			! CIE RA Column
	.byte	1			! Augmentation size
#ifdef HAVE_AS_SPARC_UA_PCREL
	.byte	0x1b			! FDE Encoding (pcrel sdata4)
#else
	.byte	0x50			! FDE Encoding (aligned absolute)
#endif
	.byte	0xc, 14, 0		! DW_CFA_def_cfa, %o6, offset 0
	.align	4
.LECIE:

	.long	.LEFDE1 - .LSFDE1	! FDE Length
.LSFDE1:
	.long	.LSFDE1 - .LCIE		! FDE CIE offset
	.long	FDE_ADDR(.LUW0)		! Initial location
	.long	.LUW2 - .LUW0		! Address range
	.byte	0			! Augmentation size
	.byte	0x40+1			! DW_CFA_advance_loc 4
	.byte	0xd, 30			! DW_CFA_def_cfa_register, %i6
	.byte	0x2d			! DW_CFA_GNU_window_save
	.byte	0x9, 15, 31		! DW_CFA_register, %o7, %i7
	.align	4
.LEFDE1:

	.long	.LEFDE2 - .LSFDE2	! FDE Length
.LSFDE2:
	.long	.LSFDE2 - .LCIE		! FDE CIE offset
	.long	FDE_ADDR(.LUW3)		! Initial location
	.long	.LUW5 - .LUW3		! Address range
	.byte	0			! Augmentation size
	.byte	0x40+1			! DW_CFA_advance_loc 4
	.byte	0xd, 30			! DW_CFA_def_cfa_register, %i6
	.byte	0x2d			! DW_CFA_GNU_window_save
	.byte	0x9, 15, 31		! DW_CFA_register, %o7, %i7
	.align	4
.LEFDE2:

	.long	.LEFDE3 - .LSFDE3	! FDE Length
.LSFDE3:
	.long	.LSFDE3 - .LCIE		! FDE CIE offset
	.long	FDE_ADDR(.LUW6)		! Initial location
	.long	.LUW8 - .LUW6		! Address range
	.byte	0			! Augmentation size
	.byte	0x40+1			! DW_CFA_advance_loc 4
	.byte	0xd, 30			! DW_CFA_def_cfa_register, %i6
	.byte	0x2d			! DW_CFA_GNU_window_save
	.byte	0x9, 15, 31		! DW_CFA_register, %o7, %i7
	.align	4
.LEFDE3:

#endif /* !SPARC64 */
#if defined __ELF__ && defined __linux__
	.section	.note.GNU-stack,"",@progbits
#endif
