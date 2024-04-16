/* -----------------------------------------------------------------------
   ia64_flags.h - Copyright (c) 2000 Hewlett Packard Company
   
   IA64/unix Foreign Function Interface 

   Original author: Hans Boehm, HP Labs

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

/* "Type" codes used between assembly and C.  When used as a part of
   a cfi->flags value, the low byte will be these extra type codes,
   and bits 8-31 will be the actual size of the type.  */

/* Small structures containing N words in integer registers.  */
#define FFI_IA64_TYPE_SMALL_STRUCT	(FFI_TYPE_LAST + 1)

/* Homogeneous Floating Point Aggregates (HFAs) which are returned
   in FP registers.  */
#define FFI_IA64_TYPE_HFA_FLOAT		(FFI_TYPE_LAST + 2)
#define FFI_IA64_TYPE_HFA_DOUBLE	(FFI_TYPE_LAST + 3)
#define FFI_IA64_TYPE_HFA_LDOUBLE	(FFI_TYPE_LAST + 4)
