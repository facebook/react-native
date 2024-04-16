module Pod
  class Command
    class IPC < Command
      class Podfile < IPC
        include ProjectDirectory

        self.summary = 'Converts a Podfile to YAML'
        self.description = 'Converts a Podfile to YAML and prints it to STDOUT.'
        self.arguments = [
          CLAide::Argument.new('PATH', true),
        ]

        def initialize(argv)
          @path = argv.shift_argument
          super
        end

        def validate!
          super
          help! 'A Podfile path is required.' unless @path
        end

        def run
          require 'yaml'
          podfile = Pod::Podfile.from_file(@path)
          output_pipe.puts podfile.to_yaml
        end
      end
    end
  end
end
