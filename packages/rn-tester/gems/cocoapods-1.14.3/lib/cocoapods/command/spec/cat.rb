module Pod
  class Command
    class Spec < Command
      class Cat < Spec
        self.summary = 'Prints a spec file'

        self.description = <<-DESC
          Prints the content of the podspec(s) whose name matches `QUERY` to standard output.
        DESC

        self.arguments = [
          CLAide::Argument.new('QUERY', false),
        ]

        def self.options
          [
            ['--regex', 'Interpret the `QUERY` as a regular expression'],
            ['--show-all', 'Pick from all versions of the given podspec'],
            ['--version', 'Print a specific version of the given podspec'],
          ].concat(super)
        end

        def initialize(argv)
          @use_regex = argv.flag?('regex')
          @show_all = argv.flag?('show-all')
          @query = argv.shift_argument
          @query = @query.gsub('.podspec', '') unless @query.nil?
          @version = argv.option('version')
          super
        end

        def validate!
          super
          help! 'A podspec name is required.' unless @query
          validate_regex!(@query) if @use_regex
        end

        def run
          query = @use_regex ? @query : Regexp.escape(@query)
          filepath = if @show_all
                       specs = get_path_of_spec(query, @show_all).split(/\n/)
                       index = UI.choose_from_array(specs, "Which spec would you like to print [1-#{specs.count}]? ")
                       specs[index]
                     else
                       get_path_of_spec(query, @version)
                     end

          UI.puts File.read(filepath)
        end
      end
    end
  end
end
