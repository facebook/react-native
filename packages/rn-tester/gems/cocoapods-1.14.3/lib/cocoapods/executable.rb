module Pod
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
    # @param  [String] executable
    #         The binary to use.
    #
    # @param  [Array<#to_s>] command
    #         The command to send to the binary.
    #
    # @param  [Boolean] raise_on_failure
    #         Whether it should raise if the command fails.
    #
    # @raise  If the executable could not be located.
    #
    # @raise  If the command fails and the `raise_on_failure` is set to true.
    #
    # @return [String] the output of the command (STDOUT and STDERR).
    #
    def self.execute_command(executable, command, raise_on_failure = true)
      bin = which!(executable)

      command = command.map(&:to_s)
      if File.basename(bin) == 'tar.exe'
        # Tar on Windows needs --force-local
        command.push('--force-local')
      end
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
          raise Informative, "#{full_command}\n\n#{output}"
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
      paths = ENV.fetch('PATH') { '' }.split(File::PATH_SEPARATOR)
      paths.unshift('./')
      paths.uniq!
      paths.each do |path|
        bin = File.expand_path(program, path)
        if Gem.win_platform?
          bin += '.exe'
        end
        if File.file?(bin) && File.executable?(bin)
          return bin
        end
      end
      nil
    end

    # Returns the absolute path to the binary with the given name on the current
    # `PATH`, or raises if none is found.
    #
    # @param  [String] program
    #         The name of the program being searched for.
    #
    # @return [String] The absolute path to the given program.
    #
    def self.which!(program)
      which(program).tap do |bin|
        raise Informative, "Unable to locate the executable `#{program}`" unless bin
      end
    end

    # Runs the given command, capturing the desired output.
    #
    # @param  [String] executable
    #         The binary to use.
    #
    # @param  [Array<#to_s>] command
    #         The command to send to the binary.
    #
    # @param  [Symbol] capture
    #         Whether it should raise if the command fails.
    #
    # @param  [Hash] env
    #         Environment variables to be set for the command.
    #
    # @raise  If the executable could not be located.
    #
    # @return [(String, Process::Status)]
    #         The desired captured output from the command, and the status from
    #         running the command.
    #
    def self.capture_command(executable, command, capture: :merge, env: {}, **kwargs)
      bin = which!(executable)

      require 'open3'
      command = command.map(&:to_s)
      case capture
      when :merge then Open3.capture2e(env, [bin, bin], *command, **kwargs)
      when :both then Open3.capture3(env, [bin, bin], *command, **kwargs)
      when :out then Open3.capture3(env, [bin, bin], *command, **kwargs).values_at(0, -1)
      when :err then Open3.capture3(env, [bin, bin], *command, **kwargs).drop(1)
      when :none then Open3.capture3(env, [bin, bin], *command, **kwargs).last
      end
    end

    # (see Executable.capture_command)
    #
    # @raise  If running the command fails
    #
    def self.capture_command!(executable, command, **kwargs)
      capture_command(executable, command, **kwargs).tap do |result|
        result = Array(result)
        status = result.last
        unless status.success?
          output = result[0..-2].join
          raise Informative, "#{executable} #{command.join(' ')}\n\n#{output}".strip
        end
      end
    end

    private

    def self.popen3(bin, command, stdout, stderr)
      require 'open3'
      Open3.popen3(bin, *command) do |i, o, e, t|
        reader(o, stdout)
        reader(e, stderr)
        i.close

        status = t.value

        o.flush
        e.flush
        sleep(0.01)

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
        rescue EOFError, IOError
          output << (buf << $/) unless buf.empty?
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
      attr_reader :indent

      # @return [IO] the {IO} to which the output should be printed.
      #
      attr_reader :io

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
