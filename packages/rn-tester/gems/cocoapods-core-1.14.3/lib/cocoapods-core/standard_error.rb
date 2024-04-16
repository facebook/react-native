module Pod
  # Namespaces all the errors raised by CocoaPods.
  #
  class StandardError < ::StandardError; end

  #-------------------------------------------------------------------------#

  # Wraps an exception raised by a DSL file in order to show to the user the
  # contents of the line that raised the exception.
  #
  class DSLError < Informative
    # @return [String] the description that should be presented to the user.
    #
    attr_reader :description

    # @return [String] the path of the dsl file that raised the exception.
    #
    attr_reader :dsl_path

    # @return [Exception] the exception raised by the
    #         evaluation of the dsl file.
    #
    attr_reader :underlying_exception

    # @param [Exception] underlying_exception @see underlying_exception
    # @param [String]    dsl_path  @see dsl_path
    #
    def initialize(description, dsl_path, underlying_exception, contents = nil)
      @description          = description
      @dsl_path             = dsl_path
      @underlying_exception = underlying_exception
      @contents             = contents
    end

    # @return [String] the contents of the DSL that cause the exception to
    #         be raised.
    #
    def contents
      @contents ||= begin
        dsl_path && File.exist?(dsl_path) && File.read(dsl_path)
      end
    end

    # The message of the exception reports the content of podspec for the
    # line that generated the original exception.
    #
    # @example Output
    #
    #   Invalid podspec at `RestKit.podspec` - undefined method
    #   `exclude_header_search_paths=' for #<Pod::Specification for
    #   `RestKit/Network (0.9.3)`>
    #
    #       from spec-repos/master/RestKit/0.9.3/RestKit.podspec:36
    #       -------------------------------------------
    #           # because it would break: #import <CoreData/CoreData.h>
    #    >      ns.exclude_header_search_paths = 'Code/RestKit.h'
    #         end
    #       -------------------------------------------
    #
    # @return [String] the message of the exception.
    #
    def message
      @message ||= begin
        trace_line, description = parse_line_number_from_description

        m = "\n[!] #{description}.\n"
        m = m.red if m.respond_to?(:red)

        backtrace = underlying_exception.backtrace
        return m unless backtrace && dsl_path && contents

        trace_line = backtrace.find { |l| l.include?(dsl_path.to_s) } || trace_line
        return m unless trace_line
        line_numer = trace_line.split(':')[1].to_i - 1
        return m unless line_numer

        lines      = contents.lines
        indent     = ' #  '
        indicator  = indent.tr('#', '>')
        first_line = (line_numer.zero?)
        last_line  = (line_numer == (lines.count - 1))

        m << "\n"
        m << "#{indent}from #{trace_line.gsub(/:in.*$/, '')}\n"
        m << "#{indent}-------------------------------------------\n"
        m << "#{indent}#{lines[line_numer - 1]}" unless first_line
        m << "#{indicator}#{lines[line_numer]}"
        m << "#{indent}#{lines[line_numer + 1]}" unless last_line
        m << "\n" unless m.end_with?("\n")
        m << "#{indent}-------------------------------------------\n"
      end
    end

    private

    def parse_line_number_from_description
      description = self.description
      if dsl_path && description =~ /((#{Regexp.quote File.expand_path(dsl_path)}|#{Regexp.quote dsl_path.to_s}):\d+)/
        trace_line = Regexp.last_match[1]
        description = description.sub(/#{Regexp.quote trace_line}:\s*/, '')
        if description =~ /^\s*\^\z/
          description = description.lines[0..-3].join.chomp
        end
      end
      [trace_line, description]
    end
  end
end
