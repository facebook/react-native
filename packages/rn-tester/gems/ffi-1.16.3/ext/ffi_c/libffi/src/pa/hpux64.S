/* -----------------------------------------------------------------------
   hpux64.S - (c) 2005-2022 John David Anglin <dave.anglin@bell.net>

   HPUX PA 64-Bit Foreign Function Interface

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
#include <fficonfig.h>
#include <ffi.h>

	.LEVEL 2.0w
	.text
	.align	4

	/* void ffi_call_pa64(void (*)(char *, extended_cif *),
			       extended_cif *ecif,
			       unsigned bytes,
			       unsigned flags,
			       unsigned *rvalue,
			       void (*fn)());
	 */

	.export	ffi_call_pa64,code
	.import	ffi_prep_args_pa64,code

	.align	4

L$FB1
ffi_call_pa64
	.proc
	.callinfo	FRAME=48,CALLS,SAVE_RP,ENTRY_GR=4
	.entry
	std	%rp, -16(%sp)
	copy	%r3, %r1
L$CFI11
	copy	%sp, %r3
L$CFI12
	std,ma	%r1, 48(%sp)

	/* Setup the stack for calling prep_args...
	   We want the stack to look like this:

	   [ Previous stack                            ] <- %r3

	   [ 48-byte register save area                ]

	   [ Stack space for call arguments            ] <- %r4

	   [ 16-byte rame marker                       ]

	   [ 128-byte stack for calling prep_args      ] <- %sp
	 */

	std	%r4, 8(%r3)		; save r4
L$CFI13
	std	%r23, 16(%r3)		; save flags we need it later
	std	%r22, 24(%r3)		; save rvalue
	std	%r21, 32(%r3)		; save fn pointer

	copy	%sp, %r4
	copy	%r4, %r26		; argument stack pointer
	addl	%r24, %sp, %sp		; allocate argument space

	ldo	112(%sp), %r29		; arg pointer for prep args

	/* Call prep_args:
	   %arg0(stack) -- set up above to point to call arguments
	   %arg1(ecif) -- same as incoming param
	   %arg2(bytes) -- same as incoming param */
	bl	ffi_prep_args_pa64,%r2
	ldo	128(%sp), %sp
	ldo	-128(%sp), %sp

	/* Load the arguments that should be passed in registers
	   The fp args were loaded by the prep_args function.  */
	ldd	0(%r4), %r26
	ldd	8(%r4), %r25
	ldd	16(%r4), %r24
	ldd	24(%r4), %r23
	ldd     32(%r4), %r22
	ldd     40(%r4), %r21
	ldd     48(%r4), %r20
	ldd     56(%r4), %r19

	ldd	24(%r3), %ret0		; %ret0 <- rvalue

	ldd	32(%r3), %r1		; %r1 <- function pointer
	ldd	16(%r1), %rp		; fn address
	ldd	24(%r1), %dp		; New gp
	bve,l	(%rp), %r2		; Call the user function
	ldo	64(%r4), %r29		; Argument pointer

	/* Prepare to store the result; recover flags and rvalue.  */
	ldd	16(%r3), %r21		; r21 <- flags
	extrd,s	%r21, 63, 32, %r21	; sign extend flags for blr

	/* Adjust flags range from [-16, 15] to  [0, 31].  */
	addi	16, %r21, %r21

	blr	%r21, %r0
	ldd	24(%r3), %r20		; r20 <- rvalue

	/* Giant jump table */
	/* 16-byte small struct */
	b,n	L$smst16
	nop
	/* 15-byte small struct */
	b,n	L$smst15
	nop
	/* 14-byte small struct */
	b,n	L$smst14
	nop
	/* 13-byte small struct */
	b,n	L$smst13
	nop
	/* 12-byte small struct */
	b,n	L$smst12
	nop
	/* 11-byte small struct */
	b,n	L$smst11
	nop
	/* 10-byte small struct */
	b,n	L$smst10
	nop
	/* 9-byte small struct */
	b,n	L$smst9
	nop
	/* 8-byte small struct */
	b,n	L$smst8
	nop
	/* 7-byte small struct */
	b,n	L$smst7
	nop
	/* 6-byte small struct */
	b,n	L$smst6
	nop
	/* 5-byte small struct */
	b,n	L$smst5
	nop
	/* 4-byte small struct */
	b,n	L$smst4
	nop
	/* 3-byte small struct */
	b,n	L$smst3
	nop
	/* 2-byte small struct */
	b,n	L$smst2
	nop
	/* 1-byte small struct */
	b,n	L$smst1
	nop
	/* void */
	b,n	L$done
	nop
	/* int */
	b	L$done
	std	%ret0, 0(%r20)
	/* float */
	b	L$done
	fstw	%fr4R, 0(%r20)
	/* double */
	b	L$done
	fstd	%fr4, 0(%r20)
	/* long double */
	b,n	L$longdouble
	nop
	/* unsigned int8 */
	b	L$done
	std	%ret0, 0(%r20)
	/* signed int8 */
	b	L$done
	std	%ret0, 0(%r20)
	/* unsigned int16 */
	b	L$done
	std	%ret0, 0(%r20)
	/* signed int16 */
	b	L$done
	std	%ret0, 0(%r20)
	/* unsigned int32 */
	b	L$done
	std	%ret0, 0(%r20)
	/* signed int32 */
	b	L$done
	std	%ret0, 0(%r20)
	/* unsigned int64 */
	b	L$done
	std	%ret0, 0(%r20)
	/* signed int64 */
	b	L$done
	std	%ret0, 0(%r20)
	/* large struct */
	b,n	L$done
	nop
	/* pointer */
	b	L$done
	std	%ret0, 0(%r20)
	/* complex */
	b,n	L$done
	nop

L$longdouble
	std	%ret0, 0(%r20)
	b	L$done
	std	%ret1, 8(%r20)

	/* We need to copy byte-by-byte the exact number bytes
	   in the struct to avoid clobbering other data.  */
L$smst1
	extrd,u	%ret0, 7, 8, %r22
	b	L$done
	stb	%r22, 0(%r20)

L$smst2
	extrd,u	%ret0, 7, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 15, 8, %r22
	b	L$done
	stb	%r22, 0(%r20)

L$smst3
	extrd,u	%ret0, 7, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 15, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 23, 8, %r22
	b	L$done
	stb	%r22, 0(%r20)

L$smst4
	extrd,u	%ret0, 7, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 15, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 23, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 31, 8, %r22
	b	L$done
	stb	%r22, 0(%r20)

L$smst5
	extrd,u	%ret0, 7, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 15, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 23, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 31, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 39, 8, %r22
	b	L$done
	stb	%r22, 0(%r20)

L$smst6
	extrd,u	%ret0, 7, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 15, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 23, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 31, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 39, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 47, 8, %r22
	b	L$done
	stb	%r22, 0(%r20)

L$smst7
	extrd,u	%ret0, 7, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 15, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 23, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 31, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 39, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 47, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 55, 8, %r22
	b	L$done
	stb	%r22, 0(%r20)

L$smst8
	extrd,u	%ret0, 7, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 15, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 23, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 31, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 39, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 47, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 55, 8, %r22
	stb,ma	%r22, 1(%r20)
	b	L$done
	stb	%ret0, 0(%r20)

L$smst9
	extrd,u	%ret0, 7, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 15, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 23, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 31, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 39, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 47, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 55, 8, %r22
	stb,ma	%r22, 1(%r20)
	stb,ma	%ret0, 1(%r20)
	extrd,u	%ret1, 7, 8, %r22
	b	L$done
	stb	%r22, 0(%r20)

L$smst10
	extrd,u	%ret0, 7, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 15, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 23, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 31, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 39, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 47, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 55, 8, %r22
	stb,ma	%r22, 1(%r20)
	stb,ma	%ret0, 1(%r20)
	extrd,u	%ret1, 7, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 15, 8, %r22
	b	L$done
	stb	%r22, 0(%r20)

L$smst11
	extrd,u	%ret0, 7, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 15, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 23, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 31, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 39, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 47, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 55, 8, %r22
	stb,ma	%r22, 1(%r20)
	stb,ma	%ret0, 1(%r20)
	extrd,u	%ret1, 7, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 15, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 23, 8, %r22
	b	L$done
	stb	%r22, 0(%r20)

L$smst12
	extrd,u	%ret0, 7, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 15, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 23, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 31, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 39, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 47, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 55, 8, %r22
	stb,ma	%r22, 1(%r20)
	stb,ma	%ret0, 1(%r20)
	extrd,u	%ret1, 7, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 15, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 23, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 31, 8, %r22
	b	L$done
	stb	%r22, 0(%r20)

L$smst13
	extrd,u	%ret0, 7, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 15, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 23, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 31, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 39, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 47, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 55, 8, %r22
	stb,ma	%r22, 1(%r20)
	stb,ma	%ret0, 1(%r20)
	extrd,u	%ret1, 7, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 15, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 23, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 31, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 39, 8, %r22
	b	L$done
	stb	%r22, 0(%r20)

L$smst14
	extrd,u	%ret0, 7, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 15, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 23, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 31, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 39, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 47, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 55, 8, %r22
	stb,ma	%r22, 1(%r20)
	stb,ma	%ret0, 1(%r20)
	extrd,u	%ret1, 7, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 15, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 23, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 31, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 39, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 47, 8, %r22
	b	L$done
	stb	%r22, 0(%r20)

L$smst15
	extrd,u	%ret0, 7, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 15, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 23, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 31, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 39, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 47, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 55, 8, %r22
	stb,ma	%r22, 1(%r20)
	stb,ma	%ret0, 1(%r20)
	extrd,u	%ret1, 7, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 15, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 23, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 31, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 39, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 47, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 55, 8, %r22
	b	L$done
	stb	%r22, 0(%r20)

L$smst16
	extrd,u	%ret0, 7, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 15, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 23, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 31, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 39, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 47, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret0, 55, 8, %r22
	stb,ma	%r22, 1(%r20)
	stb,ma	%ret0, 1(%r20)
	extrd,u	%ret1, 7, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 15, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 23, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 31, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 39, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 47, 8, %r22
	stb,ma	%r22, 1(%r20)
	extrd,u	%ret1, 55, 8, %r22
	stb,ma	%r22, 1(%r20)
	stb	%ret1, 0(%r20)

L$done
	/* all done, restore registers and return */
	copy	%r4, %sp
	ldd	8(%r3), %r4
	ldd	-16(%r3), %rp
	bve	(%rp)
	ldd,mb	-48(%sp), %r3
	.exit
	.procend
L$FE1
	.size	ffi_call_pa64, .-ffi_call_pa64

	/* void ffi_closure_pa64(void);
	   Called with closure argument in %r21 */

	.export ffi_closure_pa64,code
	.import ffi_closure_inner_pa64,code
	.align 4
L$FB2
ffi_closure_pa64
	.proc
	.callinfo FRAME=128,CALLS,SAVE_RP,ENTRY_GR=3
	.entry

	std	%rp, -16(%sp)
	copy	%r3, %r1
L$CFI21
	copy	%sp, %r3
L$CFI22
	std,ma	%r1, 128(%sp)
L$CFI23

	/* Put arguments onto the stack and call ffi_closure_inner.  */
	std	%r26, -64(%r29)
	std	%r25, -56(%r29)
	std	%r24, -48(%r29)
	std	%r23, -40(%r29)
	std	%r22, -32(%r29)
	std	%r21, -24(%r29)
	std	%r20, -16(%r29)
	std	%r19, -8(%r29)

	/* Load and save start of argument stack.  */
	ldo	-64(%r29), %r25
	std	%r25, 8(%r3)

	/* Setup arg pointer.  */
	ldo	-16(%sp), %ret1

	/* Retrieve closure pointer and real gp.  */
	copy	%dp, %r26
	bl	ffi_closure_inner_pa64, %r2
	ldd	0(%dp), %dp

	/* Retrieve start of argument stack.  */
	ldd	8(%r3), %r1

	/* Restore r3 and op stack.  */
	ldd,mb	-128(%sp), %r3

	/* Load return address.  */
	ldd	-16(%sp), %rp

	/* Load return values from first and second stack slots.  */
	ldd	0(%r1), %ret0
	bve	(%rp)
	ldd	8(%r1), %ret1

	.exit
	.procend
	.end
L$FE2:
	.size	ffi_closure_pa64, .-ffi_closure_pa64

	.section	.eh_frame,"aw",@progbits
L$frame1:
	.word   L$ECIE1-L$SCIE1 ;# Length of Common Information Entry
L$SCIE1:
	.word   0x0     ;# CIE Identifier Tag
	.byte   0x3     ;# CIE Version
	.stringz ""     ;# CIE Augmentation
	.uleb128 0x1    ;# CIE Code Alignment Factor
	.sleb128 8      ;# CIE Data Alignment Factor
	.byte   0x2     ;# CIE RA Column
	.byte   0xc     ;# DW_CFA_def_cfa
	.uleb128 0x1e
	.uleb128 0x0
	.align 8
L$ECIE1:
L$SFDE1:
	.word   L$EFDE1-L$ASFDE1        ;# FDE Length
L$ASFDE1:
	.word   L$ASFDE1-L$frame1       ;# FDE CIE offset
	.dword  L$FB1	;# FDE initial location
	.dword  L$FE1-L$FB1	;# FDE address range

	.byte   0x4	;# DW_CFA_advance_loc4
	.word   L$CFI11-L$FB1
	.byte	0x9	;# DW_CFA_register: r3 in r1
	.uleb128 0x3
	.uleb128 0x1
	.byte   0x11    ;# DW_CFA_offset_extended_sf: r2 at cfa-16
	.uleb128 0x2
	.sleb128 -2
	.byte   0x4     ;# DW_CFA_advance_loc4
	.word   L$CFI12-L$CFI11
	.byte   0xd     ;# DW_CFA_def_cfa_register: r3
	.uleb128 0x3

	.byte   0x4     ;# DW_CFA_advance_loc4
	.word   L$CFI13-L$CFI12
	.byte	0x83	;# DW_CFA_offset: r3 at cfa+0
	.uleb128 0
	.byte	0x84	;# DW_CFA_offset: r4 at cfa+8
	.uleb128 1

	.align 8
L$EFDE1:

L$SFDE2:
	.word   L$EFDE2-L$ASFDE2        ;# FDE Length
L$ASFDE2:
	.word   L$ASFDE2-L$frame1       ;# FDE CIE offset
	.dword   L$FB2	;# FDE initial location
	.dword   L$FE2-L$FB2     ;# FDE address range
	.byte   0x4	;# DW_CFA_advance_loc4
	.word   L$CFI21-L$FB2
	.byte   0x9	;# DW_CFA_register: r3 in r1
	.uleb128 0x3
	.uleb128 0x1
	.byte   0x11    ;# DW_CFA_offset_extended_sf: r2 at cfa-16
	.uleb128 0x2
	.sleb128 -2

	.byte   0x4     ;# DW_CFA_advance_loc4
	.word   L$CFI22-L$CFI21
	.byte   0xd     ;# DW_CFA_def_cfa_register: r3
	.uleb128 0x3

	.byte   0x4     ;# DW_CFA_advance_loc4
	.word   L$CFI23-L$CFI22
	.byte	0x83	;# DW_CFA_offset: r3 at cfa+0
	.uleb128 0

	.align 8
L$EFDE2:
