#
# Copyright (C) 2008-2010 Wayne Meissner
# Copyright (C) 2008, 2009 Andrea Fazzi
# Copyright (C) 2008, 2009 Luc Heinrich
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
#

module FFI

  class StructLayout

    # @return [Array<Array(Symbol, Numeric)>
    # Get an array of tuples (field name, offset of the field).
    def offsets
      members.map { |m| [ m, self[m].offset ] }
    end

    # @return [Numeric]
    # Get the offset of a field.
    def offset_of(field_name)
      self[field_name].offset
    end

    # An enum {Field} in a {StructLayout}.
    class Enum < Field

      # @param [AbstractMemory] ptr pointer on a {Struct}
      # @return [Object]
      # Get an object of type {#type} from memory pointed by +ptr+.
      def get(ptr)
        type.find(ptr.get_int(offset))
      end

      # @param [AbstractMemory] ptr pointer on a {Struct}
      # @param  value
      # @return [nil]
      # Set +value+ into memory pointed by +ptr+.
      def put(ptr, value)
        ptr.put_int(offset, type.find(value))
      end

    end

    class InnerStruct < Field
      def get(ptr)
        type.struct_class.new(ptr.slice(self.offset, self.size))
      end

     def put(ptr, value)
       raise TypeError, "wrong value type (expected #{type.struct_class})" unless value.is_a?(type.struct_class)
       ptr.slice(self.offset, self.size).__copy_from__(value.pointer, self.size)
     end
    end

    class Mapped < Field
      def initialize(name, offset, type, orig_field)
        @orig_field = orig_field
        super(name, offset, type)
      end

      def get(ptr)
        type.from_native(@orig_field.get(ptr), nil)
      end

      def put(ptr, value)
        @orig_field.put(ptr, type.to_native(value, nil))
      end
    end
  end
end
