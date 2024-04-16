module Xcodeproj
  # Manages the UI output so clients can customize it.
  #
  module UserInterface
    # Prints a message to standard output.
    #
    # @return [void]
    #
    def self.puts(message)
      STDOUT.puts message
    end

    # Prints a message to standard error.
    #
    # @return [void]
    #
    def self.warn(message)
      STDERR.puts message
    end
  end
  UI = UserInterface
end
