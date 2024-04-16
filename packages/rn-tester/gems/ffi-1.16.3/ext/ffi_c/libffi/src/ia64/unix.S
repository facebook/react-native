/* -----------------------------------------------------------------------
   unix.S - Copyright (c) 1998, 2008 Red Hat, Inc.
            Copyright (c) 2000 Hewlett Packard Company
   
   IA64/unix Foreign Function Interface 

   Primary author: Hans Boehm, HP Labs

   Loosely modeled on Cygnus code for other platforms.

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
#include "ia64_flags.h"

	.pred.safe_across_calls p1-p5,p16-p63
.text
/* HPUX assembler needs to see these symbols, otherwise compilation
   fails */
#ifdef __hpux
      .global memcpy
      .global ffi_closure_unix_inner
#endif

/* int ffi_call_unix (struct ia64_args *stack, PTR64 rvalue,
		      void (*fn)(void), int flags);
 */

        .align 16
        .global	ffi_call_unix
        .proc	ffi_call_unix
ffi_call_unix:
	.prologue
	/* Bit o trickiness.  We actually share a stack frame with ffi_call.
	   Rely on the fact that ffi_call uses a vframe and don't bother
	   tracking one here at all.  */
	.fframe	0
	.save	ar.pfs, r36 // loc0
	alloc   loc0 = ar.pfs, 4, 3, 8, 0
	.save	rp, loc1
	mov 	loc1 = b0
	.body
	add	r16 = 16, in0
	mov	loc2 = gp
	mov	r8 = in1
	;;

	/* Load up all of the argument registers.  */
	ldf.fill f8 = [in0], 32
	ldf.fill f9 = [r16], 32
	;;
	ldf.fill f10 = [in0], 32
	ldf.fill f11 = [r16], 32
	;;
	ldf.fill f12 = [in0], 32
	ldf.fill f13 = [r16], 32
	;;
	ldf.fill f14 = [in0], 32
	ldf.fill f15 = [r16], 24
	;;
	ld8	out0 = [in0], 16
	ld8	out1 = [r16], 16
	;;
	ld8	out2 = [in0], 16
	ld8	out3 = [r16], 16
	;;
	ld8	out4 = [in0], 16
	ld8	out5 = [r16], 16
	;;
	ld8	out6 = [in0]
	ld8	out7 = [r16]
	;;

	/* Deallocate the register save area from the stack frame.  */
	mov	sp = in0

	/* Call the target function.  */
	ld8	r16 = [in2], 8
	;;
	ld8	gp = [in2]
	mov	b6 = r16
	br.call.sptk.many b0 = b6
	;;

	/* Dispatch to handle return value.  */
	mov	gp = loc2
	zxt1	r16 = in3
	;;
	mov	ar.pfs = loc0
	addl	r18 = @ltoffx(.Lst_table), gp
	;;
	/* default assembler on HP-UX does not support LDXMOV */
#ifdef __hpux
	ld8	r18 = [r18]
#else
	ld8.mov	r18 = [r18], .Lst_table
#endif
	mov	b0 = loc1
	;;
	shladd	r18 = r16, 3, r18
	;;
	ld8	r17 = [r18]
	shr	in3 = in3, 8
	;;
	add	r17 = r17, r18
	;;
	mov	b6 = r17
	br	b6
	;;

.Lst_void:
	br.ret.sptk.many b0
	;;
.Lst_uint8:
	zxt1	r8 = r8
	;;
	st8	[in1] = r8
	br.ret.sptk.many b0
	;;
.Lst_sint8:
	sxt1	r8 = r8
	;;
	st8	[in1] = r8
	br.ret.sptk.many b0
	;;
.Lst_uint16:
	zxt2	r8 = r8
	;;
	st8	[in1] = r8
	br.ret.sptk.many b0
	;;
.Lst_sint16:
	sxt2	r8 = r8
	;;
	st8	[in1] = r8
	br.ret.sptk.many b0
	;;
.Lst_uint32:
	zxt4	r8 = r8
	;;
	st8	[in1] = r8
	br.ret.sptk.many b0
	;;
.Lst_sint32:
	sxt4	r8 = r8
	;;
	st8	[in1] = r8
	br.ret.sptk.many b0
	;;
.Lst_int64:
	st8	[in1] = r8
	br.ret.sptk.many b0
	;;
.Lst_float:
	stfs	[in1] = f8
	br.ret.sptk.many b0
	;;
.Lst_double:
	stfd	[in1] = f8
	br.ret.sptk.many b0
	;;
.Lst_ldouble:
	stfe	[in1] = f8
	br.ret.sptk.many b0
	;;

.Lst_small_struct:
	cmp.lt	p6, p0 = 8, in3
	cmp.lt	p7, p0 = 16, in3
	cmp.lt	p8, p0 = 24, in3
	;;
	add	r16 = 8, sp
	add	r17 = 16, sp
	add	r18 = 24, sp
	;;
	st8	[sp] = r8
(p6)	st8	[r16] = r9
	mov	out0 = in1
(p7)	st8	[r17] = r10
(p8)	st8	[r18] = r11
	mov	out1 = sp
	mov	out2 = in3
	;;
	// ia64 software calling convention requires
	// top 16 bytes of stack to be scratch space
	// PLT resolver uses that scratch space at
	// 'memcpy' symbol reolution time
	add	sp = -16, sp
	br.call.sptk.many b0 = memcpy#
	;;
	mov	ar.pfs = loc0
	mov	b0 = loc1
	mov	gp = loc2
	br.ret.sptk.many b0

.Lst_hfa_float:
	add	r16 = 4, in1
	cmp.lt	p6, p0 = 4, in3
	;;
	stfs	[in1] = f8, 8
(p6)	stfs	[r16] = f9, 8
	cmp.lt	p7, p0 = 8, in3
	cmp.lt	p8, p0 = 12, in3
	;;
(p7)	stfs	[in1] = f10, 8
(p8)	stfs	[r16] = f11, 8
	cmp.lt	p9, p0 = 16, in3
	cmp.lt	p10, p0 = 20, in3
	;;
(p9)	stfs	[in1] = f12, 8
(p10)	stfs	[r16] = f13, 8
	cmp.lt	p6, p0 = 24, in3
	cmp.lt	p7, p0 = 28, in3
	;;
(p6)	stfs	[in1] = f14
(p7)	stfs	[r16] = f15
	br.ret.sptk.many b0
	;;

.Lst_hfa_double:
	add	r16 = 8, in1
	cmp.lt	p6, p0 = 8, in3
	;;
	stfd	[in1] = f8, 16
(p6)	stfd	[r16] = f9, 16
	cmp.lt	p7, p0 = 16, in3
	cmp.lt	p8, p0 = 24, in3
	;;
(p7)	stfd	[in1] = f10, 16
(p8)	stfd	[r16] = f11, 16
	cmp.lt	p9, p0 = 32, in3
	cmp.lt	p10, p0 = 40, in3
	;;
(p9)	stfd	[in1] = f12, 16
(p10)	stfd	[r16] = f13, 16
	cmp.lt	p6, p0 = 48, in3
	cmp.lt	p7, p0 = 56, in3
	;;
(p6)	stfd	[in1] = f14
(p7)	stfd	[r16] = f15
	br.ret.sptk.many b0
	;;

.Lst_hfa_ldouble:
	add	r16 = 16, in1
	cmp.lt	p6, p0 = 16, in3
	;;
	stfe	[in1] = f8, 32
(p6)	stfe	[r16] = f9, 32
	cmp.lt	p7, p0 = 32, in3
	cmp.lt	p8, p0 = 48, in3
	;;
(p7)	stfe	[in1] = f10, 32
(p8)	stfe	[r16] = f11, 32
	cmp.lt	p9, p0 = 64, in3
	cmp.lt	p10, p0 = 80, in3
	;;
(p9)	stfe	[in1] = f12, 32
(p10)	stfe	[r16] = f13, 32
	cmp.lt	p6, p0 = 96, in3
	cmp.lt	p7, p0 = 112, in3
	;;
(p6)	stfe	[in1] = f14
(p7)	stfe	[r16] = f15
	br.ret.sptk.many b0
	;;

        .endp ffi_call_unix

        .align 16
        .global ffi_closure_unix
        .proc ffi_closure_unix

#define FRAME_SIZE	(8*16 + 8*8 + 8*16)

ffi_closure_unix:
	.prologue
	.save	ar.pfs, r40 // loc0
	alloc   loc0 = ar.pfs, 8, 4, 4, 0
	.fframe	FRAME_SIZE
	add	r12 = -FRAME_SIZE, r12
	.save	rp, loc1
	mov	loc1 = b0
	.save	ar.unat, loc2
	mov	loc2 = ar.unat
	.body

	/* Retrieve closure pointer and real gp.  */
#ifdef _ILP32
	addp4	out0 = 0, gp
	addp4	gp = 16, gp
#else
	mov	out0 = gp
	add	gp = 16, gp
#endif
	;;
	ld8	gp = [gp]

	/* Spill all of the possible argument registers.  */
	add	r16 = 16 + 8*16, sp
	add	r17 = 16 + 8*16 + 16, sp
	;;
	stf.spill [r16] = f8, 32
	stf.spill [r17] = f9, 32
	mov	loc3 = gp
	;;
	stf.spill [r16] = f10, 32
	stf.spill [r17] = f11, 32
	;;
	stf.spill [r16] = f12, 32
	stf.spill [r17] = f13, 32
	;;
	stf.spill [r16] = f14, 32
	stf.spill [r17] = f15, 24
	;;
	.mem.offset 0, 0
	st8.spill [r16] = in0, 16
	.mem.offset 8, 0
	st8.spill [r17] = in1, 16
	add	out1 = 16 + 8*16, sp
	;;
	.mem.offset 0, 0
	st8.spill [r16] = in2, 16
	.mem.offset 8, 0
	st8.spill [r17] = in3, 16
	add	out2 = 16, sp
	;;
	.mem.offset 0, 0
	st8.spill [r16] = in4, 16
	.mem.offset 8, 0
	st8.spill [r17] = in5, 16
	mov	out3 = r8
	;;
	.mem.offset 0, 0
	st8.spill [r16] = in6
	.mem.offset 8, 0
	st8.spill [r17] = in7

	/* Invoke ffi_closure_unix_inner for the hard work.  */
	br.call.sptk.many b0 = ffi_closure_unix_inner
	;;

	/* Dispatch to handle return value.  */
	mov	gp = loc3
	zxt1	r16 = r8
	;;
	addl	r18 = @ltoffx(.Lld_table), gp
	mov	ar.pfs = loc0
	;;
#ifdef __hpux
	ld8	r18 = [r18]
#else
	ld8.mov	r18 = [r18], .Lst_table
#endif
	mov	b0 = loc1
	;;
	shladd	r18 = r16, 3, r18
	mov	ar.unat = loc2
	;;
	ld8	r17 = [r18]
	shr	r8 = r8, 8
	;;
	add	r17 = r17, r18
	add	r16 = 16, sp
	;;
	mov	b6 = r17
	br	b6
	;;
	.label_state 1

.Lld_void:
	.restore sp
	add	sp = FRAME_SIZE, sp
	br.ret.sptk.many b0
	;;
.Lld_int:
	.body
	.copy_state 1
	ld8	r8 = [r16]
	.restore sp
	add	sp = FRAME_SIZE, sp
	br.ret.sptk.many b0
	;;
.Lld_float:
	.body
	.copy_state 1
	ldfs	f8 = [r16]
	.restore sp
	add	sp = FRAME_SIZE, sp
	br.ret.sptk.many b0
	;;
.Lld_double:
	.body
	.copy_state 1
	ldfd	f8 = [r16]
	.restore sp
	add	sp = FRAME_SIZE, sp
	br.ret.sptk.many b0
	;;
.Lld_ldouble:
	.body
	.copy_state 1
	ldfe	f8 = [r16]
	.restore sp
	add	sp = FRAME_SIZE, sp
	br.ret.sptk.many b0
	;;

.Lld_small_struct:
	.body
	.copy_state 1
	add	r17 = 8, r16
	cmp.lt	p6, p0 = 8, r8
	cmp.lt	p7, p0 = 16, r8
	cmp.lt	p8, p0 = 24, r8
	;;
	ld8	r8 = [r16], 16
(p6)	ld8	r9 = [r17], 16
	;;
(p7)	ld8	r10 = [r16]
(p8)	ld8	r11 = [r17]
	.restore sp
	add	sp = FRAME_SIZE, sp
	br.ret.sptk.many b0
	;;

.Lld_hfa_float:
	.body
	.copy_state 1
	add	r17 = 4, r16
	cmp.lt	p6, p0 = 4, r8
	;;
	ldfs	f8 = [r16], 8
(p6)	ldfs	f9 = [r17], 8
	cmp.lt	p7, p0 = 8, r8
	cmp.lt	p8, p0 = 12, r8
	;;
(p7)	ldfs	f10 = [r16], 8
(p8)	ldfs	f11 = [r17], 8
	cmp.lt	p9, p0 = 16, r8
	cmp.lt	p10, p0 = 20, r8
	;;
(p9)	ldfs	f12 = [r16], 8
(p10)	ldfs	f13 = [r17], 8
	cmp.lt	p6, p0 = 24, r8
	cmp.lt	p7, p0 = 28, r8
	;;
(p6)	ldfs	f14 = [r16]
(p7)	ldfs	f15 = [r17]
	.restore sp
	add	sp = FRAME_SIZE, sp
	br.ret.sptk.many b0
	;;

.Lld_hfa_double:
	.body
	.copy_state 1
	add	r17 = 8, r16
	cmp.lt	p6, p0 = 8, r8
	;;
	ldfd	f8 = [r16], 16
(p6)	ldfd	f9 = [r17], 16
	cmp.lt	p7, p0 = 16, r8
	cmp.lt	p8, p0 = 24, r8
	;;
(p7)	ldfd	f10 = [r16], 16
(p8)	ldfd	f11 = [r17], 16
	cmp.lt	p9, p0 = 32, r8
	cmp.lt	p10, p0 = 40, r8
	;;
(p9)	ldfd	f12 = [r16], 16
(p10)	ldfd	f13 = [r17], 16
	cmp.lt	p6, p0 = 48, r8
	cmp.lt	p7, p0 = 56, r8
	;;
(p6)	ldfd	f14 = [r16]
(p7)	ldfd	f15 = [r17]
	.restore sp
	add	sp = FRAME_SIZE, sp
	br.ret.sptk.many b0
	;;

.Lld_hfa_ldouble:
	.body
	.copy_state 1
	add	r17 = 16, r16
	cmp.lt	p6, p0 = 16, r8
	;;
	ldfe	f8 = [r16], 32
(p6)	ldfe	f9 = [r17], 32
	cmp.lt	p7, p0 = 32, r8
	cmp.lt	p8, p0 = 48, r8
	;;
(p7)	ldfe	f10 = [r16], 32
(p8)	ldfe	f11 = [r17], 32
	cmp.lt	p9, p0 = 64, r8
	cmp.lt	p10, p0 = 80, r8
	;;
(p9)	ldfe	f12 = [r16], 32
(p10)	ldfe	f13 = [r17], 32
	cmp.lt	p6, p0 = 96, r8
	cmp.lt	p7, p0 = 112, r8
	;;
(p6)	ldfe	f14 = [r16]
(p7)	ldfe	f15 = [r17]
	.restore sp
	add	sp = FRAME_SIZE, sp
	br.ret.sptk.many b0
	;;

	.endp	ffi_closure_unix
#ifdef __hpux
	.rodata
#else
	.section .rodata
#endif
	.align	8
.Lst_table:
	data8	@pcrel(.Lst_void)		// FFI_TYPE_VOID
	data8	@pcrel(.Lst_sint32)		// FFI_TYPE_INT
	data8	@pcrel(.Lst_float)		// FFI_TYPE_FLOAT
	data8	@pcrel(.Lst_double)		// FFI_TYPE_DOUBLE
	data8	@pcrel(.Lst_ldouble)		// FFI_TYPE_LONGDOUBLE
	data8	@pcrel(.Lst_uint8)		// FFI_TYPE_UINT8
	data8	@pcrel(.Lst_sint8)		// FFI_TYPE_SINT8
	data8	@pcrel(.Lst_uint16)		// FFI_TYPE_UINT16
	data8	@pcrel(.Lst_sint16)		// FFI_TYPE_SINT16
	data8	@pcrel(.Lst_uint32)		// FFI_TYPE_UINT32
	data8	@pcrel(.Lst_sint32)		// FFI_TYPE_SINT32
	data8	@pcrel(.Lst_int64)		// FFI_TYPE_UINT64
	data8	@pcrel(.Lst_int64)		// FFI_TYPE_SINT64
	data8	@pcrel(.Lst_void)		// FFI_TYPE_STRUCT
	data8	@pcrel(.Lst_int64)		// FFI_TYPE_POINTER
	data8	@pcrel(.Lst_void)		// FFI_TYPE_COMPLEX (not implemented)
	data8 	@pcrel(.Lst_small_struct)	// FFI_IA64_TYPE_SMALL_STRUCT
	data8	@pcrel(.Lst_hfa_float)		// FFI_IA64_TYPE_HFA_FLOAT
	data8	@pcrel(.Lst_hfa_double)		// FFI_IA64_TYPE_HFA_DOUBLE
	data8	@pcrel(.Lst_hfa_ldouble)	// FFI_IA64_TYPE_HFA_LDOUBLE

.Lld_table:
	data8	@pcrel(.Lld_void)		// FFI_TYPE_VOID
	data8	@pcrel(.Lld_int)		// FFI_TYPE_INT
	data8	@pcrel(.Lld_float)		// FFI_TYPE_FLOAT
	data8	@pcrel(.Lld_double)		// FFI_TYPE_DOUBLE
	data8	@pcrel(.Lld_ldouble)		// FFI_TYPE_LONGDOUBLE
	data8	@pcrel(.Lld_int)		// FFI_TYPE_UINT8
	data8	@pcrel(.Lld_int)		// FFI_TYPE_SINT8
	data8	@pcrel(.Lld_int)		// FFI_TYPE_UINT16
	data8	@pcrel(.Lld_int)		// FFI_TYPE_SINT16
	data8	@pcrel(.Lld_int)		// FFI_TYPE_UINT32
	data8	@pcrel(.Lld_int)		// FFI_TYPE_SINT32
	data8	@pcrel(.Lld_int)		// FFI_TYPE_UINT64
	data8	@pcrel(.Lld_int)		// FFI_TYPE_SINT64
	data8	@pcrel(.Lld_void)		// FFI_TYPE_STRUCT
	data8	@pcrel(.Lld_int)		// FFI_TYPE_POINTER
	data8	@pcrel(.Lld_void)		// FFI_TYPE_COMPLEX (not implemented)
	data8 	@pcrel(.Lld_small_struct)	// FFI_IA64_TYPE_SMALL_STRUCT
	data8	@pcrel(.Lld_hfa_float)		// FFI_IA64_TYPE_HFA_FLOAT
	data8	@pcrel(.Lld_hfa_double)		// FFI_IA64_TYPE_HFA_DOUBLE
	data8	@pcrel(.Lld_hfa_ldouble)	// FFI_IA64_TYPE_HFA_LDOUBLE

#if defined __ELF__ && defined __linux__
	.section	.note.GNU-stack,"",@progbits
#endif
