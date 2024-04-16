require 'tempfile'
require 'open3'

module FFI

  # ConstGenerator turns C constants into ruby values.
  #
  # @example a simple example for stdio
  #  require 'ffi/tools/const_generator'
  #  cg = FFI::ConstGenerator.new('stdio') do |gen|
  #    gen.const(:SEEK_SET)
  #    gen.const('SEEK_CUR')
  #    gen.const('seek_end')   # this constant does not exist
  #  end            # #calculate called automatically at the end of the block
  #
  #  cg['SEEK_SET'] # => 0
  #  cg['SEEK_CUR'] # => 1
  #  cg['seek_end'] # => nil
  #  cg.to_ruby     # => "SEEK_SET = 0\nSEEK_CUR = 1\n# seek_end not available"
  class ConstGenerator
    @options = {}
    attr_reader :constants

    # Creates a new constant generator that uses +prefix+ as a name, and an
    # options hash.
    #
    # The only option is +:required+, which if set to +true+ raises an error if a
    # constant you have requested was not found.
    #
    # @param [#to_s] prefix
    # @param [Hash] options
    # @return
    # @option options [Boolean] :required
    # @overload initialize(prefix, options)
    # @overload initialize(prefix, options) { |gen| ... }
    #  @yieldparam [ConstGenerator] gen new generator is passed to the block
    #  When passed a block, {#calculate} is automatically called at the end of
    #  the block, otherwise you must call it yourself.
    def initialize(prefix = nil, options = {})
      @includes = ['stdio.h', 'stddef.h']
      @constants = {}
      @prefix = prefix

      @required = options[:required]
      @options = options

      if block_given? then
        yield self
        calculate self.class.options.merge(options)
      end
    end
    # Set class options
    # These options are merged with {#initialize} options when it is called with a block.
    # @param [Hash] options
    # @return [Hash] class options
    def self.options=(options)
      @options = options
    end
    # Get class options.
    # @return [Hash] class options
    def self.options
      @options
    end
    # @param [String] name
    # @return constant value (converted if a +converter+ was defined).
    # Access a constant by name.
    def [](name)
      @constants[name].converted_value
    end

    # Request the value for C constant +name+.
    #
    # @param [#to_s] name C constant name
    # @param [String] format a printf format string to print the value out
    # @param [String] cast a C cast for the value
    # @param ruby_name alternate ruby name for {#to_ruby}
    #
    # @overload const(name, format=nil, cast='', ruby_name=nil, converter=nil)
    #  +converter+ is a Method or a Proc.
    #  @param [#call] converter convert the value from a string to the appropriate
    #   type for {#to_ruby}.
    # @overload const(name, format=nil, cast='', ruby_name=nil) { |value| ... }
    #  Use a converter block. This block convert the value from a string to the
    #  appropriate type for {#to_ruby}.
    #  @yieldparam value constant value
    def const(name, format = nil, cast = '', ruby_name = nil, converter = nil,
              &converter_proc)
      format ||= '%d'
      cast ||= ''

      if converter_proc and converter then
        raise ArgumentError, "Supply only converter or converter block"
      end

      converter = converter_proc if converter.nil?

      const = Constant.new name, format, cast, ruby_name, converter
      @constants[name.to_s] = const
      return const
    end

    # Calculate constants values.
    # @param [Hash] options
    # @option options [String] :cppflags flags for C compiler
    # @return [nil]
    # @raise if a constant is missing and +:required+ was set to +true+ (see {#initialize})
    def calculate(options = {})
      binary_path = nil

      Tempfile.open("#{@prefix}.const_generator") do |f|
        binary_path = f.path + ".bin"
        @includes.each do |inc|
          f.puts "#include <#{inc}>"
        end
        f.puts "\nint main(int argc, char **argv)\n{"

        @constants.each_value do |const|
          f.puts <<-EOF
  #ifdef #{const.name}
  printf("#{const.name} #{const.format}\\n", #{const.cast}#{const.name});
  #endif
          EOF
        end

        f.puts "\n\treturn 0;\n}"
        f.flush

        cc = ENV['CC'] || 'gcc'
        output = `#{cc} #{options[:cppflags]} -D_DARWIN_USE_64_BIT_INODE -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -x c -Wall -Werror #{f.path} -o #{binary_path} 2>&1`

        unless $?.success? then
          output = output.split("\n").map { |l| "\t#{l}" }.join "\n"
          raise "Compilation error generating constants #{@prefix}:\n#{output}"
        end
      end

      output = `#{binary_path}`
      File.unlink(binary_path + (FFI::Platform.windows? ? ".exe" : ""))
      output.each_line do |line|
        line =~ /^(\S+)\s(.*)$/
        const = @constants[$1]
        const.value = $2
      end

      missing_constants = @constants.select do |name, constant|
        constant.value.nil?
      end.map { |name,| name }

      if @required and not missing_constants.empty? then
        raise "Missing required constants for #{@prefix}: #{missing_constants.join ', '}"
      end
    end

    # Dump constants to +io+.
    # @param [#puts] io
    # @return [nil]
    def dump_constants(io)
      @constants.each do |name, constant|
        name = [@prefix, name].join '.' if @prefix
        io.puts "#{name} = #{constant.converted_value}"
      end
    end

    # Outputs values for discovered constants.  If the constant's value was
    # not discovered it is not omitted.
    # @return [String]
    def to_ruby
      @constants.sort_by { |name,| name }.map do |name, constant|
        if constant.value.nil? then
          "# #{name} not available"
        else
          constant.to_ruby
        end
      end.join "\n"
    end

    # Add additional C include file(s) to calculate constants from.
    # @note +stdio.h+ and +stddef.h+ automatically included
    # @param [List<String>, Array<String>] i include file(s)
    # @return [Array<String>] array of include files
    def include(*i)
      @includes |= i.flatten
    end

  end

  # This class hold constants for {ConstGenerator}
  class ConstGenerator::Constant

    attr_reader :name, :format, :cast
    attr_accessor :value

    # @param [#to_s] name
    # @param [String] format a printf format string to print the value out
    # @param [String] cast a C cast for the value
    # @param ruby_name alternate ruby name for {#to_ruby}
    # @param [#call] converter convert the value from a string to the appropriate
    #  type for {#to_ruby}.
    def initialize(name, format, cast, ruby_name = nil, converter=nil)
      @name = name
      @format = format
      @cast = cast
      @ruby_name = ruby_name
      @converter = converter
      @value = nil
    end

    # Return constant value (converted if a +converter+ was defined).
    # @return constant value.
    def converted_value
      if @converter
        @converter.call(@value)
      else
        @value
      end
    end

    # get constant ruby name
    # @return [String]
    def ruby_name
      @ruby_name || @name
    end

    # Get an evaluable string from constant.
    # @return [String]
    def to_ruby
      "#{ruby_name} = #{converted_value}"
    end

  end

end
