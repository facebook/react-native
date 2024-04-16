/* -----------------------------------------------------------------------
   aix.S - Copyright (c) 2002, 2009 Free Software Foundation, Inc.
   based on darwin.S by John Hornkvist

   PowerPC Assembly glue.

   Permission is hereby granted, free of charge, to any person obtaining
   a copy of this software and associated documentation files (the
   ``Software''), to deal in the Software without restriction, including
   without limitation the rights to use, copy, modify, merge, publish,
   distribute, sublicense, and/or sell copies of the Software, and to
   permit persons to whom the Software is furnished to do so, subject to
   the following conditions:

   The above copyright notice and this permission notice shall be included
   in all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED ``AS IS'', WITHOUT WARRANTY OF ANY KIND, EXPRESS
   OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
   IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY CLAIM, DAMAGES OR
   OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
   ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
   OTHER DEALINGS IN THE SOFTWARE.
   ----------------------------------------------------------------------- */

	.set r0,0
	.set r1,1
	.set r2,2
	.set r3,3
	.set r4,4
	.set r5,5
	.set r6,6
	.set r7,7
	.set r8,8
	.set r9,9
	.set r10,10
	.set r11,11
	.set r12,12
	.set r13,13
	.set r14,14
	.set r15,15
	.set r16,16
	.set r17,17
	.set r18,18
	.set r19,19
	.set r20,20
	.set r21,21
	.set r22,22
	.set r23,23
	.set r24,24
	.set r25,25
	.set r26,26
	.set r27,27
	.set r28,28
	.set r29,29
	.set r30,30
	.set r31,31
	.set f0,0
	.set f1,1
	.set f2,2
	.set f3,3
	.set f4,4
	.set f5,5
	.set f6,6
	.set f7,7
	.set f8,8
	.set f9,9
	.set f10,10
	.set f11,11
	.set f12,12
	.set f13,13
	.set f14,14
	.set f15,15
	.set f16,16
	.set f17,17
	.set f18,18
	.set f19,19
	.set f20,20
	.set f21,21

	.extern .ffi_prep_args

#define LIBFFI_ASM
#include <fficonfig.h>
#include <ffi.h>
#define JUMPTARGET(name) name
#define L(x) x
	.file "aix.S"
	.toc

	/* void ffi_call_AIX(extended_cif *ecif, unsigned long bytes,
	 *		     unsigned int flags, unsigned int *rvalue,
	 *		     void (*fn)(),
	 *		     void (*prep_args)(extended_cif*, unsigned *const));
	 * r3=ecif, r4=bytes, r5=flags, r6=rvalue, r7=fn, r8=prep_args
	 */

.csect .text[PR]
	.align 2
	.globl ffi_call_AIX
	.globl .ffi_call_AIX
.csect ffi_call_AIX[DS]
ffi_call_AIX:
#ifdef __64BIT__
	.llong .ffi_call_AIX, TOC[tc0], 0
	.csect .text[PR]
.ffi_call_AIX:
	.function .ffi_call_AIX,.ffi_call_AIX,16,044,LFE..0-LFB..0
	.bf __LINE__
	.line 1
LFB..0:
	/* Save registers we use.  */
	mflr	r0

	std	r28,-32(r1)
	std	r29,-24(r1)
	std	r30,-16(r1)
	std	r31, -8(r1)

	std	r0, 16(r1)
LCFI..0:
	mr	r28, r1		/* our AP.  */
	stdux	r1, r1, r4
LCFI..1:

	/* Save arguments over call...  */
	mr	r31, r5	/* flags, */
	mr	r30, r6	/* rvalue, */
	mr	r29, r7	/* function address.  */
	std	r2, 40(r1)

	/* Call ffi_prep_args.  */
	mr	r4, r1
	bl	.ffi_prep_args
	nop

	/* Now do the call.  */
	ld	r0, 0(r29)
	ld	r2, 8(r29)
	ld	r11, 16(r29)
	/* Set up cr1 with bits 4-7 of the flags.  */
	mtcrf	0x40, r31
	mtctr	r0
	/* Load all those argument registers.  */
	/* We have set up a nice stack frame, just load it into registers. */
	ld	r3, 40+(1*8)(r1)
	ld	r4, 40+(2*8)(r1)
	ld	r5, 40+(3*8)(r1)
	ld	r6, 40+(4*8)(r1)
	nop
	ld	r7, 40+(5*8)(r1)
	ld	r8, 40+(6*8)(r1)
	ld	r9, 40+(7*8)(r1)
	ld	r10,40+(8*8)(r1)

L1:
	/* Load all the FP registers.  */
	bf	6,L2 /* 2f + 0x18 */
	lfd	f1,-32-(13*8)(r28)
	lfd	f2,-32-(12*8)(r28)
	lfd	f3,-32-(11*8)(r28)
	lfd	f4,-32-(10*8)(r28)
	nop
	lfd	f5,-32-(9*8)(r28)
	lfd	f6,-32-(8*8)(r28)
	lfd	f7,-32-(7*8)(r28)
	lfd	f8,-32-(6*8)(r28)
	nop
	lfd	f9,-32-(5*8)(r28)
	lfd	f10,-32-(4*8)(r28)
	lfd	f11,-32-(3*8)(r28)
	lfd	f12,-32-(2*8)(r28)
	nop
	lfd	f13,-32-(1*8)(r28)

L2:
	/* Make the call.  */
	bctrl
	ld	r2, 40(r1)

	/* Now, deal with the return value.  */
	mtcrf	0x01, r31

	bt	30, L(done_return_value)
	bt	29, L(fp_return_value)
	std	r3, 0(r30)

	/* Fall through...  */

L(done_return_value):
	/* Restore the registers we used and return.  */
	mr	r1, r28
	ld	r0, 16(r28)
	ld	r28, -32(r1)
	mtlr	r0
	ld	r29, -24(r1)
	ld	r30, -16(r1)
	ld	r31, -8(r1)
	blr

L(fp_return_value):
	bf	28, L(float_return_value)
	stfd	f1, 0(r30)
	bf	31, L(done_return_value)
	stfd	f2, 8(r30)
	b	L(done_return_value)
L(float_return_value):
	stfs	f1, 0(r30)
	b	L(done_return_value)
LFE..0:
#else /* ! __64BIT__ */
	
	.long .ffi_call_AIX, TOC[tc0], 0
	.csect .text[PR]
.ffi_call_AIX:
	.function .ffi_call_AIX,.ffi_call_AIX,16,044,LFE..0-LFB..0
	.bf __LINE__
	.line 1
LFB..0:
	/* Save registers we use.  */
	mflr	r0

	stw	r28,-16(r1)
	stw	r29,-12(r1)
	stw	r30, -8(r1)
	stw	r31, -4(r1)

	stw	r0, 8(r1)
LCFI..0:
	mr	r28, r1		/* out AP.  */
	stwux	r1, r1, r4
LCFI..1:

	/* Save arguments over call...  */
	mr	r31, r5	/* flags, */
	mr	r30, r6	/* rvalue, */
	mr	r29, r7	/* function address, */
	stw	r2, 20(r1)

	/* Call ffi_prep_args.  */
	mr	r4, r1
	bl	.ffi_prep_args
	nop

	/* Now do the call.  */
	lwz	r0, 0(r29)
	lwz	r2, 4(r29)
	lwz	r11, 8(r29)
	/* Set up cr1 with bits 4-7 of the flags.  */
	mtcrf	0x40, r31
	mtctr	r0
	/* Load all those argument registers.  */
	/* We have set up a nice stack frame, just load it into registers. */
	lwz	r3, 20+(1*4)(r1)
	lwz	r4, 20+(2*4)(r1)
	lwz	r5, 20+(3*4)(r1)
	lwz	r6, 20+(4*4)(r1)
	nop
	lwz	r7, 20+(5*4)(r1)
	lwz	r8, 20+(6*4)(r1)
	lwz	r9, 20+(7*4)(r1)
	lwz	r10,20+(8*4)(r1)

L1:
	/* Load all the FP registers.  */
	bf	6,L2 /* 2f + 0x18 */
	lfd	f1,-16-(13*8)(r28)
	lfd	f2,-16-(12*8)(r28)
	lfd	f3,-16-(11*8)(r28)
	lfd	f4,-16-(10*8)(r28)
	nop
	lfd	f5,-16-(9*8)(r28)
	lfd	f6,-16-(8*8)(r28)
	lfd	f7,-16-(7*8)(r28)
	lfd	f8,-16-(6*8)(r28)
	nop
	lfd	f9,-16-(5*8)(r28)
	lfd	f10,-16-(4*8)(r28)
	lfd	f11,-16-(3*8)(r28)
	lfd	f12,-16-(2*8)(r28)
	nop
	lfd	f13,-16-(1*8)(r28)

L2:
	/* Make the call.  */
	bctrl
	lwz	r2, 20(r1)

	/* Now, deal with the return value.  */
	mtcrf	0x01, r31

	bt	30, L(done_return_value)
	bt	29, L(fp_return_value)
	stw	r3, 0(r30)
	bf	28, L(done_return_value)
	stw	r4, 4(r30)

	/* Fall through...  */

L(done_return_value):
	/* Restore the registers we used and return.  */
	mr	r1, r28
	lwz	r0, 8(r28)
	lwz	r28,-16(r1)
	mtlr	r0
	lwz	r29,-12(r1)
	lwz	r30, -8(r1)
	lwz	r31, -4(r1)
	blr

L(fp_return_value):
	bf	28, L(float_return_value)
	stfd	f1, 0(r30)
	b	L(done_return_value)
L(float_return_value):
	stfs	f1, 0(r30)
	b	L(done_return_value)
LFE..0:
#endif
	.ef __LINE__
	.long 0
	.byte 0,0,0,1,128,4,0,0
/* END(ffi_call_AIX) */

	/* void ffi_call_go_AIX(extended_cif *ecif, unsigned long bytes,
	 *		        unsigned int flags, unsigned int *rvalue,
	 *		        void (*fn)(),
	 *		        void (*prep_args)(extended_cif*, unsigned *const),
	 *                      void *closure);
	 * r3=ecif, r4=bytes, r5=flags, r6=rvalue, r7=fn, r8=prep_args, r9=closure
	 */

.csect .text[PR]
	.align 2
	.globl ffi_call_go_AIX
	.globl .ffi_call_go_AIX
.csect ffi_call_go_AIX[DS]
ffi_call_go_AIX:
#ifdef __64BIT__
	.llong .ffi_call_go_AIX, TOC[tc0], 0
	.csect .text[PR]
.ffi_call_go_AIX:
	.function .ffi_call_go_AIX,.ffi_call_go_AIX,16,044,LFE..1-LFB..1
	.bf __LINE__
	.line 1
LFB..1:
	/* Save registers we use.  */
	mflr	r0

	std	r28,-32(r1)
	std	r29,-24(r1)
	std	r30,-16(r1)
	std	r31, -8(r1)

	std	r9, 8(r1)	/* closure, saved in cr field. */
	std	r0, 16(r1)
LCFI..2:
	mr	r28, r1		/* our AP.  */
	stdux	r1, r1, r4
LCFI..3:

	/* Save arguments over call...  */
	mr	r31, r5	/* flags, */
	mr	r30, r6	/* rvalue, */
	mr	r29, r7	/* function address,  */
	std	r2, 40(r1)

	/* Call ffi_prep_args.  */
	mr	r4, r1
	bl	.ffi_prep_args
	nop

	/* Now do the call.  */
	ld	r0, 0(r29)
	ld	r2, 8(r29)
	ld      r11, 8(r28)	/* closure */
	/* Set up cr1 with bits 4-7 of the flags.  */
	mtcrf	0x40, r31
	mtctr	r0
	/* Load all those argument registers.  */
	/* We have set up a nice stack frame, just load it into registers. */
	ld	r3, 40+(1*8)(r1)
	ld	r4, 40+(2*8)(r1)
	ld	r5, 40+(3*8)(r1)
	ld	r6, 40+(4*8)(r1)
	nop
	ld	r7, 40+(5*8)(r1)
	ld	r8, 40+(6*8)(r1)
	ld	r9, 40+(7*8)(r1)
	ld	r10,40+(8*8)(r1)

	b	L1
LFE..1:
#else /* ! __64BIT__ */
	
	.long .ffi_call_go_AIX, TOC[tc0], 0
	.csect .text[PR]
.ffi_call_go_AIX:
	.function .ffi_call_go_AIX,.ffi_call_go_AIX,16,044,LFE..1-LFB..1
	.bf __LINE__
	.line 1
	/* Save registers we use.  */
LFB..1:
	mflr	r0

	stw	r28,-16(r1)
	stw	r29,-12(r1)
	stw	r30, -8(r1)
	stw	r31, -4(r1)

	stw	r9, 4(r1)	/* closure, saved in cr field.  */
	stw	r0, 8(r1)
LCFI..2:
	mr	r28, r1		/* out AP.  */
	stwux	r1, r1, r4
LCFI..3:

	/* Save arguments over call...  */
	mr	r31, r5	/* flags, */
	mr	r30, r6	/* rvalue, */
	mr	r29, r7	/* function address, */
	stw	r2, 20(r1)

	/* Call ffi_prep_args.  */
	mr	r4, r1
	bl	.ffi_prep_args
	nop

	/* Now do the call.  */
	lwz	r0, 0(r29)
	lwz	r2, 4(r29)
	lwz	r11, 4(r28)	/* closure */
	/* Set up cr1 with bits 4-7 of the flags.  */
	mtcrf	0x40, r31
	mtctr	r0
	/* Load all those argument registers.  */
	/* We have set up a nice stack frame, just load it into registers. */
	lwz	r3, 20+(1*4)(r1)
	lwz	r4, 20+(2*4)(r1)
	lwz	r5, 20+(3*4)(r1)
	lwz	r6, 20+(4*4)(r1)
	nop
	lwz	r7, 20+(5*4)(r1)
	lwz	r8, 20+(6*4)(r1)
	lwz	r9, 20+(7*4)(r1)
	lwz	r10,20+(8*4)(r1)

	b	L1
LFE..1:
#endif
	.ef __LINE__
	.long 0
	.byte 0,0,0,1,128,4,0,0
/* END(ffi_call_go_AIX) */

.csect .text[PR]
	.align 2
	.globl ffi_call_DARWIN
	.globl .ffi_call_DARWIN
.csect ffi_call_DARWIN[DS]
ffi_call_DARWIN:
#ifdef __64BIT__
	.llong .ffi_call_DARWIN, TOC[tc0], 0
#else
	.long .ffi_call_DARWIN, TOC[tc0], 0
#endif
	.csect .text[PR]
.ffi_call_DARWIN:
	blr
	.long 0
	.byte 0,0,0,0,0,0,0,0
/* END(ffi_call_DARWIN) */

/* EH frame stuff.  */

#define LR_REGNO		0x41		/* Link Register (65), see rs6000.md */
#ifdef __64BIT__
#define PTRSIZE			8
#define LOG2_PTRSIZE		3
#define FDE_ENCODING		0x1c		/* DW_EH_PE_pcrel|DW_EH_PE_sdata8 */
#define EH_DATA_ALIGN_FACT	0x78		/* LEB128 -8 */
#else
#define PTRSIZE			4
#define LOG2_PTRSIZE		2
#define FDE_ENCODING		0x1b		/* DW_EH_PE_pcrel|DW_EH_PE_sdata4 */
#define EH_DATA_ALIGN_FACT	0x7c		/* LEB128 -4 */
#endif
	.csect	_unwind.ro_[RO],4
	.align	LOG2_PTRSIZE
	.globl	_GLOBAL__F_libffi_src_powerpc_aix
_GLOBAL__F_libffi_src_powerpc_aix:
Lframe..1:
	.vbyte	4,LECIE..1-LSCIE..1	/* CIE Length */
LSCIE..1:
	.vbyte	4,0			/* CIE Identifier Tag */
	.byte	0x3			/* CIE Version */
	.byte	"zR"			/* CIE Augmentation */
	.byte	0
	.byte	0x1			/* uleb128 0x1; CIE Code Alignment Factor */
	.byte	EH_DATA_ALIGN_FACT	/* leb128 -4/-8; CIE Data Alignment Factor */
	.byte	0x41			/* CIE RA Column */
	.byte	0x1			/* uleb128 0x1; Augmentation size */
	.byte	FDE_ENCODING		/* FDE Encoding (pcrel|sdata4/8) */
	.byte	0xc			/* DW_CFA_def_cfa */
	.byte	0x1			/*     uleb128 0x1; Register r1 */
	.byte	0			/*     uleb128 0x0; Offset 0 */
	.align	LOG2_PTRSIZE
LECIE..1:
LSFDE..1:
	.vbyte	4,LEFDE..1-LASFDE..1	/* FDE Length */
LASFDE..1:
	.vbyte	4,LASFDE..1-Lframe..1	/* FDE CIE offset */
	.vbyte	PTRSIZE,LFB..0-$	/* FDE initial location */
	.vbyte	PTRSIZE,LFE..0-LFB..0	/* FDE address range */
	.byte   0			/* uleb128 0x0; Augmentation size */
	.byte	0x4			/* DW_CFA_advance_loc4 */
	.vbyte	4,LCFI..0-LFB..0
	.byte	0x11			/* DW_CFA_def_offset_extended_sf */
	.byte	LR_REGNO		/*     uleb128 LR_REGNO; Register LR */
	.byte	0x7e			/*     leb128 -2; Offset -2 (8/16) */
	.byte	0x9f			/* DW_CFA_offset Register r31 */
	.byte	0x1			/*     uleb128 0x1; Offset 1 (-4/-8) */
	.byte	0x9e			/* DW_CFA_offset Register r30 */
	.byte	0x2			/*     uleb128 0x2; Offset 2 (-8/-16) */
	.byte	0x9d			/* DW_CFA_offset Register r29 */
	.byte	0x3			/*     uleb128 0x3; Offset 3 (-12/-24) */
	.byte	0x9c			/* DW_CFA_offset Register r28 */
	.byte	0x4			/*     uleb128 0x4; Offset 4 (-16/-32) */
	.byte	0x4			/* DW_CFA_advance_loc4 */
	.vbyte	4,LCFI..1-LCFI..0
	.byte	0xd			/* DW_CFA_def_cfa_register */
	.byte	0x1c			/*     uleb128 28; Register r28 */
	.align	LOG2_PTRSIZE
LEFDE..1:
LSFDE..2:
	.vbyte	4,LEFDE..2-LASFDE..2	/* FDE Length */
LASFDE..2:
	.vbyte	4,LASFDE..2-Lframe..1	/* FDE CIE offset */
	.vbyte	PTRSIZE,LFB..1-$	/* FDE initial location */
	.vbyte	PTRSIZE,LFE..1-LFB..1	/* FDE address range */
	.byte   0			/* uleb128 0x0; Augmentation size */
	.byte	0x4			/* DW_CFA_advance_loc4 */
	.vbyte	4,LCFI..2-LFB..1
	.byte	0x11			/* DW_CFA_def_offset_extended_sf */
	.byte	LR_REGNO		/*     uleb128 LR_REGNO; Register LR */
	.byte	0x7e			/*     leb128 -2; Offset -2 (8/16) */
	.byte	0x9f			/* DW_CFA_offset Register r31 */
	.byte	0x1			/*     uleb128 0x1; Offset 1 (-4/-8) */
	.byte	0x9e			/* DW_CFA_offset Register r30 */
	.byte	0x2			/*     uleb128 0x2; Offset 2 (-8/-16) */
	.byte	0x9d			/* DW_CFA_offset Register r29 */
	.byte	0x3			/*     uleb128 0x3; Offset 3 (-12/-24) */
	.byte	0x9c			/* DW_CFA_offset Register r28 */
	.byte	0x4			/*     uleb128 0x4; Offset 4 (-16/-32) */
	.byte	0x4			/* DW_CFA_advance_loc4 */
	.vbyte	4,LCFI..3-LCFI..2
	.byte	0xd			/* DW_CFA_def_cfa_register */
	.byte	0x1c			/*     uleb128 28; Register r28 */
	.align	LOG2_PTRSIZE
LEFDE..2:
	.vbyte	4,0			/* End of FDEs */

	.csect	.text[PR]
	.ref	_GLOBAL__F_libffi_src_powerpc_aix	/* Prevents garbage collection by AIX linker */

