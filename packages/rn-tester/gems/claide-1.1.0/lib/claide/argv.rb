# encoding: utf-8

module CLAide
  # This class is responsible for parsing the parameters specified by the user,
  # accessing individual parameters, and keep state by removing handled
  # parameters.
  #
  class ARGV
    # @return [ARGV] Coerces an object to the ARGV class if needed.
    #
    # @param  [Object] argv
    #         The object which should be converted to the ARGV class.
    #
    def self.coerce(argv)
      if argv.is_a?(ARGV)
        argv
      else
        ARGV.new(argv)
      end
    end

    # @param [Array<#to_s>] argv
    #        A list of parameters.
    #
    def initialize(argv)
      @entries = Parser.parse(argv)
    end

    # @return [Boolean] Whether or not there are any remaining unhandled
    #         parameters.
    #
    def empty?
      @entries.empty?
    end

    # @return [Array<String>] A list of the remaining unhandled parameters, in
    #         the same format a user specifies it in.
    #
    # @example
    #
    #   argv = CLAide::ARGV.new(['tea', '--no-milk', '--sweetener=honey'])
    #   argv.shift_argument # => 'tea'
    #   argv.remainder      # => ['--no-milk', '--sweetener=honey']
    #
    def remainder
      @entries.map do |type, (key, value)|
        case type
        when :arg
          key
        when :flag
          "--#{'no-' if value == false}#{key}"
        when :option
          "--#{key}=#{value}"
        end
      end
    end

    # @return [Array<String>] A list of the remaining unhandled parameters, in
    #         the same format the user specified them.
    #
    # @example
    #
    #   argv = CLAide::ARGV.new(['tea', '--no-milk', '--sweetener=honey'])
    #   argv.shift_argument # => 'tea'
    #   argv.remainder!     # => ['--no-milk', '--sweetener=honey']
    #   argv.remainder      # => []
    #
    def remainder!
      remainder.tap { @entries.clear }
    end

    # @return [Hash] A hash that consists of the remaining flags and options
    #         and their values.
    #
    # @example
    #
    #   argv = CLAide::ARGV.new(['tea', '--no-milk', '--sweetener=honey'])
    #   argv.options # => { 'milk' => false, 'sweetener' => 'honey' }
    #
    def options
      options = {}
      @entries.each do |type, (key, value)|
        options[key] = value unless type == :arg
      end
      options
    end

    # @return [Array<String>] A list of the remaining arguments.
    #
    # @example
    #
    #   argv = CLAide::ARGV.new(['tea', 'white', '--no-milk', 'biscuit'])
    #   argv.shift_argument # => 'tea'
    #   argv.arguments      # => ['white', 'biscuit']
    #
    def arguments
      @entries.map { |type, value| value if type == :arg }.compact
    end

    # @return [Array<String>] A list of the remaining arguments.
    #
    # @note   This version also removes the arguments from the remaining
    #         parameters.
    #
    # @example
    #
    #   argv = CLAide::ARGV.new(['tea', 'white', '--no-milk', 'biscuit'])
    #   argv.arguments  # => ['tea', 'white', 'biscuit']
    #   argv.arguments! # => ['tea', 'white', 'biscuit']
    #   argv.arguments  # => []
    #
    def arguments!
      arguments = []
      while arg = shift_argument
        arguments << arg
      end
      arguments
    end

    # @return [String] The first argument in the remaining parameters.
    #
    # @note   This will remove the argument from the remaining parameters.
    #
    # @example
    #
    #   argv = CLAide::ARGV.new(['tea', 'white'])
    #   argv.shift_argument # => 'tea'
    #   argv.arguments      # => ['white']
    #
    def shift_argument
      if index = @entries.find_index { |type, _| type == :arg }
        entry = @entries[index]
        @entries.delete_at(index)
        entry.last
      end
    end

    # @return [Boolean, nil] Returns `true` if the flag by the specified `name`
    #         is among the remaining parameters and is not negated.
    #
    # @param  [String] name
    #         The name of the flag to look for among the remaining parameters.
    #
    # @param  [Boolean] default
    #         The value that is returned in case the flag is not among the
    #         remaining parameters.
    #
    # @note   This will remove the flag from the remaining parameters.
    #
    # @example
    #
    #   argv = CLAide::ARGV.new(['tea', '--no-milk', '--sweetener=honey'])
    #   argv.flag?('milk')       # => false
    #   argv.flag?('milk')       # => nil
    #   argv.flag?('milk', true) # => true
    #   argv.remainder           # => ['tea', '--sweetener=honey']
    #
    def flag?(name, default = nil)
      delete_entry(:flag, name, default, true)
    end

    # @return [String, nil] Returns the value of the option by the specified
    #         `name` is among the remaining parameters.
    #
    # @param  [String] name
    #         The name of the option to look for among the remaining
    #         parameters.
    #
    # @param  [String] default
    #         The value that is returned in case the option is not among the
    #         remaining parameters.
    #
    # @note   This will remove the option from the remaining parameters.
    #
    # @example
    #
    #   argv = CLAide::ARGV.new(['tea', '--no-milk', '--sweetener=honey'])
    #   argv.option('sweetener')          # => 'honey'
    #   argv.option('sweetener')          # => nil
    #   argv.option('sweetener', 'sugar') # => 'sugar'
    #   argv.remainder                   # => ['tea', '--no-milk']
    #
    def option(name, default = nil)
      delete_entry(:option, name, default)
    end

    # @return [Array<String>] Returns an array of all the values of the option
    #                         with the specified `name` among the remaining
    #                         parameters.
    #
    # @param  [String] name
    #         The name of the option to look for among the remaining
    #         parameters.
    #
    # @note   This will remove the option from the remaining parameters.
    #
    # @example
    #
    #   argv = CLAide::ARGV.new(['--ignore=foo', '--ignore=bar'])
    #   argv.all_options('include')  # => []
    #   argv.all_options('ignore')   # => ['bar', 'foo']
    #   argv.remainder               # => []
    #
    def all_options(name)
      options = []
      while entry = option(name)
        options << entry
      end
      options
    end

    private

    # @return [Array<Array<Symbol, String, Array>>] A list of tuples for each
    #         non consumed parameter, where the first entry is the `type` and
    #         the second entry the actual parsed parameter.
    #
    attr_reader :entries

    # @return [Bool, String, Nil] Removes an entry from the entries list and
    #         returns its value or the default value if the entry was not
    #         present.
    #
    # @param  [Symbol] requested_type
    #         The type of the entry.
    #
    # @param  [String] requested_key
    #         The key of the entry.
    #
    # @param  [Bool, String, Nil] default
    #         The value which should be returned if the entry is not present.
    #
    # @param  [Bool] delete_all
    #         Whether all values matching `requested_type` and `requested_key`
    #         should be deleted.
    #
    def delete_entry(requested_type, requested_key, default, delete_all = false)
      pred = proc do |type, (key, _value)|
        requested_key == key && requested_type == type
      end
      entry = entries.reverse_each.find(&pred)
      delete_all ? entries.delete_if(&pred) : entries.delete(entry)

      entry.nil? ? default : entry.last.last
    end

    module Parser
      # @return [Array<Array<Symbol, String, Array>>] A list of tuples for each
      #         parameter, where the first entry is the `type` and the second
      #         entry the actual parsed parameter.
      #
      # @example
      #
      #   list = parse(['tea', '--no-milk', '--sweetener=honey'])
      #   list # => [[:arg, "tea"],
      #              [:flag, ["milk", false]],
      #              [:option, ["sweetener", "honey"]]]
      #
      def self.parse(argv)
        entries = []
        copy = argv.map(&:to_s)
        double_dash = false
        while argument = copy.shift
          next if !double_dash && double_dash = (argument == '--')
          type = double_dash ? :arg : argument_type(argument)
          parsed_argument = parse_argument(type, argument)
          entries << [type, parsed_argument]
        end
        entries
      end

      # @return [Symbol] Returns the type of an argument. The types can be
      #         either: `:arg`, `:flag`, `:option`.
      #
      # @param  [String] argument
      #         The argument to check.
      #
      def self.argument_type(argument)
        if argument.start_with?('--')
          if argument.include?('=')
            :option
          else
            :flag
          end
        else
          :arg
        end
      end

      # @return [String, Array<String, String>] Returns the argument itself for
      #         normal arguments (like commands) and a tuple with the key and
      #         the value for options and flags.
      #
      # @param  [Symbol] type
      #         The type of the argument.
      #
      # @param  [String] argument
      #         The argument to check.
      #
      def self.parse_argument(type, argument)
        case type
        when :arg
          return argument
        when :flag
          return parse_flag(argument)
        when :option
          return argument[2..-1].split('=', 2)
        end
      end

      # @return [String, Array<String, String>] Returns the parameter
      #         describing a flag arguments.
      #
      # @param  [String] argument
      #         The flag argument to check.
      #
      def self.parse_flag(argument)
        if argument.start_with?('--no-')
          key = argument[5..-1]
          value = false
        else
          key = argument[2..-1]
          value = true
        end
        [key, value]
      end
    end
  end
end
