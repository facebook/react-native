require 'fourflusher/compat'

# This file is a verbatim copy from CocoaPods, a project licensed under the MIT license.

# Copyright (c) 2011 - 2015 Eloy Durán <eloy.de.enige@gmail.com>,
#                           Fabio Pelosin <fabiopelosin@gmail.com>,
#                           Samuel Giddins <segiddins@segiddins.me>,
#                           Marius Rackwitz <git@mariusrackwitz.de>,
#                           Kyle Fuller <kyle@fuller.li>,
#                           Boris Bügling <boris@buegling.com>,
#                           Orta Therox <orta.therox@gmail.com>, and
#                           Olivier Halligon <olivier@halligon.net>.

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.

module Fourflusher
  # Module which provides support for running executables.
  #
  # In a class it can be used as:
  #
  #     extend Executable
  #     executable :git
  #
  # This will create two methods `git` and `git!` both accept a command but
  # the later will raise on non successful executions. The methods return the
  # output of the command.
  #
  module Executable
    # Creates the methods for the executable with the given name.
    #
    # @param  [Symbol] name
    #         the name of the executable.
    #
    # @return [void]
    #
    def executable(name)
      define_method(name) do |*command|
        Executable.execute_command(name, Array(command).flatten, false)
      end

      define_method(name.to_s + '!') do |*command|
        Executable.execute_command(name, Array(command).flatten, true)
      end
    end

    # Executes the given command displaying it if in verbose mode.
    #
    # @param  [String] bin
    #         The binary to use.
    #
    # @param  [Array<#to_s>] command
    #         The command to send to the binary.
    #
    # @param  [Bool] raise_on_failure
    #         Whether it should raise if the command fails.
    #
    # @raise  If the executable could not be located.
    #
    # @raise  If the command fails and the `raise_on_failure` is set to true.
    #
    # @return [String] the output of the command (STDOUT and STDERR).
    #
    def self.execute_command(executable, command, raise_on_failure = true)
      bin = which(executable)
      fail Fourflusher::Informative, "Unable to locate the executable `#{executable}`" unless bin

      command = command.map(&:to_s)
      full_command = "#{bin} #{command.join(' ')}"

      if Config.instance.verbose?
        UI.message("$ #{full_command}")
        stdout = Indenter.new(STDOUT)
        stderr = Indenter.new(STDERR)
      else
        stdout = Indenter.new
        stderr = Indenter.new
      end

      status = popen3(bin, command, stdout, stderr)
      stdout = stdout.join
      stderr = stderr.join
      output = stdout + stderr
      unless status.success?
        if raise_on_failure
          fail Fourflusher::Informative, "#{full_command}\n\n#{output}"
        else
          UI.message("[!] Failed: #{full_command}".red)
        end
      end

      output
    end

    # Returns the absolute path to the binary with the given name on the current
    # `PATH`, or `nil` if none is found.
    #
    # @param  [String] program
    #         The name of the program being searched for.
    #
    # @return [String,Nil] The absolute path to the given program, or `nil` if
    #                      it wasn't found in the current `PATH`.
    #
    def self.which(program)
      program = program.to_s
      ENV['PATH'].split(File::PATH_SEPARATOR).each do |path|
        bin = File.expand_path(program, path)
        return bin if File.file?(bin) && File.executable?(bin)
      end
      nil
    end

    # Runs the given command, capturing the desired output.
    #
    # @param  [String] bin
    #         The binary to use.
    #
    # @param  [Array<#to_s>] command
    #         The command to send to the binary.
    #
    # @param  [Symbol] capture
    #         Whether it should raise if the command fails.
    #
    # @raise  If the executable could not be located.
    #
    # @return [(String, Process::Status)]
    #         The desired captured output from the command, and the status from
    #         running the command.
    #
    def self.capture_command(executable, command, capture: :merge)
      bin = which(executable)
      fail Fourflusher::Informative, "Unable to locate the executable `#{executable}`" unless bin

      require 'open3'
      command = command.map(&:to_s)
      case capture
      when :merge then Open3.capture2e(bin, *command)
      when :both then Open3.capture3(bin, *command)
      when :out then Open3.capture2(bin, *command)
      when :err then Open3.capture3(bin, *command).drop(1)
      when :none then Open3.capture2(bin, *command).last
      end
    end

    private

    def self.popen3(bin, command, stdout, stderr)
      require 'open3'
      Open3.popen3(bin, *command) do |i, o, e, t|
        stdout_thread = reader(o, stdout)
        stderr_thread = reader(e, stderr)
        i.close

        status = t.value

        o.flush
        e.flush

        # wait for both threads to process the streams
        stdout_thread.join
        stderr_thread.join

        status
      end
    end

    def self.reader(input, output)
      Thread.new do
        buf = ''
        begin
          loop do
            buf << input.readpartial(4096)
            loop do
              string, separator, buf = buf.partition(/[\r\n]/)
              if separator.empty?
                buf = string
                break
              end
              output << (string << separator)
            end
          end
        rescue EOFError
          output << (buf << $INPUT_RECORD_SEPARATOR) unless buf.empty?
        end
      end
    end

    #-------------------------------------------------------------------------#

    # Helper class that allows to write to an {IO} instance taking into account
    # the UI indentation level.
    #
    class Indenter < ::Array
      # @return [Fixnum] The indentation level of the UI.
      #
      attr_accessor :indent

      # @return [IO] the {IO} to which the output should be printed.
      #
      attr_accessor :io

      # Init a new Indenter
      #
      # @param [IO] io @see io
      #
      def initialize(io = nil)
        @io = io
        @indent = ' ' * UI.indentation_level
      end

      # Stores a portion of the output and prints it to the {IO} instance.
      #
      # @param  [String] value
      #         the output to print.
      #
      # @return [void]
      #
      def <<(value)
        super
        io << "#{indent}#{value}" if io
      end
    end
  end
end
