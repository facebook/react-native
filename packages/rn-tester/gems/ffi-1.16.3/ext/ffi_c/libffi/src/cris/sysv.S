/* -----------------------------------------------------------------------
   sysv.S - Copyright (c) 2004 Simon Posnjak
	    Copyright (c) 2005 Axis Communications AB

   CRIS Foreign Function Interface

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
   IN NO EVENT SHALL SIMON POSNJAK BE LIABLE FOR ANY CLAIM, DAMAGES OR
   OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
   ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
   OTHER DEALINGS IN THE SOFTWARE.
   ----------------------------------------------------------------------- */

#define LIBFFI_ASM
#include <ffi.h>
#define CONCAT(x,y) x ## y
#define XCONCAT(x,y) CONCAT (x, y)
#define L(x) XCONCAT (__USER_LABEL_PREFIX__, x)

	.text

	;; OK, when we get called we should have this (according to
	;; AXIS ETRAX 100LX Programmer's Manual chapter 6.3).
	;;
	;; R10:	 ffi_prep_args (func. pointer)
	;; R11:  &ecif
	;; R12:  cif->bytes
	;; R13:  fig->flags
	;; sp+0: ecif.rvalue
	;; sp+4: fn (function pointer to the function that we need to call)

	.globl  L(ffi_call_SYSV)
	.type   L(ffi_call_SYSV),@function
	.hidden	L(ffi_call_SYSV)

L(ffi_call_SYSV):
	;; Save the regs to the stack.
	push $srp
	;; Used for stack pointer saving.
	push $r6
	;; Used for function address pointer.
	push $r7
	;; Used for stack pointer saving.
	push $r8
	;; We save fig->flags to stack we will need them after we
	;; call The Function.
	push $r13

	;; Saving current stack pointer.
	move.d $sp,$r8
	move.d $sp,$r6

	;; Move address of ffi_prep_args to r13.
	move.d $r10,$r13

	;; Make room on the stack for the args of fn.
	sub.d  $r12,$sp

	;; Function void ffi_prep_args(char *stack, extended_cif *ecif) parameters are:
	;; 	r10 <-- stack pointer
	;; 	r11 <-- &ecif (already there)
	move.d $sp,$r10

	;; Call the function.
	jsr $r13

	;; Save the size of the structures which are passed on stack.
	move.d $r10,$r7

	;; Move first four args in to r10..r13.
	move.d [$sp+0],$r10
	move.d [$sp+4],$r11
	move.d [$sp+8],$r12
	move.d [$sp+12],$r13

	;; Adjust the stack and check if any parameters are given on stack.
	addq 16,$sp
	sub.d $r7,$r6
	cmp.d $sp,$r6

	bpl go_on
	nop

go_on_no_params_on_stack:
	move.d $r6,$sp

go_on:
	;; Discover if we need to put rval address in to r9.
	move.d [$r8+0],$r7
	cmpq FFI_TYPE_STRUCT,$r7
	bne call_now
	nop

	;; Move rval address to $r9.
	move.d [$r8+20],$r9

call_now:
	;; Move address of The Function in to r7.
	move.d [$r8+24],$r7

	;; Call The Function.
	jsr $r7

	;; Reset stack.
	move.d $r8,$sp

	;; Load rval type (fig->flags) in to r13.
	pop $r13

	;; Detect rval type.
	cmpq FFI_TYPE_VOID,$r13
	beq epilogue

	cmpq FFI_TYPE_STRUCT,$r13
	beq epilogue

	cmpq FFI_TYPE_DOUBLE,$r13
	beq return_double_or_longlong

	cmpq FFI_TYPE_UINT64,$r13
	beq return_double_or_longlong

	cmpq FFI_TYPE_SINT64,$r13
	beq return_double_or_longlong
	nop

	;; Just return the 32 bit value.
	ba return
	nop

return_double_or_longlong:
	;; Load half of the rval to r10 and the other half to r11.
	move.d [$sp+16],$r13
	move.d $r10,[$r13]
	addq 4,$r13
	move.d $r11,[$r13]
	ba epilogue
	nop

return:
	;; Load the rval to r10.
	move.d [$sp+16],$r13
	move.d $r10,[$r13]

epilogue:
	pop $r8
	pop $r7
	pop $r6
	Jump [$sp+]

	.size   ffi_call_SYSV,.-ffi_call_SYSV

/* Save R10..R13 into an array, somewhat like varargs.  Copy the next
   argument too, to simplify handling of any straddling parameter.
   Save R9 and SP after those.  Jump to function handling the rest.
   Since this is a template, copied and the main function filled in by
   the user.  */

	.globl	L(ffi_cris_trampoline_template)
	.type	L(ffi_cris_trampoline_template),@function
	.hidden	L(ffi_cris_trampoline_template)

L(ffi_cris_trampoline_template):
0:
	/* The value we get for "PC" is right after the prefix instruction,
	   two bytes from the beginning, i.e. 0b+2. */
	move.d $r10,[$pc+2f-(0b+2)]
	move.d $pc,$r10
1:
	addq 2f-1b+4,$r10
	move.d $r11,[$r10+]
	move.d $r12,[$r10+]
	move.d $r13,[$r10+]
	move.d [$sp],$r11
	move.d $r11,[$r10+]
	move.d $r9,[$r10+]
	move.d $sp,[$r10+]
	subq FFI_CRIS_TRAMPOLINE_DATA_PART_SIZE,$r10
	move.d 0,$r11
3:
        jump 0
2:
	.size	ffi_cris_trampoline_template,.-0b

/* This macro create a constant usable as "extern const int \name" in
   C from within libffi, when \name has no prefix decoration.  */

	.macro const name,value
	.globl	\name
	.type	\name,@object
	.hidden	\name
\name:
	.dword  \value
	.size	\name,4
	.endm

/* Constants for offsets within the trampoline.  We could do this with
   just symbols, avoiding memory contents and memory accesses, but the
   C usage code would look a bit stranger.  */

	const L(ffi_cris_trampoline_fn_offset),2b-4-0b
	const L(ffi_cris_trampoline_closure_offset),3b-4-0b
