require 'cocoapods/user_interface/error_report'
require 'cocoapods/user_interface/inspector_reporter'

module Pod
  # Provides support for UI output. It provides support for nested sections of
  # information and for a verbose mode.
  #
  module UserInterface
    require 'colored2'

    @title_colors      =  %w( yellow green )
    @title_level       =  0
    @indentation_level =  2
    @treat_titles_as_messages = false
    @warnings = []

    class << self
      include Config::Mixin

      attr_accessor :indentation_level
      attr_accessor :title_level
      attr_accessor :warnings

      # @return [IO] IO object to which UI output will be directed.
      #
      attr_accessor :output_io

      # @return [Boolean] Whether the wrapping of the strings to the width of the
      #         terminal should be disabled.
      #
      attr_accessor :disable_wrap
      alias_method :disable_wrap?, :disable_wrap

      # Prints a title taking an optional verbose prefix and
      # a relative indentation valid for the UI action in the passed
      # block.
      #
      # In verbose mode titles are printed with a color according
      # to their level. In normal mode titles are printed only if
      # they have nesting level smaller than 2.
      #
      # @todo Refactor to title (for always visible titles like search)
      #       and sections (titles that represent collapsible sections).
      #
      # @param [String] title
      #        The title to print
      #
      # @param [String] verbose_prefix
      #        See #message
      #
      # @param [FixNum] relative_indentation
      #        The indentation level relative to the current,
      #        when the message is printed.
      #
      def section(title, verbose_prefix = '', relative_indentation = 0)
        if config.verbose?
          title(title, verbose_prefix, relative_indentation)
        elsif title_level < 1
          puts title
        end

        self.indentation_level += relative_indentation
        self.title_level += 1
        yield if block_given?
      ensure
        self.indentation_level -= relative_indentation
        self.title_level -= 1
      end

      # In verbose mode it shows the sections and the contents.
      # In normal mode it just prints the title.
      #
      # @return [void]
      #
      def titled_section(title, options = {})
        relative_indentation = options[:relative_indentation] || 0
        verbose_prefix = options[:verbose_prefix] || ''
        if config.verbose?
          title(title, verbose_prefix, relative_indentation)
        else
          puts title
        end

        self.indentation_level += relative_indentation
        self.title_level += 1
        yield if block_given?
      ensure
        self.indentation_level -= relative_indentation
        self.title_level -= 1
      end

      # A title opposed to a section is always visible
      #
      # @param [String] title
      #        The title to print
      #
      # @param [String] verbose_prefix
      #        See #message
      #
      # @param [FixNum] relative_indentation
      #        The indentation level relative to the current,
      #        when the message is printed.
      #
      def title(title, verbose_prefix = '', relative_indentation = 2)
        if @treat_titles_as_messages
          message(title, verbose_prefix)
        else
          title = verbose_prefix + title if config.verbose?
          title = "\n#{title}" if @title_level < 2
          if (color = @title_colors[@title_level])
            title = title.send(color)
          end
          puts "#{title}"
        end

        self.indentation_level += relative_indentation
        self.title_level += 1
        yield if block_given?
      ensure
        self.indentation_level -= relative_indentation
        self.title_level -= 1
      end

      # Prints a verbose message taking an optional verbose prefix and
      # a relative indentation valid for the UI action in the passed
      # block.
      #
      # @todo Clean interface.
      #
      # @param [String] message
      #        The message to print.
      #
      # @param [String] verbose_prefix
      #        See #message
      #
      # @param [FixNum] relative_indentation
      #        The indentation level relative to the current,
      #        when the message is printed.
      #
      # @yield  The action, this block is always executed.
      #
      # @return [void]
      #
      def message(message, verbose_prefix = '', relative_indentation = 2)
        message = verbose_prefix + message if config.verbose?
        puts_indented message if config.verbose?

        self.indentation_level += relative_indentation
        yield if block_given?
      ensure
        self.indentation_level -= relative_indentation
      end

      # Prints an info to the user. The info is always displayed.
      # It respects the current indentation level only in verbose
      # mode.
      #
      # Any title printed in the optional block is treated as a message.
      #
      # @param [String] message
      #        The message to print.
      #
      def info(message)
        indentation = config.verbose? ? self.indentation_level : 0
        indented = wrap_string(message, indentation)
        puts(indented)

        self.indentation_level += 2
        @treat_titles_as_messages = true
        yield if block_given?
      ensure
        @treat_titles_as_messages = false
        self.indentation_level -= 2
      end

      # Prints an important message to the user.
      #
      # @param [String] message The message to print.
      #
      # return [void]
      #
      def notice(message)
        puts("\n[!] #{message}".green)
      end

      # Returns a string containing relative location of a path from the Podfile.
      # The returned path is quoted. If the argument is nil it returns the
      # empty string.
      #
      # @param [#to_str] pathname
      #        The path to print.
      #
      def path(pathname)
        if pathname
          from_path = config.podfile_path.dirname if config.podfile_path
          from_path ||= Pathname.pwd
          path = begin
                   Pathname(pathname).relative_path_from(from_path)
                 rescue
                   pathname
                 end
          "`#{path}`"
        else
          ''
        end
      end

      # Prints the textual representation of a given set.
      #
      # @param  [Set] set
      #         the set that should be presented.
      #
      # @param  [Symbol] mode
      #         the presentation mode, either `:normal` or `:name_and_version`.
      #
      def pod(set, mode = :normal)
        if mode == :name_and_version
          puts_indented "#{set.name} #{set.versions.first.version}"
        else
          pod = Specification::Set::Presenter.new(set)
          title = "-> #{pod.name} (#{pod.version})"
          if pod.spec.deprecated?
            title += " #{pod.deprecation_description}"
            colored_title = title.red
          else
            colored_title = title.green
          end

          title(colored_title, '', 1) do
            puts_indented pod.summary if pod.summary
            puts_indented "pod '#{pod.name}', '~> #{pod.version}'"
            labeled('Homepage', pod.homepage)
            labeled('Source',   pod.source_url)
            labeled('Versions', pod.versions_by_source)
            if mode == :stats
              labeled('Authors',  pod.authors) if pod.authors =~ /,/
              labeled('Author',   pod.authors) if pod.authors !~ /,/
              labeled('License',  pod.license)
              labeled('Platform', pod.platform)
              labeled('Stars',    pod.github_stargazers)
              labeled('Forks',    pod.github_forks)
            end
            labeled('Subspecs', pod.subspecs)
          end
        end
      end

      # Prints a message with a label.
      #
      # @param [String] label
      #        The label to print.
      #
      # @param [#to_s] value
      #        The value to print.
      #
      # @param [FixNum] justification
      #        The justification of the label.
      #
      def labeled(label, value, justification = 12)
        if value
          title = "- #{label}:"
          if value.is_a?(Array)
            lines = [wrap_string(title, self.indentation_level)]
            value.each do |v|
              lines << wrap_string("- #{v}", self.indentation_level + 2)
            end
            puts lines.join("\n")
          else
            puts wrap_string(title.ljust(justification) + "#{value}", self.indentation_level)
          end
        end
      end

      # Prints a message respecting the current indentation level and
      # wrapping it to the terminal width if necessary.
      #
      # @param [String] message
      #        The message to print.
      #
      def puts_indented(message = '')
        indented = wrap_string(message, self.indentation_level)
        puts(indented)
      end

      # Prints the stored warnings. This method is intended to be called at the
      # end of the execution of the binary.
      #
      # @return [void]
      #
      def print_warnings
        STDOUT.flush
        warnings.each do |warning|
          next if warning[:verbose_only] && !config.verbose?
          STDERR.puts("\n[!] #{warning[:message]}".yellow)
          warning[:actions].each do |action|
            string = "- #{action}"
            string = wrap_string(string, 4)
            puts(string)
          end
        end
      end

      # Presents a choice among the elements of an array to the user.
      #
      # @param  [Array<#to_s>] array
      #         The list of the elements among which the user should make his
      #         choice.
      #
      # @param  [String] message
      #         The message to display to the user.
      #
      # @return [Fixnum] The index of the chosen array item.
      #
      def choose_from_array(array, message)
        array.each_with_index do |item, index|
          UI.puts "#{index + 1}: #{item}"
        end

        UI.puts message

        index = UI.gets.chomp.to_i - 1
        if index < 0 || index > array.count - 1
          raise Informative, "#{index + 1} is invalid [1-#{array.count}]"
        else
          index
        end
      end

      public

      # @!group Basic methods
      #-----------------------------------------------------------------------#

      # prints a message followed by a new line unless config is silent.
      #
      # @param [String] message
      #        The message to print.
      #
      def puts(message = '')
        return if config.silent?
        begin
          (output_io || STDOUT).puts(message)
        rescue Errno::EPIPE
          exit 0
        end
      end

      # prints a message followed by a new line unless config is silent.
      #
      # @param [String] message
      #        The message to print.
      #
      def print(message)
        return if config.silent?
        begin
          (output_io || STDOUT).print(message)
        rescue Errno::EPIPE
          exit 0
        end
      end

      # gets input from $stdin
      #
      def gets
        $stdin.gets
      end

      # Stores important warning to the user optionally followed by actions
      # that the user should take. To print them use {#print_warnings}.
      #
      # @param [String]  message The message to print.
      # @param [Array]   actions The actions that the user should take.
      # @param [Boolean]    verbose_only
      #        Restrict the appearance of the warning to verbose mode only
      #
      # return [void]
      #
      def warn(message, actions = [], verbose_only = false)
        warnings << { :message => message, :actions => actions, :verbose_only => verbose_only }
      end

      # Pipes all output inside given block to a pager.
      #
      # @yield Code block in which inputs to {#puts} and {#print} methods will be printed to the piper.
      #
      def with_pager
        prev_handler = Signal.trap('INT', 'IGNORE')
        IO.popen((ENV['PAGER'] || 'less -R'), 'w') do |io|
          UI.output_io = io
          yield
        end
      ensure
        Signal.trap('INT', prev_handler)
        UI.output_io = nil
      end

      private

      # @!group Helpers
      #-----------------------------------------------------------------------#

      # @return [String] Wraps a string taking into account the width of the
      # terminal and an option indent. Adapted from
      # https://macromates.com/blog/2006/wrapping-text-with-regular-expressions/
      #
      # @param [String] string  The string to wrap
      #
      # @param [String] indent  The string to use to indent the result.
      #
      # @return [String]        The formatted string.
      #
      # @note If CocoaPods is not being run in a terminal or the width of the
      # terminal is too small a width of 80 is assumed.
      #
      def wrap_string(string, indent = 0)
        if disable_wrap
          (' ' * indent) + string
        else
          first_space = ' ' * indent
          indented = CLAide::Command::Banner::TextWrapper.wrap_with_indent(string, indent, 9999)
          first_space + indented
        end
      end
    end
  end
  UI = UserInterface

  #---------------------------------------------------------------------------#

  # Redirects cocoapods-core UI.
  #
  module CoreUI
    class << self
      def puts(message)
        UI.puts message
      end

      def print(message)
        UI.print(message)
      end

      def warn(message)
        UI.warn message
      end
    end
  end
end

#---------------------------------------------------------------------------#

module Xcodeproj
  # Redirects xcodeproj UI.
  #
  module UserInterface
    def self.puts(message)
      ::Pod::UI.puts message
    end

    def self.warn(message)
      ::Pod::UI.warn message
    end
  end
end
