# encoding: utf-8

module CLAide
  require 'claide/informative_error'

  # The exception class that is raised to indicate a help banner should be
  # shown while running {Command.run}.
  #
  class Help < StandardError
    include InformativeError

    # @return [String] The banner containing the usage instructions of the
    # command to show in the help.
    #
    attr_reader :banner

    # @return [String] An optional error message that will be shown before the
    #         help banner.
    #
    attr_reader :error_message

    # @param [String] banner @see banner
    # @param [String] error_message @see error_message
    #
    # @note  If an error message is provided, the exit status, used to
    #        terminate the program with, will be set to `1`, otherwise a {Help}
    #        exception is treated as not being a real error and exits with `0`.
    #
    def initialize(banner, error_message = nil)
      @banner = banner
      @error_message = error_message
      @exit_status = @error_message.nil? ? 0 : 1
    end

    # @return [String] The optional error message, colored in red if
    #         {Command.ansi_output} is set to `true`.
    #
    def formatted_error_message
      if error_message
        message = "[!] #{error_message}"
        prettify_error_message(message)
      end
    end

    # @return [String]
    #
    def prettify_error_message(message)
      message.ansi.red
    end

    # @return [String] The optional error message, combined with the help
    #         banner of the command.
    #
    def message
      [formatted_error_message, banner].compact.join("\n\n")
    end
  end
end
