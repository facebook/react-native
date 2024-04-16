# frozen_string_literal: true

module Molinillo
  # Conveys information about the resolution process to a user.
  module UI
    # The {IO} object that should be used to print output. `STDOUT`, by default.
    #
    # @return [IO]
    def output
      STDOUT
    end

    # Called roughly every {#progress_rate}, this method should convey progress
    # to the user.
    #
    # @return [void]
    def indicate_progress
      output.print '.' unless debug?
    end

    # How often progress should be conveyed to the user via
    # {#indicate_progress}, in seconds. A third of a second, by default.
    #
    # @return [Float]
    def progress_rate
      0.33
    end

    # Called before resolution begins.
    #
    # @return [void]
    def before_resolution
      output.print 'Resolving dependencies...'
    end

    # Called after resolution ends (either successfully or with an error).
    # By default, prints a newline.
    #
    # @return [void]
    def after_resolution
      output.puts
    end

    # Conveys debug information to the user.
    #
    # @param [Integer] depth the current depth of the resolution process.
    # @return [void]
    def debug(depth = 0)
      if debug?
        debug_info = yield
        debug_info = debug_info.inspect unless debug_info.is_a?(String)
        debug_info = debug_info.split("\n").map { |s| ":#{depth.to_s.rjust 4}: #{s}" }
        output.puts debug_info
      end
    end

    # Whether or not debug messages should be printed.
    # By default, whether or not the `MOLINILLO_DEBUG` environment variable is
    # set.
    #
    # @return [Boolean]
    def debug?
      return @debug_mode if defined?(@debug_mode)
      @debug_mode = ENV['MOLINILLO_DEBUG']
    end
  end
end
