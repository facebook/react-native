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

require 'ffi/platform'
require 'ffi/struct_layout'
require 'ffi/struct_layout_builder'
require 'ffi/struct_by_reference'

module FFI

  class Struct

    # Get struct size
    # @return [Numeric]
    def size
      self.class.size
    end

    # @return [Fixnum] Struct alignment
    def alignment
      self.class.alignment
    end
    alias_method :align, :alignment

    # (see FFI::StructLayout#offset_of)
    def offset_of(name)
      self.class.offset_of(name)
    end

    # (see FFI::StructLayout#members)
    def members
      self.class.members
    end

    # @return [Array]
    # Get array of values from Struct fields.
    def values
      members.map { |m| self[m] }
    end

    # (see FFI::StructLayout#offsets)
    def offsets
      self.class.offsets
    end

    # Clear the struct content.
    # @return [self]
    def clear
      pointer.clear
      self
    end

    # Get {Pointer} to struct content.
    # @return [AbstractMemory]
    def to_ptr
      pointer
    end

    # Get struct size
    # @return [Numeric]
    def self.size
      defined?(@layout) ? @layout.size : defined?(@size) ? @size : 0
    end

    # set struct size
    # @param [Numeric] size
    # @return [size]
    def self.size=(size)
      raise ArgumentError, "Size already set" if defined?(@size) || defined?(@layout)
      @size = size
    end

    # @return (see Struct#alignment)
    def self.alignment
      @layout.alignment
    end

    # (see FFI::Type#members)
    def self.members
      @layout.members
    end

    # (see FFI::StructLayout#offsets)
    def self.offsets
      @layout.offsets
    end

    # (see FFI::StructLayout#offset_of)
    def self.offset_of(name)
      @layout.offset_of(name)
    end

    def self.in
      ptr(:in)
    end

    def self.out
      ptr(:out)
    end

    def self.ptr(flags = :inout)
      @ref_data_type ||= Type::Mapped.new(StructByReference.new(self))
    end

    def self.val
      @val_data_type ||= StructByValue.new(self)
    end

    def self.by_value
      self.val
    end

    def self.by_ref(flags = :inout)
      self.ptr(flags)
    end

    class ManagedStructConverter < StructByReference

      # @param [Struct] struct_class
      def initialize(struct_class)
        super(struct_class)

        raise NoMethodError, "release() not implemented for class #{struct_class}" unless struct_class.respond_to? :release
        @method = struct_class.method(:release)
      end

      # @param [Pointer] ptr
      # @param [nil] ctx
      # @return [Struct]
      def from_native(ptr, ctx)
        struct_class.new(AutoPointer.new(ptr, @method))
      end
    end

    def self.auto_ptr
      @managed_type ||= Type::Mapped.new(ManagedStructConverter.new(self))
    end


    class << self
      public

      # @return [StructLayout]
      # @overload layout
      #  @return [StructLayout]
      #  Get struct layout.
      # @overload layout(*spec)
      #  @param [Array<Symbol, Integer>,Array(Hash)] spec
      #  @return [StructLayout]
      #  Create struct layout from +spec+.
      #  @example Creating a layout from an array +spec+
      #    class MyStruct < Struct
      #      layout :field1, :int,
      #             :field2, :pointer,
      #             :field3, :string
      #    end
      #  @example Creating a layout from an array +spec+ with offset
      #    class MyStructWithOffset < Struct
      #      layout :field1, :int,
      #             :field2, :pointer, 6,  # set offset to 6 for this field
      #             :field3, :string
      #    end
      #  @example Creating a layout from a hash +spec+
      #    class MyStructFromHash < Struct
      #      layout :field1 => :int,
      #             :field2 => :pointer,
      #             :field3 => :string
      #    end
      #  @example Creating a layout with pointers to functions
      #    class MyFunctionTable < Struct
      #      layout :function1, callback([:int, :int], :int),
      #             :function2, callback([:pointer], :void),
      #             :field3, :string
      #    end
      def layout(*spec)
        return @layout if spec.size == 0

        warn "[DEPRECATION] Struct layout is already defined for class #{self.inspect}. Redefinition as in #{caller[0]} will be disallowed in ffi-2.0." if defined?(@layout)

        builder = StructLayoutBuilder.new
        builder.union = self < Union
        builder.packed = @packed if defined?(@packed)
        builder.alignment = @min_alignment if defined?(@min_alignment)

        if spec[0].kind_of?(Hash)
          hash_layout(builder, spec)
        else
          array_layout(builder, spec)
        end
        builder.size = @size if defined?(@size) && @size > builder.size
        cspec = builder.build
        @layout = cspec unless self == Struct
        @size = cspec.size
        return cspec
      end


      protected

      def callback(params, ret)
        mod = enclosing_module
        ret_type = find_type(ret, mod)
        if ret_type == Type::STRING
          raise TypeError, ":string is not allowed as return type of callbacks"
        end
        FFI::CallbackInfo.new(ret_type, params.map { |e| find_type(e, mod) })
      end

      def packed(packed = 1)
        @packed = packed
      end
      alias :pack :packed

      def aligned(alignment = 1)
        @min_alignment = alignment
      end
      alias :align :aligned

      def enclosing_module
        begin
          mod = self.name.split("::")[0..-2].inject(Object) { |obj, c| obj.const_get(c) }
          if mod.respond_to?(:find_type) && (mod.is_a?(FFI::Library) || mod < FFI::Struct)
            mod
          end
        rescue Exception
          nil
        end
      end


      def find_field_type(type, mod = enclosing_module)
        if type.kind_of?(Class) && type < Struct
          FFI::Type::Struct.new(type)

        elsif type.kind_of?(Class) && type < FFI::StructLayout::Field
          type

        elsif type.kind_of?(::Array)
          FFI::Type::Array.new(find_field_type(type[0]), type[1])

        else
          find_type(type, mod)
        end
      end

      def find_type(type, mod = enclosing_module)
        if mod
          mod.find_type(type)
        end || FFI.find_type(type)
      end

      private

      # @param [StructLayoutBuilder] builder
      # @param [Hash] spec
      # @return [builder]
      # Add hash +spec+ to +builder+.
      def hash_layout(builder, spec)
        spec[0].each do |name, type|
          builder.add name, find_field_type(type), nil
        end
      end

      # @param [StructLayoutBuilder] builder
      # @param [Array<Symbol, Integer>] spec
      # @return [builder]
      # Add array +spec+ to +builder+.
      def array_layout(builder, spec)
        i = 0
        while i < spec.size
          name, type = spec[i, 2]
          i += 2

          # If the next param is a Integer, it specifies the offset
          if spec[i].kind_of?(Integer)
            offset = spec[i]
            i += 1
          else
            offset = nil
          end

          builder.add name, find_field_type(type), offset
        end
      end
    end
  end
end
