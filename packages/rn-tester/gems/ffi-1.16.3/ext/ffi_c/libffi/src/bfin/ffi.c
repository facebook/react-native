/* -----------------------------------------------------------------------
   ffi.c - Copyright (c) 2012  Alexandre K. I. de Mendonca <alexandre.keunecke@gmail.com>,
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
#include <ffi.h>
#include <ffi_common.h>

#include <stdlib.h>
#include <stdio.h>

/* Maximum number of GPRs available for argument passing.  */
#define MAX_GPRARGS 3

/*
 * Return types
 */
#define FFIBFIN_RET_VOID 0
#define FFIBFIN_RET_BYTE 1
#define FFIBFIN_RET_HALFWORD 2
#define FFIBFIN_RET_INT64 3
#define FFIBFIN_RET_INT32 4

/*====================================================================*/
/*                          PROTOTYPE          *
 /*====================================================================*/
void ffi_prep_args(unsigned char *, extended_cif *);

/*====================================================================*/
/*                          Externals                                 */
/*                          (Assembly)                                */
/*====================================================================*/

extern void ffi_call_SYSV(unsigned, extended_cif *, void(*)(unsigned char *, extended_cif *), unsigned, void *, void(*fn)(void));

/*====================================================================*/
/*                          Implementation                            */
/*                                                            */
/*====================================================================*/


/*
 * This function calculates the return type (size) based on type.
 */

ffi_status ffi_prep_cif_machdep(ffi_cif *cif)
{
   /* --------------------------------------*
    *   Return handling                *
    * --------------------------------------*/
   switch (cif->rtype->type) {
      case FFI_TYPE_VOID:
         cif->flags = FFIBFIN_RET_VOID;
         break;
      case FFI_TYPE_UINT16:
      case FFI_TYPE_SINT16:
         cif->flags = FFIBFIN_RET_HALFWORD;
         break;
      case FFI_TYPE_UINT8:
         cif->flags = FFIBFIN_RET_BYTE;
         break;
      case FFI_TYPE_INT:
      case FFI_TYPE_UINT32:
      case FFI_TYPE_SINT32:
      case FFI_TYPE_FLOAT:
      case FFI_TYPE_POINTER:
      case FFI_TYPE_SINT8:
         cif->flags = FFIBFIN_RET_INT32;
         break;
      case FFI_TYPE_SINT64:
      case FFI_TYPE_UINT64:
      case FFI_TYPE_DOUBLE:
          cif->flags = FFIBFIN_RET_INT64;
          break;
      case FFI_TYPE_STRUCT:
         if (cif->rtype->size <= 4){
        	 cif->flags = FFIBFIN_RET_INT32;
         }else if (cif->rtype->size == 8){
        	 cif->flags = FFIBFIN_RET_INT64;
         }else{
        	 //it will return via a hidden pointer in P0
        	 cif->flags = FFIBFIN_RET_VOID;
         }
         break;
      default:
         FFI_ASSERT(0);
         break;
   }
   return FFI_OK;
}

/*
 * This will prepare the arguments and will call the assembly routine
 * cif = the call interface
 * fn = the function to be called
 * rvalue = the return value
 * avalue = the arguments
 */
void ffi_call(ffi_cif *cif, void(*fn)(void), void *rvalue, void **avalue)
{
   int ret_type = cif->flags;
   extended_cif ecif;
   ecif.cif = cif;
   ecif.avalue = avalue;
   ecif.rvalue = rvalue;

   switch (cif->abi) {
      case FFI_SYSV:
         ffi_call_SYSV(cif->bytes, &ecif, ffi_prep_args, ret_type, ecif.rvalue, fn);
         break;
      default:
         FFI_ASSERT(0);
         break;
   }
}


/*
* This function prepares the parameters (copies them from the ecif to the stack)
*  to call the function (ffi_prep_args is called by the assembly routine in file
*  sysv.S, which also calls the actual function)
*/
void ffi_prep_args(unsigned char *stack, extended_cif *ecif)
{
   register unsigned int i = 0;
   void **p_argv;
   unsigned char *argp;
   ffi_type **p_arg;
   argp = stack;
   p_argv = ecif->avalue;
   for (i = ecif->cif->nargs, p_arg = ecif->cif->arg_types;
        (i != 0);
        i--, p_arg++) {
      size_t z;
      z = (*p_arg)->size;
      if (z < sizeof(int)) {
         z = sizeof(int);
         switch ((*p_arg)->type) {
            case FFI_TYPE_SINT8: {
                  signed char v = *(SINT8 *)(* p_argv);
                  signed int t = v;
                  *(signed int *) argp = t;
               }
               break;
            case FFI_TYPE_UINT8: {
                  unsigned char v = *(UINT8 *)(* p_argv);
                  unsigned int t = v;
                  *(unsigned int *) argp = t;
               }
               break;
            case FFI_TYPE_SINT16:
               *(signed int *) argp = (signed int) * (SINT16 *)(* p_argv);
               break;
            case FFI_TYPE_UINT16:
               *(unsigned int *) argp = (unsigned int) * (UINT16 *)(* p_argv);
               break;
            case FFI_TYPE_STRUCT:
               memcpy(argp, *p_argv, (*p_arg)->size);
               break;
            default:
               FFI_ASSERT(0);
               break;
         }
      } else if (z == sizeof(int)) {
         *(unsigned int *) argp = (unsigned int) * (UINT32 *)(* p_argv);
      } else {
         memcpy(argp, *p_argv, z);
      }
      p_argv++;
      argp += z;
   }
}



