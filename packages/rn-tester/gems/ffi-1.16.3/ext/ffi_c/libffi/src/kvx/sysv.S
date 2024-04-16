/* Copyright (c) 2020 Kalray

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
``Software''), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED ``AS IS'', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.  */

#if defined(__kvx__)
#define LIBFFI_ASM
#include <fficonfig.h>
#include <ffi.h>
#include <ffi_cfi.h>
#include <kvx/asm.h>

.text
.global ffi_call_SYSV
.type ffi_call_SYSV, @function
.type ffi_prep_args, @function
.align 8

/* ffi_call_SYSV

  r0: total size to allocate on stack
  r1: size of arg slots
  r2: extended cif structure, DO NOT REMOVE: it is used by ffi_prep_args()
  r3: return value address
  r4: function to call
  r5: integer sign extension method to be used
*/
ffi_call_SYSV:
	addd $r12 = $r12, -64
	so (-32)[$r12] = $r20r21r22r23
	;;
	sd (0)[$r12] = $r24
	;;
	get $r23 = $ra
	copyd $r20 = $r12
	sbfd $r12 = $r0, $r12
	;;
	copyd $r0 = $r12
	copyd $r21 = $r3
	copyd $r22 = $r4
	copyd $r24 = $r5
	call ffi_prep_args
	;;
	lo $r8r9r10r11 = (64)[$r12]
	;;
	lo $r4r5r6r7 = (32)[$r12]
	;;
	lo $r0r1r2r3 = (0)[$r12]
	copyd $r12 = $r0
	/* $r15 is the register used by the ABI to return big (>32 bytes)
	 * structs by value.
	 * It is also referred to as the "struct register" in the ABI.
	 */
	copyd $r15 = $r21
	icall $r22
	;;
	pcrel $r4 = @pcrel(.Ltable)
	cb.deqz $r24 ? .Lend
	;;
	addx8d $r24 = $r24, $r4
	;;
	igoto $r24
	;;
.Ltable:
0: /* we should never arrive here */
	goto .Lerror
	nop
	;;
1: /* Sign extend byte to double */
	sxbd $r0 = $r0
	goto .Lend
	;;
2: /* Sign extend half to double */
	sxhd $r0 = $r0
	goto .Lend
	;;
3: /* Sign extend word to double */
	sxwd $r0 = $r0
	goto .Lend
	;;
4: /* Zero extend byte to double */
	zxbd $r0 = $r0
	goto .Lend
	;;
5: /* Zero extend half to double */
	zxhd $r0 = $r0
	goto .Lend
	;;
6: /* Zero extend word to double */
	zxwd $r0 = $r0
	/* Fallthrough to .Lend */
	;;
.Lend:
	ld $r24 = (0)[$r12]
	;;
	set $ra = $r23
	lo $r20r21r22r23 = (32)[$r20]
	addd $r12 = $r20, 64
	;;
	ret
	;;
.Lerror:
	errop
	;;

#endif /* __kvx__ */

#if defined __ELF__ && defined __linux__
	.section .note.GNU-stack,"",%progbits
#endif

