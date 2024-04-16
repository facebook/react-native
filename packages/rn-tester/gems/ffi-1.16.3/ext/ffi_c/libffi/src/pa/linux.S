/* -----------------------------------------------------------------------
   linux.S - (c) 2003-2004 Randolph Chung <tausq@debian.org>
	     (c) 2008 Red Hat, Inc.

   HPPA Foreign Function Interface

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
   IN NO EVENT SHALL RENESAS TECHNOLOGY BE LIABLE FOR ANY CLAIM, DAMAGES OR
   OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
   ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
   OTHER DEALINGS IN THE SOFTWARE.
   ----------------------------------------------------------------------- */

#define LIBFFI_ASM
#include <fficonfig.h>
#include <ffi.h>

	.text
	.level 1.1
	.align 4

	/* void ffi_call_pa32(void (*)(char *, extended_cif *),
			       extended_cif *ecif,
			       unsigned bytes,
			       unsigned flags,
			       unsigned *rvalue,
			       void (*fn)(void));
	 */

	.export ffi_call_pa32,code
	.import ffi_prep_args_pa32,code

	.type ffi_call_pa32, @function
.LFB1:
ffi_call_pa32:
	.proc
	.callinfo FRAME=64,CALLS,SAVE_RP,SAVE_SP,ENTRY_GR=4
	.entry
	stw %rp, -20(%sp)
	copy %r3, %r1
.LCFI11:

	copy %sp, %r3
.LCFI12:

	/* Setup the stack for calling prep_args...
	   We want the stack to look like this:

	   [ Previous stack                            ] <- %r3

	   [ 64-bytes register save area               ] <- %r4

	   [ Stack space for actual call, passed as    ] <- %arg0
	   [     arg0 to ffi_prep_args_pa32           ]

	   [ Stack for calling prep_args               ] <- %sp
	 */

	stwm %r1, 64(%sp)
	stw %r4, 12(%r3)
.LCFI13:
	copy %sp, %r4

	addl %arg2, %r4, %arg0      /* arg stack */
	stw %arg3, -48(%r3)         /* save flags; we need it later */

	/* Call prep_args:
	   %arg0(stack) -- set up above
	   %arg1(ecif) -- same as incoming param
	   %arg2(bytes) -- same as incoming param */
	bl ffi_prep_args_pa32,%r2
	ldo 64(%arg0), %sp
	ldo -64(%sp), %sp

	/* now %sp should point where %arg0 was pointing.  */

	/* Load the arguments that should be passed in registers
	   The fp args were loaded by the prep_args function.  */
	ldw -36(%sp), %arg0
	ldw -40(%sp), %arg1
	ldw -44(%sp), %arg2
	ldw -48(%sp), %arg3

	/* in case the function is going to return a structure
	   we need to give it a place to put the result.  */
	ldw -52(%r3), %ret0                     /* %ret0 <- rvalue */
	ldw -56(%r3), %r22                      /* %r22 <- function to call */
	bl $$dyncall, %r31                      /* Call the user function */
	copy %r31, %rp

	/* Prepare to store the result; we need to recover flags and rvalue.  */
	ldw -48(%r3), %r21                      /* r21 <- flags */

	/* Adjust flags range from [-8, 15] to  [0, 23].  */
	addi 8, %r21, %r21

	blr %r21, %r0
	ldw -52(%r3), %r20                      /* r20 <- rvalue */

	/* Giant jump table */
	/* 8-byte small struct */
	b,n	.Lsmst8
	nop
	/* 7-byte small struct */
	b,n	.Lsmst7
	nop
	/* 6-byte small struct */
	b,n	.Lsmst6
	nop
	/* 5-byte small struct */
	b,n	.Lsmst5
	nop
	/* 4-byte small struct */
	b,n	.Lsmst4
	nop
	/* 3-byte small struct */
	b,n	.Lsmst3
	nop
	/* 2-byte small struct */
	b,n	.Lsmst2
	nop
	/* 1-byte small struct */
	b	.Ldone
	stb	%ret0, 0(%r20)
	/* void */
	b,n	.Ldone
	nop
	/* int */
	b	.Ldone
	stw	%ret0, 0(%r20)
	/* float */
	b	.Ldone
	fstw	%fr4L,0(%r20)
	/* double */
	b	.Ldone
	fstd	%fr4,0(%r20)
	/* long double */
	b	.Ldone
	fstd	%fr4,0(%r20)
	/* unsigned int8 */
	b	.Ldone
	stw	%ret0, 0(%r20)
	/* sint8 */
	b	.Ldone
	stw	%ret0, 0(%r20)
	/* unsigned int16 */
	b	.Ldone
	stw	%ret0, 0(%r20)
	/* sint16 */
	b	.Ldone
	stw	%ret0, 0(%r20)
	/* unsigned int32 */
	b	.Ldone
	stw	%ret0, 0(%r20)
	/* sint32 */
	b	.Ldone
	stw	%ret0, 0(%r20)
	/* unsigned int64 */
	b,n	.Luint64
	nop
	/* signed int64 */
	b,n	.Lsint64
	nop
	/* large struct */
	b,n	.Ldone
	nop
	/* pointer */
	b	.Ldone
	stw	%ret0, 0(%r20)
	/* complex */
	b,n	.Ldone
	nop

	/* Store the result according to the return type.  */

.Luint64:
.Lsint64:
	stw	%ret0, 0(%r20)
	b	.Ldone
	stw	%ret1, 4(%r20)

.Lsmst2:
	/* 2-byte structs are returned in ret0 as ????xxyy.  */
	extru	%ret0, 23, 8, %r22
	stbs,ma	%r22, 1(%r20)
	b	.Ldone
	stb	%ret0, 0(%r20)

.Lsmst3:
	/* 3-byte structs are returned in ret0 as ??xxyyzz.  */
	extru	%ret0, 15, 8, %r22
	stbs,ma	%r22, 1(%r20)
	extru	%ret0, 23, 8, %r22
	stbs,ma	%r22, 1(%r20)
	b	.Ldone
	stb	%ret0, 0(%r20)

.Lsmst4:
	/* 4-byte structs are returned in ret0 as wwxxyyzz.  */
	extru	%ret0, 7, 8, %r22
	stbs,ma	%r22, 1(%r20)
	extru	%ret0, 15, 8, %r22
	stbs,ma	%r22, 1(%r20)
	extru	%ret0, 23, 8, %r22
	stbs,ma	%r22, 1(%r20)
	b	.Ldone
	stb	%ret0, 0(%r20)

.Lsmst5:
	/* 5 byte values are returned right justified:
	      ret0     ret1
	   5: ??????aa bbccddee */
	stbs,ma	%ret0, 1(%r20)
	extru	%ret1, 7, 8, %r22
	stbs,ma	%r22, 1(%r20)
	extru	%ret1, 15, 8, %r22
	stbs,ma	%r22, 1(%r20)
	extru	%ret1, 23, 8, %r22
	stbs,ma	%r22, 1(%r20)
	b	.Ldone
	stb	%ret1, 0(%r20)

.Lsmst6:
	/* 6 byte values are returned right justified:
	      ret0     ret1
	   6: ????aabb ccddeeff */
	extru	%ret0, 23, 8, %r22
	stbs,ma	%r22, 1(%r20)
	stbs,ma	%ret0, 1(%r20)
	extru	%ret1, 7, 8, %r22
	stbs,ma	%r22, 1(%r20)
	extru	%ret1, 15, 8, %r22
	stbs,ma	%r22, 1(%r20)
	extru	%ret1, 23, 8, %r22
	stbs,ma	%r22, 1(%r20)
	b	.Ldone
	stb	%ret1, 0(%r20)

.Lsmst7:
	/* 7 byte values are returned right justified:
	      ret0     ret1
	   7: ??aabbcc ddeeffgg */
	extru	%ret0, 15, 8, %r22
	stbs,ma	%r22, 1(%r20)
	extru	%ret0, 23, 8, %r22
	stbs,ma	%r22, 1(%r20)
	stbs,ma	%ret0, 1(%r20)
	extru	%ret1, 7, 8, %r22
	stbs,ma	%r22, 1(%r20)
	extru	%ret1, 15, 8, %r22
	stbs,ma	%r22, 1(%r20)
	extru	%ret1, 23, 8, %r22
	stbs,ma	%r22, 1(%r20)
	b	.Ldone
	stb	%ret1, 0(%r20)

.Lsmst8:
	/* 8 byte values are returned right justified:
	      ret0     ret1
	   8: aabbccdd eeffgghh */
	extru	%ret0, 7, 8, %r22
	stbs,ma	%r22, 1(%r20)
	extru	%ret0, 15, 8, %r22
	stbs,ma	%r22, 1(%r20)
	extru	%ret0, 23, 8, %r22
	stbs,ma	%r22, 1(%r20)
	stbs,ma	%ret0, 1(%r20)
	extru	%ret1, 7, 8, %r22
	stbs,ma	%r22, 1(%r20)
	extru	%ret1, 15, 8, %r22
	stbs,ma	%r22, 1(%r20)
	extru	%ret1, 23, 8, %r22
	stbs,ma	%r22, 1(%r20)
	stb	%ret1, 0(%r20)

.Ldone:
	/* all done, return */
	copy %r4, %sp                           /* pop arg stack */
	ldw 12(%r3), %r4
	ldwm -64(%sp), %r3                      /* .. and pop stack */
	ldw -20(%sp), %rp
	bv %r0(%rp)
	nop
	.exit
	.procend
.LFE1:

	/* void ffi_closure_pa32(void);
	   Called with closure argument in %r19 */
	.export ffi_closure_pa32,code
	.import ffi_closure_inner_pa32,code

	.type ffi_closure_pa32, @function
.LFB2:
ffi_closure_pa32:
	.proc
	.callinfo FRAME=64,CALLS,SAVE_RP,SAVE_SP,ENTRY_GR=3
	.entry

	stw %rp, -20(%sp)
.LCFI20:
	copy %r3, %r1
.LCFI21:
	copy %sp, %r3
.LCFI22:
	stwm %r1, 64(%sp)

	/* Put arguments onto the stack and call ffi_closure_inner.  */
	stw %arg0, -36(%r3)
	stw %arg1, -40(%r3)
	stw %arg2, -44(%r3)
	stw %arg3, -48(%r3)

	/* Retrieve closure pointer and real gp.  */
	copy    %r19, %arg0
	ldw     8(%r19), %r19
	bl ffi_closure_inner_pa32, %r2
	copy %r3, %arg1

	ldwm -64(%sp), %r3
	ldw -20(%sp), %rp
	ldw -36(%sp), %ret0
	bv %r0(%r2)
	ldw -40(%sp), %ret1

	.exit
	.procend
.LFE2:

	.section        ".eh_frame",EH_FRAME_FLAGS,@progbits
.Lframe1:
	.word   .LECIE1-.LSCIE1 ;# Length of Common Information Entry
.LSCIE1:
	.word   0x0     ;# CIE Identifier Tag
	.byte   0x1     ;# CIE Version
#ifdef __PIC__
	.ascii  "zR\0"  ;# CIE Augmentation: 'z' - data, 'R' - DW_EH_PE_... data
#else
	.ascii "\0"     ;# CIE Augmentation
#endif
	.uleb128 0x1    ;# CIE Code Alignment Factor
	.sleb128 4      ;# CIE Data Alignment Factor
	.byte   0x2     ;# CIE RA Column
#ifdef __PIC__
	.uleb128 0x1    ;# Augmentation size
	.byte	0x1b    ;# FDE Encoding (DW_EH_PE_pcrel|DW_EH_PE_sdata4)
#endif
	.byte   0xc     ;# DW_CFA_def_cfa
	.uleb128 0x1e
	.uleb128 0x0
	.align 4
.LECIE1:
.LSFDE1:
	.word   .LEFDE1-.LASFDE1        ;# FDE Length
.LASFDE1:
	.word   .LASFDE1-.Lframe1       ;# FDE CIE offset
#ifdef __PIC__
	.word	.LFB1-. ;# FDE initial location
#else
	.word	.LFB1   ;# FDE initial location
#endif
	.word   .LFE1-.LFB1     ;# FDE address range
#ifdef __PIC__
	.uleb128 0x0	;# Augmentation size: no data
#endif
	.byte   0x4     ;# DW_CFA_advance_loc4
	.word   .LCFI11-.LFB1
	.byte	0x83	;# DW_CFA_offset, column 0x3
	.uleb128 0x0
	.byte   0x11    ;# DW_CFA_offset_extended_sf; save r2 at [r30-20]
	.uleb128 0x2
	.sleb128 -5

	.byte   0x4     ;# DW_CFA_advance_loc4
	.word   .LCFI12-.LCFI11
	.byte   0xd     ;# DW_CFA_def_cfa_register = r3
	.uleb128 0x3

	.byte   0x4     ;# DW_CFA_advance_loc4
	.word   .LCFI13-.LCFI12
	.byte	0x84	;# DW_CFA_offset, column 0x4
	.uleb128 0x3

	.align 4
.LEFDE1:

.LSFDE2:
	.word   .LEFDE2-.LASFDE2        ;# FDE Length
.LASFDE2:
	.word   .LASFDE2-.Lframe1       ;# FDE CIE offset
#ifdef __PIC__
	.word   .LFB2-. ;# FDE initial location
#else
	.word   .LFB2   ;# FDE initial location
#endif
	.word   .LFE2-.LFB2     ;# FDE address range
#ifdef __PIC__
	.uleb128 0x0	;# Augmentation size: no data
#endif
	.byte   0x4     ;# DW_CFA_advance_loc4
	.word   .LCFI21-.LFB2
	.byte   0x83    ;# DW_CFA_offset, column 0x3
	.uleb128 0x0
	.byte   0x11    ;# DW_CFA_offset_extended_sf
	.uleb128 0x2
	.sleb128 -5

	.byte   0x4     ;# DW_CFA_advance_loc4
	.word   .LCFI22-.LCFI21
	.byte   0xd     ;# DW_CFA_def_cfa_register = r3
	.uleb128 0x3

	.align 4
.LEFDE2:
