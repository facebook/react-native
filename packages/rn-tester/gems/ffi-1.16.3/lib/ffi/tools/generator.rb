require 'ffi/tools/struct_generator'
require 'ffi/tools/const_generator'

module FFI

  ##
  # Generate files with C structs for FFI::Struct and C constants.
  #
  # == A simple example
  #
  # In file +zlib.rb.ffi+:
  #   module Zlib
  #     @@@
  #     constants do |c|
  #       c.include "zlib.h"
  #       c.const :ZLIB_VERNUM
  #     end
  #     @@@
  #
  #     class ZStream < FFI::Struct
  #
  #       struct do |s|
  #         s.name "struct z_stream_s"
  #         s.include "zlib.h"
  #
  #         s.field :next_in,   :pointer
  #         s.field :avail_in,  :uint
  #         s.field :total_in,  :ulong
  #       end
  #       @@@
  #     end
  #   end
  #
  # Translate the file:
  #   require "ffi/tools/generator"
  #   FFI::Generator.new "zlib.rb.ffi", "zlib.rb"
  #
  # Generates the file +zlib.rb+ with constant values and offsets:
  #   module Zlib
  #   ZLIB_VERNUM = 4784
  #
  #   class ZStream < FFI::Struct
  #     layout :next_in, :pointer, 0,
  #            :avail_in, :uint, 8,
  #            :total_in, :ulong, 16
  #   end
  #
  # @see FFI::Generator::Task for easy integration in a Rakefile
  class Generator

    def initialize(ffi_name, rb_name, options = {})
      @ffi_name = ffi_name
      @rb_name = rb_name
      @options = options
      @name = File.basename rb_name, '.rb'

      file = File.read @ffi_name

      new_file = file.gsub(/^( *)@@@(.*?)@@@/m) do
        @constants = []
        @structs = []

        indent = $1
        original_lines = $2.count "\n"

        instance_eval $2, @ffi_name, $`.count("\n")

        new_lines = []
        @constants.each { |c| new_lines << c.to_ruby }
        @structs.each { |s| new_lines << s.generate_layout }

        new_lines = new_lines.join("\n").split "\n" # expand multiline blocks
        new_lines = new_lines.map { |line| indent + line }

        padding = original_lines - new_lines.length
        new_lines += [nil] * padding if padding >= 0

        new_lines.join "\n"
      end

      open @rb_name, 'w' do |f|
        f.puts "# This file is generated from `#{@ffi_name}'. Do not edit."
        f.puts
        f.puts new_file
      end
    end

    def constants(options = {}, &block)
      @constants << FFI::ConstGenerator.new(@name, @options.merge(options), &block)
    end

    def struct(options = {}, &block)
      @structs << FFI::StructGenerator.new(@name, @options.merge(options), &block)
    end

    ##
    # Utility converter for constants

    def to_s
      proc { |obj| obj.to_s.inspect }
    end

  end
end

