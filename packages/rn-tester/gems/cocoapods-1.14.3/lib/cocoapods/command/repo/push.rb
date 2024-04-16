require 'tempfile'
require 'fileutils'
require 'active_support/core_ext/string/inflections'

module Pod
  class Command
    class Repo < Command
      class Push < Repo
        self.summary = 'Push new specifications to a spec-repo'

        self.description = <<-DESC
        Validates `NAME.podspec` or `*.podspec` in the current working dir,
        creates a directory and version folder for the pod in the local copy of
        `REPO` (#{Config.instance.repos_dir}/[REPO]), copies the podspec file into the
        version directory, and finally it pushes `REPO` to its remote.
        DESC

        self.arguments = [
          CLAide::Argument.new('REPO', true),
          CLAide::Argument.new('NAME.podspec', false),
        ]

        def self.options
          [
            ['--allow-warnings', 'Allows pushing even if there are warnings'],
            ['--use-libraries', 'Linter uses static libraries to install the spec'],
            ['--use-modular-headers', 'Lint uses modular headers during installation'],
            ["--sources=#{Pod::TrunkSource::TRUNK_REPO_URL}", 'The sources from which to pull dependent pods ' \
             '(defaults to all available repos). Multiple sources must be comma-delimited'],
            ['--local-only', 'Does not perform the step of pushing REPO to its remote'],
            ['--no-private', 'Lint includes checks that apply only to public repos'],
            ['--skip-import-validation', 'Lint skips validating that the pod can be imported'],
            ['--skip-tests', 'Lint skips building and running tests during validation'],
            ['--commit-message="Fix bug in pod"', 'Add custom commit message. Opens default editor if no commit ' \
              'message is specified'],
            ['--use-json', 'Convert the podspec to JSON before pushing it to the repo'],
            ['--swift-version=VERSION', 'The `SWIFT_VERSION` that should be used when linting the spec. ' \
             'This takes precedence over the Swift versions specified by the spec or a `.swift-version` file'],
            ['--no-overwrite', 'Disallow pushing that would overwrite an existing spec'],
            ['--update-sources', 'Make sure sources are up-to-date before a push'],
            ['--validation-dir', 'The directory to use for validation. If none is specified a temporary directory will be used.'],
          ].concat(super)
        end

        def initialize(argv)
          @allow_warnings = argv.flag?('allow-warnings')
          @local_only = argv.flag?('local-only')
          @repo = argv.shift_argument
          @source = source_for_repo
          @source_urls = argv.option('sources', config.sources_manager.all.map(&:url).append(Pod::TrunkSource::TRUNK_REPO_URL).uniq.join(',')).split(',')
          @update_sources = argv.flag?('update-sources')
          @podspec = argv.shift_argument
          @use_frameworks = !argv.flag?('use-libraries')
          @use_modular_headers = argv.flag?('use-modular-headers', false)
          @private = argv.flag?('private', true)
          @message = argv.option('commit-message')
          @commit_message = argv.flag?('commit-message', false)
          @use_json = argv.flag?('use-json')
          @swift_version = argv.option('swift-version', nil)
          @skip_import_validation = argv.flag?('skip-import-validation', false)
          @skip_tests = argv.flag?('skip-tests', false)
          @allow_overwrite = argv.flag?('overwrite', true)
          @validation_dir = argv.option('validation-dir', nil)
          super
        end

        def validate!
          super
          help! 'A spec-repo name or url is required.' unless @repo
          unless @source && @source.repo.directory?
            raise Informative,
                  "Unable to find the `#{@repo}` repo. " \
                  'If it has not yet been cloned, add it via `pod repo add`.'
          end
        end

        def run
          open_editor if @commit_message && @message.nil?
          check_if_push_allowed
          update_sources if @update_sources
          validate_podspec_files
          check_repo_status
          update_repo
          add_specs_to_repo
          push_repo unless @local_only
        end

        #---------------------------------------------------------------------#

        private

        # @!group Push sub-steps

        extend Executable
        executable :git

        # Open default editor to allow users to enter commit message
        #
        def open_editor
          return if ENV['EDITOR'].nil?

          file = Tempfile.new('cocoapods')
          File.chmod(0777, file.path)
          file.close

          system("#{ENV['EDITOR']} #{file.path}")
          @message = File.read file.path
        end

        # Temporary check to ensure that users do not push accidentally private
        # specs to the master repo.
        #
        def check_if_push_allowed
          if @source.is_a?(CDNSource)
            raise Informative, 'Cannot push to a CDN source, as it is read-only.'
          end

          remotes, = Executable.capture_command('git', %w(remote --verbose), :capture => :merge, :chdir => repo_dir)
          master_repo_urls = [
            'git@github.com:CocoaPods/Specs.git',
            'https://github.com/CocoaPods/Specs.git',
          ]
          is_master_repo = master_repo_urls.any? do |url|
            remotes.include?(url)
          end

          if is_master_repo
            raise Informative, 'To push to the CocoaPods master repo use ' \
              "the `pod trunk push` command.\n\nIf you are using a fork of " \
              'the master repo for private purposes we recommend to migrate ' \
              'to a clean private repo. To disable this check remove the ' \
              'remote pointing to the CocoaPods master repo.'
          end
        end

        # Performs a full lint against the podspecs.
        #
        def validate_podspec_files
          UI.puts "\nValidating #{'spec'.pluralize(count)}".yellow
          podspec_files.each do |podspec|
            validator = Validator.new(podspec, @source_urls)
            validator.allow_warnings = @allow_warnings
            validator.use_frameworks = @use_frameworks
            validator.use_modular_headers = @use_modular_headers
            validator.ignore_public_only_results = @private
            validator.swift_version = @swift_version
            validator.skip_import_validation = @skip_import_validation
            validator.skip_tests = @skip_tests
            validator.validation_dir = @validation_dir
            begin
              validator.validate
            rescue => e
              raise Informative, "The `#{podspec}` specification does not validate." \
                                 "\n\n#{e.message}"
            end
            raise Informative, "The `#{podspec}` specification does not validate." unless validator.validated?
          end
        end

        # Checks that the repo is clean.
        #
        # @raise  If the repo is not clean.
        #
        # @todo   Add specs for staged and unstaged files.
        #
        # @todo   Gracefully handle the case where source is not under git
        #         source control.
        #
        # @return [void]
        #
        def check_repo_status
          porcelain_status, = Executable.capture_command('git', %w(status --porcelain), :capture => :merge, :chdir => repo_dir)
          clean = porcelain_status == ''
          raise Informative, "The repo `#{@repo}` at #{UI.path repo_dir} is not clean" unless clean
        end

        # Updates the git repo against the remote.
        #
        # @return [void]
        #
        def update_repo
          UI.puts "Updating the `#{@repo}' repo\n".yellow
          git!(%W(-C #{repo_dir} pull))
        end

        # Update sources if present
        #
        # @return [void]
        #
        def update_sources
          return if @source_urls.nil?
          @source_urls.each do |source_url|
            source = config.sources_manager.source_with_name_or_url(source_url)
            dir = source.specs_dir
            UI.puts "Updating a source at #{dir} for #{source}"
            git!(%W(-C #{dir} pull))
          end
        end

        # Commits the podspecs to the source, which should be a git repo.
        #
        # @note   The pre commit hook of the repo is skipped as the podspecs have
        #         already been linted.
        #
        # @return [void]
        #
        def add_specs_to_repo
          UI.puts "\nAdding the #{'spec'.pluralize(count)} to the `#{@repo}' repo\n".yellow
          podspec_files.each do |spec_file|
            spec = Pod::Specification.from_file(spec_file)
            output_path = @source.pod_path(spec.name) + spec.version.to_s
            message = if @message && !@message.empty?
                        @message
                      elsif output_path.exist?
                        "[Fix] #{spec}"
                      elsif output_path.dirname.directory?
                        "[Update] #{spec}"
                      else
                        "[Add] #{spec}"
                      end

            if output_path.exist? && !@allow_overwrite
              raise Informative, "#{spec} already exists and overwriting has been disabled."
            end

            FileUtils.mkdir_p(output_path)

            if @use_json
              json_file_name = "#{spec.name}.podspec.json"
              json_file = File.join(output_path, json_file_name)
              File.open(json_file, 'w') { |file| file.write(spec.to_pretty_json) }
            else
              FileUtils.cp(spec_file, output_path)
            end

            # only commit if modified
            if repo_git('status', '--porcelain').include?(spec.name)
              UI.puts " - #{message}"
              repo_git('add', spec.name)
              repo_git('commit', '--no-verify', '-m', message)
            else
              UI.puts " - [No change] #{spec}"
            end
          end
        end

        # Pushes the git repo against the remote.
        #
        # @return [void]
        #
        def push_repo
          UI.puts "\nPushing the `#{@repo}' repo\n".yellow
          repo_git('push', 'origin', 'HEAD')
        end

        #---------------------------------------------------------------------#

        private

        # @!group Private helpers

        # @return result of calling the git! with args in repo_dir
        #
        def repo_git(*args)
          git!(['-C', repo_dir] + args)
        end

        # @return [Pathname] The directory of the repository.
        #
        def repo_dir
          @source.specs_dir
        end

        # @return [Array<Pathname>] The path of the specifications to push.
        #
        def podspec_files
          if @podspec
            path = Pathname(@podspec)
            raise Informative, "Couldn't find #{@podspec}" unless path.exist?
            [path]
          else
            files = Pathname.glob('*.podspec{,.json}')
            raise Informative, "Couldn't find any podspec files in current directory" if files.empty?
            files
          end
        end

        # @return [Integer] The number of the podspec files to push.
        #
        def count
          podspec_files.count
        end

        # Returns source for @repo
        #
        # @note If URL is invalid or repo doesn't exist, validate! will throw the error
        #
        # @return [Source]
        #
        def source_for_repo
          config.sources_manager.source_with_name_or_url(@repo) unless @repo.nil?
        rescue
          nil
        end

        #---------------------------------------------------------------------#
      end
    end
  end
end
