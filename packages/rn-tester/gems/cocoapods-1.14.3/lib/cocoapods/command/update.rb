module Pod
  class Command
    class Update < Command
      include RepoUpdate
      include ProjectDirectory

      self.summary = 'Update outdated project dependencies and create new ' \
        'Podfile.lock'

      self.description = <<-DESC
        Updates the Pods identified by the specified `POD_NAMES`, which is a
        space-delimited list of pod names. If no `POD_NAMES` are specified, it
        updates all the Pods, ignoring the contents of the Podfile.lock. This
        command is reserved for the update of dependencies; pod install should
        be used to install changes to the Podfile.
      DESC

      self.arguments = [
        CLAide::Argument.new('POD_NAMES', false, true),
      ]

      def self.options
        [
          ["--sources=#{Pod::TrunkSource::TRUNK_REPO_URL}", 'The sources from which to update dependent pods. ' \
           'Multiple sources must be comma-delimited'],
          ['--exclude-pods=podName', 'Pods to exclude during update. Multiple pods must be comma-delimited'],
          ['--clean-install', 'Ignore the contents of the project cache and force a full pod installation. This only ' \
           'applies to projects that have enabled incremental installation'],
        ].concat(super)
      end

      def initialize(argv)
        @pods = argv.arguments!

        @source_urls = argv.option('sources', '').split(',')
        @excluded_pods = argv.option('exclude-pods', '').split(',')
        @clean_install = argv.flag?('clean-install', false)
        @source_pods = @source_urls.flat_map { |url| config.sources_manager.source_with_name_or_url(url).pods }

        super
      end

      def run
        verify_podfile_exists!

        installer = installer_for_config
        installer.repo_update = repo_update?(:default => true)
        installer.clean_install = @clean_install
        if @pods.any? || @excluded_pods.any? || @source_pods.any?
          verify_lockfile_exists!
          verify_pods_are_installed!
          verify_excluded_pods_are_installed!

          @pods += @source_pods.select { |pod| config.lockfile.pod_names.include?(pod) }
          @pods = config.lockfile.pod_names.dup if @pods.empty?
          @pods -= @excluded_pods

          installer.update = { :pods => @pods }
        else
          UI.puts 'Update all pods'.yellow
          installer.update = true
        end
        installer.install!
      end

      private

      # Check if all given pods are installed
      #
      def verify_pods_are_installed!
        missing_pods = lockfile_missing_pods(@pods)

        unless missing_pods.empty?
          message = if missing_pods.length > 1
                      "Pods `#{missing_pods.join('`, `')}` are not " \
                          'installed and cannot be updated'
                    else
                      "The `#{missing_pods.first}` Pod is not installed " \
                          'and cannot be updated'
                    end
          raise Informative, message
        end
      end

      # Check if excluded pods are installed
      #
      def verify_excluded_pods_are_installed!
        missing_pods = lockfile_missing_pods(@excluded_pods)

        unless missing_pods.empty?
          pluralized_words = missing_pods.length > 1 ? %w(Pods are) : %w(Pod is)
          message = "Trying to skip `#{missing_pods.join('`, `')}` #{pluralized_words.first} " \
                  "which #{pluralized_words.last} not installed"
          raise Informative, message
        end
      end

      def lockfile_missing_pods(pods)
        lockfile_roots = config.lockfile.pod_names.map { |pod| Specification.root_name(pod) }
        pods.map { |pod| Specification.root_name(pod) }.uniq - lockfile_roots
      end
    end
  end
end
