module Pod
  class Command
    module Options
      # Provides support for commands to skip updating the spec repositories.
      #
      module RepoUpdate
        module Options
          def options
            [
              ['--no-repo-update', 'Skip running `pod repo update` before install'],
            ].concat(super)
          end
        end

        def self.included(base)
          base.extend(Options)
        end

        def repo_update?(default: false)
          if @repo_update.nil?
            default
          else
            @repo_update
          end
        end

        def initialize(argv)
          @repo_update = argv.flag?('repo-update')
          super
        end
      end
    end
  end
end
