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

	.file	"linux64_closure.S"

	.machine altivec

#ifdef POWERPC64
	FFI_HIDDEN (ffi_closure_LINUX64)
	.globl  ffi_closure_LINUX64
	.text
	.cfi_startproc
# if _CALL_ELF == 2
ffi_closure_LINUX64:
#  ifndef __PCREL__
	addis	%r2, %r12, .TOC.-ffi_closure_LINUX64@ha
	addi	%r2, %r2, .TOC.-ffi_closure_LINUX64@l
#  endif
	.localentry ffi_closure_LINUX64, . - ffi_closure_LINUX64
# else
	.section        ".opd","aw"
	.align  3
ffi_closure_LINUX64:
#  ifdef _CALL_LINUX
	.quad   .L.ffi_closure_LINUX64,.TOC.@tocbase,0
	.type   ffi_closure_LINUX64,@function
	.text
.L.ffi_closure_LINUX64:
#  else
	FFI_HIDDEN (.ffi_closure_LINUX64)
	.globl  .ffi_closure_LINUX64
	.quad   .ffi_closure_LINUX64,.TOC.@tocbase,0
	.size   ffi_closure_LINUX64,24
	.type   .ffi_closure_LINUX64,@function
	.text
.ffi_closure_LINUX64:
#  endif
# endif

# if _CALL_ELF == 2
#  ifdef __VEC__
#   32 byte special reg save area + 64 byte parm save area
#   + 128 byte retval area + 13*8 fpr save area + 12*16 vec save area + round to 16
#   define STACKFRAME 528
#  else
#   32 byte special reg save area + 64 byte parm save area
#   + 64 byte retval area + 13*8 fpr save area + round to 16
#   define STACKFRAME 272
#  endif
#  define PARMSAVE 32
#  define RETVAL PARMSAVE+64
# else
#  48 bytes special reg save area + 64 bytes parm save area
#  + 16 bytes retval area + 13*8 bytes fpr save area + round to 16
#  define STACKFRAME 240
#  define PARMSAVE 48
#  define RETVAL PARMSAVE+64
# endif

# if _CALL_ELF == 2
	ld	%r12, FFI_TRAMPOLINE_SIZE(%r11)		# closure->cif
	mflr	%r0
	lwz	%r12, 28(%r12)				# cif->flags
	mtcrf	0x40, %r12
	addi	%r12, %r1, PARMSAVE
	bt	7, 0f
	# Our caller has not allocated a parameter save area.
	# We need to allocate one here and use it to pass gprs to
	# ffi_closure_helper_LINUX64.
	addi	%r12, %r1, -STACKFRAME+PARMSAVE
0:
	# Save general regs into parm save area
	std	%r3, 0(%r12)
	std	%r4, 8(%r12)
	std	%r5, 16(%r12)
	std	%r6, 24(%r12)
	std	%r7, 32(%r12)
	std	%r8, 40(%r12)
	std	%r9, 48(%r12)
	std	%r10, 56(%r12)

	# load up the pointer to the parm save area
	mr	%r7, %r12
# else
	# copy r2 to r11 and load TOC into r2
	mr	%r11, %r2
	ld	%r2, 16(%r2)

	mflr	%r0
	# Save general regs into parm save area
	# This is the parameter save area set up by our caller.
	std	%r3, PARMSAVE+0(%r1)
	std	%r4, PARMSAVE+8(%r1)
	std	%r5, PARMSAVE+16(%r1)
	std	%r6, PARMSAVE+24(%r1)
	std	%r7, PARMSAVE+32(%r1)
	std	%r8, PARMSAVE+40(%r1)
	std	%r9, PARMSAVE+48(%r1)
	std	%r10, PARMSAVE+56(%r1)

	# load up the pointer to the parm save area
	addi	%r7, %r1, PARMSAVE
# endif
	std	%r0, 16(%r1)

	# closure->cif
	ld	%r3, FFI_TRAMPOLINE_SIZE(%r11)
	# closure->fun
	ld	%r4, FFI_TRAMPOLINE_SIZE+8(%r11)
	# closure->user_data
	ld	%r5, FFI_TRAMPOLINE_SIZE+16(%r11)

.Ldoclosure:
	# next save fpr 1 to fpr 13
	stfd	%f1, -104+(0*8)(%r1)
	stfd	%f2, -104+(1*8)(%r1)
	stfd	%f3, -104+(2*8)(%r1)
	stfd	%f4, -104+(3*8)(%r1)
	stfd	%f5, -104+(4*8)(%r1)
	stfd	%f6, -104+(5*8)(%r1)
	stfd	%f7, -104+(6*8)(%r1)
	stfd	%f8, -104+(7*8)(%r1)
	stfd	%f9, -104+(8*8)(%r1)
	stfd	%f10, -104+(9*8)(%r1)
	stfd	%f11, -104+(10*8)(%r1)
	stfd	%f12, -104+(11*8)(%r1)
	stfd	%f13, -104+(12*8)(%r1)

	# load up the pointer to the saved fpr registers
	addi	%r8, %r1, -104

# ifdef __VEC__
	# load up the pointer to the saved vector registers
	# 8 bytes padding for 16-byte alignment at -112(%r1)
	addi	%r9, %r8, -24
	stvx	%v13, 0, %r9
	addi	%r9, %r9, -16
	stvx	%v12, 0, %r9
	addi	%r9, %r9, -16
	stvx	%v11, 0, %r9
	addi	%r9, %r9, -16
	stvx	%v10, 0, %r9
	addi	%r9, %r9, -16
	stvx	%v9, 0, %r9
	addi	%r9, %r9, -16
	stvx	%v8, 0, %r9
	addi	%r9, %r9, -16
	stvx	%v7, 0, %r9
	addi	%r9, %r9, -16
	stvx	%v6, 0, %r9
	addi	%r9, %r9, -16
	stvx	%v5, 0, %r9
	addi	%r9, %r9, -16
	stvx	%v4, 0, %r9
	addi	%r9, %r9, -16
	stvx	%v3, 0, %r9
	addi	%r9, %r9, -16
	stvx	%v2, 0, %r9
# endif

	# load up the pointer to the result storage
	addi	%r6, %r1, -STACKFRAME+RETVAL

	stdu	%r1, -STACKFRAME(%r1)
	.cfi_def_cfa_offset STACKFRAME
	.cfi_offset 65, 16

	# make the call
# if defined _CALL_LINUX || _CALL_ELF == 2
#  ifdef __PCREL__
	bl ffi_closure_helper_LINUX64@notoc
.Lret:
#  else
	bl ffi_closure_helper_LINUX64
.Lret:
	nop
#  endif
# else
	bl .ffi_closure_helper_LINUX64
.Lret:
	nop
# endif

	# now r3 contains the return type
	# so use it to look up in a table
	# so we know how to deal with each type

	# look up the proper starting point in table
	# by using return type as offset
	ld %r0, STACKFRAME+16(%r1)
	cmpldi %r3, FFI_V2_TYPE_SMALL_STRUCT
	bge .Lsmall
	mflr %r4		# move address of .Lret to r4
	sldi %r3, %r3, 4	# now multiply return type by 16
	addi %r4, %r4, .Lret_type0 - .Lret
	add %r3, %r3, %r4	# add contents of table to table address
	mtctr %r3
	bctr			# jump to it

# Each of the ret_typeX code fragments has to be exactly 16 bytes long
# (4 instructions). For cache effectiveness we align to a 16 byte boundary
# first.
	.align 4

.Lret_type0:
# case FFI_TYPE_VOID
	mtlr %r0
	addi %r1, %r1, STACKFRAME
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset STACKFRAME
	nop
# case FFI_TYPE_INT
# ifdef __LITTLE_ENDIAN__
	lwa %r3, RETVAL+0(%r1)
# else
	lwa %r3, RETVAL+4(%r1)
# endif
	mtlr %r0
	addi %r1, %r1, STACKFRAME
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset STACKFRAME
# case FFI_TYPE_FLOAT
	lfs %f1, RETVAL+0(%r1)
	mtlr %r0
	addi %r1, %r1, STACKFRAME
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset STACKFRAME
# case FFI_TYPE_DOUBLE
	lfd %f1, RETVAL+0(%r1)
	mtlr %r0
	addi %r1, %r1, STACKFRAME
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset STACKFRAME
# case FFI_TYPE_LONGDOUBLE
	lfd %f1, RETVAL+0(%r1)
	mtlr %r0
	lfd %f2, RETVAL+8(%r1)
	b .Lfinish
# case FFI_TYPE_UINT8
# ifdef __LITTLE_ENDIAN__
	lbz %r3, RETVAL+0(%r1)
# else
	lbz %r3, RETVAL+7(%r1)
# endif
	mtlr %r0
	addi %r1, %r1, STACKFRAME
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset STACKFRAME
# case FFI_TYPE_SINT8
# ifdef __LITTLE_ENDIAN__
	lbz %r3, RETVAL+0(%r1)
# else
	lbz %r3, RETVAL+7(%r1)
# endif
	extsb %r3,%r3
	mtlr %r0
	b .Lfinish
# case FFI_TYPE_UINT16
# ifdef __LITTLE_ENDIAN__
	lhz %r3, RETVAL+0(%r1)
# else
	lhz %r3, RETVAL+6(%r1)
# endif
	mtlr %r0
.Lfinish:
	addi %r1, %r1, STACKFRAME
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset STACKFRAME
# case FFI_TYPE_SINT16
# ifdef __LITTLE_ENDIAN__
	lha %r3, RETVAL+0(%r1)
# else
	lha %r3, RETVAL+6(%r1)
# endif
	mtlr %r0
	addi %r1, %r1, STACKFRAME
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset STACKFRAME
# case FFI_TYPE_UINT32
# ifdef __LITTLE_ENDIAN__
	lwz %r3, RETVAL+0(%r1)
# else
	lwz %r3, RETVAL+4(%r1)
# endif
	mtlr %r0
	addi %r1, %r1, STACKFRAME
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset STACKFRAME
# case FFI_TYPE_SINT32
# ifdef __LITTLE_ENDIAN__
	lwa %r3, RETVAL+0(%r1)
# else
	lwa %r3, RETVAL+4(%r1)
# endif
	mtlr %r0
	addi %r1, %r1, STACKFRAME
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset STACKFRAME
# case FFI_TYPE_UINT64
	ld %r3, RETVAL+0(%r1)
	mtlr %r0
	addi %r1, %r1, STACKFRAME
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset STACKFRAME
# case FFI_TYPE_SINT64
	ld %r3, RETVAL+0(%r1)
	mtlr %r0
	addi %r1, %r1, STACKFRAME
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset STACKFRAME
# case FFI_TYPE_STRUCT
	mtlr %r0
	addi %r1, %r1, STACKFRAME
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset STACKFRAME
	nop
# case FFI_TYPE_POINTER
	ld %r3, RETVAL+0(%r1)
	mtlr %r0
	addi %r1, %r1, STACKFRAME
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset STACKFRAME
# case FFI_V2_TYPE_VECTOR
	addi %r3, %r1, RETVAL
	lvx %v2, 0, %r3
	mtlr %r0
	b .Lfinish
# case FFI_V2_TYPE_VECTOR_HOMOG
	addi %r3, %r1, RETVAL
	lvx %v2, 0, %r3
	addi %r3, %r3, 16
	b .Lmorevector
# case FFI_V2_TYPE_FLOAT_HOMOG
	lfs %f1, RETVAL+0(%r1)
	lfs %f2, RETVAL+4(%r1)
	lfs %f3, RETVAL+8(%r1)
	b .Lmorefloat
# case FFI_V2_TYPE_DOUBLE_HOMOG
	lfd %f1, RETVAL+0(%r1)
	lfd %f2, RETVAL+8(%r1)
	lfd %f3, RETVAL+16(%r1)
	lfd %f4, RETVAL+24(%r1)
	mtlr %r0
	lfd %f5, RETVAL+32(%r1)
	lfd %f6, RETVAL+40(%r1)
	lfd %f7, RETVAL+48(%r1)
	lfd %f8, RETVAL+56(%r1)
	addi %r1, %r1, STACKFRAME
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset STACKFRAME
.Lmorevector:
	lvx %v3, 0, %r3
	addi %r3, %r3, 16
	lvx %v4, 0, %r3
	addi %r3, %r3, 16
	lvx %v5, 0, %r3
	mtlr %r0
	addi %r3, %r3, 16
	lvx %v6, 0, %r3
	addi %r3, %r3, 16
	lvx %v7, 0, %r3
	addi %r3, %r3, 16
	lvx %v8, 0, %r3
	addi %r3, %r3, 16
	lvx %v9, 0, %r3
	addi %r1, %r1, STACKFRAME
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset STACKFRAME
.Lmorefloat:
	lfs %f4, RETVAL+12(%r1)
	mtlr %r0
	lfs %f5, RETVAL+16(%r1)
	lfs %f6, RETVAL+20(%r1)
	lfs %f7, RETVAL+24(%r1)
	lfs %f8, RETVAL+28(%r1)
	addi %r1, %r1, STACKFRAME
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset STACKFRAME
.Lsmall:
# ifdef __LITTLE_ENDIAN__
	ld %r3,RETVAL+0(%r1)
	mtlr %r0
	ld %r4,RETVAL+8(%r1)
	addi %r1, %r1, STACKFRAME
	.cfi_def_cfa_offset 0
	blr
# else
	# A struct smaller than a dword is returned in the low bits of r3
	# ie. right justified.  Larger structs are passed left justified
	# in r3 and r4.  The return value area on the stack will have
	# the structs as they are usually stored in memory.
	cmpldi %r3, FFI_V2_TYPE_SMALL_STRUCT + 7 # size 8 bytes?
	neg %r5, %r3
	ld %r3,RETVAL+0(%r1)
	blt .Lsmalldown
	mtlr %r0
	ld %r4,RETVAL+8(%r1)
	addi %r1, %r1, STACKFRAME
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset STACKFRAME
.Lsmalldown:
	addi %r5, %r5, FFI_V2_TYPE_SMALL_STRUCT + 7
	mtlr %r0
	sldi %r5, %r5, 3
	addi %r1, %r1, STACKFRAME
	.cfi_def_cfa_offset 0
	srd %r3, %r3, %r5
	blr
# endif

	.cfi_endproc
# if _CALL_ELF == 2
	.size	ffi_closure_LINUX64,.-ffi_closure_LINUX64
# else
#  ifdef _CALL_LINUX
	.size	ffi_closure_LINUX64,.-.L.ffi_closure_LINUX64
#  else
	.long	0
	.byte	0,12,0,1,128,0,0,0
	.size	.ffi_closure_LINUX64,.-.ffi_closure_LINUX64
#  endif
# endif


	FFI_HIDDEN (ffi_go_closure_linux64)
	.globl  ffi_go_closure_linux64
	.text
	.cfi_startproc
# if _CALL_ELF == 2
ffi_go_closure_linux64:
#  ifndef __PCREL__
	addis	%r2, %r12, .TOC.-ffi_go_closure_linux64@ha
	addi	%r2, %r2, .TOC.-ffi_go_closure_linux64@l
#  endif
	.localentry ffi_go_closure_linux64, . - ffi_go_closure_linux64
# else
	.section        ".opd","aw"
	.align  3
ffi_go_closure_linux64:
#  ifdef _CALL_LINUX
	.quad   .L.ffi_go_closure_linux64,.TOC.@tocbase,0
	.type   ffi_go_closure_linux64,@function
	.text
.L.ffi_go_closure_linux64:
#  else
	FFI_HIDDEN (.ffi_go_closure_linux64)
	.globl  .ffi_go_closure_linux64
	.quad   .ffi_go_closure_linux64,.TOC.@tocbase,0
	.size   ffi_go_closure_linux64,24
	.type   .ffi_go_closure_linux64,@function
	.text
.ffi_go_closure_linux64:
#  endif
# endif

# if _CALL_ELF == 2
	ld	%r12, 8(%r11)				# closure->cif
	mflr	%r0
	lwz	%r12, 28(%r12)				# cif->flags
	mtcrf	0x40, %r12
	addi	%r12, %r1, PARMSAVE
	bt	7, 0f
	# Our caller has not allocated a parameter save area.
	# We need to allocate one here and use it to pass gprs to
	# ffi_closure_helper_LINUX64.
	addi	%r12, %r1, -STACKFRAME+PARMSAVE
0:
	# Save general regs into parm save area
	std	%r3, 0(%r12)
	std	%r4, 8(%r12)
	std	%r5, 16(%r12)
	std	%r6, 24(%r12)
	std	%r7, 32(%r12)
	std	%r8, 40(%r12)
	std	%r9, 48(%r12)
	std	%r10, 56(%r12)

	# load up the pointer to the parm save area
	mr	%r7, %r12
# else
	mflr	%r0
	# Save general regs into parm save area
	# This is the parameter save area set up by our caller.
	std	%r3, PARMSAVE+0(%r1)
	std	%r4, PARMSAVE+8(%r1)
	std	%r5, PARMSAVE+16(%r1)
	std	%r6, PARMSAVE+24(%r1)
	std	%r7, PARMSAVE+32(%r1)
	std	%r8, PARMSAVE+40(%r1)
	std	%r9, PARMSAVE+48(%r1)
	std	%r10, PARMSAVE+56(%r1)

	# load up the pointer to the parm save area
	addi	%r7, %r1, PARMSAVE
# endif
	std	%r0, 16(%r1)

	# closure->cif
	ld	%r3, 8(%r11)
	# closure->fun
	ld	%r4, 16(%r11)
	# user_data
	mr	%r5, %r11
	b	.Ldoclosure

	.cfi_endproc
# if _CALL_ELF == 2
	.size	ffi_go_closure_linux64,.-ffi_go_closure_linux64
# else
#  ifdef _CALL_LINUX
	.size	ffi_go_closure_linux64,.-.L.ffi_go_closure_linux64
#  else
	.long	0
	.byte	0,12,0,1,128,0,0,0
	.size	.ffi_go_closure_linux64,.-.ffi_go_closure_linux64
#  endif
# endif
#endif

#if (defined __ELF__ && defined __linux__) || _CALL_ELF == 2
	.section	.note.GNU-stack,"",@progbits
#endif
