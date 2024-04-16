require 'tempfile'

module FFI

  ##
  # Generates an FFI Struct layout.
  #
  # Given the @@@ portion in:
  #
  #   class Zlib::ZStream < FFI::Struct
  #     @@@
  #     name "struct z_stream_s"
  #     include "zlib.h"
  #
  #     field :next_in,   :pointer
  #     field :avail_in,  :uint
  #     field :total_in,  :ulong
  #
  #     # ...
  #     @@@
  #   end
  #
  # StructGenerator will create the layout:
  #
  #   layout :next_in, :pointer, 0,
  #          :avail_in, :uint, 4,
  #          :total_in, :ulong, 8,
  #          # ...
  #
  # StructGenerator does its best to pad the layout it produces to preserve
  # line numbers.  Place the struct definition as close to the top of the file
  # for best results.

  class StructGenerator
    @options = {}
    attr_accessor :size
    attr_reader   :fields

    def initialize(name, options = {})
      @name = name
      @struct_name = nil
      @includes = []
      @fields = []
      @found = false
      @size = nil

      if block_given? then
        yield self
        calculate self.class.options.merge(options)
      end
    end
    def self.options=(options)
      @options = options
    end
    def self.options
      @options
    end
    def calculate(options = {})
      binary = File.join Dir.tmpdir, "rb_struct_gen_bin_#{Process.pid}"

      raise "struct name not set" if @struct_name.nil?

      Tempfile.open("#{@name}.struct_generator") do |f|
        f.puts "#include <stdio.h>"

        @includes.each do |inc|
          f.puts "#include <#{inc}>"
        end

        f.puts "#include <stddef.h>\n\n"
        f.puts "int main(int argc, char **argv)\n{"
        f.puts "  #{@struct_name} s;"
        f.puts %[  printf("sizeof(#{@struct_name}) %u\\n", (unsigned int) sizeof(#{@struct_name}));]

        @fields.each do |field|
          f.puts <<-EOF
    printf("#{field.name} %u %u\\n", (unsigned int) offsetof(#{@struct_name}, #{field.name}),
           (unsigned int) sizeof(s.#{field.name}));
  EOF
        end

        f.puts "\n  return 0;\n}"
        f.flush

        cc = ENV['CC'] || 'gcc'
        output = `#{cc} #{options[:cppflags]} #{options[:cflags]} -D_DARWIN_USE_64_BIT_INODE -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -x c -Wall -Werror #{f.path} -o #{binary} 2>&1`

        unless $?.success? then
          @found = false
          output = output.split("\n").map { |l| "\t#{l}" }.join "\n"
          raise "Compilation error generating struct #{@name} (#{@struct_name}):\n#{output}"
        end
      end

      output = `#{binary}`.split "\n"
      File.unlink(binary + (FFI::Platform.windows? ? ".exe" : ""))
      sizeof = output.shift
      unless @size
        m = /\s*sizeof\([^)]+\) (\d+)/.match sizeof
        @size = m[1]
      end

      line_no = 0
      output.each do |line|
        md = line.match(/.+ (\d+) (\d+)/)
        @fields[line_no].offset = md[1].to_i
        @fields[line_no].size   = md[2].to_i

        line_no += 1
      end

      @found = true
    end

    def field(name, type=nil)
      field = Field.new(name, type)
      @fields << field
      return field
    end

    def found?
      @found
    end

    def dump_config(io)
      io.puts "rbx.platform.#{@name}.sizeof = #{@size}"

      @fields.each { |field| io.puts field.to_config(@name) }
    end

    def generate_layout
      buf = ""

      @fields.each_with_index do |field, i|
        if buf.empty?
          buf << "layout :#{field.name}, :#{field.type}, #{field.offset}"
        else
          buf << "       :#{field.name}, :#{field.type}, #{field.offset}"
        end

        if i < @fields.length - 1
          buf << ",\n"
        end
      end

      buf
    end

    def get_field(name)
      @fields.find { |f| name == f.name }
    end

    def include(i)
      @includes << i
    end

    def name(n)
      @struct_name = n
    end

  end

  ##
  # A field in a Struct.

  class StructGenerator::Field

    attr_reader :name
    attr_reader :type
    attr_reader :offset
    attr_accessor :size

    def initialize(name, type)
      @name = name
      @type = type
      @offset = nil
      @size = nil
    end

    def offset=(o)
      @offset = o
    end

    def to_config(name)
      buf = []
      buf << "rbx.platform.#{name}.#{@name}.offset = #{@offset}"
      buf << "rbx.platform.#{name}.#{@name}.size = #{@size}"
      buf << "rbx.platform.#{name}.#{@name}.type = #{@type}" if @type
      buf
    end

  end

end

