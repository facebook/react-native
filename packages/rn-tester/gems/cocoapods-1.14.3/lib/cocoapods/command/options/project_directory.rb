module Pod
  class Command
    module Options
      # Provides support for commands to take a user-specified `project directory`
      #
      module ProjectDirectory
        module Options
          def options
            [
              ['--project-directory=/project/dir/', 'The path to the root of the project directory'],
            ].concat(super)
          end
        end

        def self.included(base)
          base.extend(Options)
        end

        def initialize(argv)
          if project_directory = argv.option('project-directory')
            @project_directory = Pathname.new(project_directory).expand_path
          end
          config.installation_root = @project_directory
          super
        end

        def validate!
          super
          if @project_directory && !@project_directory.directory?
            raise Informative, "`#{@project_directory}` is not a valid directory."
          end
        end
      end
    end
  end
end
