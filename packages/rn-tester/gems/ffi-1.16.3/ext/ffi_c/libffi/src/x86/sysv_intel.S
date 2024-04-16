/* -----------------------------------------------------------------------
   sysv.S - Copyright (c) 2017, 2022  Anthony Green
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

#ifndef __x86_64__
#ifdef _MSC_VER

#define LIBFFI_ASM
#include <fficonfig.h>
#include <ffi.h>
#include <ffi_cfi.h>
#include "internal.h"

#define C2(X, Y)  X ## Y
#define C1(X, Y)  C2(X, Y)
#define L(X)     C1(L, X)
# define ENDF(X) X ENDP

/* This macro allows the safe creation of jump tables without an
   actual table.  The entry points into the table are all 8 bytes.
   The use of ORG asserts that we're at the correct location.  */
/* ??? The clang assembler doesn't handle .org with symbolic expressions.  */
#if defined(__clang__) || defined(__APPLE__) || (defined (__sun__) && defined(__svr4__))
# define E(BASE, X)	ALIGN 8
#else
# define E(BASE, X)	ALIGN 8; ORG BASE + X * 8
#endif

    .686P
    .MODEL FLAT

EXTRN	@ffi_closure_inner@8:PROC
_TEXT SEGMENT

/* This is declared as

   void ffi_call_i386(struct call_frame *frame, char *argp)
        __attribute__((fastcall));

   Thus the arguments are present in

        ecx: frame
        edx: argp
*/

ALIGN 16
PUBLIC @ffi_call_i386@8
@ffi_call_i386@8 PROC
L(UW0):
	cfi_startproc
 #if !HAVE_FASTCALL
	mov	    ecx, [esp+4]
	mov 	edx, [esp+8]
 #endif
	mov	    eax, [esp]		/* move the return address */
	mov	    [ecx], ebp		/* store ebp into local frame */
	mov 	[ecx+4], eax	/* store retaddr into local frame */

	/* New stack frame based off ebp.  This is a itty bit of unwind
	   trickery in that the CFA *has* changed.  There is no easy way
	   to describe it correctly on entry to the function.  Fortunately,
	   it doesn't matter too much since at all points we can correctly
	   unwind back to ffi_call.  Note that the location to which we
	   moved the return address is (the new) CFA-4, so from the
	   perspective of the unwind info, it hasn't moved.  */
	mov 	ebp, ecx
L(UW1):
	/* cfi_def_cfa(%ebp, 8) */
	/* cfi_rel_offset(%ebp, 0) */

	mov 	esp, edx		/* set outgoing argument stack */
	mov 	eax, [20+R_EAX*4+ebp]	/* set register arguments */
	mov 	edx, [20+R_EDX*4+ebp]
	mov	    ecx, [20+R_ECX*4+ebp]

	call	dword ptr [ebp+8]

	mov	    ecx, [12+ebp]		/* load return type code */
	mov 	[ebp+8], ebx		/* preserve %ebx */
L(UW2):
	/* cfi_rel_offset(%ebx, 8) */

	and 	ecx, X86_RET_TYPE_MASK
	lea 	ebx, [L(store_table) + ecx * 8]
	mov 	ecx, [ebp+16]		/* load result address */
	jmp	    ebx

	ALIGN	8
L(store_table):
E(L(store_table), X86_RET_FLOAT)
	fstp	DWORD PTR [ecx]
	jmp	L(e1)
E(L(store_table), X86_RET_DOUBLE)
	fstp	QWORD PTR [ecx]
	jmp	L(e1)
E(L(store_table), X86_RET_LDOUBLE)
	fstp	QWORD PTR [ecx]
	jmp	L(e1)
E(L(store_table), X86_RET_SINT8)
	movsx	eax, al
	mov	[ecx], eax
	jmp	L(e1)
E(L(store_table), X86_RET_SINT16)
	movsx	eax, ax
	mov	[ecx], eax
	jmp	L(e1)
E(L(store_table), X86_RET_UINT8)
	movzx	eax, al
	mov	[ecx], eax
	jmp	L(e1)
E(L(store_table), X86_RET_UINT16)
	movzx	eax, ax
	mov	[ecx], eax
	jmp	L(e1)
E(L(store_table), X86_RET_INT64)
	mov	[ecx+4], edx
	/* fallthru */
E(L(store_table), X86_RET_int 32)
	mov	[ecx], eax
	/* fallthru */
E(L(store_table), X86_RET_VOID)
L(e1):
	mov	    ebx, [ebp+8]
	mov	    esp, ebp
	pop 	ebp
L(UW3):
	/* cfi_remember_state */
	/* cfi_def_cfa(%esp, 4) */
	/* cfi_restore(%ebx) */
	/* cfi_restore(%ebp) */
	ret
L(UW4):
	/* cfi_restore_state */

E(L(store_table), X86_RET_STRUCTPOP)
	jmp	    L(e1)
E(L(store_table), X86_RET_STRUCTARG)
	jmp	    L(e1)
E(L(store_table), X86_RET_STRUCT_1B)
	mov 	[ecx], al
	jmp	    L(e1)
E(L(store_table), X86_RET_STRUCT_2B)
	mov 	[ecx], ax
	jmp	    L(e1)

	/* Fill out the table so that bad values are predictable.  */
E(L(store_table), X86_RET_UNUSED14)
	int 3
E(L(store_table), X86_RET_UNUSED15)
	int 3

L(UW5):
	/* cfi_endproc */
ENDF(@ffi_call_i386@8)

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

FFI_CLOSURE_SAVE_REGS MACRO
	mov 	[esp + closure_CF+16+R_EAX*4], eax
	mov 	[esp + closure_CF+16+R_EDX*4], edx
	mov 	[esp + closure_CF+16+R_ECX*4], ecx
ENDM

FFI_CLOSURE_COPY_TRAMP_DATA MACRO
	mov 	edx, [eax+FFI_TRAMPOLINE_SIZE]      /* copy cif */
	mov 	ecx, [eax+FFI_TRAMPOLINE_SIZE+4]    /* copy fun */
	mov 	eax, [eax+FFI_TRAMPOLINE_SIZE+8];   /* copy user_data */
	mov 	[esp+closure_CF+28], edx
	mov 	[esp+closure_CF+32], ecx
	mov 	[esp+closure_CF+36], eax
ENDM

#if HAVE_FASTCALL
FFI_CLOSURE_PREP_CALL MACRO
	mov	    ecx, esp                    /* load closure_data */
	lea 	edx, [esp+closure_FS+4]     /* load incoming stack */
ENDM
#else
FFI_CLOSURE_PREP_CALL MACRO
	lea 	ecx, [esp+closure_CF]       /* load closure_data */
	lea 	edx, [esp+closure_FS+4]     /* load incoming stack */
	mov 	[esp], ecx
	mov 	[esp+4], edx
ENDM
#endif

FFI_CLOSURE_CALL_INNER MACRO UWN
	call	@ffi_closure_inner@8
ENDM

FFI_CLOSURE_MASK_AND_JUMP MACRO LABEL
	and	    eax, X86_RET_TYPE_MASK
	lea 	edx, [LABEL+eax*8]
	mov 	eax, [esp+closure_CF]       /* optimiztic load */
	jmp	    edx
ENDM

ALIGN 16
PUBLIC ffi_go_closure_EAX
ffi_go_closure_EAX PROC C
L(UW6):
	/* cfi_startproc */
	sub	esp, closure_FS
L(UW7):
	/* cfi_def_cfa_offset(closure_FS + 4) */
	FFI_CLOSURE_SAVE_REGS
	mov     edx, [eax+4]			/* copy cif */
	mov 	ecx, [eax +8]			/* copy fun */
	mov 	[esp+closure_CF+28], edx
	mov 	[esp+closure_CF+32], ecx
	mov 	[esp+closure_CF+36], eax	/* closure is user_data */
	jmp	L(do_closure_i386)
L(UW8):
	/* cfi_endproc */
ENDF(ffi_go_closure_EAX)

ALIGN 16
PUBLIC ffi_go_closure_ECX
ffi_go_closure_ECX PROC C
L(UW9):
	/* cfi_startproc */
	sub 	esp, closure_FS
L(UW10):
	/* cfi_def_cfa_offset(closure_FS + 4) */
	FFI_CLOSURE_SAVE_REGS
	mov 	edx, [ecx+4]			/* copy cif */
	mov 	eax, [ecx+8]			/* copy fun */
	mov 	[esp+closure_CF+28], edx
	mov 	[esp+closure_CF+32], eax
	mov 	[esp+closure_CF+36], ecx	/* closure is user_data */
	jmp	L(do_closure_i386)
L(UW11):
	/* cfi_endproc */
ENDF(ffi_go_closure_ECX)

/* The closure entry points are reached from the ffi_closure trampoline.
   On entry, %eax contains the address of the ffi_closure.  */

ALIGN 16
PUBLIC ffi_closure_i386
ffi_closure_i386 PROC C
L(UW12):
	/* cfi_startproc */
	sub	    esp, closure_FS
L(UW13):
	/* cfi_def_cfa_offset(closure_FS + 4) */

	FFI_CLOSURE_SAVE_REGS
	FFI_CLOSURE_COPY_TRAMP_DATA

	/* Entry point from preceeding Go closures.  */
L(do_closure_i386)::

	FFI_CLOSURE_PREP_CALL
	FFI_CLOSURE_CALL_INNER(14)
	FFI_CLOSURE_MASK_AND_JUMP L(C1(load_table,2))

    ALIGN 8
L(load_table2):
E(L(load_table2), X86_RET_FLOAT)
	fld 	dword ptr [esp+closure_CF]
	jmp	L(e2)
E(L(load_table2), X86_RET_DOUBLE)
	fld 	qword ptr [esp+closure_CF]
	jmp	L(e2)
E(L(load_table2), X86_RET_LDOUBLE)
	fld 	qword ptr [esp+closure_CF]
	jmp	L(e2)
E(L(load_table2), X86_RET_SINT8)
	movsx	eax, al
	jmp	L(e2)
E(L(load_table2), X86_RET_SINT16)
	movsx	eax, ax
	jmp	L(e2)
E(L(load_table2), X86_RET_UINT8)
	movzx	eax, al
	jmp	L(e2)
E(L(load_table2), X86_RET_UINT16)
	movzx	eax, ax
	jmp	L(e2)
E(L(load_table2), X86_RET_INT64)
	mov 	edx, [esp+closure_CF+4]
	jmp	L(e2)
E(L(load_table2), X86_RET_INT32)
	nop
	/* fallthru */
E(L(load_table2), X86_RET_VOID)
L(e2):
	add 	esp, closure_FS
L(UW16):
	/* cfi_adjust_cfa_offset(-closure_FS) */
	ret
L(UW17):
	/* cfi_adjust_cfa_offset(closure_FS) */
E(L(load_table2), X86_RET_STRUCTPOP)
	add 	esp, closure_FS
L(UW18):
	/* cfi_adjust_cfa_offset(-closure_FS) */
	ret	4
L(UW19):
	/* cfi_adjust_cfa_offset(closure_FS) */
E(L(load_table2), X86_RET_STRUCTARG)
	jmp	L(e2)
E(L(load_table2), X86_RET_STRUCT_1B)
	movzx	eax, al
	jmp	L(e2)
E(L(load_table2), X86_RET_STRUCT_2B)
	movzx	eax, ax
	jmp	L(e2)

	/* Fill out the table so that bad values are predictable.  */
E(L(load_table2), X86_RET_UNUSED14)
	int 3
E(L(load_table2), X86_RET_UNUSED15)
	int 3

L(UW20):
	/* cfi_endproc */
ENDF(ffi_closure_i386)

ALIGN 16
PUBLIC	ffi_go_closure_STDCALL
ffi_go_closure_STDCALL PROC C
L(UW21):
	/* cfi_startproc */
	sub 	esp, closure_FS
L(UW22):
	/* cfi_def_cfa_offset(closure_FS + 4) */
	FFI_CLOSURE_SAVE_REGS
	mov 	edx, [ecx+4]			/* copy cif */
	mov 	eax, [ecx+8]			/* copy fun */
	mov 	[esp+closure_CF+28], edx
	mov 	[esp+closure_CF+32], eax
	mov 	[esp+closure_CF+36], ecx	/* closure is user_data */
	jmp	L(do_closure_STDCALL)
L(UW23):
	/* cfi_endproc */
ENDF(ffi_go_closure_STDCALL)

/* For REGISTER, we have no available parameter registers, and so we
   enter here having pushed the closure onto the stack.  */

ALIGN 16
PUBLIC ffi_closure_REGISTER
ffi_closure_REGISTER PROC C
L(UW24):
	/* cfi_startproc */
	/* cfi_def_cfa(%esp, 8) */
	/* cfi_offset(%eip, -8) */
	sub 	esp, closure_FS-4
L(UW25):
	/* cfi_def_cfa_offset(closure_FS + 4) */
	FFI_CLOSURE_SAVE_REGS
	mov	ecx, [esp+closure_FS-4] 	/* load retaddr */
	mov	eax, [esp+closure_FS]		/* load closure */
	mov	[esp+closure_FS], ecx		/* move retaddr */
	jmp	L(do_closure_REGISTER)
L(UW26):
	/* cfi_endproc */
ENDF(ffi_closure_REGISTER)

/* For STDCALL (and others), we need to pop N bytes of arguments off
   the stack following the closure.  The amount needing to be popped
   is returned to us from ffi_closure_inner.  */

ALIGN 16
PUBLIC ffi_closure_STDCALL
ffi_closure_STDCALL PROC C
L(UW27):
	/* cfi_startproc */
	sub 	esp, closure_FS
L(UW28):
	/* cfi_def_cfa_offset(closure_FS + 4) */

	FFI_CLOSURE_SAVE_REGS

	/* Entry point from ffi_closure_REGISTER.  */
L(do_closure_REGISTER)::

	FFI_CLOSURE_COPY_TRAMP_DATA

	/* Entry point from preceeding Go closure.  */
L(do_closure_STDCALL)::

	FFI_CLOSURE_PREP_CALL
	FFI_CLOSURE_CALL_INNER(29)

	mov 	ecx, eax
	shr 	ecx, X86_RET_POP_SHIFT	    /* isolate pop count */
	lea 	ecx, [esp+closure_FS+ecx]	/* compute popped esp */
	mov 	edx, [esp+closure_FS]		/* move return address */
	mov 	[ecx], edx

	/* From this point on, the value of %esp upon return is %ecx+4,
	   and we've copied the return address to %ecx to make return easy.
	   There's no point in representing this in the unwind info, as
	   there is always a window between the mov and the ret which
	   will be wrong from one point of view or another.  */

	FFI_CLOSURE_MASK_AND_JUMP  L(C1(load_table,3))

    ALIGN 8
L(load_table3):
E(L(load_table3), X86_RET_FLOAT)
	fld    DWORD PTR [esp+closure_CF]
	mov     esp, ecx
	ret
E(L(load_table3), X86_RET_DOUBLE)
	fld    QWORD PTR [esp+closure_CF]
	mov     esp, ecx
	ret
E(L(load_table3), X86_RET_LDOUBLE)
	fld    QWORD PTR [esp+closure_CF]
	mov     esp, ecx
	ret
E(L(load_table3), X86_RET_SINT8)
	movsx   eax, al
	mov     esp, ecx
	ret
E(L(load_table3), X86_RET_SINT16)
	movsx   eax, ax
	mov     esp, ecx
	ret
E(L(load_table3), X86_RET_UINT8)
	movzx   eax, al
	mov     esp, ecx
	ret
E(L(load_table3), X86_RET_UINT16)
	movzx   eax, ax
	mov     esp, ecx
	ret
E(L(load_table3), X86_RET_INT64)
	mov 	edx, [esp+closure_CF+4]
	mov     esp, ecx
	ret
E(L(load_table3), X86_RET_int 32)
	mov     esp, ecx
	ret
E(L(load_table3), X86_RET_VOID)
	mov     esp, ecx
	ret
E(L(load_table3), X86_RET_STRUCTPOP)
	mov     esp, ecx
	ret
E(L(load_table3), X86_RET_STRUCTARG)
	mov 	esp, ecx
	ret
E(L(load_table3), X86_RET_STRUCT_1B)
	movzx	eax, al
	mov 	esp, ecx
	ret
E(L(load_table3), X86_RET_STRUCT_2B)
	movzx	eax, ax
	mov 	esp, ecx
	ret

	/* Fill out the table so that bad values are predictable.  */
E(L(load_table3), X86_RET_UNUSED14)
	int 3
E(L(load_table3), X86_RET_UNUSED15)
	int 3

L(UW31):
	/* cfi_endproc */
ENDF(ffi_closure_STDCALL)

#if !FFI_NO_RAW_API

#define raw_closure_S_FS	(16+16+12)

ALIGN 16
PUBLIC ffi_closure_raw_SYSV
ffi_closure_raw_SYSV PROC C
L(UW32):
	/* cfi_startproc */
	sub 	esp, raw_closure_S_FS
L(UW33):
	/* cfi_def_cfa_offset(raw_closure_S_FS + 4) */
	mov 	[esp+raw_closure_S_FS-4], ebx
L(UW34):
	/* cfi_rel_offset(%ebx, raw_closure_S_FS-4) */

	mov 	edx, [eax+FFI_TRAMPOLINE_SIZE+8]	/* load cl->user_data */
	mov 	[esp+12], edx
	lea 	edx, [esp+raw_closure_S_FS+4]		/* load raw_args */
	mov 	[esp+8], edx
	lea 	edx, [esp+16]				/* load &res */
	mov 	[esp+4], edx
	mov 	ebx, [eax+FFI_TRAMPOLINE_SIZE]		/* load cl->cif */
	mov 	[esp], ebx
	call	DWORD PTR [eax+FFI_TRAMPOLINE_SIZE+4]		/* call cl->fun */

	mov 	eax, [ebx+20]			/* load cif->flags */
	and 	eax, X86_RET_TYPE_MASK
/* #ifdef __PIC__ */
/* 	call	__x86.get_pc_thunk.bx */
/* L(pc4): */
/* 	lea 	ecx, L(load_table4)-L(pc4)(%ebx, %eax, 8), %ecx */
/* #else */
	lea 	ecx, [L(load_table4)+eax+8]
/* #endif */
	mov 	ebx, [esp+raw_closure_S_FS-4]
L(UW35):
	/* cfi_restore(%ebx) */
	mov 	eax, [esp+16]				/* Optimistic load */
	jmp	    dword ptr [ecx]

	ALIGN 8
L(load_table4):
E(L(load_table4), X86_RET_FLOAT)
	fld 	DWORD PTR [esp +16]
	jmp	L(e4)
E(L(load_table4), X86_RET_DOUBLE)
	fld 	QWORD PTR [esp +16]
	jmp	L(e4)
E(L(load_table4), X86_RET_LDOUBLE)
	fld 	QWORD PTR [esp +16]
	jmp	L(e4)
E(L(load_table4), X86_RET_SINT8)
	movsx	eax, al
	jmp	L(e4)
E(L(load_table4), X86_RET_SINT16)
	movsx	eax, ax
	jmp	L(e4)
E(L(load_table4), X86_RET_UINT8)
	movzx	eax, al
	jmp	L(e4)
E(L(load_table4), X86_RET_UINT16)
	movzx	eax, ax
	jmp	L(e4)
E(L(load_table4), X86_RET_INT64)
	mov 	edx, [esp+16+4]
	jmp	L(e4)
E(L(load_table4), X86_RET_int 32)
	nop
	/* fallthru */
E(L(load_table4), X86_RET_VOID)
L(e4):
	add 	esp, raw_closure_S_FS
L(UW36):
	/* cfi_adjust_cfa_offset(-raw_closure_S_FS) */
	ret
L(UW37):
	/* cfi_adjust_cfa_offset(raw_closure_S_FS) */
E(L(load_table4), X86_RET_STRUCTPOP)
	add 	esp, raw_closure_S_FS
L(UW38):
	/* cfi_adjust_cfa_offset(-raw_closure_S_FS) */
	ret	4
L(UW39):
	/* cfi_adjust_cfa_offset(raw_closure_S_FS) */
E(L(load_table4), X86_RET_STRUCTARG)
	jmp	L(e4)
E(L(load_table4), X86_RET_STRUCT_1B)
	movzx	eax, al
	jmp	L(e4)
E(L(load_table4), X86_RET_STRUCT_2B)
	movzx	eax, ax
	jmp	L(e4)

	/* Fill out the table so that bad values are predictable.  */
E(L(load_table4), X86_RET_UNUSED14)
	int 3
E(L(load_table4), X86_RET_UNUSED15)
	int 3

L(UW40):
	/* cfi_endproc */
ENDF(ffi_closure_raw_SYSV)

#define raw_closure_T_FS	(16+16+8)

ALIGN 16
PUBLIC ffi_closure_raw_THISCALL
ffi_closure_raw_THISCALL PROC C
L(UW41):
	/* cfi_startproc */
	/* Rearrange the stack such that %ecx is the first argument.
	   This means moving the return address.  */
	pop 	edx
L(UW42):
	/* cfi_def_cfa_offset(0) */
	/* cfi_register(%eip, %edx) */
	push	ecx
L(UW43):
	/* cfi_adjust_cfa_offset(4) */
	push 	edx
L(UW44):
	/* cfi_adjust_cfa_offset(4) */
	/* cfi_rel_offset(%eip, 0) */
	sub 	esp, raw_closure_T_FS
L(UW45):
	/* cfi_adjust_cfa_offset(raw_closure_T_FS) */
	mov 	[esp+raw_closure_T_FS-4], ebx
L(UW46):
	/* cfi_rel_offset(%ebx, raw_closure_T_FS-4) */

	mov 	edx, [eax+FFI_TRAMPOLINE_SIZE+8]	/* load cl->user_data */
	mov 	[esp+12], edx
	lea 	edx, [esp+raw_closure_T_FS+4]		/* load raw_args */
	mov 	[esp+8], edx
	lea 	edx, [esp+16]				/* load &res */
	mov 	[esp+4], edx
	mov 	ebx, [eax+FFI_TRAMPOLINE_SIZE]		/* load cl->cif */
	mov 	[esp], ebx
	call	DWORD PTR [eax+FFI_TRAMPOLINE_SIZE+4]		/* call cl->fun */

	mov 	eax, [ebx+20]				/* load cif->flags */
	and 	eax, X86_RET_TYPE_MASK
/* #ifdef __PIC__ */
/* 	call	__x86.get_pc_thunk.bx */
/* L(pc5): */
/* 	leal	L(load_table5)-L(pc5)(%ebx, %eax, 8), %ecx */
/* #else */
	lea 	ecx, [L(load_table5)+eax*8]
/*#endif */
	mov 	ebx, [esp+raw_closure_T_FS-4]
L(UW47):
	/* cfi_restore(%ebx) */
	mov 	eax, [esp+16]				/* Optimistic load */
	jmp	    DWORD PTR [ecx]

	AlIGN 4
L(load_table5):
E(L(load_table5), X86_RET_FLOAT)
	fld	DWORD PTR [esp +16]
	jmp	L(e5)
E(L(load_table5), X86_RET_DOUBLE)
	fld	QWORD PTR [esp +16]
	jmp	L(e5)
E(L(load_table5), X86_RET_LDOUBLE)
	fld	QWORD PTR [esp+16]
	jmp	L(e5)
E(L(load_table5), X86_RET_SINT8)
	movsx	eax, al
	jmp	L(e5)
E(L(load_table5), X86_RET_SINT16)
	movsx	eax, ax
	jmp	L(e5)
E(L(load_table5), X86_RET_UINT8)
	movzx	eax, al
	jmp	L(e5)
E(L(load_table5), X86_RET_UINT16)
	movzx	eax, ax
	jmp	L(e5)
E(L(load_table5), X86_RET_INT64)
	mov 	edx, [esp+16+4]
	jmp	L(e5)
E(L(load_table5), X86_RET_int 32)
	nop
	/* fallthru */
E(L(load_table5), X86_RET_VOID)
L(e5):
	add 	esp, raw_closure_T_FS
L(UW48):
	/* cfi_adjust_cfa_offset(-raw_closure_T_FS) */
	/* Remove the extra %ecx argument we pushed.  */
	ret	4
L(UW49):
	/* cfi_adjust_cfa_offset(raw_closure_T_FS) */
E(L(load_table5), X86_RET_STRUCTPOP)
	add 	esp, raw_closure_T_FS
L(UW50):
	/* cfi_adjust_cfa_offset(-raw_closure_T_FS) */
	ret	8
L(UW51):
	/* cfi_adjust_cfa_offset(raw_closure_T_FS) */
E(L(load_table5), X86_RET_STRUCTARG)
	jmp	L(e5)
E(L(load_table5), X86_RET_STRUCT_1B)
	movzx	eax, al
	jmp	L(e5)
E(L(load_table5), X86_RET_STRUCT_2B)
	movzx	eax, ax
	jmp	L(e5)

	/* Fill out the table so that bad values are predictable.  */
E(L(load_table5), X86_RET_UNUSED14)
	int 3
E(L(load_table5), X86_RET_UNUSED15)
	int 3

L(UW52):
	/* cfi_endproc */
ENDF(ffi_closure_raw_THISCALL)

#endif /* !FFI_NO_RAW_API */

#ifdef X86_DARWIN
# define COMDAT(X)							\
        .section __TEXT,__text,coalesced,pure_instructions;		\
        .weak_definition X;						\
        FFI_HIDDEN(X)
#elif defined __ELF__ && !(defined(__sun__) && defined(__svr4__))
# define COMDAT(X)							\
	.section .text.X,"axG",@progbits,X,comdat;			\
	PUBLIC	X;							\
	FFI_HIDDEN(X)
#else
# define COMDAT(X)
#endif

#if 0
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
#endif


#if 0
/* Sadly, OSX cctools-as doesn't understand .cfi directives at all.  */

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

#ifdef HAVE_AS_X86_PCREL
# define PCREL(X)	X - .
#else
# define PCREL(X)	X@rel
#endif

/* Simplify advancing between labels.  Assume DW_CFA_advance_loc1 fits.  */
#define ADV(N, P)	.byte 2, L(N)-L(P)

	.balign 4
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
	.byte	0x1b			/* FDE Encoding (pcrel sdata4) */
	.byte	0xc, 4, 4		/* DW_CFA_def_cfa, %esp offset 4 */
	.byte	0x80+8, 1		/* DW_CFA_offset, %eip offset 1*-4 */
	.balign 4
L(ECIE):

	.set	L(set1),L(EFDE1)-L(SFDE1)
	.long	L(set1)			/* FDE Length */
L(SFDE1):
	.long	L(SFDE1)-L(CIE)		/* FDE CIE offset */
	.long	PCREL(L(UW0))		/* Initial location */
	.long	L(UW5)-L(UW0)		/* Address range */
	.byte	0			/* Augmentation size */
	ADV(UW1, UW0)
	.byte	0xc, 5, 8		/* DW_CFA_def_cfa, %ebp 8 */
	.byte	0x80+5, 2		/* DW_CFA_offset, %ebp 2*-4 */
	ADV(UW2, UW1)
	.byte	0x80+3, 0		/* DW_CFA_offset, %ebx 0*-4 */
	ADV(UW3, UW2)
	.byte	0xa			/* DW_CFA_remember_state */
	.byte	0xc, 4, 4		/* DW_CFA_def_cfa, %esp 4 */
	.byte	0xc0+3			/* DW_CFA_restore, %ebx */
	.byte	0xc0+5			/* DW_CFA_restore, %ebp */
	ADV(UW4, UW3)
	.byte	0xb			/* DW_CFA_restore_state */
	.balign	4
L(EFDE1):

	.set	L(set2),L(EFDE2)-L(SFDE2)
	.long	L(set2)			/* FDE Length */
L(SFDE2):
	.long	L(SFDE2)-L(CIE)		/* FDE CIE offset */
	.long	PCREL(L(UW6))		/* Initial location */
	.long	L(UW8)-L(UW6)		/* Address range */
	.byte	0			/* Augmentation size */
	ADV(UW7, UW6)
	.byte	0xe, closure_FS+4	/* DW_CFA_def_cfa_offset */
	.balign	4
L(EFDE2):

	.set	L(set3),L(EFDE3)-L(SFDE3)
	.long	L(set3)			/* FDE Length */
L(SFDE3):
	.long	L(SFDE3)-L(CIE)		/* FDE CIE offset */
	.long	PCREL(L(UW9))		/* Initial location */
	.long	L(UW11)-L(UW9)		/* Address range */
	.byte	0			/* Augmentation size */
	ADV(UW10, UW9)
	.byte	0xe, closure_FS+4	/* DW_CFA_def_cfa_offset */
	.balign	4
L(EFDE3):

	.set	L(set4),L(EFDE4)-L(SFDE4)
	.long	L(set4)			/* FDE Length */
L(SFDE4):
	.long	L(SFDE4)-L(CIE)		/* FDE CIE offset */
	.long	PCREL(L(UW12))		/* Initial location */
	.long	L(UW20)-L(UW12)		/* Address range */
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
	.long	L(SFDE5)-L(CIE)		/* FDE CIE offset */
	.long	PCREL(L(UW21))		/* Initial location */
	.long	L(UW23)-L(UW21)		/* Address range */
	.byte	0			/* Augmentation size */
	ADV(UW22, UW21)
	.byte	0xe, closure_FS+4	/* DW_CFA_def_cfa_offset */
	.balign	4
L(EFDE5):

	.set	L(set6),L(EFDE6)-L(SFDE6)
	.long	L(set6)			/* FDE Length */
L(SFDE6):
	.long	L(SFDE6)-L(CIE)		/* FDE CIE offset */
	.long	PCREL(L(UW24))		/* Initial location */
	.long	L(UW26)-L(UW24)		/* Address range */
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
	.long	L(SFDE7)-L(CIE)		/* FDE CIE offset */
	.long	PCREL(L(UW27))		/* Initial location */
	.long	L(UW31)-L(UW27)		/* Address range */
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
	.long	L(SFDE8)-L(CIE)		/* FDE CIE offset */
	.long	PCREL(L(UW32))		/* Initial location */
	.long	L(UW40)-L(UW32)		/* Address range */
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
	.long	L(SFDE9)-L(CIE)		/* FDE CIE offset */
	.long	PCREL(L(UW41))		/* Initial location */
	.long	L(UW52)-L(UW41)		/* Address range */
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
	PUBLIC	@feat.00
@feat.00 = 1
#endif

#endif /* ifndef _MSC_VER */
#endif /* ifndef __x86_64__ */

#if defined __ELF__ && defined __linux__
	.section	.note.GNU-stack,"",@progbits
#endif
#endif

END
