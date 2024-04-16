Status
======

libffi-3.4.4 was released on October 23, 2022.  Check the libffi web
page for updates: <URL:http://sourceware.org/libffi/>.


What is libffi?
===============

Compilers for high level languages generate code that follow certain
conventions. These conventions are necessary, in part, for separate
compilation to work. One such convention is the "calling
convention". The "calling convention" is essentially a set of
assumptions made by the compiler about where function arguments will
be found on entry to a function. A "calling convention" also specifies
where the return value for a function is found.

Some programs may not know at the time of compilation what arguments
are to be passed to a function. For instance, an interpreter may be
told at run-time about the number and types of arguments used to call
a given function. Libffi can be used in such programs to provide a
bridge from the interpreter program to compiled code.

The libffi library provides a portable, high level programming
interface to various calling conventions. This allows a programmer to
call any function specified by a call interface description at run
time.

FFI stands for Foreign Function Interface.  A foreign function
interface is the popular name for the interface that allows code
written in one language to call code written in another language. The
libffi library really only provides the lowest, machine dependent
layer of a fully featured foreign function interface. A layer must
exist above libffi that handles type conversions for values passed
between the two languages.


Supported Platforms
===================

Libffi has been ported to many different platforms.

At the time of release, the following basic configurations have been
tested:

| Architecture    | Operating System | Compiler                |
| --------------- | ---------------- | ----------------------- |
| AArch64 (ARM64) | iOS              | Clang                   |
| AArch64         | Linux            | GCC                     |
| AArch64         | Windows          | MSVC                    |
| Alpha           | Linux            | GCC                     |
| Alpha           | Tru64            | GCC                     |
| ARC             | Linux            | GCC                     |
| ARC32           | Linux            | GCC                     |
| ARC64           | Linux            | GCC                     |
| ARM             | Linux            | GCC                     |
| ARM             | iOS              | GCC                     |
| ARM             | Windows          | MSVC                    |
| AVR32           | Linux            | GCC                     |
| Blackfin        | uClinux          | GCC                     |
| CSKY            | Linux            | GCC                     |
| HPPA            | HPUX             | GCC                     |
| HPPA64          | HPUX             | GCC                     |
| KVX             | Linux            | GCC                     |
| IA-64           | Linux            | GCC                     |
| LoongArch64     | Linux            | GCC                     |
| M68K            | FreeMiNT         | GCC                     |
| M68K            | Linux            | GCC                     |
| M68K            | RTEMS            | GCC                     |
| M88K            | OpenBSD/mvme88k  | GCC                     |
| Meta            | Linux            | GCC                     |
| MicroBlaze      | Linux            | GCC                     |
| MIPS            | IRIX             | GCC                     |
| MIPS            | Linux            | GCC                     |
| MIPS            | RTEMS            | GCC                     |
| MIPS64          | Linux            | GCC                     |
| Moxie           | Bare metal       | GCC                     |
| Nios II         | Linux            | GCC                     |
| OpenRISC        | Linux            | GCC                     |
| PowerPC 32-bit  | AIX              | GCC                     |
| PowerPC 32-bit  | AIX              | IBM XL C                |
| PowerPC 64-bit  | AIX              | IBM XL C                |
| PowerPC         | AMIGA            | GCC                     |
| PowerPC         | Linux            | GCC                     |
| PowerPC         | Mac OSX          | GCC                     |
| PowerPC         | FreeBSD          | GCC                     |
| PowerPC 64-bit  | FreeBSD          | GCC                     |
| PowerPC 64-bit  | Linux ELFv1      | GCC                     |
| PowerPC 64-bit  | Linux ELFv2      | GCC                     |
| RISC-V 32-bit   | Linux            | GCC                     |
| RISC-V 64-bit   | Linux            | GCC                     |
| S390            | Linux            | GCC                     |
| S390X           | Linux            | GCC                     |
| SPARC           | Linux            | GCC                     |
| SPARC           | Solaris          | GCC                     |
| SPARC           | Solaris          | Oracle Solaris Studio C |
| SPARC64         | Linux            | GCC                     |
| SPARC64         | FreeBSD          | GCC                     |
| SPARC64         | Solaris          | Oracle Solaris Studio C |
| TILE-Gx/TILEPro | Linux            | GCC                     |
| VAX             | OpenBSD/vax      | GCC                     |
| WASM32          | Emscripten       | EMCC                    |
| X86             | FreeBSD          | GCC                     |
| X86             | GNU HURD         | GCC                     |
| X86             | Interix          | GCC                     |
| X86             | kFreeBSD         | GCC                     |
| X86             | Linux            | GCC                     |
| X86             | OpenBSD          | GCC                     |
| X86             | OS/2             | GCC                     |
| X86             | Solaris          | GCC                     |
| X86             | Solaris          | Oracle Solaris Studio C |
| X86             | Windows/Cygwin   | GCC                     |
| X86             | Windows/MinGW    | GCC                     |
| X86-64          | FreeBSD          | GCC                     |
| X86-64          | Linux            | GCC                     |
| X86-64          | Linux/x32        | GCC                     |
| X86-64          | OpenBSD          | GCC                     |
| X86-64          | Solaris          | Oracle Solaris Studio C |
| X86-64          | Windows/Cygwin   | GCC                     |
| X86-64          | Windows/MinGW    | GCC                     |
| X86-64          | Mac OSX          | GCC                     |
| Xtensa          | Linux            | GCC                     |

Please send additional platform test results to
libffi-discuss@sourceware.org.

Installing libffi
=================

First you must configure the distribution for your particular
system. Go to the directory you wish to build libffi in and run the
"configure" program found in the root directory of the libffi source
distribution.  Note that building libffi requires a C99 compatible
compiler.

If you're building libffi directly from git hosted sources, configure
won't exist yet; run ./autogen.sh first.  This will require that you
install autoconf, automake and libtool.

You may want to tell configure where to install the libffi library and
header files. To do that, use the ``--prefix`` configure switch.  Libffi
will install under /usr/local by default.

If you want to enable extra run-time debugging checks use the the
``--enable-debug`` configure switch. This is useful when your program dies
mysteriously while using libffi.

Another useful configure switch is ``--enable-purify-safety``. Using this
will add some extra code which will suppress certain warnings when you
are using Purify with libffi. Only use this switch when using
Purify, as it will slow down the library.

If you don't want to build documentation, use the ``--disable-docs``
configure switch.

It's also possible to build libffi on Windows platforms with
Microsoft's Visual C++ compiler.  In this case, use the msvcc.sh
wrapper script during configuration like so:

    path/to/configure CC=path/to/msvcc.sh CXX=path/to/msvcc.sh LD=link CPP="cl -nologo -EP" CPPFLAGS="-DFFI_BUILDING_DLL"

For 64-bit Windows builds, use ``CC="path/to/msvcc.sh -m64"`` and
``CXX="path/to/msvcc.sh -m64"``.  You may also need to specify
``--build`` appropriately.

It is also possible to build libffi on Windows platforms with the LLVM
project's clang-cl compiler, like below:

    path/to/configure CC="path/to/msvcc.sh -clang-cl" CXX="path/to/msvcc.sh -clang-cl" LD=link CPP="clang-cl -EP"

When building with MSVC under a MingW environment, you may need to
remove the line in configure that sets 'fix_srcfile_path' to a 'cygpath'
command.  ('cygpath' is not present in MingW, and is not required when
using MingW-style paths.)

To build static library for ARM64 with MSVC using visual studio solution, msvc_build folder have
   aarch64/Ffi_staticLib.sln
   required header files in aarch64/aarch64_include/


SPARC Solaris builds require the use of the GNU assembler and linker.
Point ``AS`` and ``LD`` environment variables at those tool prior to
configuration.

For iOS builds, the ``libffi.xcodeproj`` Xcode project is available.

Configure has many other options. Use ``configure --help`` to see them all.

Once configure has finished, type "make". Note that you must be using
GNU make.  You can ftp GNU make from ftp.gnu.org:/pub/gnu/make .

To ensure that libffi is working as advertised, type "make check".
This will require that you have DejaGNU installed.

To install the library and header files, type ``make install``.


History
=======

See the git log for details at http://github.com/libffi/libffi.

    TBD - TBD
        Add support for wasm32.
        Add support for HPPA64, and many HPPA fixes.
        Add support for ARCv3: ARC32 & ARC64.
        Many x86 Darwin fixes.

    3.4.4 Oct-23-2022
        Important aarch64 fixes, including support for linux builds
          with Link Time Optimization (-flto).
        Fix x86 stdcall stack alignment.
        Fix x86 Windows msvc assembler compatibility.
        Fix moxie and or1k small structure args.

    3.4.3 Sep-19-2022
        All struct args are passed by value, regardless of size, as per ABIs.
        Enable static trampolines for Cygwin.
        Add support for Loongson's LoongArch64 architecture.
        Fix x32 static trampolines.
        Fix 32-bit x86 stdcall stack corruption.
        Fix ILP32 aarch64 support.

    3.4.2 Jun-28-2021
        Add static trampoline support for Linux on x86_64 and ARM64.
        Add support for Alibaba's CSKY architecture.
        Add support for Kalray's KVX architecture.
        Add support for Intel Control-flow Enforcement Technology (CET).
        Add support for ARM Pointer Authentication (PA).
        Fix 32-bit PPC regression.
        Fix MIPS soft-float problem.
        Enable tmpdir override with the $LIBFFI_TMPDIR environment variable.
        Enable compatibility with MSVC runtime stack checking.
        Reject float and small integer argument in ffi_prep_cif_var().
          Callers must promote these types themselves.

    3.3 Nov-23-2019
        Add RISC-V support.
        New API in support of GO closures.
        Add IEEE754 binary128 long double support for 64-bit Power
        Default to Microsoft's 64 bit long double ABI with Visual C++.
        GNU compiler uses 80 bits (128 in memory) FFI_GNUW64 ABI.
        Add Windows on ARM64 (WOA) support.
        Add Windows 32-bit ARM support.
        Raw java (gcj) API deprecated.
        Add pre-built PDF documentation to source distribution.
        Many new test cases and bug fixes.

    3.2.1 Nov-12-2014
        Build fix for non-iOS AArch64 targets.

    3.2 Nov-11-2014
        Add C99 Complex Type support (currently only supported on
          s390).
        Add support for PASCAL and REGISTER calling conventions on x86
          Windows/Linux.
        Add OpenRISC and Cygwin-64 support.
        Bug fixes.

    3.1 May-19-2014
        Add AArch64 (ARM64) iOS support.
        Add Nios II support.
        Add m88k and DEC VAX support.
        Add support for stdcall, thiscall, and fastcall on non-Windows
          32-bit x86 targets such as Linux.
        Various Android, MIPS N32, x86, FreeBSD and UltraSPARC IIi
          fixes.
        Make the testsuite more robust: eliminate several spurious
          failures, and respect the $CC and $CXX environment variables.
        Archive off the manually maintained ChangeLog in favor of git
          log.

    3.0.13 Mar-17-2013
        Add Meta support.
        Add missing Moxie bits.
        Fix stack alignment bug on 32-bit x86.
        Build fix for m68000 targets.
        Build fix for soft-float Power targets.
        Fix the install dir location for some platforms when building
          with GCC (OS X, Solaris).
        Fix Cygwin regression.

    3.0.12 Feb-11-2013
        Add Moxie support.
        Add AArch64 support.
        Add Blackfin support.
        Add TILE-Gx/TILEPro support.
        Add MicroBlaze support.
        Add Xtensa support.
        Add support for PaX enabled kernels with MPROTECT.
        Add support for native vendor compilers on
          Solaris and AIX.
        Work around LLVM/GCC interoperability issue on x86_64.

    3.0.11 Apr-11-2012
        Lots of build fixes.
        Add support for variadic functions (ffi_prep_cif_var).
        Add Linux/x32 support.
        Add thiscall, fastcall and MSVC cdecl support on Windows.
        Add Amiga and newer MacOS support.
        Add m68k FreeMiNT support.
        Integration with iOS' xcode build tools.
        Fix Octeon and MC68881 support.
        Fix code pessimizations.

    3.0.10 Aug-23-2011
        Add support for Apple's iOS.
        Add support for ARM VFP ABI.
        Add RTEMS support for MIPS and M68K.
        Fix instruction cache clearing problems on
          ARM and SPARC.
        Fix the N64 build on mips-sgi-irix6.5.
        Enable builds with Microsoft's compiler.
        Enable x86 builds with Oracle's Solaris compiler.
        Fix support for calling code compiled with Oracle's Sparc
          Solaris compiler.
        Testsuite fixes for Tru64 Unix.
        Additional platform support.

    3.0.9 Dec-31-2009
        Add AVR32 and win64 ports.  Add ARM softfp support.
        Many fixes for AIX, Solaris, HP-UX, *BSD.
        Several PowerPC and x86-64 bug fixes.
        Build DLL for windows.

    3.0.8 Dec-19-2008
        Add *BSD, BeOS, and PA-Linux support.

    3.0.7 Nov-11-2008
        Fix for ppc FreeBSD.
        (thanks to Andreas Tobler)

    3.0.6 Jul-17-2008
        Fix for closures on sh.
        Mark the sh/sh64 stack as non-executable.
        (both thanks to Kaz Kojima)

    3.0.5 Apr-3-2008
        Fix libffi.pc file.
        Fix #define ARM for IcedTea users.
        Fix x86 closure bug.

    3.0.4 Feb-24-2008
        Fix x86 OpenBSD configury.

    3.0.3 Feb-22-2008
        Enable x86 OpenBSD thanks to Thomas Heller, and
          x86-64 FreeBSD thanks to Björn König and Andreas Tobler.
        Clean up test instruction in README.

    3.0.2 Feb-21-2008
        Improved x86 FreeBSD support.
        Thanks to Björn König.

    3.0.1 Feb-15-2008
        Fix instruction cache flushing bug on MIPS.
        Thanks to David Daney.

    3.0.0 Feb-15-2008
        Many changes, mostly thanks to the GCC project.
        Cygnus Solutions is now Red Hat.

      [10 years go by...]

    1.20 Oct-5-1998
        Raffaele Sena produces ARM port.

    1.19 Oct-5-1998
        Fixed x86 long double and long long return support.
        m68k bug fixes from Andreas Schwab.
        Patch for DU assembler compatibility for the Alpha from Richard
          Henderson.

    1.18 Apr-17-1998
        Bug fixes and MIPS configuration changes.

    1.17 Feb-24-1998
        Bug fixes and m68k port from Andreas Schwab. PowerPC port from
        Geoffrey Keating. Various bug x86, Sparc and MIPS bug fixes.

    1.16 Feb-11-1998
        Richard Henderson produces Alpha port.

    1.15 Dec-4-1997
        Fixed an n32 ABI bug. New libtool, auto* support.

    1.14 May-13-97
        libtool is now used to generate shared and static libraries.
        Fixed a minor portability problem reported by Russ McManus
        <mcmanr@eq.gs.com>.

    1.13 Dec-2-1996
        Added --enable-purify-safety to keep Purify from complaining
          about certain low level code.
        Sparc fix for calling functions with < 6 args.
        Linux x86 a.out fix.

    1.12 Nov-22-1996
        Added missing ffi_type_void, needed for supporting void return
          types. Fixed test case for non MIPS machines. Cygnus Support
          is now Cygnus Solutions.

    1.11 Oct-30-1996
        Added notes about GNU make.

    1.10 Oct-29-1996
        Added configuration fix for non GNU compilers.

    1.09 Oct-29-1996
        Added --enable-debug configure switch. Clean-ups based on LCLint
        feedback. ffi_mips.h is always installed. Many configuration
        fixes. Fixed ffitest.c for sparc builds.

    1.08 Oct-15-1996
        Fixed n32 problem. Many clean-ups.

    1.07 Oct-14-1996
        Gordon Irlam rewrites v8.S again. Bug fixes.

    1.06 Oct-14-1996
        Gordon Irlam improved the sparc port.

    1.05 Oct-14-1996
        Interface changes based on feedback.

    1.04 Oct-11-1996
        Sparc port complete (modulo struct passing bug).

    1.03 Oct-10-1996
        Passing struct args, and returning struct values works for
        all architectures/calling conventions. Expanded tests.

    1.02 Oct-9-1996
        Added SGI n32 support. Fixed bugs in both o32 and Linux support.
        Added "make test".

    1.01 Oct-8-1996
        Fixed float passing bug in mips version. Restructured some
        of the code. Builds cleanly with SGI tools.

    1.00 Oct-7-1996
        First release. No public announcement.

Authors & Credits
=================

libffi was originally written by Anthony Green <green@moxielogic.com>.

The developers of the GNU Compiler Collection project have made
innumerable valuable contributions.  See the ChangeLog file for
details.

Some of the ideas behind libffi were inspired by Gianni Mariani's free
gencall library for Silicon Graphics machines.

The closure mechanism was designed and implemented by Kresten Krab
Thorup.

Major processor architecture ports were contributed by the following
developers:

    aarch64             Marcus Shawcroft, James Greenhalgh
    alpha               Richard Henderson
    arc                 Hackers at Synopsis
    arm                 Raffaele Sena
    avr32               Bradley Smith
    blackfin            Alexandre Keunecke I. de Mendonca
    cris                Simon Posnjak, Hans-Peter Nilsson
    csky                Ma Jun, Zhang Wenmeng
    frv                 Anthony Green
    ia64                Hans Boehm
    kvx                 Yann Sionneau
    loongarch64         Cheng Lulu, Xi Ruoyao, Xu Hao,
                        Zhang Wenlong, Pan Xuefeng
    m32r                Kazuhiro Inaoka
    m68k                Andreas Schwab
    m88k                Miod Vallat
    metag               Hackers at Imagination Technologies
    microblaze          Nathan Rossi
    mips                Anthony Green, Casey Marshall
    mips64              David Daney
    moxie               Anthony Green
    nios ii             Sandra Loosemore
    openrisc            Sebastian Macke
    pa                  Randolph Chung, Dave Anglin, Andreas Tobler
    pa64                Dave Anglin
    powerpc             Geoffrey Keating, Andreas Tobler,
                        David Edelsohn, John Hornkvist
    powerpc64           Jakub Jelinek
    riscv               Michael Knyszek, Andrew Waterman, Stef O'Rear
    s390                Gerhard Tonn, Ulrich Weigand
    sh                  Kaz Kojima
    sh64                Kaz Kojima
    sparc               Anthony Green, Gordon Irlam
    tile-gx/tilepro     Walter Lee
    vax                 Miod Vallat
    wasm32              Hood Chatham, Brion Vibber, Kleis Auke Wolthuizen
    x86                 Anthony Green, Jon Beniston
    x86-64              Bo Thorsen
    xtensa              Chris Zankel

Jesper Skov and Andrew Haley both did more than their fair share of
stepping through the code and tracking down bugs.

Thanks also to Tom Tromey for bug fixes, documentation and
configuration help.

Thanks to Jim Blandy, who provided some useful feedback on the libffi
interface.

Andreas Tobler has done a tremendous amount of work on the testsuite.

Alex Oliva solved the executable page problem for SElinux.

The list above is almost certainly incomplete and inaccurate.  I'm
happy to make corrections or additions upon request.

If you have a problem, or have found a bug, please file an issue on
our issue tracker at https://github.com/libffi/libffi/issues.

The author can be reached at green@moxielogic.com.

To subscribe/unsubscribe to our mailing lists, visit:
https://sourceware.org/mailman/listinfo/libffi-announce
https://sourceware.org/mailman/listinfo/libffi-discuss
