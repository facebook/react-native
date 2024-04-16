module Pod
  class Command
    class Spec < Command
      class Which < Spec
        self.summary = 'Prints the path of the given spec'

        self.description = <<-DESC
          Prints the path of the .podspec file(s) whose name matches `QUERY`
        DESC

        self.arguments = [
          CLAide::Argument.new('QUERY', false),
        ]

        def self.options
          [
            ['--regex', 'Interpret the `QUERY` as a regular expression'],
            ['--show-all', 'Print all versions of the given podspec'],
            ['--version', 'Print a specific version of the given podspec'],
          ].concat(super)
        end

        def initialize(argv)
          @use_regex = argv.flag?('regex')
          @show_all = argv.flag?('show-all')
          @version = argv.option('version')
          @query = argv.shift_argument
          @query = @query.gsub('.podspec', '') unless @query.nil?
          super
        end

        def validate!
          super
          help! 'A podspec name is required.' unless @query
          validate_regex!(@query) if @use_regex
        end

        def run
          query = @use_regex ? @query : Regexp.escape(@query)
          UI.puts get_path_of_spec(query, @show_all || @version)
        end
      end
    end
  end
end
