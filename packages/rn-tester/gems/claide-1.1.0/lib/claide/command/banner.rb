# encoding: utf-8

module CLAide
  class Command
    # Creates the formatted banner to present as help of the provided command
    # class.
    #
    class Banner
      # @return [Class] The command for which the banner should be created.
      #
      attr_accessor :command

      # @param [Class] command @see command
      #
      def initialize(command)
        @command = command
      end

      # @return [String] The banner for the command.
      #
      def formatted_banner
        sections = [
          ['Usage',    formatted_usage_description],
          ['Commands', formatted_subcommand_summaries],
          ['Options',  formatted_options_description],
        ]
        banner = sections.map do |(title, body)|
          [prettify_title("#{title}:"), body] unless body.empty?
        end.compact.join("\n\n")
        banner
      end

      private

      # @!group Banner sections
      #-----------------------------------------------------------------------#

      # @return [String] The indentation of the text.
      #
      TEXT_INDENT = 6

      # @return [Fixnum] The maximum width of the text.
      #
      MAX_WIDTH = TEXT_INDENT + 80

      # @return [Fixnum] The minimum between a name and its description.
      #
      DESCRIPTION_SPACES = 3

      # @return [Fixnum] The minimum between a name and its description.
      #
      SUBCOMMAND_BULLET_SIZE = 2

      # @return [String] The section describing the usage of the command.
      #
      def formatted_usage_description
        message = command.description || command.summary || ''
        message = TextWrapper.wrap_formatted_text(message,
                                                  TEXT_INDENT,
                                                  MAX_WIDTH)
        message = prettify_message(command, message)
        "#{signature}\n\n#{message}"
      end

      # @return [String] The signature of the command.
      #
      def signature
        full_command = command.full_command
        sub_command = signature_sub_command
        arguments = signature_arguments
        result = prettify_signature(full_command, sub_command, arguments)
        result.insert(0, '$ ')
        result.insert(0, ' ' * (TEXT_INDENT - '$ '.size))
      end

      # @return [String] The subcommand indicator of the signature.
      #
      def signature_sub_command
        return '[COMMAND]' if command.default_subcommand
        return 'COMMAND' if command.subcommands.any?
      end

      # @return [String] The arguments of the signature.
      #
      def signature_arguments
        command.arguments.map do |arg|
          names = arg.names.join('|')
          names.concat(' ' + Argument::ELLIPSIS) if arg.repeatable?
          arg.required? ? names : "[#{names}]"
        end.join(' ')
      end

      # @return [String] The section describing the subcommands of the command.
      #
      # @note   The plus sign emphasizes the that the subcommands are added to
      #         the command. The square brackets conveys a sense of direction
      #         and indicates the gravitational force towards the default
      #         command.
      #
      def formatted_subcommand_summaries
        subcommands = subcommands_for_banner
        subcommands.map do |subcommand|
          name = subcommand.command
          bullet = (name == command.default_subcommand) ? '>' : '+'
          name = "#{bullet} #{name}"
          pretty_name = prettify_subcommand(name)
          entry_description(pretty_name, subcommand.summary, name.size)
        end.join("\n")
      end

      # @return [String] The section describing the options of the command.
      #
      def formatted_options_description
        options = command.options
        options.map do |name, description|
          pretty_name = prettify_option_name(name)
          entry_description(pretty_name, description, name.size)
        end.join("\n")
      end

      # @return [String] The line describing a single entry (subcommand or
      #         option).
      #
      def entry_description(name, description, name_width)
        max_name_width = compute_max_name_width
        desc_start = max_name_width + (TEXT_INDENT - 2) + DESCRIPTION_SPACES
        result = ' ' * (TEXT_INDENT - 2)
        result << name
        result << ' ' * DESCRIPTION_SPACES
        result << ' ' * (max_name_width - name_width)
        result << TextWrapper.wrap_with_indent(description,
                                               desc_start,
                                               MAX_WIDTH)
      end

      # @!group Overrides
      #-----------------------------------------------------------------------#

      # @return [String] A decorated title.
      #
      def prettify_title(title)
        title.ansi.underline
      end

      # @return [String] A decorated textual representation of the subcommand
      #         name.
      #
      def prettify_subcommand(name)
        name.chomp.ansi.green
      end

      # @return [String] A decorated textual representation of the option name.
      #
      #
      def prettify_option_name(name)
        name.chomp.ansi.blue
      end

      # @return [String] A decorated textual representation of the command.
      #
      def prettify_signature(command, subcommand, argument)
        components = [
          [command, :green],
          [subcommand, :green],
          [argument, :magenta],
        ]
        components.reduce('') do |memo, (string, ansi_key)|
          next memo if !string || string.empty?
          memo << ' ' << string.ansi.apply(ansi_key)
        end.lstrip
      end

      # @return [String] A decorated command description.
      #
      def prettify_message(command, message)
        message = message.dup
        command.arguments.each do |arg|
          arg.names.each do |name|
            message.gsub!("`#{name.gsub(/\.{3}$/, '')}`", '\0'.ansi.magenta)
          end
        end
        command.options.each do |(name, _description)|
          message.gsub!("`#{name}`", '\0'.ansi.blue)
        end
        message
      end

      # @!group Private helpers
      #-----------------------------------------------------------------------#

      # @return [Array<String>] The list of the subcommands to use in the
      #         banner.
      #
      def subcommands_for_banner
        command.subcommands_for_command_lookup.reject do |subcommand|
          subcommand.summary.nil?
        end.sort_by(&:command)
      end

      # @return [Fixnum] The width of the largest command name or of the
      #         largest option name. Used to align all the descriptions.
      #
      def compute_max_name_width
        widths = []
        widths << command.options.map { |option| option.first.size }
        widths << subcommands_for_banner.map do |cmd|
          cmd.command.size + SUBCOMMAND_BULLET_SIZE
        end.max
        widths.flatten.compact.max || 1
      end

      module TextWrapper
        # @return [String] Wraps a formatted string (e.g. markdown) by stripping
        #         heredoc indentation and wrapping by word to the terminal width
        #         taking into account a maximum one, and indenting the string.
        #         Code lines (i.e. indented by four spaces) are not wrapped.
        #
        # @param  [String] string
        #         The string to format.
        #
        # @param  [Fixnum] indent
        #         The number of spaces to insert before the string.
        #
        # @param  [Fixnum] max_width
        #         The maximum width to use to format the string if the terminal
        #         is too wide.
        #
        def self.wrap_formatted_text(string, indent = 0, max_width = 80)
          paragraphs = strip_heredoc(string).split("\n\n")
          paragraphs = paragraphs.map do |paragraph|
            if paragraph.start_with?(' ' * 4)
              paragraph.gsub!(/\n/, "\n#{' ' * indent}")
            else
              paragraph = wrap_with_indent(paragraph, indent, max_width)
            end
            paragraph.insert(0, ' ' * indent).rstrip
          end
          paragraphs.join("\n\n")
        end

        # @return [String] Wraps a string to the terminal width taking into
        #         account the given indentation.
        #
        # @param  [String] string
        #         The string to indent.
        #
        # @param  [Fixnum] indent
        #         The number of spaces to insert before the string.
        #
        # @param  [Fixnum] max_width
        #         The maximum width to use to format the string if the terminal
        #         is too wide.
        #
        def self.wrap_with_indent(string, indent = 0, max_width = 80)
          if terminal_width == 0
            width = max_width
          else
            width = [terminal_width, max_width].min
          end

          full_line = string.gsub("\n", ' ')
          available_width = width - indent
          space = ' ' * indent
          word_wrap(full_line, available_width).split("\n").join("\n#{space}")
        end

        # @return [String] Lifted straight from ActionView. Thanks guys!
        #
        def self.word_wrap(line, line_width)
          line.gsub(/(.{1,#{line_width}})(\s+|$)/, "\\1\n").strip
        end

        # @return [String] Lifted straight from ActiveSupport. Thanks guys!
        #
        def self.strip_heredoc(string)
          if min = string.scan(/^[ \t]*(?=\S)/).min
            string.gsub(/^[ \t]{#{min.size}}/, '')
          else
            string
          end
        end

        # @!group Private helpers
        #---------------------------------------------------------------------#

        # @return [Fixnum] The width of the current terminal unless being piped.
        #
        def self.terminal_width
          @terminal_width ||=
            (!ENV['CLAIDE_DISABLE_AUTO_WRAP'] &&
             STDOUT.tty? &&
             calculate_terminal_width) || 0
        end

        def self.calculate_terminal_width
          require 'io/console'
          STDOUT.winsize.last
        rescue LoadError
          (system('which tput > /dev/null 2>&1') && `tput cols`.to_i) || 0
        rescue
          0
        end
        private_class_method :calculate_terminal_width
      end
    end
  end
end
