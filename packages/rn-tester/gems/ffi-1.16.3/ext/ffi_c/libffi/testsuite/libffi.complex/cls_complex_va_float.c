/* Area:	ffi_call, closure_call
   Purpose:	Test complex' passed in variable argument lists.
   Limitations:	none.
   PR:		none.
   Originator:	<vogt@linux.vnet.ibm.com>.  */

/* { dg-do run } */

/* Alpha splits _Complex into two arguments.  It's illegal to pass
   float through varargs, so _Complex float goes badly.  In sort of
   gets passed as _Complex double, but the compiler doesn't agree
   with itself on this issue.  */
/* { dg-do run { xfail alpha*-*-* } } */

#include "complex_defs_float.inc"
#include "cls_complex_va.inc"
