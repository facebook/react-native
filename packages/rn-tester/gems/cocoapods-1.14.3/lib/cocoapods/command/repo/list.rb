module Pod
  class Command
    class Repo < Command
      class List < Repo
        self.summary = 'List repos'

        self.description = <<-DESC
            List the repos from the local spec-repos directory at `#{Config.instance.repos_dir}`.
        DESC

        def self.options
          [['--count-only', 'Show the total number of repos']].concat(super)
        end

        def initialize(argv)
          @count_only = argv.flag?('count-only')
          super
        end

        # @output  Examples:
        #
        #          trunk
        #          - type: CDN
        #          - URL:  https://cdn.cocoapods.org/
        #          - path: /Users/lascorbe/.cocoapods/repos/trunk
        #
        #          test
        #          - type: local copy
        #          - URL: file:///Users/lascorbe/.cocoapods/repos/test
        #          - path: /Users/lascorbe/.cocoapods/repos/test
        #
        def run
          sources = config.sources_manager.all
          print_sources(sources) unless @count_only
          print_count_of_sources(sources)
        end

        private

        # Pretty-prints the source at the given path.
        #
        # @param  [Source] source
        #         The source repository to be printed.
        #
        # @return [void]
        #
        def print_source(source)
          if source.is_a?(Pod::CDNSource)
            UI.puts '- Type: CDN'
          elsif source.git?
            branch_name, = Executable.capture_command('git', %w(name-rev --name-only HEAD), :capture => :out, :chdir => source.repo)
            branch_name.strip!
            branch_name = 'unknown' if branch_name.empty?
            UI.puts "- Type: git (#{branch_name})"
          else
            UI.puts "- Type: #{source.type}"
          end

          UI.puts "- URL:  #{source.url}"
          UI.puts "- Path: #{source.repo}"
        end

        # Pretty-prints the given sources.
        #
        # @param  [Array<Source>] sources
        #         The sources that should be printed.
        #
        # @return [void]
        #
        def print_sources(sources)
          sources.each do |source|
            UI.title source.name do
              print_source(source)
            end
          end
          UI.puts "\n"
        end

        # Pretty-prints the number of sources.
        #
        # @param  [Array<Source>] sources
        #         The sources whose count should be printed.
        #
        # @return [void]
        #
        def print_count_of_sources(sources)
          number_of_repos = sources.length
          repo_string = number_of_repos != 1 ? 'repos' : 'repo'
          UI.puts "#{number_of_repos} #{repo_string}".green
        end
      end
    end
  end
end
