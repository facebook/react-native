module Pod
  class Command
    class IPC < Command
      class Repl < IPC
        include ProjectDirectory

        END_OF_OUTPUT_SIGNAL = "\n\r".freeze

        self.summary = 'The repl listens to commands on standard input'
        self.description = <<-DESC
          The repl listens to commands on standard input and prints their
          result to standard output.
          It accepts all the other ipc subcommands. The repl will signal the
          end of output with the the ASCII CR+LF `\\n\\r`.
        DESC

        def run
          print_version
          signal_end_of_output
          listen
        end

        def print_version
          output_pipe.puts "version: '#{Pod::VERSION}'"
        end

        def signal_end_of_output
          output_pipe.puts(END_OF_OUTPUT_SIGNAL)
          STDOUT.flush
        end

        def listen
          while repl_command = STDIN.gets
            execute_repl_command(repl_command)
          end
        end

        def execute_repl_command(repl_command)
          unless repl_command == '\n'
            repl_commands = repl_command.split
            subcommand = repl_commands.shift.capitalize
            arguments = repl_commands
            subcommand_class = Pod::Command::IPC.const_get(subcommand)
            subcommand_class.new(CLAide::ARGV.new(arguments)).run
            signal_end_of_output
          end
        end
      end
    end
  end
end
