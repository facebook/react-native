module Pod
  class Command
    class IPC < Command
      class Spec < IPC
        self.summary = 'Converts a podspec to JSON'
        self.description = 'Converts a podspec to JSON and prints it to STDOUT.'
        self.arguments = [
          CLAide::Argument.new('PATH', true),
        ]

        def initialize(argv)
          @path = argv.shift_argument
          super
        end

        def validate!
          super
          help! 'A specification path is required.' unless @path
        end

        def run
          require 'json'
          spec = Specification.from_file(@path)
          output_pipe.puts(spec.to_pretty_json)
        end
      end
    end
  end
end
