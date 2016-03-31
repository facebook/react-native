/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.soloader;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.File;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.channels.FileChannel;

/**
 * Extract SoLoader boottsrap information from an ELF file.  This is not a general purpose ELF
 * library.
 *
 * See specification at http://www.sco.com/developers/gabi/latest/contents.html.  You will not be
 * able to verify the operation of the functions below without having read the ELF specification.
 */
public final class MinElf {

  public static final int ELF_MAGIC = 0x464c457f;

  public static final int DT_NULL = 0;
  public static final int DT_NEEDED = 1;
  public static final int DT_STRTAB = 5;

  public static final int PT_LOAD = 1;
  public static final int PT_DYNAMIC = 2;

  public static final int PN_XNUM = 0xFFFF;

  public static String[] extract_DT_NEEDED(File elfFile) throws IOException {
    FileInputStream is = new FileInputStream(elfFile);
    try {
      return extract_DT_NEEDED(is.getChannel());
    } finally {
      is.close(); // Won't throw
    }
  }

  /**
   * Treating {@code bb} as an ELF file, extract all the DT_NEEDED entries from its dynamic section.
   *
   * @param fc FileChannel referring to ELF file
   * @return Array of strings, one for each DT_NEEDED entry, in file order
   */
  public static String[] extract_DT_NEEDED(FileChannel fc)
      throws IOException {

    //
    // All constants below are fixed by the ELF specification and are the offsets of fields within
    // the elf.h data structures.
    //

    ByteBuffer bb = ByteBuffer.allocate(8 /* largest read unit */);

    // Read ELF header.

    bb.order(ByteOrder.LITTLE_ENDIAN);
    if (getu32(fc, bb, Elf32_Ehdr.e_ident) != ELF_MAGIC) {
      throw new ElfError("file is not ELF");
    }

    boolean is32 = (getu8(fc, bb, Elf32_Ehdr.e_ident + 0x4) == 1);
    if (getu8(fc, bb, Elf32_Ehdr.e_ident + 0x5) == 2) {
      bb.order(ByteOrder.BIG_ENDIAN);
    }

    // Offsets above are identical in 32- and 64-bit cases.

    // Find the offset of the dynamic linking information.

    long e_phoff = is32
        ? getu32(fc, bb, Elf32_Ehdr.e_phoff)
        :  get64(fc, bb, Elf64_Ehdr.e_phoff);

    long e_phnum = is32
        ? getu16(fc, bb, Elf32_Ehdr.e_phnum)
        : getu16(fc, bb, Elf64_Ehdr.e_phnum);

    int e_phentsize = is32
        ? getu16(fc, bb, Elf32_Ehdr.e_phentsize)
        : getu16(fc, bb, Elf64_Ehdr.e_phentsize);

    if (e_phnum == PN_XNUM) { // Overflowed into section[0].sh_info

      long e_shoff = is32
          ? getu32(fc, bb, Elf32_Ehdr.e_shoff)
          : get64(fc, bb, Elf64_Ehdr.e_shoff);

      long sh_info = is32
          ? getu32(fc, bb, e_shoff + Elf32_Shdr.sh_info)
          : getu32(fc, bb, e_shoff + Elf64_Shdr.sh_info);

      e_phnum = sh_info;
    }

    long dynStart = 0;
    long phdr = e_phoff;

    for (long i = 0; i < e_phnum; ++i) {
      long p_type = is32
          ? getu32(fc, bb, phdr + Elf32_Phdr.p_type)
          : getu32(fc, bb, phdr + Elf64_Phdr.p_type);

      if (p_type == PT_DYNAMIC) {
        long p_offset = is32
            ? getu32(fc, bb, phdr + Elf32_Phdr.p_offset)
            : get64(fc, bb, phdr + Elf64_Phdr.p_offset);

        dynStart = p_offset;
        break;
      }

      phdr += e_phentsize;
    }

    if (dynStart == 0) {
      throw new ElfError("ELF file does not contain dynamic linking information");
    }

    // Walk the items in the dynamic section, counting the DT_NEEDED entries.  Also remember where
    // the string table for those entries lives.  That table is a pointer, which we translate to an
    // offset below.

    long d_tag;
    int nr_DT_NEEDED = 0;
    long dyn = dynStart;
    long ptr_DT_STRTAB = 0;

    do {
      d_tag = is32
          ? getu32(fc, bb, dyn + Elf32_Dyn.d_tag)
          : get64(fc, bb, dyn + Elf64_Dyn.d_tag);

      if (d_tag == DT_NEEDED) {
        if (nr_DT_NEEDED == Integer.MAX_VALUE) {
          throw new ElfError("malformed DT_NEEDED section");
        }

        nr_DT_NEEDED += 1;
      } else if (d_tag == DT_STRTAB) {
        ptr_DT_STRTAB = is32
            ? getu32(fc, bb, dyn + Elf32_Dyn.d_un)
            : get64(fc, bb, dyn + Elf64_Dyn.d_un);
      }

      dyn += is32 ? 8 : 16;
    } while (d_tag != DT_NULL);

    if (ptr_DT_STRTAB == 0) {
      throw new ElfError("Dynamic section string-table not found");
    }

    // Translate the runtime string table pointer we found above to a file offset.

    long off_DT_STRTAB = 0;
    phdr = e_phoff;

    for (int i = 0; i < e_phnum; ++i) {
      long p_type = is32
          ? getu32(fc, bb, phdr + Elf32_Phdr.p_type)
          : getu32(fc, bb, phdr + Elf64_Phdr.p_type);

      if (p_type == PT_LOAD) {
        long p_vaddr = is32
            ? getu32(fc, bb, phdr + Elf32_Phdr.p_vaddr)
            : get64(fc, bb, phdr + Elf64_Phdr.p_vaddr);

        long p_memsz = is32
            ? getu32(fc, bb, phdr + Elf32_Phdr.p_memsz)
            : get64(fc, bb, phdr + Elf64_Phdr.p_memsz);

        if (p_vaddr <= ptr_DT_STRTAB && ptr_DT_STRTAB < p_vaddr + p_memsz) {
          long p_offset = is32
              ? getu32(fc, bb, phdr + Elf32_Phdr.p_offset)
              : get64(fc, bb, phdr + Elf64_Phdr.p_offset);

          off_DT_STRTAB = p_offset + (ptr_DT_STRTAB - p_vaddr);
          break;
        }
      }

      phdr += e_phentsize;
    }

    if (off_DT_STRTAB == 0) {
      throw new ElfError("did not find file offset of DT_STRTAB table");
    }

    String[] needed = new String[nr_DT_NEEDED];

    nr_DT_NEEDED = 0;
    dyn = dynStart;

    do {
      d_tag = is32
          ? getu32(fc, bb, dyn + Elf32_Dyn.d_tag)
          : get64(fc, bb, dyn + Elf64_Dyn.d_tag);

      if (d_tag == DT_NEEDED) {
        long d_val = is32
            ? getu32(fc, bb, dyn + Elf32_Dyn.d_un)
            : get64(fc, bb, dyn + Elf64_Dyn.d_un);

        needed[nr_DT_NEEDED] = getSz(fc, bb, off_DT_STRTAB + d_val);
        if (nr_DT_NEEDED == Integer.MAX_VALUE) {
          throw new ElfError("malformed DT_NEEDED section");
        }

        nr_DT_NEEDED += 1;
      }

      dyn += is32 ? 8 : 16;
    } while (d_tag != DT_NULL);

    if (nr_DT_NEEDED != needed.length) {
      throw new ElfError("malformed DT_NEEDED section");
    }

    return needed;
  }

  private static String getSz(FileChannel fc, ByteBuffer bb, long offset)
      throws IOException {
    StringBuilder sb = new StringBuilder();
    short b;
    while ((b = getu8(fc, bb, offset++)) != 0) {
      sb.append((char) b);
    }

    return sb.toString();
  }

  private static void read(FileChannel fc, ByteBuffer bb, int sz, long offset)
      throws IOException {
    bb.position(0);
    bb.limit(sz);
    if (fc.read(bb, offset) != sz) {
      throw new ElfError("ELF file truncated");
    }

    bb.position(0);
  }

  private static long get64(FileChannel fc, ByteBuffer bb, long offset)
      throws IOException {
    read(fc, bb, 8, offset);
    return bb.getLong();
  }

  private static long getu32(FileChannel fc, ByteBuffer bb, long offset)
      throws IOException {
    read(fc, bb, 4, offset);
    return bb.getInt() & 0xFFFFFFFFL; // signed -> unsigned
  }

  private static int getu16(FileChannel fc, ByteBuffer bb, long offset)
      throws IOException {
    read(fc, bb, 2, offset);
    return bb.getShort() & (int) 0xFFFF; // signed -> unsigned
  }

  private static short getu8(FileChannel fc, ByteBuffer bb, long offset)
      throws IOException {
    read(fc, bb, 1, offset);
    return (short) (bb.get() & 0xFF); // signed -> unsigned
  }

  private static class ElfError extends RuntimeException {
    ElfError(String why) {
      super(why);
    }
  }
}
