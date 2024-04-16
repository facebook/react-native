/* -----------------------------------------------------------------------
   sysv.S - Copyright (c) 2017  Anthony Green
          - Copyright (c) 2013  The Written Word, Inc.
          - Copyright (c) 1996,1998,2001-2003,2005,2008,2010  Red Hat, Inc.
   
   X86 Foreign Function Interface 

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

#ifdef __i386__
#ifndef _MSC_VER

#define LIBFFI_ASM	
#include <fficonfig.h>
#include <ffi.h>
#include "internal.h"

#define C2(X, Y)  X ## Y
#define C1(X, Y)  C2(X, Y)
#ifdef __USER_LABEL_PREFIX__
# define C(X)     C1(__USER_LABEL_PREFIX__, X)
#else
# define C(X)     X
#endif

#ifdef X86_DARWIN
# define L(X)     C1(L, X)
#else
# define L(X)     C1(.L, X)
#endif

#ifdef __ELF__
# define ENDF(X)  .type	X,@function; .size X, . - X
#else
# define ENDF(X)
#endif

/* Handle win32 fastcall name mangling.  */
#ifdef X86_WIN32
# define ffi_call_i386		"@ffi_call_i386@8"
# define ffi_closure_inner	"@ffi_closure_inner@8"
#else
# define ffi_call_i386		C(ffi_call_i386)
# define ffi_closure_inner	C(ffi_closure_inner)
#endif

/* This macro allows the safe creation of jump tables without an
   actual table.  The entry points into the table are all 8 bytes.
   The use of ORG asserts that we're at the correct location.  */
/* ??? The clang assembler doesn't handle .org with symbolic expressions.  */
#if defined(__clang__) || defined(__APPLE__) || (defined (__sun__) && defined(__svr4__))
# define E(BASE, X)	.balign 8
#else
# define E(BASE, X)	.balign 8; .org BASE + X * 8
#endif

	.text
	.balign	16
	.globl	ffi_call_i386
	FFI_HIDDEN(ffi_call_i386)

/* This is declared as

   void ffi_call_i386(struct call_frame *frame, char *argp)
        __attribute__((fastcall));

   Thus the arguments are present in

        ecx: frame
        edx: argp
*/

ffi_call_i386:
L(UW0):
	# cfi_startproc
	_CET_ENDBR
#if !HAVE_FASTCALL
	movl	4(%esp), %ecx
	movl	8(%esp), %edx
#endif
	movl	(%esp), %eax		/* move the return address */
	movl	%ebp, (%ecx)		/* store %ebp into local frame */
	movl	%eax, 4(%ecx)		/* store retaddr into local frame */

	/* New stack frame based off ebp.  This is a itty bit of unwind
	   trickery in that the CFA *has* changed.  There is no easy way
	   to describe it correctly on entry to the function.  Fortunately,
	   it doesn't matter too much since at all points we can correctly
	   unwind back to ffi_call.  Note that the location to which we
	   moved the return address is (the new) CFA-4, so from the
	   perspective of the unwind info, it hasn't moved.  */
	movl	%ecx, %ebp
L(UW1):
	# cfi_def_cfa(%ebp, 8)
	# cfi_rel_offset(%ebp, 0)

	movl	%edx, %esp		/* set outgoing argument stack */
	movl	20+R_EAX*4(%ebp), %eax	/* set register arguments */
	movl	20+R_EDX*4(%ebp), %edx
	movl	20+R_ECX*4(%ebp), %ecx

	call	*8(%ebp)

	movl	12(%ebp), %ecx		/* load return type code */
	movl	%ebx, 8(%ebp)		/* preserve %ebx */
L(UW2):
	# cfi_rel_offset(%ebx, 8)

	andl	$X86_RET_TYPE_MASK, %ecx
#ifdef __PIC__
	call	C(__x86.get_pc_thunk.bx)
L(pc1):
	leal	L(store_table)-L(pc1)(%ebx, %ecx, 8), %ebx
#else
	leal	L(store_table)(,%ecx, 8), %ebx
#endif
	movl	16(%ebp), %ecx		/* load result address */
	_CET_NOTRACK jmp *%ebx

	.balign	8
L(store_table):
E(L(store_table), X86_RET_FLOAT)
	fstps	(%ecx)
	jmp	L(e1)
E(L(store_table), X86_RET_DOUBLE)
	fstpl	(%ecx)
	jmp	L(e1)
E(L(store_table), X86_RET_LDOUBLE)
	fstpt	(%ecx)
	jmp	L(e1)
E(L(store_table), X86_RET_SINT8)
	movsbl	%al, %eax
	mov	%eax, (%ecx)
	jmp	L(e1)
E(L(store_table), X86_RET_SINT16)
	movswl	%ax, %eax
	mov	%eax, (%ecx)
	jmp	L(e1)
E(L(store_table), X86_RET_UINT8)
	movzbl	%al, %eax
	mov	%eax, (%ecx)
	jmp	L(e1)
E(L(store_table), X86_RET_UINT16)
	movzwl	%ax, %eax
	mov	%eax, (%ecx)
	jmp	L(e1)
E(L(store_table), X86_RET_INT64)
	movl	%edx, 4(%ecx)
	/* fallthru */
E(L(store_table), X86_RET_INT32)
	movl	%eax, (%ecx)
	/* fallthru */
E(L(store_table), X86_RET_VOID)
L(e1):
	movl	8(%ebp), %ebx
	movl	%ebp, %esp
	popl	%ebp
L(UW3):
	# cfi_remember_state
	# cfi_def_cfa(%esp, 4)
	# cfi_restore(%ebx)
	# cfi_restore(%ebp)
	ret
L(UW4):
	# cfi_restore_state

E(L(store_table), X86_RET_STRUCTPOP)
	jmp	L(e1)
E(L(store_table), X86_RET_STRUCTARG)
	jmp	L(e1)
E(L(store_table), X86_RET_STRUCT_1B)
	movb	%al, (%ecx)
	jmp	L(e1)
E(L(store_table), X86_RET_STRUCT_2B)
	movw	%ax, (%ecx)
	jmp	L(e1)

	/* Fill out the table so that bad values are predictable.  */
E(L(store_table), X86_RET_UNUSED14)
	ud2
E(L(store_table), X86_RET_UNUSED15)
	ud2

L(UW5):
	# cfi_endproc
ENDF(ffi_call_i386)

/* The inner helper is declared as

   void ffi_closure_inner(struct closure_frame *frame, char *argp)
	__attribute_((fastcall))

   Thus the arguments are placed in

	ecx:	frame
	edx:	argp
*/

/* Macros to help setting up the closure_data structure.  */

#if HAVE_FASTCALL
# define closure_FS	(40 + 4)
# define closure_CF	0
#else
# define closure_FS	(8 + 40 + 12)
# define closure_CF	8
#endif

#define FFI_CLOSURE_SAVE_REGS		\
	movl	%eax, closure_CF+16+R_EAX*4(%esp);	\
	movl	%edx, closure_CF+16+R_EDX*4(%esp);	\
	movl	%ecx, closure_CF+16+R_ECX*4(%esp)

#define FFI_CLOSURE_COPY_TRAMP_DATA					\
	movl	FFI_TRAMPOLINE_SIZE(%eax), %edx;	/* copy cif */	\
	movl	FFI_TRAMPOLINE_SIZE+4(%eax), %ecx;	/* copy fun */	\
	movl	FFI_TRAMPOLINE_SIZE+8(%eax), %eax;	/* copy user_data */ \
	movl	%edx, closure_CF+28(%esp);				\
	movl	%ecx, closure_CF+32(%esp);				\
	movl	%eax, closure_CF+36(%esp)

#if HAVE_FASTCALL
# define FFI_CLOSURE_PREP_CALL						\
	movl	%esp, %ecx;			/* load closure_data */	\
	leal	closure_FS+4(%esp), %edx;	/* load incoming stack */
#else
# define FFI_CLOSURE_PREP_CALL						\
	leal	closure_CF(%esp), %ecx;		/* load closure_data */	\
	leal	closure_FS+4(%esp), %edx;	/* load incoming stack */ \
	movl	%ecx, (%esp);						\
	movl	%edx, 4(%esp)
#endif

#define FFI_CLOSURE_CALL_INNER(UWN) \
	call	ffi_closure_inner

#define FFI_CLOSURE_MASK_AND_JUMP(N, UW)				\
	andl	$X86_RET_TYPE_MASK, %eax;				\
	leal	L(C1(load_table,N))(, %eax, 8), %edx;			\
	movl	closure_CF(%esp), %eax;		/* optimiztic load */	\
	_CET_NOTRACK jmp *%edx

#ifdef __PIC__
# if defined X86_DARWIN || defined HAVE_HIDDEN_VISIBILITY_ATTRIBUTE
#  undef FFI_CLOSURE_MASK_AND_JUMP
#  define FFI_CLOSURE_MASK_AND_JUMP(N, UW)				\
	andl	$X86_RET_TYPE_MASK, %eax;				\
	call	C(__x86.get_pc_thunk.dx);				\
L(C1(pc,N)):								\
	leal	L(C1(load_table,N))-L(C1(pc,N))(%edx, %eax, 8), %edx;	\
	movl	closure_CF(%esp), %eax;		/* optimiztic load */	\
	_CET_NOTRACK jmp *%edx
# else
#  define FFI_CLOSURE_CALL_INNER_SAVE_EBX
#  undef FFI_CLOSURE_CALL_INNER
#  define FFI_CLOSURE_CALL_INNER(UWN)					\
	movl	%ebx, 40(%esp);			/* save ebx */		\
L(C1(UW,UWN)):								\
	/* cfi_rel_offset(%ebx, 40); */					\
	call	C(__x86.get_pc_thunk.bx);	/* load got register */	\
	addl	$C(_GLOBAL_OFFSET_TABLE_), %ebx;			\
	call	ffi_closure_inner@PLT
#  undef FFI_CLOSURE_MASK_AND_JUMP
#  define FFI_CLOSURE_MASK_AND_JUMP(N, UWN)				\
	andl	$X86_RET_TYPE_MASK, %eax;				\
	leal	L(C1(load_table,N))@GOTOFF(%ebx, %eax, 8), %edx;	\
	movl	40(%esp), %ebx;			/* restore ebx */	\
L(C1(UW,UWN)):								\
	/* cfi_restore(%ebx); */					\
	movl	closure_CF(%esp), %eax;		/* optimiztic load */	\
	_CET_NOTRACK jmp *%edx
# endif /* DARWIN || HIDDEN */
#endif /* __PIC__ */

	.balign	16
	.globl	C(ffi_go_closure_EAX)
	FFI_HIDDEN(C(ffi_go_closure_EAX))
C(ffi_go_closure_EAX):
L(UW6):
	# cfi_startproc
	_CET_ENDBR
	subl	$closure_FS, %esp
L(UW7):
	# cfi_def_cfa_offset(closure_FS + 4)
	FFI_CLOSURE_SAVE_REGS
	movl	4(%eax), %edx			/* copy cif */
	movl	8(%eax), %ecx			/* copy fun */
	movl	%edx, closure_CF+28(%esp)
	movl	%ecx, closure_CF+32(%esp)
	movl	%eax, closure_CF+36(%esp)	/* closure is user_data */
	jmp	L(do_closure_i386)
L(UW8):
	# cfi_endproc
ENDF(C(ffi_go_closure_EAX))

	.balign	16
	.globl	C(ffi_go_closure_ECX)
	FFI_HIDDEN(C(ffi_go_closure_ECX))
C(ffi_go_closure_ECX):
L(UW9):
	# cfi_startproc
	_CET_ENDBR
	subl	$closure_FS, %esp
L(UW10):
	# cfi_def_cfa_offset(closure_FS + 4)
	FFI_CLOSURE_SAVE_REGS
	movl	4(%ecx), %edx			/* copy cif */
	movl	8(%ecx), %eax			/* copy fun */
	movl	%edx, closure_CF+28(%esp)
	movl	%eax, closure_CF+32(%esp)
	movl	%ecx, closure_CF+36(%esp)	/* closure is user_data */
	jmp	L(do_closure_i386)
L(UW11):
	# cfi_endproc
ENDF(C(ffi_go_closure_ECX))

/* The closure entry points are reached from the ffi_closure trampoline.
   On entry, %eax contains the address of the ffi_closure.  */

	.balign	16
	.globl	C(ffi_closure_i386)
	FFI_HIDDEN(C(ffi_closure_i386))

C(ffi_closure_i386):
L(UW12):
	# cfi_startproc
	_CET_ENDBR
	subl	$closure_FS, %esp
L(UW13):
	# cfi_def_cfa_offset(closure_FS + 4)

	FFI_CLOSURE_SAVE_REGS
	FFI_CLOSURE_COPY_TRAMP_DATA

	/* Entry point from preceeding Go closures.  */
L(do_closure_i386):

	FFI_CLOSURE_PREP_CALL
	FFI_CLOSURE_CALL_INNER(14)
	FFI_CLOSURE_MASK_AND_JUMP(2, 15)

	.balign	8
L(load_table2):
E(L(load_table2), X86_RET_FLOAT)
	flds	closure_CF(%esp)
	jmp	L(e2)
E(L(load_table2), X86_RET_DOUBLE)
	fldl	closure_CF(%esp)
	jmp	L(e2)
E(L(load_table2), X86_RET_LDOUBLE)
	fldt	closure_CF(%esp)
	jmp	L(e2)
E(L(load_table2), X86_RET_SINT8)
	movsbl	%al, %eax
	jmp	L(e2)
E(L(load_table2), X86_RET_SINT16)
	movswl	%ax, %eax
	jmp	L(e2)
E(L(load_table2), X86_RET_UINT8)
	movzbl	%al, %eax
	jmp	L(e2)
E(L(load_table2), X86_RET_UINT16)
	movzwl	%ax, %eax
	jmp	L(e2)
E(L(load_table2), X86_RET_INT64)
	movl	closure_CF+4(%esp), %edx
	jmp	L(e2)
E(L(load_table2), X86_RET_INT32)
	nop
	/* fallthru */
E(L(load_table2), X86_RET_VOID)
L(e2):
	addl	$closure_FS, %esp
L(UW16):
	# cfi_adjust_cfa_offset(-closure_FS)
	ret
L(UW17):
	# cfi_adjust_cfa_offset(closure_FS)
E(L(load_table2), X86_RET_STRUCTPOP)
	addl	$closure_FS, %esp
L(UW18):
	# cfi_adjust_cfa_offset(-closure_FS)
	ret	$4
L(UW19):
	# cfi_adjust_cfa_offset(closure_FS)
E(L(load_table2), X86_RET_STRUCTARG)
	jmp	L(e2)
E(L(load_table2), X86_RET_STRUCT_1B)
	movzbl	%al, %eax
	jmp	L(e2)
E(L(load_table2), X86_RET_STRUCT_2B)
	movzwl	%ax, %eax
	jmp	L(e2)

	/* Fill out the table so that bad values are predictable.  */
E(L(load_table2), X86_RET_UNUSED14)
	ud2
E(L(load_table2), X86_RET_UNUSED15)
	ud2

L(UW20):
	# cfi_endproc
ENDF(C(ffi_closure_i386))

	.balign	16
	.globl	C(ffi_go_closure_STDCALL)
	FFI_HIDDEN(C(ffi_go_closure_STDCALL))
C(ffi_go_closure_STDCALL):
L(UW21):
	# cfi_startproc
	_CET_ENDBR
	subl	$closure_FS, %esp
L(UW22):
	# cfi_def_cfa_offset(closure_FS + 4)
	FFI_CLOSURE_SAVE_REGS
	movl	4(%ecx), %edx			/* copy cif */
	movl	8(%ecx), %eax			/* copy fun */
	movl	%edx, closure_CF+28(%esp)
	movl	%eax, closure_CF+32(%esp)
	movl	%ecx, closure_CF+36(%esp)	/* closure is user_data */
	jmp	L(do_closure_STDCALL)
L(UW23):
	# cfi_endproc
ENDF(C(ffi_go_closure_STDCALL))

/* For REGISTER, we have no available parameter registers, and so we
   enter here having pushed the closure onto the stack.  */

	.balign	16
	.globl	C(ffi_closure_REGISTER)
	FFI_HIDDEN(C(ffi_closure_REGISTER))
C(ffi_closure_REGISTER):
L(UW24):
	# cfi_startproc
	# cfi_def_cfa(%esp, 8)
	# cfi_offset(%eip, -8)
	_CET_ENDBR
	subl	$closure_FS-4, %esp
L(UW25):
	# cfi_def_cfa_offset(closure_FS + 4)
	FFI_CLOSURE_SAVE_REGS
	movl	closure_FS-4(%esp), %ecx	/* load retaddr */
	movl	closure_FS(%esp), %eax		/* load closure */
	movl	%ecx, closure_FS(%esp)		/* move retaddr */
	jmp	L(do_closure_REGISTER)
L(UW26):
	# cfi_endproc
ENDF(C(ffi_closure_REGISTER))

/* For STDCALL (and others), we need to pop N bytes of arguments off
   the stack following the closure.  The amount needing to be popped
   is returned to us from ffi_closure_inner.  */

	.balign	16
	.globl	C(ffi_closure_STDCALL)
	FFI_HIDDEN(C(ffi_closure_STDCALL))
C(ffi_closure_STDCALL):
L(UW27):
	# cfi_startproc
	_CET_ENDBR
	subl	$closure_FS, %esp
L(UW28):
	# cfi_def_cfa_offset(closure_FS + 4)

	FFI_CLOSURE_SAVE_REGS

	/* Entry point from ffi_closure_REGISTER.  */
L(do_closure_REGISTER):

	FFI_CLOSURE_COPY_TRAMP_DATA

	/* Entry point from preceeding Go closure.  */
L(do_closure_STDCALL):

	FFI_CLOSURE_PREP_CALL
	FFI_CLOSURE_CALL_INNER(29)

	movl	%eax, %ecx
	shrl	$X86_RET_POP_SHIFT, %ecx	/* isolate pop count */
	leal	closure_FS(%esp, %ecx), %ecx	/* compute popped esp */
	movl	closure_FS(%esp), %edx		/* move return address */
	movl	%edx, (%ecx)

	/* From this point on, the value of %esp upon return is %ecx+4,
	   and we've copied the return address to %ecx to make return easy.
	   There's no point in representing this in the unwind info, as
	   there is always a window between the mov and the ret which
	   will be wrong from one point of view or another.  */

	FFI_CLOSURE_MASK_AND_JUMP(3, 30)

	.balign	8
L(load_table3):
E(L(load_table3), X86_RET_FLOAT)
	flds    closure_CF(%esp)
	movl    %ecx, %esp
	ret
E(L(load_table3), X86_RET_DOUBLE)
	fldl    closure_CF(%esp)
	movl    %ecx, %esp
	ret
E(L(load_table3), X86_RET_LDOUBLE)
	fldt    closure_CF(%esp)
	movl    %ecx, %esp
	ret
E(L(load_table3), X86_RET_SINT8)
	movsbl  %al, %eax
	movl    %ecx, %esp
	ret
E(L(load_table3), X86_RET_SINT16)
	movswl  %ax, %eax
	movl    %ecx, %esp
	ret
E(L(load_table3), X86_RET_UINT8)
	movzbl  %al, %eax
	movl    %ecx, %esp
	ret
E(L(load_table3), X86_RET_UINT16)
	movzwl  %ax, %eax
	movl    %ecx, %esp
	ret
E(L(load_table3), X86_RET_INT64)
	movl	closure_CF+4(%esp), %edx
	movl    %ecx, %esp
	ret
E(L(load_table3), X86_RET_INT32)
	movl    %ecx, %esp
	ret
E(L(load_table3), X86_RET_VOID)
	movl    %ecx, %esp
	ret
E(L(load_table3), X86_RET_STRUCTPOP)
	movl    %ecx, %esp
	ret
E(L(load_table3), X86_RET_STRUCTARG)
	movl	%ecx, %esp
	ret
E(L(load_table3), X86_RET_STRUCT_1B)
	movzbl	%al, %eax
	movl	%ecx, %esp
	ret
E(L(load_table3), X86_RET_STRUCT_2B)
	movzwl	%ax, %eax
	movl	%ecx, %esp
	ret

	/* Fill out the table so that bad values are predictable.  */
E(L(load_table3), X86_RET_UNUSED14)
	ud2
E(L(load_table3), X86_RET_UNUSED15)
	ud2

L(UW31):
	# cfi_endproc
ENDF(C(ffi_closure_STDCALL))

#if defined(FFI_EXEC_STATIC_TRAMP)
	.balign	16
	.globl	C(ffi_closure_i386_alt)
	FFI_HIDDEN(C(ffi_closure_i386_alt))
C(ffi_closure_i386_alt):
	/* See the comments above trampoline_code_table. */
	_CET_ENDBR
	movl	4(%esp), %eax			/* Load closure in eax */
	add	$8, %esp			/* Restore the stack */
	jmp	C(ffi_closure_i386)
ENDF(C(ffi_closure_i386_alt))

	.balign	16
	.globl	C(ffi_closure_REGISTER_alt)
	FFI_HIDDEN(C(ffi_closure_REGISTER_alt))
C(ffi_closure_REGISTER_alt):
	/* See the comments above trampoline_code_table. */
	_CET_ENDBR
	movl	(%esp), %eax			/* Restore eax */
	add	$4, %esp			/* Leave closure on stack */
	jmp	C(ffi_closure_REGISTER)
ENDF(C(ffi_closure_REGISTER_alt))

	.balign	16
	.globl	C(ffi_closure_STDCALL_alt)
	FFI_HIDDEN(C(ffi_closure_STDCALL_alt))
C(ffi_closure_STDCALL_alt):
	/* See the comments above trampoline_code_table. */
	_CET_ENDBR
	movl	4(%esp), %eax			/* Load closure in eax */
	add	$8, %esp			/* Restore the stack */
	jmp	C(ffi_closure_STDCALL)
ENDF(C(ffi_closure_STDCALL_alt))

/*
 * Below is the definition of the trampoline code table. Each element in
 * the code table is a trampoline.
 *
 * Because we jump to the trampoline, we place a _CET_ENDBR at the
 * beginning of the trampoline to mark it as a valid branch target. This is
 * part of the the Intel CET (Control Flow Enforcement Technology).
 */
/*
 * The trampoline uses register eax.  It saves the original value of eax on
 * the stack.
 *
 * The trampoline has two parameters - target code to jump to and data for
 * the target code. The trampoline extracts the parameters from its parameter
 * block (see tramp_table_map()). The trampoline saves the data address on
 * the stack. Finally, it jumps to the target code.
 *
 * The target code can choose to:
 *
 * - restore the value of eax
 * - load the data address in a register
 * - restore the stack pointer to what it was when the trampoline was invoked.
 */
#ifdef ENDBR_PRESENT
#define X86_DATA_OFFSET		4081
#define X86_CODE_OFFSET		4070
#else
#define X86_DATA_OFFSET		4085
#define X86_CODE_OFFSET		4074
#endif

	.align	X86_TRAMP_MAP_SIZE
	.globl	C(trampoline_code_table)
	FFI_HIDDEN(C(trampoline_code_table))
C(trampoline_code_table):
	.rept	X86_TRAMP_MAP_SIZE / X86_TRAMP_SIZE
	_CET_ENDBR
	sub	$8, %esp
	movl	%eax, (%esp)			/* Save %eax on stack */
	call	1f				/* Get next PC into %eax */
	movl	X86_DATA_OFFSET(%eax), %eax	/* Copy data into %eax */
	movl	%eax, 4(%esp)			/* Save data on stack */
	call	1f				/* Get next PC into %eax */
	movl	X86_CODE_OFFSET(%eax), %eax	/* Copy code into %eax */
	jmp	*%eax				/* Jump to code */
1:
	mov	(%esp), %eax
	ret
	.align	4
	.endr
ENDF(C(trampoline_code_table))
	.align	X86_TRAMP_MAP_SIZE
#endif /* FFI_EXEC_STATIC_TRAMP */

#if !FFI_NO_RAW_API

#define raw_closure_S_FS	(16+16+12)

	.balign	16
	.globl	C(ffi_closure_raw_SYSV)
	FFI_HIDDEN(C(ffi_closure_raw_SYSV))
C(ffi_closure_raw_SYSV):
L(UW32):
	# cfi_startproc
	_CET_ENDBR
	subl	$raw_closure_S_FS, %esp
L(UW33):
	# cfi_def_cfa_offset(raw_closure_S_FS + 4)
	movl	%ebx, raw_closure_S_FS-4(%esp)
L(UW34):
	# cfi_rel_offset(%ebx, raw_closure_S_FS-4)

	movl	FFI_TRAMPOLINE_SIZE+8(%eax), %edx	/* load cl->user_data */
	movl	%edx, 12(%esp)
	leal	raw_closure_S_FS+4(%esp), %edx		/* load raw_args */
	movl	%edx, 8(%esp)
	leal	16(%esp), %edx				/* load &res */
	movl	%edx, 4(%esp)
	movl	FFI_TRAMPOLINE_SIZE(%eax), %ebx		/* load cl->cif */
	movl	%ebx, (%esp)
	call	*FFI_TRAMPOLINE_SIZE+4(%eax)		/* call cl->fun */

	movl	20(%ebx), %eax				/* load cif->flags */
	andl	$X86_RET_TYPE_MASK, %eax
#ifdef __PIC__
	call	C(__x86.get_pc_thunk.bx)
L(pc4):
	leal	L(load_table4)-L(pc4)(%ebx, %eax, 8), %ecx
#else
	leal	L(load_table4)(,%eax, 8), %ecx
#endif
	movl	raw_closure_S_FS-4(%esp), %ebx
L(UW35):
	# cfi_restore(%ebx)
	movl	16(%esp), %eax				/* Optimistic load */
	jmp	*%ecx

	.balign	8
L(load_table4):
E(L(load_table4), X86_RET_FLOAT)
	flds	16(%esp)
	jmp	L(e4)
E(L(load_table4), X86_RET_DOUBLE)
	fldl	16(%esp)
	jmp	L(e4)
E(L(load_table4), X86_RET_LDOUBLE)
	fldt	16(%esp)
	jmp	L(e4)
E(L(load_table4), X86_RET_SINT8)
	movsbl	%al, %eax
	jmp	L(e4)
E(L(load_table4), X86_RET_SINT16)
	movswl	%ax, %eax
	jmp	L(e4)
E(L(load_table4), X86_RET_UINT8)
	movzbl	%al, %eax
	jmp	L(e4)
E(L(load_table4), X86_RET_UINT16)
	movzwl	%ax, %eax
	jmp	L(e4)
E(L(load_table4), X86_RET_INT64)
	movl	16+4(%esp), %edx
	jmp	L(e4)
E(L(load_table4), X86_RET_INT32)
	nop
	/* fallthru */
E(L(load_table4), X86_RET_VOID)
L(e4):
	addl	$raw_closure_S_FS, %esp
L(UW36):
	# cfi_adjust_cfa_offset(-raw_closure_S_FS)
	ret
L(UW37):
	# cfi_adjust_cfa_offset(raw_closure_S_FS)
E(L(load_table4), X86_RET_STRUCTPOP)
	addl	$raw_closure_S_FS, %esp
L(UW38):
	# cfi_adjust_cfa_offset(-raw_closure_S_FS)
	ret	$4
L(UW39):
	# cfi_adjust_cfa_offset(raw_closure_S_FS)
E(L(load_table4), X86_RET_STRUCTARG)
	jmp	L(e4)
E(L(load_table4), X86_RET_STRUCT_1B)
	movzbl	%al, %eax
	jmp	L(e4)
E(L(load_table4), X86_RET_STRUCT_2B)
	movzwl	%ax, %eax
	jmp	L(e4)

	/* Fill out the table so that bad values are predictable.  */
E(L(load_table4), X86_RET_UNUSED14)
	ud2
E(L(load_table4), X86_RET_UNUSED15)
	ud2

L(UW40):
	# cfi_endproc
ENDF(C(ffi_closure_raw_SYSV))

#define raw_closure_T_FS	(16+16+8)

	.balign	16
	.globl	C(ffi_closure_raw_THISCALL)
	FFI_HIDDEN(C(ffi_closure_raw_THISCALL))
C(ffi_closure_raw_THISCALL):
L(UW41):
	# cfi_startproc
	_CET_ENDBR
	/* Rearrange the stack such that %ecx is the first argument.
	   This means moving the return address.  */
	popl	%edx
L(UW42):
	# cfi_def_cfa_offset(0)
	# cfi_register(%eip, %edx)
	pushl	%ecx
L(UW43):
	# cfi_adjust_cfa_offset(4)
	pushl	%edx
L(UW44):
	# cfi_adjust_cfa_offset(4)
	# cfi_rel_offset(%eip, 0)
	subl	$raw_closure_T_FS, %esp
L(UW45):
	# cfi_adjust_cfa_offset(raw_closure_T_FS)
	movl	%ebx, raw_closure_T_FS-4(%esp)
L(UW46):
	# cfi_rel_offset(%ebx, raw_closure_T_FS-4)

	movl	FFI_TRAMPOLINE_SIZE+8(%eax), %edx	/* load cl->user_data */
	movl	%edx, 12(%esp)
	leal	raw_closure_T_FS+4(%esp), %edx		/* load raw_args */
	movl	%edx, 8(%esp)
	leal	16(%esp), %edx				/* load &res */
	movl	%edx, 4(%esp)
	movl	FFI_TRAMPOLINE_SIZE(%eax), %ebx		/* load cl->cif */
	movl	%ebx, (%esp)
	call	*FFI_TRAMPOLINE_SIZE+4(%eax)		/* call cl->fun */

	movl	20(%ebx), %eax				/* load cif->flags */
	andl	$X86_RET_TYPE_MASK, %eax
#ifdef __PIC__
	call	C(__x86.get_pc_thunk.bx)
L(pc5):
	leal	L(load_table5)-L(pc5)(%ebx, %eax, 8), %ecx
#else
	leal	L(load_table5)(,%eax, 8), %ecx
#endif
	movl	raw_closure_T_FS-4(%esp), %ebx
L(UW47):
	# cfi_restore(%ebx)
	movl	16(%esp), %eax				/* Optimistic load */
	jmp	*%ecx

	.balign	8
L(load_table5):
E(L(load_table5), X86_RET_FLOAT)
	flds	16(%esp)
	jmp	L(e5)
E(L(load_table5), X86_RET_DOUBLE)
	fldl	16(%esp)
	jmp	L(e5)
E(L(load_table5), X86_RET_LDOUBLE)
	fldt	16(%esp)
	jmp	L(e5)
E(L(load_table5), X86_RET_SINT8)
	movsbl	%al, %eax
	jmp	L(e5)
E(L(load_table5), X86_RET_SINT16)
	movswl	%ax, %eax
	jmp	L(e5)
E(L(load_table5), X86_RET_UINT8)
	movzbl	%al, %eax
	jmp	L(e5)
E(L(load_table5), X86_RET_UINT16)
	movzwl	%ax, %eax
	jmp	L(e5)
E(L(load_table5), X86_RET_INT64)
	movl	16+4(%esp), %edx
	jmp	L(e5)
E(L(load_table5), X86_RET_INT32)
	nop
	/* fallthru */
E(L(load_table5), X86_RET_VOID)
L(e5):
	addl	$raw_closure_T_FS, %esp
L(UW48):
	# cfi_adjust_cfa_offset(-raw_closure_T_FS)
	/* Remove the extra %ecx argument we pushed.  */
	ret	$4
L(UW49):
	# cfi_adjust_cfa_offset(raw_closure_T_FS)
E(L(load_table5), X86_RET_STRUCTPOP)
	addl	$raw_closure_T_FS, %esp
L(UW50):
	# cfi_adjust_cfa_offset(-raw_closure_T_FS)
	ret	$8
L(UW51):
	# cfi_adjust_cfa_offset(raw_closure_T_FS)
E(L(load_table5), X86_RET_STRUCTARG)
	jmp	L(e5)
E(L(load_table5), X86_RET_STRUCT_1B)
	movzbl	%al, %eax
	jmp	L(e5)
E(L(load_table5), X86_RET_STRUCT_2B)
	movzwl	%ax, %eax
	jmp	L(e5)

	/* Fill out the table so that bad values are predictable.  */
E(L(load_table5), X86_RET_UNUSED14)
	ud2
E(L(load_table5), X86_RET_UNUSED15)
	ud2

L(UW52):
	# cfi_endproc
ENDF(C(ffi_closure_raw_THISCALL))

#endif /* !FFI_NO_RAW_API */

#ifdef X86_DARWIN
/* The linker in use on earlier Darwin needs weak definitions to be
   placed in a coalesced section.  That section should not be called
   __TEXT,__text since that would be re-defining the attributes of the
   .text section (which is an error for earlier tools). Here we use
   '__textcoal_nt' which is what GCC emits for this.
   Later linker versions are happy to use a normal section and, after
   Darwin12 / OSX 10.8, the tools warn that using coalesced sections
   for this is deprecated so we must switch to avoid build fails and/or
   deprecation warnings.  */
# if defined(__ENVIRONMENT_MAC_OS_X_VERSION_MIN_REQUIRED__) &&		\
   __ENVIRONMENT_MAC_OS_X_VERSION_MIN_REQUIRED__ < 1080
#  define COMDAT(X)							\
        .section __TEXT,__textcoal_nt,coalesced,pure_instructions;	\
        .weak_definition X;						\
        FFI_HIDDEN(X)
# else
#  define COMDAT(X)							\
        .text;								\
        .weak_definition X;						\
        FFI_HIDDEN(X)
# endif
#elif defined __ELF__ && !(defined(__sun__) && defined(__svr4__))
# define COMDAT(X)							\
	.section .text.X,"axG",@progbits,X,comdat;			\
	.globl	X;							\
	FFI_HIDDEN(X)
#else
# define COMDAT(X)
#endif

#if defined(__PIC__)
	COMDAT(C(__x86.get_pc_thunk.bx))
C(__x86.get_pc_thunk.bx):
	movl	(%esp), %ebx
	ret
ENDF(C(__x86.get_pc_thunk.bx))
# if defined X86_DARWIN || defined HAVE_HIDDEN_VISIBILITY_ATTRIBUTE
	COMDAT(C(__x86.get_pc_thunk.dx))
C(__x86.get_pc_thunk.dx):
	movl	(%esp), %edx
	ret
ENDF(C(__x86.get_pc_thunk.dx))
#endif /* DARWIN || HIDDEN */
#endif /* __PIC__ */

/* Sadly, OSX cctools-as does not understand .cfi directives at all so
   we build an eh frame by hand.  */

#ifdef __APPLE__
/* The cctools assembler will try to make a difference between two local
   symbols into a relocation against, which will not work in the eh (produces
   link-time fails).
   To avoid this, we compute the symbol difference with a .set directive and
   then substitute this value.  */
# define LEN(N, P)	.set Llen$N$P,L(N)-L(P); .long Llen$N$P
/* Note, this assume DW_CFA_advance_loc1 fits into 7 bits.  */
# define ADV(N, P)	.set Ladv$N$P,L(N)-L(P); .byte 2, Ladv$N$P
/* For historical reasons, the EH reg numbers for SP and FP are swapped from
   the DWARF ones for 32b Darwin.  */
# define SP 5
# define FP 4
# define ENC 0x10
#else
# define LEN(N, P)	.long L(N)-L(P)
/* Assume DW_CFA_advance_loc1 fits.  */
# define ADV(N, P)	.byte 2, L(N)-L(P)
# define SP 4
# define FP 5
# define ENC 0x1b
#endif

#ifdef HAVE_AS_X86_PCREL
# define PCREL(X)	X-.
#else
# define PCREL(X)	X@rel
#endif

#ifdef __APPLE__
.section __TEXT,__eh_frame,coalesced,no_toc+strip_static_syms+live_support
EHFrame0:
#elif defined(X86_WIN32)
.section .eh_frame,"r"
#elif defined(HAVE_AS_X86_64_UNWIND_SECTION_TYPE)
.section .eh_frame,EH_FRAME_FLAGS,@unwind
#else
.section .eh_frame,EH_FRAME_FLAGS,@progbits
#endif
#ifndef __APPLE__
/* EH sections are already suitably aligned on Darwin.  */
	.balign 4
#endif

L(CIE):
	.set	L(set0),L(ECIE)-L(SCIE)
	.long	L(set0)			/* CIE Length */
L(SCIE):
	.long	0			/* CIE Identifier Tag */
	.byte	1			/* CIE Version */
	.ascii	"zR\0"			/* CIE Augmentation */
	.byte	1			/* CIE Code Alignment Factor */
	.byte	0x7c			/* CIE Data Alignment Factor */
	.byte	0x8			/* CIE RA Column */
	.byte	1			/* Augmentation size */
	.byte	ENC			/* FDE Encoding (pcrel abs/4byte) */
	.byte	0xc, SP, 4		/* DW_CFA_def_cfa, %esp offset 4 */
	.byte	0x80+8, 1		/* DW_CFA_offset, %eip offset 1*-4 */
	.balign 4
L(ECIE):

	.set	L(set1),L(EFDE1)-L(SFDE1)
	.long	L(set1)			/* FDE Length */
L(SFDE1):
	LEN(SFDE1, CIE)			/* FDE CIE offset */
	.long	PCREL(L(UW0))		/* Initial location */
	LEN(UW5, UW0)			/* Address range */
	.byte	0			/* Augmentation size */
	ADV(UW1, UW0)
	.byte	0xc, FP, 8		/* DW_CFA_def_cfa, %ebp 8 */
	.byte	0x80+FP, 2		/* DW_CFA_offset, %ebp 2*-4 */
	ADV(UW2, UW1)
	.byte	0x80+3, 0		/* DW_CFA_offset, %ebx 0*-4 */
	ADV(UW3, UW2)
	.byte	0xa			/* DW_CFA_remember_state */
	.byte	0xc, SP, 4		/* DW_CFA_def_cfa, %esp 4 */
	.byte	0xc0+3			/* DW_CFA_restore, %ebx */
	.byte	0xc0+FP			/* DW_CFA_restore, %ebp */
	ADV(UW4, UW3)
	.byte	0xb			/* DW_CFA_restore_state */
	.balign	4
L(EFDE1):

	.set	L(set2),L(EFDE2)-L(SFDE2)
	.long	L(set2)			/* FDE Length */
L(SFDE2):
	LEN(SFDE2, CIE)			/* FDE CIE offset */
	.long	PCREL(L(UW6))		/* Initial location */
	LEN(UW8,UW6)			/* Address range */
	.byte	0			/* Augmentation size */
	ADV(UW7, UW6)
	.byte	0xe, closure_FS+4	/* DW_CFA_def_cfa_offset */
	.balign	4
L(EFDE2):

	.set	L(set3),L(EFDE3)-L(SFDE3)
	.long	L(set3)			/* FDE Length */
L(SFDE3):
	LEN(SFDE3, CIE)			/* FDE CIE offset */
	.long	PCREL(L(UW9))		/* Initial location */
	LEN(UW11, UW9)			/* Address range */
	.byte	0			/* Augmentation size */
	ADV(UW10, UW9)
	.byte	0xe, closure_FS+4	/* DW_CFA_def_cfa_offset */
	.balign	4
L(EFDE3):

	.set	L(set4),L(EFDE4)-L(SFDE4)
	.long	L(set4)			/* FDE Length */
L(SFDE4):
	LEN(SFDE4, CIE)		/* FDE CIE offset */
	.long	PCREL(L(UW12))		/* Initial location */
	LEN(UW20, UW12)			/* Address range */
	.byte	0			/* Augmentation size */
	ADV(UW13, UW12)
	.byte	0xe, closure_FS+4	/* DW_CFA_def_cfa_offset */
#ifdef FFI_CLOSURE_CALL_INNER_SAVE_EBX
	ADV(UW14, UW13)
	.byte	0x80+3, (40-(closure_FS+4))/-4  /* DW_CFA_offset %ebx */
	ADV(UW15, UW14)
	.byte	0xc0+3			/* DW_CFA_restore %ebx */
	ADV(UW16, UW15)
#else
	ADV(UW16, UW13)
#endif
	.byte	0xe, 4			/* DW_CFA_def_cfa_offset */
	ADV(UW17, UW16)
	.byte	0xe, closure_FS+4	/* DW_CFA_def_cfa_offset */
	ADV(UW18, UW17)
	.byte	0xe, 4			/* DW_CFA_def_cfa_offset */
	ADV(UW19, UW18)
	.byte	0xe, closure_FS+4	/* DW_CFA_def_cfa_offset */
	.balign	4
L(EFDE4):

	.set	L(set5),L(EFDE5)-L(SFDE5)
	.long	L(set5)			/* FDE Length */
L(SFDE5):
	LEN(SFDE5, CIE)			/* FDE CIE offset */
	.long	PCREL(L(UW21))		/* Initial location */
	LEN(UW23, UW21)			/* Address range */
	.byte	0			/* Augmentation size */
	ADV(UW22, UW21)
	.byte	0xe, closure_FS+4	/* DW_CFA_def_cfa_offset */
	.balign	4
L(EFDE5):

	.set	L(set6),L(EFDE6)-L(SFDE6)
	.long	L(set6)			/* FDE Length */
L(SFDE6):
	LEN(SFDE6, CIE)			/* FDE CIE offset */
	.long	PCREL(L(UW24))		/* Initial location */
	LEN(UW26, UW24)			/* Address range */
	.byte	0			/* Augmentation size */
	.byte	0xe, 8			/* DW_CFA_def_cfa_offset */
	.byte	0x80+8, 2		/* DW_CFA_offset %eip, 2*-4 */
	ADV(UW25, UW24)
	.byte	0xe, closure_FS+4	/* DW_CFA_def_cfa_offset */
	.balign	4
L(EFDE6):

	.set	L(set7),L(EFDE7)-L(SFDE7)
	.long	L(set7)			/* FDE Length */
L(SFDE7):
	LEN(SFDE7, CIE)			/* FDE CIE offset */
	.long	PCREL(L(UW27))		/* Initial location */
	LEN(UW31, UW27)			/* Address range */
	.byte	0			/* Augmentation size */
	ADV(UW28, UW27)
	.byte	0xe, closure_FS+4	/* DW_CFA_def_cfa_offset */
#ifdef FFI_CLOSURE_CALL_INNER_SAVE_EBX
	ADV(UW29, UW28)
	.byte	0x80+3, (40-(closure_FS+4))/-4  /* DW_CFA_offset %ebx */
	ADV(UW30, UW29)
	.byte	0xc0+3			/* DW_CFA_restore %ebx */
#endif
	.balign	4
L(EFDE7):
#if !FFI_NO_RAW_API
	.set	L(set8),L(EFDE8)-L(SFDE8)
	.long	L(set8)			/* FDE Length */
L(SFDE8):
	LEN(SFDE8, CIE)			/* FDE CIE offset */
	.long	PCREL(L(UW32))		/* Initial location */
	LEN(UW40, UW32)			/* Address range */
	.byte	0			/* Augmentation size */
	ADV(UW33, UW32)
	.byte	0xe, raw_closure_S_FS+4	/* DW_CFA_def_cfa_offset */
	ADV(UW34, UW33)
	.byte	0x80+3, 2		/* DW_CFA_offset %ebx 2*-4 */
	ADV(UW35, UW34)
	.byte	0xc0+3			/* DW_CFA_restore %ebx */
	ADV(UW36, UW35)
	.byte	0xe, 4			/* DW_CFA_def_cfa_offset */
	ADV(UW37, UW36)
	.byte	0xe, raw_closure_S_FS+4	/* DW_CFA_def_cfa_offset */
	ADV(UW38, UW37)
	.byte	0xe, 4			/* DW_CFA_def_cfa_offset */
	ADV(UW39, UW38)
	.byte	0xe, raw_closure_S_FS+4	/* DW_CFA_def_cfa_offset */
	.balign	4
L(EFDE8):

	.set	L(set9),L(EFDE9)-L(SFDE9)
	.long	L(set9)			/* FDE Length */
L(SFDE9):
	LEN(SFDE9, CIE)			/* FDE CIE offset */
	.long	PCREL(L(UW41))		/* Initial location */
	LEN(UW52, UW41)			/* Address range */
	.byte	0			/* Augmentation size */
	ADV(UW42, UW41)
	.byte	0xe, 0			/* DW_CFA_def_cfa_offset */
	.byte	0x9, 8, 2		/* DW_CFA_register %eip, %edx */
	ADV(UW43, UW42)
	.byte	0xe, 4			/* DW_CFA_def_cfa_offset */
	ADV(UW44, UW43)
	.byte	0xe, 8			/* DW_CFA_def_cfa_offset */
	.byte	0x80+8, 2		/* DW_CFA_offset %eip 2*-4 */
	ADV(UW45, UW44)
	.byte	0xe, raw_closure_T_FS+8	/* DW_CFA_def_cfa_offset */
	ADV(UW46, UW45)
	.byte	0x80+3, 3		/* DW_CFA_offset %ebx 3*-4 */
	ADV(UW47, UW46)
	.byte	0xc0+3			/* DW_CFA_restore %ebx */
	ADV(UW48, UW47)
	.byte	0xe, 8			/* DW_CFA_def_cfa_offset */
	ADV(UW49, UW48)
	.byte	0xe, raw_closure_T_FS+8	/* DW_CFA_def_cfa_offset */
	ADV(UW50, UW49)
	.byte	0xe, 8			/* DW_CFA_def_cfa_offset */
	ADV(UW51, UW50)
	.byte	0xe, raw_closure_T_FS+8	/* DW_CFA_def_cfa_offset */
	.balign	4
L(EFDE9):
#endif /* !FFI_NO_RAW_API */

#ifdef _WIN32
	.def	 @feat.00;
	.scl	3;
	.type	0;
	.endef
	.globl	@feat.00
@feat.00 = 1
#endif

#if defined(__APPLE__)
    .subsections_via_symbols
# if defined(__ENVIRONMENT_MAC_OS_X_VERSION_MIN_REQUIRED__) &&		\
   __ENVIRONMENT_MAC_OS_X_VERSION_MIN_REQUIRED__ >= 1070 && __clang__
/* compact unwind is not used with GCC at present, was not present before 10.6
   but has some bugs there, so do not emit until 10.7.  */
    .section __LD,__compact_unwind,regular,debug

    /* compact unwind for ffi_call_i386 */
    .long    C(ffi_call_i386)
    .set     L1,L(UW5)-L(UW0)
    .long    L1
    .long    0x04000000 /* use dwarf unwind info */
    .long    0
    .long    0

    /* compact unwind for ffi_go_closure_EAX */
    .long    C(ffi_go_closure_EAX)
    .set     L2,L(UW8)-L(UW6)
    .long    L2
    .long    0x04000000 /* use dwarf unwind info */
    .long    0
    .long    0

    /* compact unwind for ffi_go_closure_ECX */
    .long    C(ffi_go_closure_ECX)
    .set     L3,L(UW11)-L(UW9)
    .long    L3
    .long    0x04000000 /* use dwarf unwind info */
    .long    0
    .long    0

    /* compact unwind for ffi_closure_i386 */
    .long    C(ffi_closure_i386)
    .set     L4,L(UW20)-L(UW12)
    .long    L4
    .long    0x04000000 /* use dwarf unwind info */
    .long    0
    .long    0

    /* compact unwind for ffi_go_closure_STDCALL */
    .long    C(ffi_go_closure_STDCALL)
    .set     L5,L(UW23)-L(UW21)
    .long    L5
    .long    0x04000000 /* use dwarf unwind info */
    .long    0
    .long    0

    /* compact unwind for ffi_closure_REGISTER */
    .long    C(ffi_closure_REGISTER)
    .set     L6,L(UW26)-L(UW24)
    .long    L6
    .long    0x04000000 /* use dwarf unwind info */
    .long    0
    .long    0

    /* compact unwind for ffi_closure_STDCALL */
    .long    C(ffi_closure_STDCALL)
    .set     L7,L(UW31)-L(UW27)
    .long    L7
    .long    0x04000000 /* use dwarf unwind info */
    .long    0
    .long    0

    /* compact unwind for ffi_closure_raw_SYSV */
    .long    C(ffi_closure_raw_SYSV)
    .set     L8,L(UW40)-L(UW32)
    .long    L8
    .long    0x04000000 /* use dwarf unwind info */
    .long    0
    .long    0

    /* compact unwind for ffi_closure_raw_THISCALL */
    .long    C(ffi_closure_raw_THISCALL)
    .set     L9,L(UW52)-L(UW41)
    .long    L9
    .long    0x04000000 /* use dwarf unwind info */
    .long    0
    .long    0
#endif /* use compact unwind */
#endif /* __APPLE__ */

#endif /* ifndef _MSC_VER */

#endif /* ifdef __i386__ */

#if defined __ELF__ && defined __linux__
	.section	.note.GNU-stack,"",@progbits
#endif
