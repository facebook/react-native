#
# Copyright (C) 2008, 2009 Wayne Meissner
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

  # This module implements a couple of class methods to play with IO.
  module IO
    # @param [Integer] fd file decriptor
    # @param [String] mode mode string
    # @return [::IO]
    # Synonym for IO::for_fd.
    def self.for_fd(fd, mode = "r")
      ::IO.for_fd(fd, mode)
    end

    # @param [#read] io io to read from
    # @param [AbstractMemory] buf destination for data read from +io+
    # @param [nil, Numeric] len maximul number of bytes to read from +io+. If +nil+,
    #  read until end of file.
    # @return [Numeric] length really read, in bytes
    #
    # A version of IO#read that reads data from an IO and put then into a native buffer.
    #
    # This will be optimized at some future time to eliminate the double copy.
    #
    def self.native_read(io, buf, len)
      tmp = io.read(len)
      return -1 unless tmp
      buf.put_bytes(0, tmp)
      tmp.length
    end

  end
end

