# encoding: utf-8

module CLAide
  # Including this module into an exception class will ensure that when raised,
  # while running {Command.run}, only the message of the exception will be
  # shown to the user. Unless disabled with the `--verbose` flag.
  #
  # In addition, the message will be colored red, if {Command.ansi_output}
  # is set to `true`.
  #
  module InformativeError
    # @return [Numeric] The exist status code that should be used to terminate
    #         the program with. Defaults to `1`.
    #
    attr_writer :exit_status

    def exit_status
      @exit_status ||= 1
    end
  end
end
