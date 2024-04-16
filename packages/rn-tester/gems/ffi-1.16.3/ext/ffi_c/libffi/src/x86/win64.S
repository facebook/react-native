#ifdef __x86_64__
#define LIBFFI_ASM
#include <fficonfig.h>
#include <ffi.h>
#include <ffi_cfi.h>
#include "asmnames.h"

#if defined(HAVE_AS_CFI_PSEUDO_OP)
        .cfi_sections   .debug_frame
#endif

#ifdef X86_WIN64
#define SEH(...) __VA_ARGS__
#define arg0	%rcx
#define arg1	%rdx
#define arg2	%r8
#define arg3	%r9
#else
#define SEH(...)
#define arg0	%rdi
#define arg1	%rsi
#define arg2	%rdx
#define arg3	%rcx
#endif

/* This macro allows the safe creation of jump tables without an
   actual table.  The entry points into the table are all 8 bytes.
   The use of ORG asserts that we're at the correct location.  */
/* ??? The clang assembler doesn't handle .org with symbolic expressions.  */
#if defined(__clang__) || defined(__APPLE__) || (defined (__sun__) && defined(__svr4__))
# define E(BASE, X)	.balign 8
#else
# define E(BASE, X)	.balign 8; .org BASE + (X) * 8
#endif

	.text

/* ffi_call_win64 (void *stack, struct win64_call_frame *frame, void *r10)

   Bit o trickiness here -- FRAME is the base of the stack frame
   for this function.  This has been allocated by ffi_call.  We also
   deallocate some of the stack that has been alloca'd.  */

	.align	8
	.globl	C(ffi_call_win64)
	FFI_HIDDEN(C(ffi_call_win64))

	SEH(.seh_proc ffi_call_win64)
C(ffi_call_win64):
	cfi_startproc
	_CET_ENDBR
	/* Set up the local stack frame and install it in rbp/rsp.  */
	movq	(%rsp), %rax
	movq	%rbp, (arg1)
	movq	%rax, 8(arg1)
	movq	arg1, %rbp
	cfi_def_cfa(%rbp, 16)
	cfi_rel_offset(%rbp, 0)
	SEH(.seh_pushreg %rbp)
	SEH(.seh_setframe %rbp, 0)
	SEH(.seh_endprologue)
	movq	arg0, %rsp

	movq	arg2, %r10

	/* Load all slots into both general and xmm registers.  */
	movq	(%rsp), %rcx
	movsd	(%rsp), %xmm0
	movq	8(%rsp), %rdx
	movsd	8(%rsp), %xmm1
	movq	16(%rsp), %r8
	movsd	16(%rsp), %xmm2
	movq	24(%rsp), %r9
	movsd	24(%rsp), %xmm3

	call	*16(%rbp)

	movl	24(%rbp), %ecx
	movq	32(%rbp), %r8
	leaq	0f(%rip), %r10
	cmpl	$FFI_TYPE_SMALL_STRUCT_4B, %ecx
	leaq	(%r10, %rcx, 8), %r10
	ja	99f
	_CET_NOTRACK jmp *%r10

/* Below, we're space constrained most of the time.  Thus we eschew the
   modern "mov, pop, ret" sequence (5 bytes) for "leave, ret" (2 bytes).  */
#define epilogue		\
	leaveq;			\
	cfi_remember_state;	\
	cfi_def_cfa(%rsp, 8);	\
	cfi_restore(%rbp);	\
	ret;			\
	cfi_restore_state

	.align	8
0:
E(0b, FFI_TYPE_VOID)
	epilogue
E(0b, FFI_TYPE_INT)
	movslq	%eax, %rax
	movq	%rax, (%r8)
	epilogue
E(0b, FFI_TYPE_FLOAT)
	movss	%xmm0, (%r8)
	epilogue
E(0b, FFI_TYPE_DOUBLE)
	movsd	%xmm0, (%r8)
	epilogue
// FFI_TYPE_LONGDOUBLE may be FFI_TYPE_DOUBLE but we need a different value here.
E(0b, FFI_TYPE_DOUBLE + 1)
	call	PLT(C(abort))
E(0b, FFI_TYPE_UINT8)
	movzbl	%al, %eax
	movq	%rax, (%r8)
	epilogue
E(0b, FFI_TYPE_SINT8)
	movsbq	%al, %rax
	jmp	98f
E(0b, FFI_TYPE_UINT16)
	movzwl	%ax, %eax
	movq	%rax, (%r8)
	epilogue
E(0b, FFI_TYPE_SINT16)
	movswq	%ax, %rax
	jmp	98f
E(0b, FFI_TYPE_UINT32)
	movl	%eax, %eax
	movq	%rax, (%r8)
	epilogue
E(0b, FFI_TYPE_SINT32)
	movslq	%eax, %rax
	movq	%rax, (%r8)
	epilogue
E(0b, FFI_TYPE_UINT64)
98:	movq	%rax, (%r8)
	epilogue
E(0b, FFI_TYPE_SINT64)
	movq	%rax, (%r8)
	epilogue
E(0b, FFI_TYPE_STRUCT)
	epilogue
E(0b, FFI_TYPE_POINTER)
	movq	%rax, (%r8)
	epilogue
E(0b, FFI_TYPE_COMPLEX)
	call	PLT(C(abort))
E(0b, FFI_TYPE_SMALL_STRUCT_1B)
	movb	%al, (%r8)
	epilogue
E(0b, FFI_TYPE_SMALL_STRUCT_2B)
	movw	%ax, (%r8)
	epilogue
E(0b, FFI_TYPE_SMALL_STRUCT_4B)
	movl	%eax, (%r8)
	epilogue

	.align	8
99:	call	PLT(C(abort))

	epilogue

	cfi_endproc
	SEH(.seh_endproc)


/* 32 bytes of outgoing register stack space, 8 bytes of alignment,
   16 bytes of result, 32 bytes of xmm registers.  */
#define ffi_clo_FS	(32+8+16+32)
#define ffi_clo_OFF_R	(32+8)
#define ffi_clo_OFF_X	(32+8+16)

	.align	8
	.globl	C(ffi_go_closure_win64)
	FFI_HIDDEN(C(ffi_go_closure_win64))

	SEH(.seh_proc ffi_go_closure_win64)
C(ffi_go_closure_win64):
	cfi_startproc
	_CET_ENDBR
	/* Save all integer arguments into the incoming reg stack space.  */
	movq	%rcx, 8(%rsp)
	movq	%rdx, 16(%rsp)
	movq	%r8, 24(%rsp)
	movq	%r9, 32(%rsp)

	movq	8(%r10), %rcx			/* load cif */
	movq	16(%r10), %rdx			/* load fun */
	movq	%r10, %r8			/* closure is user_data */
	jmp	0f
	cfi_endproc
	SEH(.seh_endproc)

	.align	8
	.globl	C(ffi_closure_win64)
	FFI_HIDDEN(C(ffi_closure_win64))

	SEH(.seh_proc ffi_closure_win64)
C(ffi_closure_win64):
	cfi_startproc
	_CET_ENDBR
	/* Save all integer arguments into the incoming reg stack space.  */
	movq	%rcx, 8(%rsp)
	movq	%rdx, 16(%rsp)
	movq	%r8, 24(%rsp)
	movq	%r9, 32(%rsp)

	movq	FFI_TRAMPOLINE_SIZE(%r10), %rcx		/* load cif */
	movq	FFI_TRAMPOLINE_SIZE+8(%r10), %rdx	/* load fun */
	movq	FFI_TRAMPOLINE_SIZE+16(%r10), %r8	/* load user_data */
0:
	subq	$ffi_clo_FS, %rsp
	cfi_adjust_cfa_offset(ffi_clo_FS)
	SEH(.seh_stackalloc ffi_clo_FS)
	SEH(.seh_endprologue)

	/* Save all sse arguments into the stack frame.  */
	movsd	%xmm0, ffi_clo_OFF_X(%rsp)
	movsd	%xmm1, ffi_clo_OFF_X+8(%rsp)
	movsd	%xmm2, ffi_clo_OFF_X+16(%rsp)
	movsd	%xmm3, ffi_clo_OFF_X+24(%rsp)

	leaq	ffi_clo_OFF_R(%rsp), %r9
	call	PLT(C(ffi_closure_win64_inner))

	/* Load the result into both possible result registers.  */
	movq    ffi_clo_OFF_R(%rsp), %rax
	movsd   ffi_clo_OFF_R(%rsp), %xmm0

	addq	$ffi_clo_FS, %rsp
	cfi_adjust_cfa_offset(-ffi_clo_FS)
	ret

	cfi_endproc
	SEH(.seh_endproc)

#if defined(FFI_EXEC_STATIC_TRAMP)
	.align	8
	.globl	C(ffi_closure_win64_alt)
	FFI_HIDDEN(C(ffi_closure_win64_alt))

	SEH(.seh_proc ffi_closure_win64_alt)
C(ffi_closure_win64_alt):
	_CET_ENDBR
	movq	8(%rsp), %r10
	addq	$16, %rsp
	jmp	C(ffi_closure_win64)
	SEH(.seh_endproc)
#endif
#endif /* __x86_64__ */

#if defined __ELF__ && defined __linux__
	.section	.note.GNU-stack,"",@progbits
#endif
