/* -----------------------------------------------------------------------
   sysv.S - Copyright (c) 2014 Sebastian Macke <sebastian@macke.de>

   OpenRISC Foreign Function Interface

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
	.globl ffi_call_SYSV
	.type ffi_call_SYSV, @function
/*
  r3: size to allocate on stack
  r4: extended cif structure
  r5: function pointer ffi_prep_args
  r6: ret address
  r7: function to call
  r8: flag for return type
*/

ffi_call_SYSV:
	/* Store registers used on stack */
	l.sw -4(r1), r9 /* return address */
	l.sw -8(r1), r1 /* stack address */
	l.sw -12(r1), r14 /* callee saved registers */
	l.sw -16(r1), r16
	l.sw -20(r1), r18 
	l.sw -24(r1), r20

	l.ori r14, r1, 0x0 /* save stack pointer */
	l.addi r1, r1, -24

	l.ori r16, r7, 0x0 /* save function address */
	l.ori r18, r6, 0x0 /* save ret address */
	l.ori r20, r8, 0x0 /* save flag */

	l.sub r1, r1, r3 /* reserve space on stack */

	/* Call ffi_prep_args */
	l.ori r3, r1, 0x0  /* first argument stack address, second already ecif */
	l.jalr r5
	l.nop

	/* Load register arguments and call*/

	l.lwz r3, 0(r1)
	l.lwz r4, 4(r1)
	l.lwz r5, 8(r1)
	l.lwz r6, 12(r1)
	l.lwz r7, 16(r1)
	l.lwz r8, 20(r1)
	l.ori r1, r11, 0x0 /* new stack pointer */
	l.jalr r16
	l.nop
	
	/* handle return values */

	l.sfeqi r20, FFI_TYPE_STRUCT
	l.bf ret  /* structs don't return an rvalue */
	l.nop

	/* copy ret address */

	l.sfeqi r20, FFI_TYPE_UINT64
	l.bnf four_byte_ret  /* 8 byte value is returned */
	l.nop

	l.sw 4(r18), r12

four_byte_ret:
	l.sw 0(r18), r11

ret:
	/* return */
	l.ori r1, r14, 0x0 /* reset stack pointer */
	l.lwz r9, -4(r1)
	l.lwz r1, -8(r1)
	l.lwz r14, -12(r1)
	l.lwz r16, -16(r1)
	l.lwz r18, -20(r1)
	l.lwz r20, -24(r1)
	l.jr r9
	l.nop

.size ffi_call_SYSV, .-ffi_call_SYSV
