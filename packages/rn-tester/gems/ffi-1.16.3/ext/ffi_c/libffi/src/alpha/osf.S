/* -----------------------------------------------------------------------
   osf.S - Copyright (c) 1998, 2001, 2007, 2008, 2011, 2014 Red Hat

   Alpha/OSF Foreign Function Interface

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
#include <ffi_cfi.h>
#include "internal.h"

	.arch ev6
	.text

/* Aid in building a direct addressed jump table, 4 insns per entry.  */
.macro E index
	.align	4
	.org	99b + \index * 16
.endm

/* ffi_call_osf (void *stack, void *frame, unsigned flags,
		 void *raddr, void (*fnaddr)(void), void *closure)

   Bit o trickiness here -- FRAME is the base of the stack frame
   for this function.  This has been allocated by ffi_call.  We also
   deallocate some of the stack that has been alloca'd.  */

	.align	4
	.globl	ffi_call_osf
	.ent	ffi_call_osf
	FFI_HIDDEN(ffi_call_osf)

ffi_call_osf:
	cfi_startproc
	cfi_def_cfa($17, 32)
	mov	$16, $30
	stq	$26, 0($17)
	stq	$15, 8($17)
	mov	$17, $15
	.prologue 0
	cfi_def_cfa_register($15)
	cfi_rel_offset($26, 0)
	cfi_rel_offset($15, 8)

	stq	$18, 16($17)		# save flags into frame
	stq	$19, 24($17)		# save rvalue into frame
	mov	$20, $27		# fn into place for call
	mov	$21, $1			# closure into static chain

	# Load up all of the (potential) argument registers.
	ldq	$16, 0($30)
	ldt	$f16, 0($30)
	ldt	$f17, 8($30)
	ldq	$17, 8($30)
	ldt	$f18, 16($30)
	ldq	$18, 16($30)
	ldt	$f19, 24($30)
	ldq	$19, 24($30)
	ldt	$f20, 32($30)
	ldq	$20, 32($30)
	ldt	$f21, 40($30)
	ldq	$21, 40($30)

	# Deallocate the register argument area.
	lda	$30, 48($30)

	jsr	$26, ($27), 0
0:
	ldah	$29, 0($26)		!gpdisp!1
	ldq	$2, 24($15)		# reload rvalue
	lda	$29, 0($29)		!gpdisp!1
	ldq	$3, 16($15)		# reload flags
	lda	$1, 99f-0b($26)
	ldq	$26, 0($15)
	ldq	$15, 8($15)
	cfi_restore($26)
	cfi_restore($15)
	cfi_def_cfa($sp, 0)
	cmoveq	$2, ALPHA_ST_VOID, $3	# mash null rvalue to void
	addq	$3, $3, $3
	s8addq	$3, $1, $1		# 99f + stcode * 16
	jmp	$31, ($1), $st_int

	.align	4
99:
E ALPHA_ST_VOID
	ret
E ALPHA_ST_INT
$st_int:
	stq	$0, 0($2)
	ret
E ALPHA_ST_FLOAT
	sts	$f0, 0($2)
	ret
E ALPHA_ST_DOUBLE
	stt	$f0, 0($2)
	ret
E ALPHA_ST_CPLXF
	sts	$f0, 0($2)
	sts	$f1, 4($2)
	ret
E ALPHA_ST_CPLXD
	stt	$f0, 0($2)
	stt	$f1, 8($2)
	ret

	cfi_endproc
	.end	ffi_call_osf

/* ffi_closure_osf(...)

   Receives the closure argument in $1.   */

#define CLOSURE_FS	(16*8)

	.align	4
	.globl	ffi_go_closure_osf
	.ent	ffi_go_closure_osf
	FFI_HIDDEN(ffi_go_closure_osf)

ffi_go_closure_osf:
	cfi_startproc
	ldgp	$29, 0($27)
	subq	$30, CLOSURE_FS, $30
	cfi_adjust_cfa_offset(CLOSURE_FS)
	stq	$26, 0($30)
	.prologue 1
	cfi_rel_offset($26, 0)

	stq	$16, 10*8($30)
	stq	$17, 11*8($30)
	stq	$18, 12*8($30)

	ldq	$16, 8($1)			# load cif
	ldq	$17, 16($1)			# load fun
	mov	$1, $18				# closure is user_data
	br	$do_closure

	cfi_endproc
	.end	ffi_go_closure_osf

	.align	4
	.globl	ffi_closure_osf
	.ent	ffi_closure_osf
	FFI_HIDDEN(ffi_closure_osf)

ffi_closure_osf:
	cfi_startproc
	ldgp	$29, 0($27)
	subq	$30, CLOSURE_FS, $30
	cfi_adjust_cfa_offset(CLOSURE_FS)
	stq	$26, 0($30)
	.prologue 1
	cfi_rel_offset($26, 0)

	# Store all of the potential argument registers in va_list format.
	stq	$16, 10*8($30)
	stq	$17, 11*8($30)
	stq	$18, 12*8($30)

	ldq	$16, 24($1)			# load cif
	ldq	$17, 32($1)			# load fun
	ldq	$18, 40($1)			# load user_data

$do_closure:
	stq	$19, 13*8($30)
	stq	$20, 14*8($30)
	stq	$21, 15*8($30)
	stt	$f16, 4*8($30)
	stt	$f17, 5*8($30)
	stt	$f18, 6*8($30)
	stt	$f19, 7*8($30)
	stt	$f20, 8*8($30)
	stt	$f21, 9*8($30)

	# Call ffi_closure_osf_inner to do the bulk of the work.
	lda	$19, 2*8($30)
	lda	$20, 10*8($30)
	jsr	$26, ffi_closure_osf_inner
0:
	ldah	$29, 0($26)			!gpdisp!2
	lda	$2, 99f-0b($26)
	s4addq	$0, 0, $1			# ldcode * 4
	ldq	$0, 16($30)			# preload return value
	s4addq	$1, $2, $1			# 99f + ldcode * 16
	lda	$29, 0($29)			!gpdisp!2
	ldq	$26, 0($30)
	cfi_restore($26)
	jmp	$31, ($1), $load_32

.macro epilogue
	addq	$30, CLOSURE_FS, $30
	cfi_adjust_cfa_offset(-CLOSURE_FS)
	ret
	.align	4
	cfi_adjust_cfa_offset(CLOSURE_FS)
.endm

	.align 4
99:
E ALPHA_LD_VOID
	epilogue

E ALPHA_LD_INT64
	epilogue

E ALPHA_LD_INT32
$load_32:
	sextl	$0, $0
	epilogue

E ALPHA_LD_UINT16
	zapnot	$0, 3, $0
	epilogue

E ALPHA_LD_SINT16
#ifdef __alpha_bwx__
	sextw	$0, $0
#else
	sll	$0, 48, $0
	sra	$0, 48, $0
#endif
	epilogue

E ALPHA_LD_UINT8
	and	$0, 0xff, $0
	epilogue

E ALPHA_LD_SINT8
#ifdef __alpha_bwx__
	sextb	$0, $0
#else
	sll	$0, 56, $0
	sra	$0, 56, $0
#endif
	epilogue

E ALPHA_LD_FLOAT
	lds	$f0, 16($sp)
	epilogue

E ALPHA_LD_DOUBLE
	ldt	$f0, 16($sp)
	epilogue

E ALPHA_LD_CPLXF
	lds	$f0, 16($sp)
	lds	$f1, 20($sp)
	epilogue

E ALPHA_LD_CPLXD
	ldt	$f0, 16($sp)
	ldt	$f1, 24($sp)
	epilogue

	cfi_endproc
	.end	ffi_closure_osf

#if defined __ELF__ && defined __linux__
	.section	.note.GNU-stack,"",@progbits
#endif
