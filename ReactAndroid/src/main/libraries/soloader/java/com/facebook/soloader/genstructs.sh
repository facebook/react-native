#!/bin/bash

#
# This script generates Java structures that contain the offsets of
# fields in various ELF ABI structures.  com.facebook.soloader.MinElf
# uses these structures while parsing ELF files.
#

set -euo pipefail

struct2java() {
    ../../../../scripts/struct2java.py "$@"
}

declare -a structs=(Elf32_Ehdr Elf64_Ehdr)
structs+=(Elf32_Ehdr Elf64_Ehdr)
structs+=(Elf32_Phdr Elf64_Phdr)
structs+=(Elf32_Shdr Elf64_Shdr)
structs+=(Elf32_Dyn Elf64_Dyn)

for struct in "${structs[@]}"; do
    cat > elfhdr.c <<EOF
#include <elf.h>
static const $struct a;
EOF
    gcc -g -c -o elfhdr.o elfhdr.c
    cat > $struct.java <<EOF
// Copyright 2004-present Facebook. All Rights Reserved.
// AUTOMATICALLY GENERATED CODE. Regenerate with genstructs.sh.
package com.facebook.soloader;
EOF
    struct2java elfhdr.o $struct >> $struct.java
done

rm -f elfhdr.o elfhdr.c
