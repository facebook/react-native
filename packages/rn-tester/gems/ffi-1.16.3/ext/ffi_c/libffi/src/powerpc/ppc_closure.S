/* -----------------------------------------------------------------------
   sysv.h - Copyright (c) 2003 Jakub Jelinek <jakub@redhat.com>
	    Copyright (c) 2008 Red Hat, Inc.

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
#include <powerpc/asm.h>

	.file   "ppc_closure.S"

#ifndef POWERPC64

FFI_HIDDEN(ffi_closure_SYSV)
ENTRY(ffi_closure_SYSV)
	.cfi_startproc
	stwu %r1,-144(%r1)
	.cfi_def_cfa_offset 144
	mflr %r0
	stw %r0,148(%r1)
	.cfi_offset 65, 4

# we want to build up an areas for the parameters passed
# in registers (both floating point and integer)

	# so first save gpr 3 to gpr 10 (aligned to 4)
	stw   %r3, 16(%r1)
	stw   %r4, 20(%r1)
	stw   %r5, 24(%r1)

	# set up registers for the routine that does the work

	# closure->cif
	lwz %r3,FFI_TRAMPOLINE_SIZE(%r11)
	# closure->fun
	lwz %r4,FFI_TRAMPOLINE_SIZE+4(%r11)
	# closure->user_data
	lwz %r5,FFI_TRAMPOLINE_SIZE+8(%r11)

.Ldoclosure:
	stw   %r6, 28(%r1)
	stw   %r7, 32(%r1)
	stw   %r8, 36(%r1)
	stw   %r9, 40(%r1)
	stw   %r10,44(%r1)

#ifndef __NO_FPRS__
	# next save fpr 1 to fpr 8 (aligned to 8)
	stfd  %f1, 48(%r1)
	stfd  %f2, 56(%r1)
	stfd  %f3, 64(%r1)
	stfd  %f4, 72(%r1)
	stfd  %f5, 80(%r1)
	stfd  %f6, 88(%r1)
	stfd  %f7, 96(%r1)
	stfd  %f8, 104(%r1)
#endif

	# pointer to the result storage
	addi %r6,%r1,112

	# pointer to the saved gpr registers
	addi %r7,%r1,16

	# pointer to the saved fpr registers
	addi %r8,%r1,48

	# pointer to the outgoing parameter save area in the previous frame
	# i.e. the previous frame pointer + 8
	addi %r9,%r1,152

	# make the call
	bl ffi_closure_helper_SYSV@local
.Lret:
	# now r3 contains the return type
	# so use it to look up in a table
	# so we know how to deal with each type

	# look up the proper starting point in table
	# by using return type as offset

	mflr %r4		# move address of .Lret to r4
	slwi %r3,%r3,4		# now multiply return type by 16
	addi %r4, %r4, .Lret_type0 - .Lret
	lwz %r0,148(%r1)
	add %r3,%r3,%r4		# add contents of table to table address
	mtctr %r3
	bctr			# jump to it

# Each of the ret_typeX code fragments has to be exactly 16 bytes long
# (4 instructions). For cache effectiveness we align to a 16 byte boundary
# first.
	.align 4
# case FFI_TYPE_VOID
.Lret_type0:
	mtlr %r0
	addi %r1,%r1,144
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset 144
	nop

# case FFI_TYPE_INT
	lwz %r3,112+0(%r1)
	mtlr %r0
.Lfinish:
	addi %r1,%r1,144
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset 144

# case FFI_TYPE_FLOAT
#ifndef __NO_FPRS__
	lfs %f1,112+0(%r1)
#else
	nop
#endif
	mtlr %r0
	addi %r1,%r1,144
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset 144

# case FFI_TYPE_DOUBLE
#ifndef __NO_FPRS__
	lfd %f1,112+0(%r1)
#else
	nop
#endif
	mtlr %r0
	addi %r1,%r1,144
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset 144

# case FFI_TYPE_LONGDOUBLE
#ifndef __NO_FPRS__
	lfd %f1,112+0(%r1)
	lfd %f2,112+8(%r1)
	mtlr %r0
	b .Lfinish
#else
	mtlr %r0
	addi %r1,%r1,144
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset 144
	nop
#endif

# case FFI_TYPE_UINT8
#ifdef __LITTLE_ENDIAN__
	lbz %r3,112+0(%r1)
#else
	lbz %r3,112+3(%r1)
#endif
	mtlr %r0
	addi %r1,%r1,144
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset 144

# case FFI_TYPE_SINT8
#ifdef __LITTLE_ENDIAN__
	lbz %r3,112+0(%r1)
#else
	lbz %r3,112+3(%r1)
#endif
	extsb %r3,%r3
	mtlr %r0
	b .Lfinish

# case FFI_TYPE_UINT16
#ifdef __LITTLE_ENDIAN__
	lhz %r3,112+0(%r1)
#else
	lhz %r3,112+2(%r1)
#endif
	mtlr %r0
	addi %r1,%r1,144
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset 144

# case FFI_TYPE_SINT16
#ifdef __LITTLE_ENDIAN__
	lha %r3,112+0(%r1)
#else
	lha %r3,112+2(%r1)
#endif
	mtlr %r0
	addi %r1,%r1,144
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset 144

# case FFI_TYPE_UINT32
	lwz %r3,112+0(%r1)
	mtlr %r0
	addi %r1,%r1,144
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset 144

# case FFI_TYPE_SINT32
	lwz %r3,112+0(%r1)
	mtlr %r0
	addi %r1,%r1,144
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset 144

# case FFI_TYPE_UINT64
	lwz %r3,112+0(%r1)
	lwz %r4,112+4(%r1)
	mtlr %r0
	b .Lfinish

# case FFI_TYPE_SINT64
	lwz %r3,112+0(%r1)
	lwz %r4,112+4(%r1)
	mtlr %r0
	b .Lfinish

# case FFI_TYPE_STRUCT
	mtlr %r0
	addi %r1,%r1,144
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset 144
	nop

# case FFI_TYPE_POINTER
	lwz %r3,112+0(%r1)
	mtlr %r0
	addi %r1,%r1,144
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset 144

# case FFI_TYPE_UINT128
	lwz %r3,112+0(%r1)
	lwz %r4,112+4(%r1)
	lwz %r5,112+8(%r1)
	b .Luint128

# The return types below are only used when the ABI type is FFI_SYSV.
# case FFI_SYSV_TYPE_SMALL_STRUCT + 1. One byte struct.
	lbz %r3,112+0(%r1)
	mtlr %r0
	addi %r1,%r1,144
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset 144

# case FFI_SYSV_TYPE_SMALL_STRUCT + 2. Two byte struct.
	lhz %r3,112+0(%r1)
	mtlr %r0
	addi %r1,%r1,144
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset 144

# case FFI_SYSV_TYPE_SMALL_STRUCT + 3. Three byte struct.
	lwz %r3,112+0(%r1)
#ifdef __LITTLE_ENDIAN__
	mtlr %r0
	addi %r1,%r1,144
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset 144
#else
	srwi %r3,%r3,8
	mtlr %r0
	b .Lfinish
#endif

# case FFI_SYSV_TYPE_SMALL_STRUCT + 4. Four byte struct.
	lwz %r3,112+0(%r1)
	mtlr %r0
	addi %r1,%r1,144
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset 144

# case FFI_SYSV_TYPE_SMALL_STRUCT + 5. Five byte struct.
	lwz %r3,112+0(%r1)
	lwz %r4,112+4(%r1)
#ifdef __LITTLE_ENDIAN__
	mtlr %r0
	b .Lfinish
#else
	li %r5,24
	b .Lstruct567
#endif

# case FFI_SYSV_TYPE_SMALL_STRUCT + 6. Six byte struct.
	lwz %r3,112+0(%r1)
	lwz %r4,112+4(%r1)
#ifdef __LITTLE_ENDIAN__
	mtlr %r0
	b .Lfinish
#else
	li %r5,16
	b .Lstruct567
#endif

# case FFI_SYSV_TYPE_SMALL_STRUCT + 7. Seven byte struct.
	lwz %r3,112+0(%r1)
	lwz %r4,112+4(%r1)
#ifdef __LITTLE_ENDIAN__
	mtlr %r0
	b .Lfinish
#else
	li %r5,8
	b .Lstruct567
#endif

# case FFI_SYSV_TYPE_SMALL_STRUCT + 8. Eight byte struct.
	lwz %r3,112+0(%r1)
	lwz %r4,112+4(%r1)
	mtlr %r0
	b .Lfinish

#ifndef __LITTLE_ENDIAN__
.Lstruct567:
	subfic %r6,%r5,32
	srw %r4,%r4,%r5
	slw %r6,%r3,%r6
	srw %r3,%r3,%r5
	or %r4,%r6,%r4
	mtlr %r0
	addi %r1,%r1,144
	.cfi_def_cfa_offset 0
	blr
	.cfi_def_cfa_offset 144
#endif

.Luint128:
	lwz %r6,112+12(%r1)
	mtlr %r0
	addi %r1,%r1,144
	.cfi_def_cfa_offset 0
	blr
	.cfi_endproc
END(ffi_closure_SYSV)


FFI_HIDDEN(ffi_go_closure_sysv)
ENTRY(ffi_go_closure_sysv)
	.cfi_startproc
	stwu %r1,-144(%r1)
	.cfi_def_cfa_offset 144
	mflr %r0
	stw %r0,148(%r1)
	.cfi_offset 65, 4

	stw   %r3, 16(%r1)
	stw   %r4, 20(%r1)
	stw   %r5, 24(%r1)

	# closure->cif
	lwz %r3,4(%r11)
	# closure->fun
	lwz %r4,8(%r11)
	# user_data
	mr %r5,%r11
	b .Ldoclosure
	.cfi_endproc
END(ffi_go_closure_sysv)

#if defined __ELF__ && defined __linux__
	.section	.note.GNU-stack,"",@progbits
#endif
#endif
