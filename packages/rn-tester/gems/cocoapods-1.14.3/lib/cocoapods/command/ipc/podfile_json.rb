module Pod
  class Command
    class IPC < Command
      class PodfileJSON < IPC
        include ProjectDirectory

        self.summary = 'Converts a Podfile to JSON'
        self.description = 'Converts a Podfile to JSON and prints it to STDOUT.'
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
          podfile = Pod::Podfile.from_file(@path)
          output_pipe.puts podfile.to_hash.to_json
        end
      end
    end
  end
end
