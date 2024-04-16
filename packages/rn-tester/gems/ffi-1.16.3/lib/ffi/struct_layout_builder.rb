#
# Copyright (C) 2008-2010 Wayne Meissner
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

  # Build a {StructLayout struct layout}.
  class StructLayoutBuilder
    attr_reader :size
    attr_reader :alignment

    def initialize
      @size = 0
      @alignment = 1
      @min_alignment = 1
      @packed = false
      @union = false
      @fields = Array.new
    end

    # Set size attribute with +size+ only if +size+ is greater than attribute value.
    # @param [Numeric] size
    def size=(size)
      @size = size if size > @size
    end

    # Set alignment attribute with +align+ only if it is greater than attribute value.
    # @param [Numeric] align
    def alignment=(align)
      @alignment = align if align > @alignment
      @min_alignment = align
    end

    # Set union attribute.
    # Set to +true+ to build a {Union} instead of a {Struct}.
    # @param [Boolean] is_union
    # @return [is_union]
    def union=(is_union)
      @union = is_union
    end

    # Building a {Union} or a {Struct} ?
    #
    # @return [Boolean]
    #
    def union?
      @union
    end

    # Set packed attribute
    # @overload packed=(packed) Set alignment and packed attributes to
    #   +packed+.
    #
    #   @param [Fixnum] packed
    #
    #   @return [packed]
    # @overload packed=(packed) Set packed attribute.
    #   @param packed
    #
    #   @return [0,1]
    #
    def packed=(packed)
      if packed.is_a?(0.class)
        @alignment = packed
        @packed = packed
      else
        @packed = packed ? 1 : 0
      end
    end


    # List of number types
    NUMBER_TYPES = [
      Type::INT8,
      Type::UINT8,
      Type::INT16,
      Type::UINT16,
      Type::INT32,
      Type::UINT32,
      Type::LONG,
      Type::ULONG,
      Type::INT64,
      Type::UINT64,
      Type::FLOAT32,
      Type::FLOAT64,
      Type::LONGDOUBLE,
      Type::BOOL,
    ].freeze

    # @param [String, Symbol] name name of the field
    # @param [Array, DataConverter, Struct, StructLayout::Field, Symbol, Type] type type of the field
    # @param [Numeric, nil] offset
    # @return [self]
    # Add a field to the builder.
    # @note Setting +offset+ to +nil+ or +-1+ is equivalent to +0+.
    def add(name, type, offset = nil)

      if offset.nil? || offset == -1
        offset = @union ? 0 : align(@size, @packed ? [ @packed, type.alignment ].min : [ @min_alignment, type.alignment ].max)
      end

      #
      # If a FFI::Type type was passed in as the field arg, try and convert to a StructLayout::Field instance
      #
      field = type.is_a?(StructLayout::Field) ? type : field_for_type(name, offset, type)
      @fields << field
      @alignment = [ @alignment, field.alignment ].max unless @packed
      @size = [ @size, field.size + (@union ? 0 : field.offset) ].max

      return self
    end

    # @param (see #add)
    # @return (see #add)
    # Same as {#add}.
    # @see #add
    def add_field(name, type, offset = nil)
      add(name, type, offset)
    end

    # @param (see #add)
    # @return (see #add)
    # Add a struct as a field to the builder.
    def add_struct(name, type, offset = nil)
      add(name, Type::Struct.new(type), offset)
    end

    # @param name (see #add)
    # @param type (see #add)
    # @param [Numeric] count array length
    # @param offset (see #add)
    # @return (see #add)
    # Add an array as a field to the builder.
    def add_array(name, type, count, offset = nil)
      add(name, Type::Array.new(type, count), offset)
    end

    # @return [StructLayout]
    # Build and return the struct layout.
    def build
      # Add tail padding if the struct is not packed
      size = @packed ? @size : align(@size, @alignment)

      layout = StructLayout.new(@fields, size, @alignment)
      layout.__union! if @union
      layout
    end

    private

    # @param [Numeric] offset
    # @param [Numeric] align
    # @return [Numeric]
    def align(offset, align)
      align + ((offset - 1) & ~(align - 1));
    end

    # @param (see #add)
    # @return [StructLayout::Field]
    def field_for_type(name, offset, type)
      field_class = case
      when type.is_a?(Type::Function)
        StructLayout::Function

      when type.is_a?(Type::Struct)
        StructLayout::InnerStruct

      when type.is_a?(Type::Array)
        StructLayout::Array

      when type.is_a?(FFI::Enum)
        StructLayout::Enum

      when NUMBER_TYPES.include?(type)
        StructLayout::Number

      when type == Type::POINTER
        StructLayout::Pointer

      when type == Type::STRING
        StructLayout::String

      when type.is_a?(Class) && type < StructLayout::Field
        type

      when type.is_a?(DataConverter)
        return StructLayout::Mapped.new(name, offset, Type::Mapped.new(type), field_for_type(name, offset, type.native_type))

      when type.is_a?(Type::Mapped)
        return StructLayout::Mapped.new(name, offset, type, field_for_type(name, offset, type.native_type))

      else
        raise TypeError, "invalid struct field type #{type.inspect}"
      end

      field_class.new(name, offset, type)
    end
  end

end
