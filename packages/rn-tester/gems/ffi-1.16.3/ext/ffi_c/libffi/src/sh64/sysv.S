/* -----------------------------------------------------------------------
   sysv.S - Copyright (c) 2003, 2004, 2006, 2008 Kaz Kojima
   
   SuperH SHmedia Foreign Function Interface 

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
#ifdef HAVE_MACHINE_ASM_H
#include <machine/asm.h>
#else
/* XXX these lose for some platforms, I'm sure. */
#define CNAME(x) x
#define ENTRY(x) .globl CNAME(x); .type CNAME(x),%function; CNAME(x):
#endif

#ifdef __LITTLE_ENDIAN__
#define OFS_FLT	0
#else
#define OFS_FLT	4
#endif

	.section	.text..SHmedia32,"ax"

	# r2:	ffi_prep_args
	# r3:	&ecif
	# r4:	bytes
	# r5:	flags
	# r6:	flags2
	# r7:	rvalue
	# r8:	fn

	# This assumes we are using gas.
	.align	5
ENTRY(ffi_call_SYSV)
	# Save registers
.LFB1:
	addi.l	r15, -48, r15
.LCFI0:
	st.q	r15, 40, r32
	st.q	r15, 32, r31
	st.q	r15, 24, r30
	st.q	r15, 16, r29
	st.q	r15, 8, r28
	st.l	r15, 4, r18
	st.l	r15, 0, r14
.LCFI1:
	add.l	r15, r63, r14
.LCFI2:
#	add	r4, r63, r28
	add	r5, r63, r29
	add	r6, r63, r30
	add	r7, r63, r31
	add	r8, r63, r32

	addi	r4, (64 + 7), r4
	andi	r4, ~7, r4
	sub.l	r15, r4, r15

	ptabs/l	r2, tr0
	add	r15, r63, r2
	blink	tr0, r18

	addi	r15, 64, r22
	movi	0, r0
	movi	0, r1
	movi	-1, r23

	pt/l	1f, tr1
	bnei/l	r29, FFI_TYPE_STRUCT, tr1
	ld.l	r15, 0, r19
	addi	r15, 8, r15
	addi	r0, 1, r0
1:

.L_pass:
	andi	r30, 3, r20
	shlri	r30, 2, r30

	pt/l	.L_call_it, tr0
	pt/l	.L_pass_i, tr1
	pt/l	.L_pass_f, tr2

	beqi/l	r20, FFI_TYPE_VOID, tr0
	beqi/l	r20, FFI_TYPE_INT, tr1
	beqi/l	r20, FFI_TYPE_FLOAT, tr2

.L_pass_d:
	addi	r0, 1, r0
	pt/l	3f, tr0
	movi	12, r20
	bge/l	r1, r20, tr0

	pt/l	.L_pop_d, tr1
	pt/l	2f, tr0
	blink	tr1, r63
2:
	addi.l	r15, 8, r15
3:
	pt/l	.L_pass, tr0
	addi	r1, 2, r1
	blink	tr0, r63

.L_pop_d:
	pt/l	.L_pop_d_tbl, tr1
	gettr	tr1, r20
	shlli	r1, 2, r21
	add	r20, r21, r20
	ptabs/l	r20, tr1
	blink	tr1, r63

.L_pop_d_tbl:
	fld.d	r15, 0, dr0
	blink	tr0, r63
	fld.d	r15, 0, dr2
	blink	tr0, r63
	fld.d	r15, 0, dr4
	blink	tr0, r63
	fld.d	r15, 0, dr6
	blink	tr0, r63
	fld.d	r15, 0, dr8
	blink	tr0, r63
	fld.d	r15, 0, dr10
	blink	tr0, r63

.L_pass_f:
	addi	r0, 1, r0
	pt/l	3f, tr0
	movi	12, r20
	bge/l	r1, r20, tr0

	pt/l	.L_pop_f, tr1
	pt/l	2f, tr0
	blink	tr1, r63
2:
	addi.l	r15, 8, r15
3:
	pt/l	.L_pass, tr0
	blink	tr0, r63

.L_pop_f:
	pt/l	.L_pop_f_tbl, tr1
	pt/l	5f, tr2
	gettr	tr1, r20
	bge/l	r23, r63, tr2
	add	r1, r63, r23 
	shlli	r1, 3, r21
	addi	r1, 2, r1
	add	r20, r21, r20
	ptabs/l	r20, tr1
	blink	tr1, r63
5:
	addi	r23, 1, r21
	movi	-1, r23
	shlli	r21, 3, r21
	add	r20, r21, r20
	ptabs/l	r20, tr1
	blink	tr1, r63

.L_pop_f_tbl:
	fld.s	r15, OFS_FLT, fr0
	blink	tr0, r63
	fld.s	r15, OFS_FLT, fr1
	blink	tr0, r63
	fld.s	r15, OFS_FLT, fr2
	blink	tr0, r63
	fld.s	r15, OFS_FLT, fr3
	blink	tr0, r63
	fld.s	r15, OFS_FLT, fr4
	blink	tr0, r63
	fld.s	r15, OFS_FLT, fr5
	blink	tr0, r63
	fld.s	r15, OFS_FLT, fr6
	blink	tr0, r63
	fld.s	r15, OFS_FLT, fr7
	blink	tr0, r63
	fld.s	r15, OFS_FLT, fr8
	blink	tr0, r63
	fld.s	r15, OFS_FLT, fr9
	blink	tr0, r63
	fld.s	r15, OFS_FLT, fr10
	blink	tr0, r63
	fld.s	r15, OFS_FLT, fr11
	blink	tr0, r63

.L_pass_i:
	pt/l	3f, tr0
	movi	8, r20
	bge/l	r0, r20, tr0

	pt/l	.L_pop_i, tr1
	pt/l	2f, tr0
	blink	tr1, r63
2:
	addi.l	r15, 8, r15
3:
	pt/l	.L_pass, tr0
	addi	r0, 1, r0
	blink	tr0, r63

.L_pop_i:
	pt/l	.L_pop_i_tbl, tr1
	gettr	tr1, r20
	shlli	r0, 3, r21
	add	r20, r21, r20
	ptabs/l	r20, tr1
	blink	tr1, r63

.L_pop_i_tbl:
	ld.q	r15, 0, r2
	blink	tr0, r63
	ld.q	r15, 0, r3
	blink	tr0, r63
	ld.q	r15, 0, r4
	blink	tr0, r63
	ld.q	r15, 0, r5
	blink	tr0, r63
	ld.q	r15, 0, r6
	blink	tr0, r63
	ld.q	r15, 0, r7
	blink	tr0, r63
	ld.q	r15, 0, r8
	blink	tr0, r63
	ld.q	r15, 0, r9
	blink	tr0, r63

.L_call_it:
	# call function
	pt/l	1f, tr1
	bnei/l	r29, FFI_TYPE_STRUCT, tr1
	add	r19, r63, r2
1:
	add	r22, r63, r15
	ptabs/l	r32, tr0
	blink	tr0, r18

	pt/l	.L_ret_i, tr0
	pt/l	.L_ret_ll, tr1
	pt/l	.L_ret_d, tr2
	pt/l	.L_ret_f, tr3
	pt/l	.L_epilogue, tr4

	beqi/l	r29, FFI_TYPE_INT, tr0
	beqi/l	r29, FFI_TYPE_UINT32, tr0
	beqi/l	r29, FFI_TYPE_SINT64, tr1
	beqi/l	r29, FFI_TYPE_UINT64, tr1
	beqi/l	r29, FFI_TYPE_DOUBLE, tr2
	beqi/l	r29, FFI_TYPE_FLOAT, tr3

	pt/l	.L_ret_q, tr0
	pt/l	.L_ret_h, tr1

	beqi/l	r29, FFI_TYPE_UINT8, tr0
	beqi/l	r29, FFI_TYPE_UINT16, tr1
	blink	tr4, r63

.L_ret_d:
	fst.d	r31, 0, dr0
	blink	tr4, r63

.L_ret_ll:
	st.q	r31, 0, r2
	blink	tr4, r63

.L_ret_f:
	fst.s	r31, OFS_FLT, fr0
	blink	tr4, r63

.L_ret_q:
	st.b	r31, 0, r2
	blink	tr4, r63

.L_ret_h:
	st.w	r31, 0, r2
	blink	tr4, r63

.L_ret_i:
	st.l	r31, 0, r2
	# Fall

.L_epilogue:
	# Remove the space we pushed for the args
	add	r14, r63, r15

	ld.l	r15, 0, r14
	ld.l	r15, 4, r18
	ld.q	r15, 8, r28
	ld.q	r15, 16, r29
	ld.q	r15, 24, r30
	ld.q	r15, 32, r31
	ld.q	r15, 40, r32
	addi.l	r15, 48, r15
	ptabs	r18, tr0
	blink	tr0, r63

.LFE1:
.ffi_call_SYSV_end:
	.size	 CNAME(ffi_call_SYSV),.ffi_call_SYSV_end-CNAME(ffi_call_SYSV)

	.align	5
ENTRY(ffi_closure_SYSV)
.LFB2:
	addi.l	r15, -136, r15
.LCFI3:
	st.l	r15, 12, r18
	st.l	r15, 8, r14
	st.l	r15, 4, r12
.LCFI4:
	add	r15, r63, r14
.LCFI5:
	/* Stack layout:	
	   ...
	   64 bytes (register parameters)
	   48 bytes (floating register parameters)
	    8 bytes (result)
	    4 bytes (r18)
	    4 bytes (r14)
	    4 bytes (r12)
	    4 bytes (for align)
	   <- new stack pointer
	*/
	fst.d	r14, 24, dr0
	fst.d	r14, 32, dr2
	fst.d	r14, 40, dr4
	fst.d	r14, 48, dr6
	fst.d	r14, 56, dr8
	fst.d	r14, 64, dr10
	st.q	r14, 72, r2
	st.q	r14, 80, r3
	st.q	r14, 88, r4
	st.q	r14, 96, r5
	st.q	r14, 104, r6
	st.q	r14, 112, r7
	st.q	r14, 120, r8
	st.q	r14, 128, r9

	add	r1, r63, r2
	addi	r14, 16, r3
	addi	r14, 72, r4
	addi	r14, 24, r5
	addi	r14, 136, r6
#ifdef PIC
	movi	(((datalabel _GLOBAL_OFFSET_TABLE_-(.LPCS0-.)) >> 16) & 65535), r12
        shori	((datalabel _GLOBAL_OFFSET_TABLE_-(.LPCS0-.)) & 65535), r12
.LPCS0:	ptrel/u r12, tr0
	movi	((ffi_closure_helper_SYSV@GOTPLT) & 65535), r1
	gettr	tr0, r12
	ldx.l	r1, r12, r1
	ptabs	r1, tr0
#else
	pt/l	ffi_closure_helper_SYSV, tr0
#endif
	blink	tr0, r18

	shlli	r2, 1, r1
        movi    (((datalabel .L_table) >> 16) & 65535), r2
        shori   ((datalabel .L_table) & 65535), r2
        ldx.w   r2, r1, r1
        add     r1, r2, r1
	pt/l	.L_case_v, tr1
        ptabs   r1, tr0
        blink   tr0, r63

        .align 2
.L_table:
	.word	.L_case_v - datalabel .L_table	/* FFI_TYPE_VOID */
	.word	.L_case_i - datalabel .L_table	/* FFI_TYPE_INT */
	.word	.L_case_f - datalabel .L_table	/* FFI_TYPE_FLOAT */
	.word	.L_case_d - datalabel .L_table	/* FFI_TYPE_DOUBLE */
	.word	.L_case_d - datalabel .L_table	/* FFI_TYPE_LONGDOUBLE */
	.word	.L_case_uq - datalabel .L_table	/* FFI_TYPE_UINT8 */
	.word	.L_case_q - datalabel .L_table	/* FFI_TYPE_SINT8 */
	.word	.L_case_uh - datalabel .L_table	/* FFI_TYPE_UINT16 */
	.word	.L_case_h - datalabel .L_table	/* FFI_TYPE_SINT16 */
	.word	.L_case_i - datalabel .L_table	/* FFI_TYPE_UINT32 */
	.word	.L_case_i - datalabel .L_table	/* FFI_TYPE_SINT32 */
	.word	.L_case_ll - datalabel .L_table	/* FFI_TYPE_UINT64 */
	.word	.L_case_ll - datalabel .L_table	/* FFI_TYPE_SINT64 */
	.word	.L_case_v - datalabel .L_table	/* FFI_TYPE_STRUCT */
	.word	.L_case_i - datalabel .L_table	/* FFI_TYPE_POINTER */

        .align 2
.L_case_d:
	fld.d	r14, 16, dr0
	blink	tr1, r63
.L_case_f:
	fld.s	r14, 16, fr0
	blink	tr1, r63
.L_case_ll:
	ld.q	r14, 16, r2
	blink	tr1, r63
.L_case_i:
	ld.l	r14, 16, r2
	blink	tr1, r63
.L_case_q:
	ld.b	r14, 16, r2
	blink	tr1, r63
.L_case_uq:
	ld.ub	r14, 16, r2
	blink	tr1, r63
.L_case_h:
	ld.w	r14, 16, r2
	blink	tr1, r63
.L_case_uh:
	ld.uw	r14, 16, r2
	blink	tr1, r63
.L_case_v:
	add.l	r14, r63, r15
	ld.l	r15, 4, r12
	ld.l	r15, 8, r14
	ld.l	r15, 12, r18
	addi.l	r15, 136, r15
	ptabs	r18, tr0
	blink	tr0, r63

.LFE2:
.ffi_closure_SYSV_end:
	.size	 CNAME(ffi_closure_SYSV),.ffi_closure_SYSV_end-CNAME(ffi_closure_SYSV)

#if defined __ELF__ && defined __linux__
	.section	.note.GNU-stack,"",@progbits
#endif

	.section	".eh_frame","aw",@progbits
__FRAME_BEGIN__:
	.4byte	.LECIE1-.LSCIE1	/* Length of Common Information Entry */
.LSCIE1:
	.4byte	0x0	/* CIE Identifier Tag */
	.byte	0x1	/* CIE Version */
#ifdef PIC
	.ascii "zR\0"	/* CIE Augmentation */
#else
	.byte	0x0	/* CIE Augmentation */
#endif
	.uleb128 0x1	/* CIE Code Alignment Factor */
	.sleb128 -4	/* CIE Data Alignment Factor */
	.byte	0x12	/* CIE RA Column */
#ifdef PIC
	.uleb128 0x1	/* Augmentation size */
	.byte	0x10	/* FDE Encoding (pcrel) */
#endif
	.byte	0xc	/* DW_CFA_def_cfa */
	.uleb128 0xf
	.uleb128 0x0
	.align	2
.LECIE1:
.LSFDE1:
	.4byte	datalabel .LEFDE1-datalabel .LASFDE1	/* FDE Length */
.LASFDE1:
	.4byte	datalabel .LASFDE1-datalabel __FRAME_BEGIN__
#ifdef PIC
	.4byte	.LFB1-.	/* FDE initial location */
#else
	.4byte	.LFB1	/* FDE initial location */
#endif
	.4byte	datalabel .LFE1-datalabel .LFB1	/* FDE address range */
#ifdef PIC
	.uleb128 0x0	/* Augmentation size */
#endif
	.byte	0x4	/* DW_CFA_advance_loc4 */
	.4byte	datalabel .LCFI0-datalabel .LFB1
	.byte	0xe	/* DW_CFA_def_cfa_offset */
	.uleb128 0x30
	.byte	0x4	/* DW_CFA_advance_loc4 */
	.4byte	datalabel .LCFI1-datalabel .LCFI0
	.byte   0x8e	/* DW_CFA_offset, column 0xe */
	.uleb128 0xc
	.byte   0x92	/* DW_CFA_offset, column 0x12 */
	.uleb128 0xb
	.byte   0x9c	/* DW_CFA_offset, column 0x1c */
	.uleb128 0xa
	.byte   0x9d	/* DW_CFA_offset, column 0x1d */
	.uleb128 0x8
	.byte   0x9e	/* DW_CFA_offset, column 0x1e */
	.uleb128 0x6
	.byte   0x9f	/* DW_CFA_offset, column 0x1f */
	.uleb128 0x4
	.byte   0xa0	/* DW_CFA_offset, column 0x20 */
	.uleb128 0x2
	.byte	0x4	/* DW_CFA_advance_loc4 */
	.4byte	datalabel .LCFI2-datalabel .LCFI1
	.byte	0xd	/* DW_CFA_def_cfa_register */
	.uleb128 0xe
	.align	2
.LEFDE1:

.LSFDE3:
	.4byte	datalabel .LEFDE3-datalabel .LASFDE3	/* FDE Length */
.LASFDE3:
	.4byte	datalabel .LASFDE3-datalabel __FRAME_BEGIN__
#ifdef PIC
	.4byte	.LFB2-.	/* FDE initial location */
#else
	.4byte	.LFB2	/* FDE initial location */
#endif
	.4byte	datalabel .LFE2-datalabel .LFB2	/* FDE address range */
#ifdef PIC
	.uleb128 0x0	/* Augmentation size */
#endif
	.byte	0x4	/* DW_CFA_advance_loc4 */
	.4byte	datalabel .LCFI3-datalabel .LFB2
	.byte	0xe	/* DW_CFA_def_cfa_offset */
	.uleb128 0x88
	.byte	0x4	/* DW_CFA_advance_loc4 */
	.4byte	datalabel .LCFI4-datalabel .LCFI3
	.byte   0x8c	/* DW_CFA_offset, column 0xc */
	.uleb128 0x21
	.byte   0x8e	/* DW_CFA_offset, column 0xe */
	.uleb128 0x20
	.byte   0x92	/* DW_CFA_offset, column 0x12 */
	.uleb128 0x1f
	.byte	0x4	/* DW_CFA_advance_loc4 */
	.4byte	datalabel .LCFI5-datalabel .LCFI4
	.byte	0xd	/* DW_CFA_def_cfa_register */
	.uleb128 0xe
	.align	2
.LEFDE3:
