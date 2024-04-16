#
# Copyright (C) 2023 Lars Kanis
#
# This file is part of ruby-ffi.
#
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
#
# * Redistributions of source code must retain the above copyright notice, this
#   list of conditions and the following disclaimer.
# * Redistributions in binary form must reproduce the above copyright notice
#   this list of conditions and the following disclaimer in the documentation
#   and/or other materials provided with the distribution.
# * Neither the name of the Ruby FFI project nor the names of its contributors
#   may be used to endorse or promote products derived from this software
#   without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE
# FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
# DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
# SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
# CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
# OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.#

module FFI
  # Transform a generic library name and ABI number to a platform library name
  #
  # Example:
  #   module LibVips
  #     extend FFI::Library
  #     ffi_lib LibraryPath.new("vips", abi_number: 42)
  #   end
  #
  # This translates to the following library file names:
  #   libvips-42.dll    on Windows
  #   libvips.so.42     on Linux
  #   libvips.42.dylib  on Macos
  #
  # See https://packaging.ubuntu.com/html/libraries.html for more information about library naming.
  class LibraryPath
    attr_reader :name
    attr_reader :abi_number
    attr_reader :root

    # Build a new library path
    #
    # * <tt>name</tt> :  The name of the library without file prefix or suffix.
    # * <tt>abi_number</tt> :  The ABI number of the library.
    # * <tt>root</tt> :  An optional base path prepended to the library name.
    def initialize(name, abi_number: nil, root: nil)
      @name = name
      @abi_number = abi_number
      @root = root
    end

    def self.wrap(value)
      # We allow instances of LibraryPath to pass through transparently:
      return value if value.is_a?(self)

      # We special case a library named 'c' to be the standard C library:
      return Library::LIBC if value == 'c'

      # If provided a relative file name we convert it into a library path:
      if value && File.basename(value) == value
        return self.new(value)
      end

      # Otherwise, we assume it's a full path to a library:
      return value
    end

    def full_name
      # If the abi_number is given, we format it specifically according to platform rules:
      if abi_number
        if Platform.windows?
          "#{Platform::LIBPREFIX}#{name}-#{abi_number}.#{Platform::LIBSUFFIX}"
        elsif Platform.mac?
          "#{Platform::LIBPREFIX}#{name}.#{abi_number}.#{Platform::LIBSUFFIX}"
        else # Linux? BSD? etc.
          "#{Platform::LIBPREFIX}#{name}.#{Platform::LIBSUFFIX}.#{abi_number}"
        end
      else
        # Otherwise we just add prefix and suffix:
        lib = name
        # Add library prefix if missing
        lib = Platform::LIBPREFIX + lib unless lib =~ /^#{Platform::LIBPREFIX}/
        # Add library extension if missing
        r = Platform.windows? || Platform.mac? ? "\\.#{Platform::LIBSUFFIX}$" : "\\.so($|\\.[1234567890]+)"
        lib += ".#{Platform::LIBSUFFIX}" unless lib =~ /#{r}/
        lib
      end
    end

    def to_s
      if root
        # If the root path is given, we generate the full path:
        File.join(root, full_name)
      else
        full_name
      end
    end
  end
end
