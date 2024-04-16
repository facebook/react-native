/* -----------------------------------------------------------------------
   sysv.h - Copyright (c) 2003 Jakub Jelinek <jakub@redhat.com>
	    Copyright (c) 2008 Red Hat, Inc.

   PowerPC64 Assembly glue.

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

	.machine altivec

#ifdef POWERPC64
	.hidden	ffi_call_LINUX64
	.globl	ffi_call_LINUX64
	.text
	.cfi_startproc
# if _CALL_ELF == 2
ffi_call_LINUX64:
#  ifndef __PCREL__
	addis	%r2, %r12, .TOC.-ffi_call_LINUX64@ha
	addi	%r2, %r2, .TOC.-ffi_call_LINUX64@l
#  endif
	.localentry ffi_call_LINUX64, . - ffi_call_LINUX64
# else
	.section	".opd","aw"
	.align	3
ffi_call_LINUX64:
#  ifdef _CALL_LINUX
	.quad	.L.ffi_call_LINUX64,.TOC.@tocbase,0
	.type	ffi_call_LINUX64,@function
	.text
.L.ffi_call_LINUX64:
#  else
	.hidden	.ffi_call_LINUX64
	.globl	.ffi_call_LINUX64
	.quad	.ffi_call_LINUX64,.TOC.@tocbase,0
	.size	ffi_call_LINUX64,24
	.type	.ffi_call_LINUX64,@function
	.text
.ffi_call_LINUX64:
#  endif
# endif
	mflr	%r0
	std	%r28, -32(%r1)
	std	%r29, -24(%r1)
	std	%r30, -16(%r1)
	std	%r31, -8(%r1)
	std	%r7, 8(%r1)	/* closure, saved in cr field.  */
	std	%r0, 16(%r1)

	mr	%r28, %r1	/* our AP.  */
	.cfi_def_cfa_register 28
	.cfi_offset 65, 16
	.cfi_offset 31, -8
	.cfi_offset 30, -16
	.cfi_offset 29, -24
	.cfi_offset 28, -32

	stdux	%r1, %r1, %r8
	mr	%r31, %r6	/* flags, */
	mr	%r30, %r5	/* rvalue, */
	mr	%r29, %r4	/* function address.  */
/* Save toc pointer, not for the ffi_prep_args64 call, but for the later
   bctrl function call.  */
# if _CALL_ELF == 2
	std	%r2, 24(%r1)
# else
	std	%r2, 40(%r1)
# endif

	/* Call ffi_prep_args64.  */
	mr	%r4, %r1
# if defined _CALL_LINUX || _CALL_ELF == 2
#  ifdef __PCREL__
	bl	ffi_prep_args64@notoc
#  else
	bl	ffi_prep_args64
	nop
#  endif
# else
	bl	.ffi_prep_args64
	nop
# endif

# if _CALL_ELF == 2
	mr	%r12, %r29
# else
	ld	%r12, 0(%r29)
	ld	%r2, 8(%r29)
# endif
	/* Now do the call.  */
	/* Set up cr1 with bits 3-7 of the flags.  */
	mtcrf	0xc0, %r31

	/* Get the address to call into CTR.  */
	mtctr	%r12
	/* Load all those argument registers.  */
	addi	%r29, %r28, -32-(8*8)
	ld	%r3,  (0*8)(%r29)
	ld	%r4,  (1*8)(%r29)
	ld	%r5,  (2*8)(%r29)
	ld	%r6,  (3*8)(%r29)
	bf-	5, 1f
	ld	%r7,  (4*8)(%r29)
	ld	%r8,  (5*8)(%r29)
	ld	%r9,  (6*8)(%r29)
	ld	%r10, (7*8)(%r29)
1:

	/* Load all the FP registers.  */
	bf-	6, 2f
	addi	%r29, %r29, -(14*8)
	lfd	%f1,  ( 1*8)(%r29)
	lfd	%f2,  ( 2*8)(%r29)
	lfd	%f3,  ( 3*8)(%r29)
	lfd	%f4,  ( 4*8)(%r29)
	lfd	%f5,  ( 5*8)(%r29)
	lfd	%f6,  ( 6*8)(%r29)
	lfd	%f7,  ( 7*8)(%r29)
	lfd	%f8,  ( 8*8)(%r29)
	lfd	%f9,  ( 9*8)(%r29)
	lfd	%f10, (10*8)(%r29)
	lfd	%f11, (11*8)(%r29)
	lfd	%f12, (12*8)(%r29)
	lfd	%f13, (13*8)(%r29)
2:

	/* Load all the vector registers.  */
	bf-	3, 3f
	addi	%r29, %r29, -16
	lvx	%v13, 0, %r29
	addi	%r29, %r29, -16
	lvx	%v12, 0, %r29
	addi	%r29, %r29, -16
	lvx	%v11, 0, %r29
	addi	%r29, %r29, -16
	lvx	%v10, 0, %r29
	addi	%r29, %r29, -16
	lvx	%v9,  0, %r29
	addi	%r29, %r29, -16
	lvx	%v8,  0, %r29
	addi	%r29, %r29, -16
	lvx	%v7,  0, %r29
	addi	%r29, %r29, -16
	lvx	%v6,  0, %r29
	addi	%r29, %r29, -16
	lvx	%v5,  0, %r29
	addi	%r29, %r29, -16
	lvx	%v4,  0, %r29
	addi	%r29, %r29, -16
	lvx	%v3,  0, %r29
	addi	%r29, %r29, -16
	lvx	%v2,  0, %r29
3:

	/* Make the call.  */
	ld	%r11, 8(%r28)
	bctrl

	/* This must follow the call immediately, the unwinder
	   uses this to find out if r2 has been saved or not.  */
# if _CALL_ELF == 2
	ld	%r2, 24(%r1)
# else
	ld	%r2, 40(%r1)
# endif

	/* Now, deal with the return value.  */
	mtcrf	0x01, %r31
	bt	31, .Lstruct_return_value
	bt	30, .Ldone_return_value
	bt	29, .Lfp_return_value
	bt	28, .Lvec_return_value
	std	%r3, 0(%r30)
	/* Fall through...  */

.Ldone_return_value:
	/* Restore the registers we used and return.  */
	mr	%r1, %r28
	.cfi_def_cfa_register 1
	ld	%r0, 16(%r28)
	ld	%r28, -32(%r28)
	mtlr	%r0
	ld	%r29, -24(%r1)
	ld	%r30, -16(%r1)
	ld	%r31, -8(%r1)
	blr

.Lvec_return_value:
	stvx	%v2, 0, %r30
	b	.Ldone_return_value

.Lfp_return_value:
	.cfi_def_cfa_register 28
	mtcrf	0x02, %r31 /* cr6  */
	bf	27, .Lfloat_return_value
	stfd	%f1, 0(%r30)
	bf	26, .Ldone_return_value
	stfd	%f2, 8(%r30)
	b	.Ldone_return_value
.Lfloat_return_value:
	stfs	%f1, 0(%r30)
	b	.Ldone_return_value

.Lstruct_return_value:
	bf	29, .Lvec_homog_or_small_struct
	mtcrf	0x02, %r31 /* cr6  */
	bf	27, .Lfloat_homog_return_value
	stfd	%f1, 0(%r30)
	stfd	%f2, 8(%r30)
	stfd	%f3, 16(%r30)
	stfd	%f4, 24(%r30)
	stfd	%f5, 32(%r30)
	stfd	%f6, 40(%r30)
	stfd	%f7, 48(%r30)
	stfd	%f8, 56(%r30)
	b	.Ldone_return_value

.Lfloat_homog_return_value:
	stfs	%f1, 0(%r30)
	stfs	%f2, 4(%r30)
	stfs	%f3, 8(%r30)
	stfs	%f4, 12(%r30)
	stfs	%f5, 16(%r30)
	stfs	%f6, 20(%r30)
	stfs	%f7, 24(%r30)
	stfs	%f8, 28(%r30)
	b	.Ldone_return_value

.Lvec_homog_or_small_struct:
	bf	28, .Lsmall_struct
	stvx	%v2, 0, %r30
	addi	%r30, %r30, 16
	stvx	%v3, 0, %r30
	addi	%r30, %r30, 16
	stvx	%v4, 0, %r30
	addi	%r30, %r30, 16
	stvx	%v5, 0, %r30
	addi	%r30, %r30, 16
	stvx	%v6, 0, %r30
	addi	%r30, %r30, 16
	stvx	%v7, 0, %r30
	addi	%r30, %r30, 16
	stvx	%v8, 0, %r30
	addi	%r30, %r30, 16
	stvx	%v9, 0, %r30
	b	.Ldone_return_value

.Lsmall_struct:
	std	%r3, 0(%r30)
	std	%r4, 8(%r30)
	b	.Ldone_return_value

	.cfi_endproc
# if _CALL_ELF == 2
	.size	ffi_call_LINUX64,.-ffi_call_LINUX64
# else
#  ifdef _CALL_LINUX
	.size	ffi_call_LINUX64,.-.L.ffi_call_LINUX64
#  else
	.long	0
	.byte	0,12,0,1,128,4,0,0
	.size	.ffi_call_LINUX64,.-.ffi_call_LINUX64
#  endif
# endif

#endif

#if (defined __ELF__ && defined __linux__) || _CALL_ELF == 2
	.section	.note.GNU-stack,"",@progbits
#endif
