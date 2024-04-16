module Pod
  class Command
    class Repo < Command
      class Update < Repo
        self.summary = 'Update a spec repo'

        self.description = <<-DESC
          Updates the local clone of the spec-repo `NAME`. If `NAME` is omitted
          this will update all spec-repos in `#{Config.instance.repos_dir}`.
        DESC

        self.arguments = [
          CLAide::Argument.new('NAME', false),
        ]

        def initialize(argv)
          @name = argv.shift_argument
          super
        end

        def run
          show_output = !config.silent?
          config.sources_manager.update(@name, show_output)
          exclude_repos_dir_from_backup
        end

        private

        # Excludes the repos directory from backups.
        #
        # @return [void]
        #
        def exclude_repos_dir_from_backup
          config.exclude_from_backup(config.repos_dir)
        end
      end
    end
  end
end
