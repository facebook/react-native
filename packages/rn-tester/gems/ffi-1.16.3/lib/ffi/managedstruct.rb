# Copyright (C) 2008 Mike Dalessio
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
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

module FFI
  #
  # FFI::ManagedStruct allows custom garbage-collection of your FFI::Structs.
  #
  # The typical use case would be when interacting with a library
  # that has a nontrivial memory management design, such as a linked
  # list or a binary tree.
  #
  # When the {Struct} instance is garbage collected, FFI::ManagedStruct will
  # invoke the class's release() method during object finalization.
  #
  # @example Example usage:
  #  module MyLibrary
  #    ffi_lib "libmylibrary"
  #    attach_function :new_dlist, [], :pointer
  #    attach_function :destroy_dlist, [:pointer], :void
  #  end
  #
  #  class DoublyLinkedList < FFI::ManagedStruct
  #    @@@
  #    struct do |s|
  #      s.name 'struct dlist'
  #      s.include 'dlist.h'
  #      s.field :head, :pointer
  #      s.field :tail, :pointer
  #    end
  #    @@@
  #
  #    def self.release ptr
  #      MyLibrary.destroy_dlist(ptr)
  #    end
  #  end
  #
  #  begin
  #    ptr = DoublyLinkedList.new(MyLibrary.new_dlist)
  #    #  do something with the list
  #  end
  #  # struct is out of scope, and will be GC'd using DoublyLinkedList#release
  #
  #
  class ManagedStruct < FFI::Struct

    # @overload initialize(pointer)
    #  @param [Pointer] pointer
    #  Create a new ManagedStruct which will invoke the class method #release on
    # @overload initialize
    # A new instance of FFI::ManagedStruct.
    def initialize(pointer=nil)
      raise NoMethodError, "release() not implemented for class #{self}" unless self.class.respond_to?(:release, true)
      raise ArgumentError, "Must supply a pointer to memory for the Struct" unless pointer
      super AutoPointer.new(pointer, self.class.method(:release))
    end

  end
end
