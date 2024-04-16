/* -----------------------------------------------------------------------
   sysv.S - Copyright (c) 2012  Alexandre K. I. de Mendonca <alexandre.keunecke@gmail.com>,
                                Paulo Pizarro <paulo.pizarro@gmail.com>

   Blackfin Foreign Function Interface

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

.text
.align 4

	/*
	 There is a "feature" in the bfin toolchain that it puts a _ before function names
	 that's why the function here it's called _ffi_call_SYSV and not ffi_call_SYSV
	 */
	.global _ffi_call_SYSV;
	.type _ffi_call_SYSV, STT_FUNC;
	.func ffi_call_SYSV

	/*
         cif->bytes    = R0    (fp+8)
         &ecif         = R1    (fp+12)
         ffi_prep_args = R2    (fp+16)
         ret_type      = stack (fp+20)
         ecif.rvalue   = stack (fp+24)
         fn            = stack (fp+28)
                           got (fp+32)

        There is room for improvement here (we can use temporary registers
        instead of saving the values in the memory)
        REGS:
        P5 => Stack pointer (function arguments)
        R5 => cif->bytes
        R4 => ret->type

        FP-20 = P3
        FP-16 = SP (parameters area)
        FP-12 = SP (temp)
        FP-08 = function return part 1 [R0]
        FP-04 = function return part 2 [R1]
	*/

_ffi_call_SYSV:
.prologue:
	LINK 20;
	[FP-20] = P3;
	[FP+8] = R0;
	[FP+12] = R1;
	[FP+16] = R2;

.allocate_stack:
	//alocate cif->bytes into the stack
	R1 = [FP+8];
	R0 = SP;
	R0 = R0 - R1;
	R1 = 4;
	R0 = R0 - R1;
	[FP-12] = SP;
	SP = R0;
	[FP-16] = SP;

.call_prep_args:
	//get the addr of prep_args
	P0 = [P3 + _ffi_prep_args@FUNCDESC_GOT17M4];
	P1 = [P0];
	P3 = [P0+4];
	R0 = [FP-16];//SP (parameter area)
	R1 = [FP+12];//ecif
	call (P1);

.call_user_function:
	//ajust SP so as to allow the user function access the parameters on the stack
	SP = [FP-16]; //point to function parameters
	R0 = [SP];
	R1 = [SP+4];
	R2 = [SP+8];
	//load user function address
	P0 = FP;
	P0 +=28;
	P1 = [P0];
	P1 = [P1];
	P3 = [P0+4];
	/*
		For functions returning aggregate values (struct) occupying more than 8 bytes,
		the caller allocates the return value object on the stack and the address
		of this object is passed to the callee as a hidden argument in register P0.
	*/
	P0 = [FP+24];

	call (P1);
	SP = [FP-12];
.compute_return:
	P2 = [FP-20];
	[FP-8] = R0;
	[FP-4] = R1;

	R0 = [FP+20];
	R1 = R0 << 2;

	R0 = [P2+.rettable@GOT17M4];
	R0 = R1 + R0;
	P2 = R0;
	R1 = [P2];

	P2 = [FP+-20];
	R0 = [P2+.rettable@GOT17M4];
	R0 = R1 + R0;
	P2 = R0;
	R0 = [FP-8];
	R1 = [FP-4];
	jump (P2);

/*
#define FFIBFIN_RET_VOID 0
#define FFIBFIN_RET_BYTE 1
#define FFIBFIN_RET_HALFWORD 2
#define FFIBFIN_RET_INT64 3
#define FFIBFIN_RET_INT32 4
*/
.align 4
.align 4
.rettable:
	.dd .epilogue - .rettable
	.dd	.rbyte - .rettable;
	.dd	.rhalfword - .rettable;
	.dd	.rint64 - .rettable;
	.dd	.rint32 - .rettable;

.rbyte:
	P0 = [FP+24];
	R0 = R0.B (Z);
	[P0] = R0;
	JUMP .epilogue
.rhalfword:
	P0 = [FP+24];
	R0 = R0.L;
	[P0] = R0;
	JUMP .epilogue
.rint64:
	P0 = [FP+24];// &rvalue
	[P0] = R0;
	[P0+4] = R1;
	JUMP .epilogue
.rint32:
	P0 = [FP+24];
	[P0] = R0;
.epilogue:
	R0 = [FP+8];
	R1 = [FP+12];
	R2 = [FP+16];
	P3 = [FP-20];
	UNLINK;
	RTS;

.size _ffi_call_SYSV,.-_ffi_call_SYSV;
.endfunc
