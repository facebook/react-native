/* -----------------------------------------------------------------------
   darwin.S - Copyright (c) 2000 John Hornkvist
	      Copyright (c) 2004, 2010 Free Software Foundation, Inc.

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

#define LIBFFI_ASM
#if defined(__ppc64__)
#define MODE_CHOICE(x, y) y
#else
#define MODE_CHOICE(x, y) x
#endif

#define machine_choice	MODE_CHOICE(ppc7400,ppc64)

; Define some pseudo-opcodes for size-independent load & store of GPRs ...
#define lgu		MODE_CHOICE(lwzu, ldu)
#define lg		MODE_CHOICE(lwz,ld)
#define sg		MODE_CHOICE(stw,std)
#define sgu		MODE_CHOICE(stwu,stdu)
#define sgux		MODE_CHOICE(stwux,stdux)

; ... and the size of GPRs and their storage indicator.
#define GPR_BYTES	MODE_CHOICE(4,8)
#define LOG2_GPR_BYTES	MODE_CHOICE(2,3)	/* log2(GPR_BYTES) */
#define g_long		MODE_CHOICE(long, quad)	/* usage is ".g_long" */

; From the ABI doc: "Mac OS X ABI Function Call Guide" Version 2009-02-04.
#define LINKAGE_SIZE	MODE_CHOICE(24,48)
#define PARAM_AREA	MODE_CHOICE(32,64)
#define SAVED_LR_OFFSET	MODE_CHOICE(8,16)	/* save position for lr */

/* If there is any FP stuff we make space for all of the regs.  */
#define SAVED_FPR_COUNT 13
#define FPR_SIZE	8
#define RESULT_BYTES	16

/* This should be kept in step with the same value in ffi_darwin.c.  */
#define ASM_NEEDS_REGISTERS 4
#define SAVE_REGS_SIZE (ASM_NEEDS_REGISTERS * GPR_BYTES)

#include <fficonfig.h>
#include <ffi.h>

#define JUMPTARGET(name) name
#define L(x) x

	.text
	.align 2
	.globl _ffi_prep_args

	.align 2
	.globl _ffi_call_DARWIN

	/* We arrive here with:
	   r3 = ptr to extended cif.
	   r4 = -bytes.
	   r5 = cif flags.
	   r6 = ptr to return value.
	   r7 = fn pointer (user func).
	   r8 = fn pointer (ffi_prep_args).
	   r9 = ffi_type* for the ret val.  */

_ffi_call_DARWIN:
Lstartcode:
	mr   	r12,r8	/* We only need r12 until the call,
			   so it does not have to be saved.  */
LFB1:
	/* Save the old stack pointer as AP.  */
	mr	r8,r1
LCFI0:
	
	/* Save the retval type in parents frame.  */
	sg	r9,(LINKAGE_SIZE+6*GPR_BYTES)(r8)

	/* Allocate the stack space we need.  */
	sgux	r1,r1,r4

	/* Save registers we use.  */
	mflr	r9
	sg	r9,SAVED_LR_OFFSET(r8)

	sg	r28,-(4 * GPR_BYTES)(r8)	
	sg	r29,-(3 * GPR_BYTES)(r8)
	sg	r30,-(2 * GPR_BYTES)(r8)
	sg	r31,-(    GPR_BYTES)(r8)

#if !defined(POWERPC_DARWIN)
	/* The TOC slot is reserved in the Darwin ABI and r2 is volatile.  */
	sg	r2,(5 * GPR_BYTES)(r1)
#endif

LCFI1:

	/* Save arguments over call.  */
	mr	r31,r5	/* flags,  */
	mr	r30,r6	/* rvalue,  */
	mr	r29,r7	/* function address,  */
	mr	r28,r8	/* our AP.  */
LCFI2:
	/* Call ffi_prep_args. r3 = extended cif, r4 = stack ptr copy.  */
	mr	r4,r1
	li	r9,0

	mtctr	r12 /* r12 holds address of _ffi_prep_args.  */
	bctrl

#if !defined(POWERPC_DARWIN)
	/* The TOC slot is reserved in the Darwin ABI and r2 is volatile.  */
	lg     r2,(5 * GPR_BYTES)(r1)
#endif
	/* Now do the call.
	   Set up cr1 with bits 4-7 of the flags.  */
	mtcrf	0x40,r31
	/* Get the address to call into CTR.  */
	mtctr	r29
	/* Load all those argument registers.
	   We have set up a nice stack frame, just load it into registers.  */
	lg     r3, (LINKAGE_SIZE                )(r1)
	lg     r4, (LINKAGE_SIZE +     GPR_BYTES)(r1)
	lg     r5, (LINKAGE_SIZE + 2 * GPR_BYTES)(r1)
	lg     r6, (LINKAGE_SIZE + 3 * GPR_BYTES)(r1)
	nop
	lg     r7, (LINKAGE_SIZE + 4 * GPR_BYTES)(r1)
	lg     r8, (LINKAGE_SIZE + 5 * GPR_BYTES)(r1)
	lg     r9, (LINKAGE_SIZE + 6 * GPR_BYTES)(r1)
	lg     r10,(LINKAGE_SIZE + 7 * GPR_BYTES)(r1)

L1:
	/* ... Load all the FP registers.  */
	bf	6,L2	/* No floats to load.  */
	lfd	f1, -SAVE_REGS_SIZE-(13*FPR_SIZE)(r28)
	lfd	f2, -SAVE_REGS_SIZE-(12*FPR_SIZE)(r28)
	lfd	f3, -SAVE_REGS_SIZE-(11*FPR_SIZE)(r28)
	lfd	f4, -SAVE_REGS_SIZE-(10*FPR_SIZE)(r28)
	nop
	lfd	f5, -SAVE_REGS_SIZE-( 9*FPR_SIZE)(r28)
	lfd	f6, -SAVE_REGS_SIZE-( 8*FPR_SIZE)(r28)
	lfd	f7, -SAVE_REGS_SIZE-( 7*FPR_SIZE)(r28)
	lfd	f8, -SAVE_REGS_SIZE-( 6*FPR_SIZE)(r28)
	nop
	lfd     f9, -SAVE_REGS_SIZE-( 5*FPR_SIZE)(r28)
	lfd     f10,-SAVE_REGS_SIZE-( 4*FPR_SIZE)(r28)
	lfd     f11,-SAVE_REGS_SIZE-( 3*FPR_SIZE)(r28)
	lfd     f12,-SAVE_REGS_SIZE-( 2*FPR_SIZE)(r28)
	nop
	lfd     f13,-SAVE_REGS_SIZE-( 1*FPR_SIZE)(r28)

L2:
	mr	r12,r29	/* Put the target address in r12 as specified.  */
	mtctr  	r12
	nop
	nop

	/* Make the call.  */
	bctrl

	/* Now, deal with the return value.  */

	/* m64 structure returns can occupy the same set of registers as
	   would be used to pass such a structure as arg0 - so take care 
	   not to step on any possibly hot regs.  */

	/* Get the flags.. */
	mtcrf	0x03,r31 ; we need c6 & cr7 now.
	; FLAG_RETURNS_NOTHING also covers struct ret-by-ref.
	bt	30,L(done_return_value)	  ; FLAG_RETURNS_NOTHING
	bf	27,L(scalar_return_value) ; not FLAG_RETURNS_STRUCT
	
	/* OK, so we have a struct.  */
#if defined(__ppc64__)
	bt	31,L(maybe_return_128) ; FLAG_RETURNS_128BITS, special case 

	/* OK, we have to map the return back to a mem struct.
	   We are about to trample the parents param area, so recover the
	   return type.  r29 is free, since the call is done.  */
	lg	r29,(LINKAGE_SIZE + 6 * GPR_BYTES)(r28)

	sg	r3, (LINKAGE_SIZE                )(r28)
	sg	r4, (LINKAGE_SIZE +     GPR_BYTES)(r28)
	sg	r5, (LINKAGE_SIZE + 2 * GPR_BYTES)(r28)
	sg	r6, (LINKAGE_SIZE + 3 * GPR_BYTES)(r28)
	nop
	sg	r7, (LINKAGE_SIZE + 4 * GPR_BYTES)(r28)
	sg	r8, (LINKAGE_SIZE + 5 * GPR_BYTES)(r28)
	sg	r9, (LINKAGE_SIZE + 6 * GPR_BYTES)(r28)
	sg	r10,(LINKAGE_SIZE + 7 * GPR_BYTES)(r28)
	/* OK, so do the block move - we trust that memcpy will not trample
	   the fprs...  */
	mr 	r3,r30 ; dest
	addi	r4,r28,LINKAGE_SIZE ; source
	/* The size is a size_t, should be long.  */
	lg	r5,0(r29)
	/* Figure out small structs */
	cmpi	0,r5,4
	bgt	L3	; 1, 2 and 4 bytes have special rules.
	cmpi	0,r5,3
	beq	L3	; not 3
	addi	r4,r4,8
	subf	r4,r5,r4
L3:
	bl	_memcpy
	
	/* ... do we need the FP registers? - recover the flags.. */
	mtcrf	0x03,r31 ; we need c6 & cr7 now.
	bf	29,L(done_return_value)	/* No floats in the struct.  */
	stfd	f1, -SAVE_REGS_SIZE-(13*FPR_SIZE)(r28)
	stfd	f2, -SAVE_REGS_SIZE-(12*FPR_SIZE)(r28)
	stfd	f3, -SAVE_REGS_SIZE-(11*FPR_SIZE)(r28)
	stfd	f4, -SAVE_REGS_SIZE-(10*FPR_SIZE)(r28)
	nop
	stfd	f5, -SAVE_REGS_SIZE-( 9*FPR_SIZE)(r28)
	stfd	f6, -SAVE_REGS_SIZE-( 8*FPR_SIZE)(r28)
	stfd	f7, -SAVE_REGS_SIZE-( 7*FPR_SIZE)(r28)
	stfd	f8, -SAVE_REGS_SIZE-( 6*FPR_SIZE)(r28)
	nop
	stfd	f9, -SAVE_REGS_SIZE-( 5*FPR_SIZE)(r28)
	stfd	f10,-SAVE_REGS_SIZE-( 4*FPR_SIZE)(r28)
	stfd	f11,-SAVE_REGS_SIZE-( 3*FPR_SIZE)(r28)
	stfd	f12,-SAVE_REGS_SIZE-( 2*FPR_SIZE)(r28)
	nop
	stfd	f13,-SAVE_REGS_SIZE-( 1*FPR_SIZE)(r28)

	mr	r3,r29	; ffi_type *
	mr	r4,r30	; dest
	addi	r5,r28,-SAVE_REGS_SIZE-(13*FPR_SIZE) ; fprs
	xor	r6,r6,r6
	sg	r6,(LINKAGE_SIZE + 7 * GPR_BYTES)(r28)
	addi	r6,r28,(LINKAGE_SIZE + 7 * GPR_BYTES) ; point to a zeroed counter.
	bl 	_darwin64_struct_floats_to_mem

	b L(done_return_value)
#else
	stw	r3,0(r30) ; m32 the only struct return in reg is 4 bytes.
#endif
	b L(done_return_value)

L(fp_return_value):
	/* Do we have long double to store?  */
	bf	31,L(fd_return_value) ; FLAG_RETURNS_128BITS
	stfd	f1,0(r30)
	stfd	f2,FPR_SIZE(r30)
	b	L(done_return_value)

L(fd_return_value):
	/* Do we have double to store?  */
	bf	28,L(float_return_value)
	stfd	f1,0(r30)
	b	L(done_return_value)

L(float_return_value):
	/* We only have a float to store.  */
	stfs	f1,0(r30)
	b	L(done_return_value)

L(scalar_return_value):
	bt	29,L(fp_return_value)	; FLAG_RETURNS_FP
	; ffi_arg is defined as unsigned long. 
	sg	r3,0(r30)		; Save the reg.
	bf	28,L(done_return_value) ; not FLAG_RETURNS_64BITS 

#if defined(__ppc64__)
L(maybe_return_128):
	std	r3,0(r30)
	bf	31,L(done_return_value) ; not FLAG_RETURNS_128BITS 
	std	r4,8(r30)
#else
	stw	r4,4(r30)
#endif

	/* Fall through.  */
	/* We want this at the end to simplify eh epilog computation.  */

L(done_return_value):
	/* Restore the registers we used and return.  */
	lg	r29,SAVED_LR_OFFSET(r28)
	; epilog
	lg	r31,-(1 * GPR_BYTES)(r28)
	mtlr	r29
	lg	r30,-(2 * GPR_BYTES)(r28)
	lg	r29,-(3 * GPR_BYTES)(r28)
	lg	r28,-(4 * GPR_BYTES)(r28)
	lg	r1,0(r1)
	blr
LFE1:
	.align	1
/* END(_ffi_call_DARWIN)  */

/* Provide a null definition of _ffi_call_AIX.  */
	.text
	.globl _ffi_call_AIX
	.align 2
_ffi_call_AIX:
	blr
/* END(_ffi_call_AIX)  */

/* EH stuff.  */

#define EH_DATA_ALIGN_FACT MODE_CHOICE(0x7c,0x78)

	.section __TEXT,__eh_frame,coalesced,no_toc+strip_static_syms+live_support
EH_frame1:
	.set	L$set$0,LECIE1-LSCIE1
	.long	L$set$0	; Length of Common Information Entry
LSCIE1:
	.long	0x0	; CIE Identifier Tag
	.byte	0x1	; CIE Version
	.ascii	"zR\0"	; CIE Augmentation
	.byte	0x1	; uleb128 0x1; CIE Code Alignment Factor
	.byte	EH_DATA_ALIGN_FACT ; sleb128 -4; CIE Data Alignment Factor
	.byte	0x41	; CIE RA Column
	.byte	0x1	; uleb128 0x1; Augmentation size
	.byte	0x10	; FDE Encoding (pcrel)
	.byte	0xc	; DW_CFA_def_cfa
	.byte	0x1	; uleb128 0x1
	.byte	0x0	; uleb128 0x0
	.align	LOG2_GPR_BYTES
LECIE1:

	.globl _ffi_call_DARWIN.eh
_ffi_call_DARWIN.eh:
LSFDE1:
	.set	L$set$1,LEFDE1-LASFDE1
	.long	L$set$1	; FDE Length
LASFDE1:
	.long	LASFDE1-EH_frame1 ; FDE CIE offset
	.g_long	Lstartcode-.	; FDE initial location
	.set	L$set$3,LFE1-Lstartcode
	.g_long	L$set$3	; FDE address range
	.byte   0x0     ; uleb128 0x0; Augmentation size
	.byte	0x4	; DW_CFA_advance_loc4
	.set	L$set$4,LCFI0-Lstartcode
	.long	L$set$4
	.byte	0xd	; DW_CFA_def_cfa_register
	.byte	0x08	; uleb128 0x08
	.byte	0x4	; DW_CFA_advance_loc4
	.set	L$set$5,LCFI1-LCFI0
	.long	L$set$5
	.byte   0x11    ; DW_CFA_offset_extended_sf
	.byte	0x41	; uleb128 0x41
	.byte   0x7e    ; sleb128 -2
	.byte	0x9f	; DW_CFA_offset, column 0x1f
	.byte	0x1	; uleb128 0x1
	.byte	0x9e	; DW_CFA_offset, column 0x1e
	.byte	0x2	; uleb128 0x2
	.byte	0x9d	; DW_CFA_offset, column 0x1d
	.byte	0x3	; uleb128 0x3
	.byte	0x9c	; DW_CFA_offset, column 0x1c
	.byte	0x4	; uleb128 0x4
	.byte	0x4	; DW_CFA_advance_loc4
	.set	L$set$6,LCFI2-LCFI1
	.long	L$set$6
	.byte	0xd	; DW_CFA_def_cfa_register
	.byte	0x1c	; uleb128 0x1c
	.align LOG2_GPR_BYTES
LEFDE1:
	.align 1

