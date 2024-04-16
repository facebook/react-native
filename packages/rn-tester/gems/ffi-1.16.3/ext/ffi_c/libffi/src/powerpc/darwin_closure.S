/* -----------------------------------------------------------------------
   darwin_closure.S - Copyright (c) 2002, 2003, 2004, 2010, 
   Free Software Foundation, Inc. 
   based on ppc_closure.S

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
#define L(x) x

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

; ... and the size of GPRs and their storage indicator.
#define GPR_BYTES	MODE_CHOICE(4,8)
#define LOG2_GPR_BYTES	MODE_CHOICE(2,3)	/* log2(GPR_BYTES) */
#define g_long		MODE_CHOICE(long, quad)	/* usage is ".g_long" */

; From the ABI doc: "Mac OS X ABI Function Call Guide" Version 2009-02-04.
#define LINKAGE_SIZE	MODE_CHOICE(24,48)
#define PARAM_AREA	MODE_CHOICE(32,64)

#define SAVED_CR_OFFSET	MODE_CHOICE(4,8)	/* save position for CR */
#define SAVED_LR_OFFSET	MODE_CHOICE(8,16)	/* save position for lr */

/* WARNING: if ffi_type is changed... here be monsters.  
   Offsets of items within the result type.  */
#define FFI_TYPE_TYPE	MODE_CHOICE(6,10)
#define FFI_TYPE_ELEM	MODE_CHOICE(8,16)

#define SAVED_FPR_COUNT 13
#define FPR_SIZE	8
/* biggest m64 struct ret is 8GPRS + 13FPRS = 168 bytes - rounded to 16bytes = 176. */
#define RESULT_BYTES	MODE_CHOICE(16,176)

; The whole stack frame **MUST** be 16byte-aligned.
#define SAVE_SIZE (((LINKAGE_SIZE+PARAM_AREA+SAVED_FPR_COUNT*FPR_SIZE+RESULT_BYTES)+15) & -16LL)
#define PAD_SIZE (SAVE_SIZE-(LINKAGE_SIZE+PARAM_AREA+SAVED_FPR_COUNT*FPR_SIZE+RESULT_BYTES))

#define PARENT_PARM_BASE (SAVE_SIZE+LINKAGE_SIZE)
#define FP_SAVE_BASE (LINKAGE_SIZE+PARAM_AREA)

#if defined(__ENVIRONMENT_MAC_OS_X_VERSION_MIN_REQUIRED__) && __ENVIRONMENT_MAC_OS_X_VERSION_MIN_REQUIRED__ >= 1050
; We no longer need the pic symbol stub for Darwin >= 9.
#define BLCLS_HELP _ffi_closure_helper_DARWIN
#define STRUCT_RETVALUE_P _darwin64_struct_ret_by_value_p
#define PASS_STR_FLOATS _darwin64_pass_struct_floats
#undef WANT_STUB
#else
#define BLCLS_HELP L_ffi_closure_helper_DARWIN$stub
#define STRUCT_RETVALUE_P L_darwin64_struct_ret_by_value_p$stub
#define PASS_STR_FLOATS L_darwin64_pass_struct_floats$stub
#define WANT_STUB
#endif

/* m32/m64

   The stack layout looks like this:

   |   Additional params...			| |     Higher address
   ~						~ ~
   |   Parameters      (at least 8*4/8=32/64)	| | NUM_GPR_ARG_REGISTERS
   |--------------------------------------------| |
   |   TOC=R2 (AIX) Reserved (Darwin)   4/8	| |
   |--------------------------------------------| |
   |   Reserved                       2*4/8	| |
   |--------------------------------------------| |
   |   Space for callee`s LR		4/8	| |
   |--------------------------------------------| |
   |   Saved CR [low word for m64]      4/8	| |
   |--------------------------------------------| |
   |   Current backchain pointer	4/8	|-/ Parent`s frame.
   |--------------------------------------------| <+ <<< on entry to
   |   Result Bytes		       16/176	| |
   |--------------------------------------------| |
   ~   padding to 16-byte alignment		~ ~
   |--------------------------------------------| |
   |   NUM_FPR_ARG_REGISTERS slots		| |
   |   here fp13 .. fp1		       13*8	| |
   |--------------------------------------------| |
   |   R3..R10			  8*4/8=32/64	| | NUM_GPR_ARG_REGISTERS
   |--------------------------------------------| |
   |   TOC=R2 (AIX) Reserved (Darwin)   4/8	| |
   |--------------------------------------------| |	stack	|
   |   Reserved [compiler,binder]     2*4/8	| |	grows	|
   |--------------------------------------------| |	down	V
   |   Space for callees LR		4/8	| |
   |--------------------------------------------| |	lower addresses
   |   Saved CR [low word for m64]      4/8	| |
   |--------------------------------------------| |     stack pointer here
   |   Current backchain pointer	4/8	|-/	during
   |--------------------------------------------|   <<<	call.

*/

	.file	"darwin_closure.S"

	.machine machine_choice

	.text
	.globl _ffi_closure_ASM
	.align LOG2_GPR_BYTES
_ffi_closure_ASM:
LFB1:
Lstartcode:
	mflr	r0			/* extract return address  */
	sg	r0,SAVED_LR_OFFSET(r1)	/* save the return address  */
LCFI0:
	sgu	r1,-SAVE_SIZE(r1)	/* skip over caller save area
					keep stack aligned to 16.  */
LCFI1:
	/* We want to build up an area for the parameters passed
	   in registers. (both floating point and integer)  */

	/* Put gpr 3 to gpr 10 in the parents outgoing area...
	   ... the remainder of any params that overflowed the regs will
	   follow here.  */
	sg	r3, (PARENT_PARM_BASE                )(r1)
	sg	r4, (PARENT_PARM_BASE + GPR_BYTES    )(r1)
	sg	r5, (PARENT_PARM_BASE + GPR_BYTES * 2)(r1)
	sg	r6, (PARENT_PARM_BASE + GPR_BYTES * 3)(r1)
	sg	r7, (PARENT_PARM_BASE + GPR_BYTES * 4)(r1)
	sg	r8, (PARENT_PARM_BASE + GPR_BYTES * 5)(r1)
	sg	r9, (PARENT_PARM_BASE + GPR_BYTES * 6)(r1)
	sg	r10,(PARENT_PARM_BASE + GPR_BYTES * 7)(r1)

	/* We save fpr 1 to fpr 14 in our own save frame.  */
	stfd	f1, (FP_SAVE_BASE                 )(r1)
	stfd	f2, (FP_SAVE_BASE +  FPR_SIZE     )(r1)
	stfd	f3, (FP_SAVE_BASE +  FPR_SIZE * 2 )(r1)
	stfd	f4, (FP_SAVE_BASE +  FPR_SIZE * 3 )(r1)
	stfd	f5, (FP_SAVE_BASE +  FPR_SIZE * 4 )(r1)
	stfd	f6, (FP_SAVE_BASE +  FPR_SIZE * 5 )(r1)
	stfd	f7, (FP_SAVE_BASE +  FPR_SIZE * 6 )(r1)
	stfd	f8, (FP_SAVE_BASE +  FPR_SIZE * 7 )(r1)
	stfd	f9, (FP_SAVE_BASE +  FPR_SIZE * 8 )(r1)
	stfd	f10,(FP_SAVE_BASE +  FPR_SIZE * 9 )(r1)
	stfd	f11,(FP_SAVE_BASE +  FPR_SIZE * 10)(r1)
	stfd	f12,(FP_SAVE_BASE +  FPR_SIZE * 11)(r1)
	stfd	f13,(FP_SAVE_BASE +  FPR_SIZE * 12)(r1)

	/* Set up registers for the routine that actually does the work
	   get the context pointer from the trampoline.  */
	mr	r3,r11

	/* Now load up the pointer to the result storage.  */
	addi	r4,r1,(SAVE_SIZE-RESULT_BYTES)

	/* Now load up the pointer to the saved gpr registers.  */
	addi	r5,r1,PARENT_PARM_BASE

	/* Now load up the pointer to the saved fpr registers.  */
	addi	r6,r1,FP_SAVE_BASE

	/* Make the call.  */
	bl	BLCLS_HELP

	/* r3 contains the rtype pointer... save it since we will need
	   it later.  */
	sg	r3,LINKAGE_SIZE(r1)	; ffi_type * result_type
	lg	r0,0(r3)		; size => r0
	lhz	r3,FFI_TYPE_TYPE(r3)	; type => r3

	/* The helper will have intercepted structure returns and inserted
	   the caller`s destination address for structs returned by ref.  */

	/* r3 contains the return type  so use it to look up in a table
	   so we know how to deal with each type.  */

	addi	r5,r1,(SAVE_SIZE-RESULT_BYTES) /* Otherwise, our return is here.  */
	bl	Lget_ret_type0_addr	/* Get pointer to Lret_type0 into LR.  */
	mflr	r4			/* Move to r4.  */
	slwi	r3,r3,4			/* Now multiply return type by 16.  */
	add	r3,r3,r4		/* Add contents of table to table address.  */
	mtctr	r3
	bctr			 	 /* Jump to it.  */
LFE1:
/* Each of the ret_typeX code fragments has to be exactly 16 bytes long
   (4 instructions). For cache effectiveness we align to a 16 byte boundary
   first.  */

	.align 4

	nop
	nop
	nop
Lget_ret_type0_addr:
	blrl

/* case FFI_TYPE_VOID  */
Lret_type0:
	b	Lfinish
	nop
	nop
	nop

/* case FFI_TYPE_INT  */
Lret_type1:
	lg	r3,0(r5)
	b	Lfinish
	nop
	nop

/* case FFI_TYPE_FLOAT  */
Lret_type2:
	lfs	f1,0(r5)
	b	Lfinish
	nop
	nop

/* case FFI_TYPE_DOUBLE  */
Lret_type3:
	lfd	f1,0(r5)
	b	Lfinish
	nop
	nop

/* case FFI_TYPE_LONGDOUBLE  */
Lret_type4:
	lfd	f1,0(r5)
	lfd	f2,8(r5)
	b	Lfinish
	nop

/* case FFI_TYPE_UINT8  */
Lret_type5:
#if defined(__ppc64__)
	lbz	r3,7(r5)
#else
	lbz	r3,3(r5)
#endif
	b	Lfinish
	nop
	nop

/* case FFI_TYPE_SINT8  */
Lret_type6:
#if defined(__ppc64__)
	lbz	r3,7(r5)
#else
	lbz	r3,3(r5)
#endif
	extsb	r3,r3
	b	Lfinish
	nop

/* case FFI_TYPE_UINT16  */
Lret_type7:
#if defined(__ppc64__)
	lhz	r3,6(r5)
#else
	lhz	r3,2(r5)
#endif
	b	Lfinish
	nop
	nop

/* case FFI_TYPE_SINT16  */
Lret_type8:
#if defined(__ppc64__)
	lha	r3,6(r5)
#else
	lha	r3,2(r5)
#endif
	b	Lfinish
	nop
	nop

/* case FFI_TYPE_UINT32  */
Lret_type9:
#if defined(__ppc64__)
	lwz	r3,4(r5)
#else
	lwz	r3,0(r5)
#endif
	b	Lfinish
	nop
	nop

/* case FFI_TYPE_SINT32  */
Lret_type10:
#if defined(__ppc64__)
	lwz	r3,4(r5)
#else
	lwz	r3,0(r5)
#endif
	b	Lfinish
	nop
	nop

/* case FFI_TYPE_UINT64  */
Lret_type11:
#if defined(__ppc64__)
	lg	r3,0(r5)
	b	Lfinish
	nop
#else
	lwz	r3,0(r5)
	lwz	r4,4(r5)
	b	Lfinish
#endif
	nop

/* case FFI_TYPE_SINT64  */
Lret_type12:
#if defined(__ppc64__)
	lg	r3,0(r5)
	b	Lfinish
	nop
#else
	lwz	r3,0(r5)
	lwz	r4,4(r5)
	b	Lfinish
#endif
	nop

/* case FFI_TYPE_STRUCT  */
Lret_type13:
#if defined(__ppc64__)
	lg	r3,0(r5)		; we need at least this...
	cmpi	0,r0,4
	bgt	Lstructend		; not a special small case
	b	Lsmallstruct		; see if we need more.
#else
	cmpwi	0,r0,4
	bgt	Lfinish		; not by value
	lg	r3,0(r5)
	b	Lfinish
#endif
/* case FFI_TYPE_POINTER  */
Lret_type14:
	lg	r3,0(r5)
	b	Lfinish
	nop
	nop

#if defined(__ppc64__)
Lsmallstruct:
	beq	Lfour			; continuation of Lret13.
	cmpi	0,r0,3
	beq	Lfinish			; don`t adjust this - can`t be any floats here...
	srdi	r3,r3,48
	cmpi	0,r0,2
	beq	Lfinish			; .. or here ..
	srdi	r3,r3,8
	b 	Lfinish			; .. or here.

Lfour:
	lg	r6,LINKAGE_SIZE(r1)	; get the result type
	lg	r6,FFI_TYPE_ELEM(r6)	; elements array pointer
	lg	r6,0(r6)		; first element
	lhz	r0,FFI_TYPE_TYPE(r6)	; OK go the type
	cmpi	0,r0,2			; FFI_TYPE_FLOAT
	bne	Lfourint
	lfs	f1,0(r5)		; just one float in the struct.
	b 	Lfinish

Lfourint:
	srdi	r3,r3,32		; four bytes.
	b 	Lfinish

Lstructend:
	lg	r3,LINKAGE_SIZE(r1)	; get the result type
	bl	STRUCT_RETVALUE_P
	cmpi	0,r3,0
	beq	Lfinish			; nope.
	/* Recover a pointer to the results.  */
	addi	r11,r1,(SAVE_SIZE-RESULT_BYTES)
	lg	r3,0(r11)		; we need at least this...
	lg	r4,8(r11)
	cmpi	0,r0,16
	beq	Lfinish		; special case 16 bytes we don't consider floats.

	/* OK, frustratingly, the process of saving the struct to mem might have
	   messed with the FPRs, so we have to re-load them :(.
	   We`ll use our FPRs space again - calling: 
	   void darwin64_pass_struct_floats (ffi_type *s, char *src, 
					     unsigned *nfpr, double **fprs) 
	   We`ll temporarily pinch the first two slots of the param area for local
	   vars used by the routine.  */
	xor	r6,r6,r6
	addi	r5,r1,PARENT_PARM_BASE		; some space
	sg	r6,0(r5)			; *nfpr zeroed.
	addi	r6,r5,8				; **fprs
	addi	r3,r1,FP_SAVE_BASE		; pointer to FPRs space
	sg	r3,0(r6)
	mr	r4,r11				; the struct is here...
	lg	r3,LINKAGE_SIZE(r1)		; ffi_type * result_type.
	bl	PASS_STR_FLOATS			; get struct floats into FPR save space.
	/* See if we used any floats  */
	lwz	r0,(SAVE_SIZE-RESULT_BYTES)(r1)	
	cmpi	0,r0,0
	beq	Lstructints			; nope.
	/* OK load `em up... */
	lfd	f1, (FP_SAVE_BASE                 )(r1)
	lfd	f2, (FP_SAVE_BASE +  FPR_SIZE     )(r1)
	lfd	f3, (FP_SAVE_BASE +  FPR_SIZE * 2 )(r1)
	lfd	f4, (FP_SAVE_BASE +  FPR_SIZE * 3 )(r1)
	lfd	f5, (FP_SAVE_BASE +  FPR_SIZE * 4 )(r1)
	lfd	f6, (FP_SAVE_BASE +  FPR_SIZE * 5 )(r1)
	lfd	f7, (FP_SAVE_BASE +  FPR_SIZE * 6 )(r1)
	lfd	f8, (FP_SAVE_BASE +  FPR_SIZE * 7 )(r1)
	lfd	f9, (FP_SAVE_BASE +  FPR_SIZE * 8 )(r1)
	lfd	f10,(FP_SAVE_BASE +  FPR_SIZE * 9 )(r1)
	lfd	f11,(FP_SAVE_BASE +  FPR_SIZE * 10)(r1)
	lfd	f12,(FP_SAVE_BASE +  FPR_SIZE * 11)(r1)
	lfd	f13,(FP_SAVE_BASE +  FPR_SIZE * 12)(r1)

	/* point back at our saved struct.  */
Lstructints:
	addi	r11,r1,(SAVE_SIZE-RESULT_BYTES)
	lg	r3,0(r11)			; we end up picking the
	lg	r4,8(r11)			; first two again.
	lg	r5,16(r11)
	lg	r6,24(r11)
	lg	r7,32(r11)
	lg	r8,40(r11)
	lg	r9,48(r11)
	lg	r10,56(r11)
#endif

/* case done  */
Lfinish:
	addi	r1,r1,SAVE_SIZE		/* Restore stack pointer.  */
	lg	r0,SAVED_LR_OFFSET(r1)	/* Get return address.  */
	mtlr	r0			/* Reset link register.  */
	blr
Lendcode:
	.align 1
	
/* END(ffi_closure_ASM)  */

/* EH frame stuff.  */
#define EH_DATA_ALIGN_FACT MODE_CHOICE(0x7c,0x78)
/* 176, 400 */
#define EH_FRAME_OFFSETA MODE_CHOICE(176,0x90)
#define EH_FRAME_OFFSETB MODE_CHOICE(1,3)

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
	.globl _ffi_closure_ASM.eh
_ffi_closure_ASM.eh:
LSFDE1:
	.set	L$set$1,LEFDE1-LASFDE1
	.long	L$set$1	; FDE Length

LASFDE1:
	.long	LASFDE1-EH_frame1	; FDE CIE offset
	.g_long	Lstartcode-.	; FDE initial location
	.set	L$set$2,LFE1-Lstartcode
	.g_long	L$set$2	; FDE address range
	.byte   0x0     ; uleb128 0x0; Augmentation size
	.byte	0x4	; DW_CFA_advance_loc4
	.set	L$set$3,LCFI1-LCFI0
	.long	L$set$3
	.byte	0xe	; DW_CFA_def_cfa_offset
	.byte	EH_FRAME_OFFSETA,EH_FRAME_OFFSETB	; uleb128 176,1/190,3
	.byte	0x4	; DW_CFA_advance_loc4
	.set	L$set$4,LCFI0-Lstartcode
	.long	L$set$4
	.byte   0x11    ; DW_CFA_offset_extended_sf
	.byte	0x41	; uleb128 0x41
	.byte   0x7e    ; sleb128 -2
	.align	LOG2_GPR_BYTES
LEFDE1:
	.align 	1

#ifdef WANT_STUB
	.section __TEXT,__picsymbolstub1,symbol_stubs,pure_instructions,32
	.align 5
L_ffi_closure_helper_DARWIN$stub:
	.indirect_symbol _ffi_closure_helper_DARWIN
	mflr r0
	bcl 20,31,"L1$spb"
"L1$spb":
	mflr r11
	addis r11,r11,ha16(L_ffi_closure_helper_DARWIN$lazy_ptr-"L1$spb")
	mtlr r0
	lwzu r12,lo16(L_ffi_closure_helper_DARWIN$lazy_ptr-"L1$spb")(r11)
	mtctr r12
	bctr
	.lazy_symbol_pointer
L_ffi_closure_helper_DARWIN$lazy_ptr:
	.indirect_symbol _ffi_closure_helper_DARWIN
	.g_long	dyld_stub_binding_helper

#if defined(__ppc64__)
	.section __TEXT,__picsymbolstub1,symbol_stubs,pure_instructions,32
	.align 5
L_darwin64_struct_ret_by_value_p$stub:
	.indirect_symbol _darwin64_struct_ret_by_value_p
	mflr r0
	bcl 20,31,"L2$spb"
"L2$spb":
	mflr r11
	addis r11,r11,ha16(L_darwin64_struct_ret_by_value_p$lazy_ptr-"L2$spb")
	mtlr r0
	lwzu r12,lo16(L_darwin64_struct_ret_by_value_p$lazy_ptr-"L2$spb")(r11)
	mtctr r12
	bctr
	.lazy_symbol_pointer
L_darwin64_struct_ret_by_value_p$lazy_ptr:
	.indirect_symbol _darwin64_struct_ret_by_value_p
	.g_long	dyld_stub_binding_helper

	.section __TEXT,__picsymbolstub1,symbol_stubs,pure_instructions,32
	.align 5
L_darwin64_pass_struct_floats$stub:
	.indirect_symbol _darwin64_pass_struct_floats
	mflr r0
	bcl 20,31,"L3$spb"
"L3$spb":
	mflr r11
	addis r11,r11,ha16(L_darwin64_pass_struct_floats$lazy_ptr-"L3$spb")
	mtlr r0
	lwzu r12,lo16(L_darwin64_pass_struct_floats$lazy_ptr-"L3$spb")(r11)
	mtctr r12
	bctr
	.lazy_symbol_pointer
L_darwin64_pass_struct_floats$lazy_ptr:
	.indirect_symbol _darwin64_pass_struct_floats
	.g_long	dyld_stub_binding_helper
#  endif
#endif
