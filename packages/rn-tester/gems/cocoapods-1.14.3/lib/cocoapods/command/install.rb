module Pod
  class Command
    class Install < Command
      include RepoUpdate
      include ProjectDirectory

      self.summary = 'Install project dependencies according to versions from a Podfile.lock'

      self.description = <<-DESC
        Downloads all dependencies defined in `Podfile` and creates an Xcode
        Pods library project in `./Pods`.

        The Xcode project file should be specified in your `Podfile` like this:

            project 'path/to/XcodeProject.xcodeproj'

        If no project is specified, then a search for an Xcode project will
        be made. If more than one Xcode project is found, the command will
        raise an error.

        This will configure the project to reference the Pods static library,
        add a build configuration file, and add a post build script to copy
        Pod resources.

        This may return one of several error codes if it encounters problems.
        * `1` Generic error code
        * `31` Spec not found (i.e out-of-date source repos, mistyped Pod name etc...)
      DESC

      def self.options
        [
          ['--repo-update', 'Force running `pod repo update` before install'],
          ['--deployment', 'Disallow any changes to the Podfile or the Podfile.lock during installation'],
          ['--clean-install', 'Ignore the contents of the project cache and force a full pod installation. This only ' \
            'applies to projects that have enabled incremental installation'],
        ].concat(super).reject { |(name, _)| name == '--no-repo-update' }
      end

      def initialize(argv)
        super
        @deployment = argv.flag?('deployment', false)
        @clean_install = argv.flag?('clean-install', false)
      end

      def run
        verify_podfile_exists!
        installer = installer_for_config
        installer.repo_update = repo_update?(:default => false)
        installer.update = false
        installer.deployment = @deployment
        installer.clean_install = @clean_install
        installer.install!
      end
    end
  end
end
