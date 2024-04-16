module Pod
  class Command
    class Outdated < Command
      include RepoUpdate
      include ProjectDirectory

      self.summary = 'Show outdated project dependencies'

      self.description = <<-DESC
        Shows the outdated pods in the current Podfile.lock, but only those from
        spec repos, not those from local/external sources.
      DESC

      def self.options
        [
          ['--ignore-prerelease', "Don't consider prerelease versions to be updates"],
        ].concat(super)
      end

      def initialize(argv)
        @ignore_prerelease = argv.flag?('ignore-prerelease')
        super
      end

      # Run the command
      #
      def run
        if updates.empty?
          UI.puts 'No pod updates are available.'.yellow
        else
          UI.section 'The color indicates what happens when you run `pod update`' do
            UI.puts "#{'<green>'.green}\t - Will be updated to the newest version"
            UI.puts "#{'<blue>'.blue}\t - Will be updated, but not to the newest version because of specified version in Podfile"
            UI.puts "#{'<red>'.red}\t - Will not be updated because of specified version in Podfile"
            UI.puts ''
          end if ansi_output?
          UI.section 'The following pod updates are available:' do
            updates.each do |(name, from_version, matching_version, to_version)|
              color = :blue
              if matching_version == to_version
                color = :green
              elsif from_version == matching_version
                color = :red
              end
              # For the specs, its necessary that to_s is called here even though it is redundant
              # https://github.com/CocoaPods/CocoaPods/pull/7204#issuecomment-342512015
              UI.puts "- #{name} #{from_version.to_s.send(color)} -> #{matching_version.to_s.send(color)} " \
              "(latest version #{to_version.to_s})" # rubocop:disable Lint/StringConversionInInterpolation
            end
          end
        end

        if deprecated_pods.any?
          UI.section 'The following pods are deprecated:' do
            deprecated_pods.each do |spec|
              if spec.deprecated_in_favor_of
                UI.puts "- #{spec.name}" \
                  " (in favor of #{spec.deprecated_in_favor_of})"
              else
                UI.puts "- #{spec.name}"
              end
            end
          end
        end
      end

      private

      def analyzer
        @analyzer ||= begin
          verify_podfile_exists!
          Installer::Analyzer.new(config.sandbox, config.podfile, config.lockfile)
        end
      end

      def updates
        @updates ||= begin
          ensure_external_podspecs_present!
          spec_sets.map do |set|
            spec = set.specification
            source_version = set.versions.find { |version| !@ignore_prerelease || !version.prerelease? }
            pod_name = spec.root.name
            lockfile_version = lockfile.version(pod_name)
            if source_version > lockfile_version
              matching_spec = unlocked_pods.find { |s| s.name == pod_name }
              matching_version =
                matching_spec ? matching_spec.version : '(unused)'
              [pod_name, lockfile_version, matching_version, source_version]
            end
          end.compact.uniq
        end
      end

      def unlocked_pods
        @unlocked_pods ||= begin
          pods = []
          UI.titled_section('Analyzing dependencies') do
            pods = Installer::Analyzer.new(config.sandbox, config.podfile).
              analyze(:outdated).
              specs_by_target.values.flatten.uniq
          end
          pods
        end
      end

      def deprecated_pods
        @deprecated_pods ||= begin
          spec_sets.map(&:specification).select do |spec|
            spec.deprecated || spec.deprecated_in_favor_of
          end.compact.uniq
        end
      end

      def spec_sets
        @spec_sets ||= begin
          analyzer.send(:update_repositories) if repo_update?(:default => true)
          aggregate = Source::Aggregate.new(analyzer.sources)
          installed_pods.map do |pod_name|
            aggregate.search(Dependency.new(pod_name))
          end.compact.uniq
        end
      end

      def installed_pods
        @installed_pods ||= begin
          verify_podfile_exists!

          lockfile.pod_names
        end
      end

      def lockfile
        @lockfile ||= begin
          verify_lockfile_exists!
          config.lockfile
        end
      end

      def ensure_external_podspecs_present!
        return unless config.podfile
        config.podfile.dependencies.each do |dep|
          next if dep.external_source.nil?
          unless config.sandbox.specification(dep.root_name)
            raise Informative, 'You must run `pod install` first to ensure that the ' \
              "podspec for `#{dep.root_name}` has been fetched."
          end
        end
      end
    end
  end
end
