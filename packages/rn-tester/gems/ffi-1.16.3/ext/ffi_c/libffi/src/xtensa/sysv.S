/* -----------------------------------------------------------------------
   sysv.S - Copyright (c) 2013 Tensilica, Inc.
   
   XTENSA Foreign Function Interface 

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

#define ENTRY(name) .text; .globl name; .type  name,@function; .align 4; name:
#define END(name) .size name , . - name

/* Assert that the table below is in sync with ffi.h.  */

#if	   FFI_TYPE_UINT8 != 5          \
        || FFI_TYPE_SINT8 != 6          \
        || FFI_TYPE_UINT16 != 7         \
        || FFI_TYPE_SINT16 != 8         \
        || FFI_TYPE_UINT32 != 9         \
        || FFI_TYPE_SINT32 != 10        \
        || FFI_TYPE_UINT64 != 11
#error "xtensa/sysv.S out of sync with ffi.h"
#endif

#define FFI_REGISTER_ARGS_OFFSET ((XTENSA_STACK_ALIGNMENT - \
				   FFI_REGISTER_NARGS * 4) & \
				   (XTENSA_STACK_ALIGNMENT - 1))

/* ffi_call_SYSV (rvalue, rbytes, flags, (*fnaddr)(), bytes, ecif)
      void *rvalue;            a2
      unsigned long rbytes;    a3
      unsigned flags;          a4
      void (*fnaddr)();        a5
      unsigned long bytes;     a6
      extended_cif* ecif)      a7
*/

ENTRY(ffi_call_SYSV)

	entry	a1, 32              # 32 byte frame for using call8 below

	mov	a10, a7             # a10(->arg0): ecif
	sub	a11, a1, a6         # a11(->arg1): stack pointer
	mov	a7, a1              # fp
	movsp	a1, a11             # set new sp = old_sp - bytes

	# align ffi_prep_args stack argument so that arguments
	# passed on stack if any start on 16-byte aligned boundary

	addi	a11, a11, FFI_REGISTER_ARGS_OFFSET

	movi	a8, ffi_prep_args
	callx8	a8                  # ffi_prep_args(ecif, stack)

	# prepare to move stack pointer back
	# to point to arguments passed on stack

	addi	a6, a1, FFI_REGISTER_ARGS_SPACE
	
	# we can pass up to 6 arguments in registers
	# for simplicity, just load 6 arguments

	l32i	a10, a1, FFI_REGISTER_ARGS_OFFSET + 0
	l32i	a11, a1, FFI_REGISTER_ARGS_OFFSET + 4
	l32i	a12, a1, FFI_REGISTER_ARGS_OFFSET + 8
	l32i	a13, a1, FFI_REGISTER_ARGS_OFFSET + 12
	l32i	a14, a1, FFI_REGISTER_ARGS_OFFSET + 16
	l32i	a15, a1, FFI_REGISTER_ARGS_OFFSET + 20

	# move stack pointer

	movsp	a1, a6

	callx8	a5                  # (*fn)(args...)

	# Handle return value(s)

	beqz	a2, .Lexit

	movi	a5, FFI_TYPE_STRUCT
	bne	a4, a5, .Lstore
	movi	a5, 16
	blt	a5, a3, .Lexit

	s32i	a10, a2, 0
	blti	a3, 5, .Lexit
	addi	a3, a3, -1
	s32i	a11, a2, 4
	blti	a3, 8, .Lexit
	s32i	a12, a2, 8
	blti	a3, 12, .Lexit
	s32i	a13, a2, 12

.Lexit:	retw

.Lstore:
	addi	a4, a4, -FFI_TYPE_UINT8
	bgei	a4, 7, .Lexit	# should never happen
	movi	a6, store_calls
	add	a4, a4, a4
	addx4	a6, a4, a6	# store_table + idx * 8
	jx	a6

	.align	8
store_calls:
	# UINT8
	s8i	a10, a2, 0
	retw

	# SINT8
	.align	8
	s8i	a10, a2, 0
	retw

	# UINT16
	.align	8
	s16i	a10, a2, 0
	retw

	# SINT16
	.align	8
	s16i	a10, a2, 0
	retw

	# UINT32
	.align	8
	s32i	a10, a2, 0
	retw

	# SINT32
	.align	8
	s32i	a10, a2, 0
	retw

	# UINT64
	.align	8
	s32i	a10, a2, 0
	s32i	a11, a2, 4
	retw

END(ffi_call_SYSV)


/*
 * void ffi_cacheflush (unsigned long start, unsigned long end)
 */

#define EXTRA_ARGS_SIZE	24

ENTRY(ffi_cacheflush)

	entry	a1, 32

1:	
#if XCHAL_DCACHE_SIZE
	dhwbi	a2, 0
#endif
#if XCHAL_ICACHE_SIZE
	ihi	a2, 0
#endif
	addi	a2, a2, 4
	blt	a2, a3, 1b

	retw

END(ffi_cacheflush)

/* ffi_trampoline is copied to the stack */

ENTRY(ffi_trampoline)

	/* 32 bytes for spill + spill overflow area of a frame that uses
	   call8,
	   FFI_REGISTER_NARGS * 4 bytes for arguments passed in registers,
	   aligned up to 4 to maintain 16 byte stack alignment,
	   4 * 4 bytes for the result.
	   This size must be in sync with ffi_closure_SYSV_inner logic.
	 */
	entry	a1, 32 + FFI_REGISTER_ARGS_SPACE + (4 * 4)   # [ 0]
	j	2f                                # [ 3]
	.align	4                                 # [ 6]
1:	.long	0                                 # [ 8]
2:	l32r	a15, 1b                           # [12]
	_mov 	a14, a0                           # [15]
	callx0	a15                               # [18]
                                                  # [21]
END(ffi_trampoline)

/*
 * ffi_closure()
 *
 * a0:  closure + 21
 * a14: return address (a0)
 */

ENTRY(ffi_closure_SYSV)

	/* intentionally omitting entry here */

	# restore return address (a0) and move pointer to closure to a10
	addi	a10, a0, -21
	mov	a0, a14

	# allow up to 4 arguments as return values
	addi	a11, a1, 4 * 4

	# save up to 6 arguments to stack (allocated by entry below)
	s32i	a2, a11,  0
	s32i	a3, a11,  4
	s32i	a4, a11,  8
	s32i	a5, a11, 12
	s32i	a6, a11, 16
	s32i	a7, a11, 20

	movi	a8, ffi_closure_SYSV_inner
	mov	a12, a1
	callx8	a8			# .._inner(*closure, **avalue, *rvalue)

	# load up to four return arguments
	l32i	a2, a1,  0
	l32i	a3, a1,  4
	l32i	a4, a1,  8
	l32i	a5, a1, 12

	# (sign-)extend return value
	movi	a11, FFI_TYPE_UINT8
	bne	a10, a11, 1f
	extui	a2, a2, 0, 8
	retw

1:	movi	a11, FFI_TYPE_SINT8
	bne	a10, a11, 1f
	sext	a2, a2, 7
	retw

1:	movi	a11, FFI_TYPE_UINT16
	bne	a10, a11, 1f
	extui	a2, a2, 0, 16
	retw

1:	movi	a11, FFI_TYPE_SINT16
	bne	a10, a11, 1f
	sext	a2, a2, 15

1:	retw

END(ffi_closure_SYSV)
