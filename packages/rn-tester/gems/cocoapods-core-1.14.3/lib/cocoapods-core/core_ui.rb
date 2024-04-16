module Pod
  # Manages the UI output so dependent gems can customize it.
  #
  module CoreUI
    def self.puts(message)
      STDOUT.puts message
    end

    def self.print(message)
      STDOUT.print(message)
    end

    def self.warn(message)
      STDERR.puts message
    end

    #-------------------------------------------------------------------------#
  end
end
