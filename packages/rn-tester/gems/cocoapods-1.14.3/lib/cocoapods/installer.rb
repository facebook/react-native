require 'active_support/core_ext/string/inflections'
require 'fileutils'
require 'cocoapods/podfile'

module Pod
  # The Installer is responsible of taking a Podfile and transform it in the
  # Pods libraries. It also integrates the user project so the Pods
  # libraries can be used out of the box.
  #
  # The Installer is capable of doing incremental updates to an existing Pod
  # installation.
  #
  # The Installer gets the information that it needs mainly from 3 files:
  #
  #   - Podfile: The specification written by the user that contains
  #     information about targets and Pods.
  #   - Podfile.lock: Contains information about the pods that were previously
  #     installed and in concert with the Podfile provides information about
  #     which specific version of a Pod should be installed. This file is
  #     ignored in update mode.
  #   - Manifest.lock: A file contained in the Pods folder that keeps track of
  #     the pods installed in the local machine. This files is used once the
  #     exact versions of the Pods has been computed to detect if that version
  #     is already installed. This file is not intended to be kept under source
  #     control and is a copy of the Podfile.lock.
  #
  # The Installer is designed to work in environments where the Podfile folder
  # is under source control and environments where it is not. The rest of the
  # files, like the user project and the workspace are assumed to be under
  # source control.
  #
  class Installer
    autoload :Analyzer,                     'cocoapods/installer/analyzer'
    autoload :InstallationOptions,          'cocoapods/installer/installation_options'
    autoload :PostInstallHooksContext,      'cocoapods/installer/post_install_hooks_context'
    autoload :PreInstallHooksContext,       'cocoapods/installer/pre_install_hooks_context'
    autoload :BaseInstallHooksContext,      'cocoapods/installer/base_install_hooks_context'
    autoload :PostIntegrateHooksContext,    'cocoapods/installer/post_integrate_hooks_context'
    autoload :PreIntegrateHooksContext,     'cocoapods/installer/pre_integrate_hooks_context'
    autoload :SourceProviderHooksContext,   'cocoapods/installer/source_provider_hooks_context'
    autoload :PodfileValidator,             'cocoapods/installer/podfile_validator'
    autoload :PodSourceDownloader,          'cocoapods/installer/pod_source_downloader'
    autoload :PodSourceInstaller,           'cocoapods/installer/pod_source_installer'
    autoload :PodSourcePreparer,            'cocoapods/installer/pod_source_preparer'
    autoload :UserProjectIntegrator,        'cocoapods/installer/user_project_integrator'
    autoload :Xcode,                        'cocoapods/installer/xcode'
    autoload :SandboxHeaderPathsInstaller,  'cocoapods/installer/sandbox_header_paths_installer'
    autoload :SandboxDirCleaner,            'cocoapods/installer/sandbox_dir_cleaner'
    autoload :ProjectCache,                 'cocoapods/installer/project_cache/project_cache'
    autoload :TargetUUIDGenerator,          'cocoapods/installer/target_uuid_generator'

    include Config::Mixin

    MASTER_SPECS_REPO_GIT_URL = 'https://github.com/CocoaPods/Specs.git'.freeze

    # @return [Sandbox] The sandbox where the Pods should be installed.
    #
    attr_reader :sandbox

    # @return [Podfile] The Podfile specification that contains the information
    #         of the Pods that should be installed.
    #
    attr_reader :podfile

    # @return [Lockfile] The Lockfile that stores the information about the
    #         Pods previously installed on any machine.
    #
    attr_reader :lockfile

    # Initialize a new instance
    #
    # @param  [Sandbox]  sandbox     @see #sandbox
    # @param  [Podfile]  podfile     @see #podfile
    # @param  [Lockfile] lockfile    @see #lockfile
    #
    def initialize(sandbox, podfile, lockfile = nil)
      @sandbox  = sandbox || raise(ArgumentError, 'Missing required argument `sandbox`')
      @podfile  = podfile || raise(ArgumentError, 'Missing required argument `podfile`')
      @lockfile = lockfile

      @use_default_plugins = true
      @has_dependencies = true
      @pod_installers = []
    end

    # @return [Hash, Boolean, nil] Pods that have been requested to be
    #         updated or true if all Pods should be updated.
    #         If all Pods should been updated the contents of the Lockfile are
    #         not taken into account for deciding what Pods to install.
    #
    attr_accessor :update

    # @return [Boolean] Whether it has dependencies. Defaults to true.
    #
    attr_accessor :has_dependencies
    alias_method :has_dependencies?, :has_dependencies

    # @return [Boolean] Whether the spec repos should be updated.
    #
    attr_accessor :repo_update
    alias_method :repo_update?, :repo_update

    # @return [Boolean] Whether default plugins should be used during
    #                   installation. Defaults to true.
    #
    attr_accessor :use_default_plugins
    alias_method :use_default_plugins?, :use_default_plugins

    # @return [Boolean] Whether installation should verify that there are no
    #                   Podfile or Lockfile changes. Defaults to false.
    #
    attr_accessor :deployment
    alias_method :deployment?, :deployment

    # @return [Boolean] Whether installation should ignore the contents of the project cache
    # when incremental installation is enabled.
    #
    attr_accessor :clean_install
    alias_method :clean_install?, :clean_install

    #-------------------------------------------------------------------------#

    private

    # @return [Array<PodSourceInstaller>] the pod installers created
    #         while installing pod targets
    #
    attr_reader :pod_installers

    # @return [ProjectInstallationCache] The installation cache stored in Pods/.project_cache/installation_cache
    #
    attr_reader :installation_cache

    # @return [ProjectMetadataCache] The metadata cache stored in Pods/.project_cache/metadata_cache
    #
    attr_reader :metadata_cache

    # @return [ProjectCacheVersion] The version of the project cache stored in Pods/.project_cache/version
    #
    attr_reader :project_cache_version

    #-------------------------------------------------------------------------#

    public

    # Installs the Pods.
    #
    # The installation process is mostly linear with a few minor complications
    # to keep in mind:
    #
    # - The stored podspecs need to be cleaned before the resolution step
    #   otherwise the sandbox might return an old podspec and not download
    #   the new one from an external source.
    # - The resolver might trigger the download of Pods from external sources
    #   necessary to retrieve their podspec (unless it is instructed not to
    #   do it).
    #
    # @return [void]
    #
    def install!
      prepare
      resolve_dependencies
      download_dependencies
      validate_targets
      clean_sandbox
      if installation_options.skip_pods_project_generation?
        show_skip_pods_project_generation_message
        run_podfile_post_install_hooks
      else
        integrate
      end
      write_lockfiles
      perform_post_install_actions
    end

    def show_skip_pods_project_generation_message
      UI.section 'Skipping Pods Project Creation'
      UI.section 'Skipping User Project Integration'
    end

    def integrate
      run_podfile_pre_integrate_hooks
      generate_pods_project
      if installation_options.integrate_targets?
        integrate_user_project
      else
        UI.section 'Skipping User Project Integration'
      end
    end

    def analyze_project_cache
      user_projects = aggregate_targets.map(&:user_project).compact.uniq
      object_version = user_projects.min_by { |p| p.object_version.to_i }.object_version.to_i unless user_projects.empty?

      if !installation_options.incremental_installation
        # Run entire installation.
        ProjectCache::ProjectCacheAnalysisResult.new(pod_targets, aggregate_targets, {},
                                                     analysis_result.all_user_build_configurations, object_version)
      else
        UI.message 'Analyzing Project Cache' do
          @installation_cache = ProjectCache::ProjectInstallationCache.from_file(sandbox, sandbox.project_installation_cache_path)
          @metadata_cache = ProjectCache::ProjectMetadataCache.from_file(sandbox, sandbox.project_metadata_cache_path)
          @project_cache_version = ProjectCache::ProjectCacheVersion.from_file(sandbox.project_version_cache_path)

          force_clean_install = clean_install || project_cache_version.version != Version.create(VersionMetadata.project_cache_version)
          cache_result = ProjectCache::ProjectCacheAnalyzer.new(sandbox, installation_cache, analysis_result.all_user_build_configurations,
                                                                object_version, plugins, pod_targets, aggregate_targets, installation_options.to_h, :clean_install => force_clean_install).analyze
          aggregate_targets_to_generate = cache_result.aggregate_targets_to_generate || []
          pod_targets_to_generate = cache_result.pod_targets_to_generate
          (aggregate_targets_to_generate + pod_targets_to_generate).each do |target|
            UI.message "- Regenerating #{target.label}"
          end
          cache_result
        end
      end
    end

    def prepare
      # Raise if pwd is inside Pods
      if Dir.pwd.start_with?(sandbox.root.to_path)
        message = 'Command should be run from a directory outside Pods directory.'
        message << "\n\n\tCurrent directory is #{UI.path(Pathname.pwd)}\n"
        raise Informative, message
      end
      UI.message 'Preparing' do
        deintegrate_if_different_major_version
        sandbox.prepare
        ensure_plugins_are_installed!
        run_plugins_pre_install_hooks
      end
    end

    # @return [Analyzer] The analyzer used to resolve dependencies
    #
    def resolve_dependencies
      plugin_sources = run_source_provider_hooks
      analyzer = create_analyzer(plugin_sources)

      UI.section 'Updating local specs repositories' do
        analyzer.update_repositories
      end if repo_update?

      UI.section 'Analyzing dependencies' do
        analyze(analyzer)
        validate_build_configurations
      end

      UI.section 'Verifying no changes' do
        verify_no_podfile_changes!
        verify_no_lockfile_changes!
      end if deployment?

      analyzer
    end

    def download_dependencies
      UI.section 'Downloading dependencies' do
        install_pod_sources
        run_podfile_pre_install_hooks
        clean_pod_sources
      end
    end

    # Stages the sandbox after analysis.
    #
    # @param [Sandbox] sandbox
    #        The sandbox to stage.
    #
    # @param [Array<PodTarget>] pod_targets
    #        The list of all pod targets.
    #
    # @return [void]
    #
    def stage_sandbox(sandbox, pod_targets)
      SandboxHeaderPathsInstaller.new(sandbox, pod_targets).install!
    end

    #-------------------------------------------------------------------------#

    # @!group Pods Project Generation

    private

    def create_generator(pod_targets_to_generate, aggregate_targets_to_generate, build_configurations, project_object_version, generate_multiple_pod_projects = false)
      if generate_multiple_pod_projects
        Xcode::MultiPodsProjectGenerator.new(sandbox, aggregate_targets_to_generate, pod_targets_to_generate,
                                             build_configurations, installation_options, config, project_object_version, metadata_cache)
      else
        Xcode::SinglePodsProjectGenerator.new(sandbox, aggregate_targets_to_generate, pod_targets_to_generate, build_configurations, installation_options, config, project_object_version)
      end
    end

    # Generates the Xcode project(s) that go inside the `Pods/` directory.
    #
    def generate_pods_project
      stage_sandbox(sandbox, pod_targets)

      cache_analysis_result = analyze_project_cache
      pod_targets_to_generate = cache_analysis_result.pod_targets_to_generate
      aggregate_targets_to_generate = cache_analysis_result.aggregate_targets_to_generate

      pod_targets_to_generate.each do |pod_target|
        pod_target.build_headers.implode_path!(pod_target.headers_sandbox)
        sandbox.public_headers.implode_path!(pod_target.headers_sandbox)
      end

      create_and_save_projects(pod_targets_to_generate, aggregate_targets_to_generate,
                               cache_analysis_result.build_configurations, cache_analysis_result.project_object_version)
      SandboxDirCleaner.new(sandbox, pod_targets, aggregate_targets).clean!

      update_project_cache(cache_analysis_result, target_installation_results)
    end

    def create_and_save_projects(pod_targets_to_generate, aggregate_targets_to_generate, build_configurations, project_object_version)
      UI.section 'Generating Pods project' do
        generator = create_generator(pod_targets_to_generate, aggregate_targets_to_generate,
                                     build_configurations, project_object_version,
                                     installation_options.generate_multiple_pod_projects)

        pod_project_generation_result = generator.generate!
        @target_installation_results = pod_project_generation_result.target_installation_results
        @pods_project = pod_project_generation_result.project
        # The `pod_target_subprojects` is used for backwards compatibility so that consumers can iterate over
        # all pod targets across projects without needing to open each one.
        @pod_target_subprojects = pod_project_generation_result.projects_by_pod_targets.keys
        @generated_projects = ([pods_project] + pod_target_subprojects || []).compact
        @generated_pod_targets = pod_targets_to_generate
        @generated_aggregate_targets = aggregate_targets_to_generate || []
        projects_by_pod_targets = pod_project_generation_result.projects_by_pod_targets

        predictabilize_uuids(generated_projects) if installation_options.deterministic_uuids?
        stabilize_target_uuids(generated_projects)

        projects_writer = Xcode::PodsProjectWriter.new(sandbox, generated_projects,
                                                       target_installation_results.pod_target_installation_results, installation_options)
        projects_writer.write! do
          run_podfile_post_install_hooks
        end

        pods_project_pod_targets = pod_targets_to_generate - projects_by_pod_targets.values.flatten
        all_projects_by_pod_targets = {}
        pods_project_by_targets = { pods_project => pods_project_pod_targets } if pods_project
        all_projects_by_pod_targets.merge!(pods_project_by_targets) if pods_project_by_targets
        all_projects_by_pod_targets.merge!(projects_by_pod_targets) if projects_by_pod_targets
        all_projects_by_pod_targets.each do |project, pod_targets|
          generator.configure_schemes(project, pod_targets, pod_project_generation_result)
        end
      end
    end

    def predictabilize_uuids(projects)
      UI.message('- Generating deterministic UUIDs') { Xcodeproj::Project.predictabilize_uuids(projects) }
    end

    def stabilize_target_uuids(projects)
      UI.message('- Stabilizing target UUIDs') { TargetUUIDGenerator.new(projects).generate! }
    end

    #-------------------------------------------------------------------------#

    public

    # @!group Installation results

    # @return [Analyzer::AnalysisResult] the result of the analysis performed during installation
    #
    attr_reader :analysis_result

    # @return [Array<Hash{String, TargetInstallationResult}>] the installation results produced by the pods project
    #         generator
    #
    attr_reader :target_installation_results

    # @return [Pod::Project] the `Pods/Pods.xcodeproj` project.
    #
    attr_reader :pods_project

    # @return [Array<Pod::Project>] the subprojects nested under pods_project.
    #
    attr_reader :pod_target_subprojects

    # @return [Array<AggregateTarget>] The model representations of an
    #         aggregation of pod targets generated for a target definition
    #         in the Podfile as result of the analyzer.
    #
    attr_reader :aggregate_targets

    # @return [Array<PodTarget>] The model representations of pod targets
    #         generated as result of the analyzer.
    #
    attr_reader :pod_targets

    # @return [Array<Project>] The list of projects generated from the installation.
    #
    attr_reader :generated_projects

    # @return [Array<PodTarget>] The list of pod targets that were generated from the installation.
    #
    attr_reader :generated_pod_targets

    # @return [Array<AggregateTarget>] The list of aggregate targets that were generated from the installation.
    #
    attr_reader :generated_aggregate_targets

    # @return [Array<Specification>] The specifications that were installed.
    #
    attr_accessor :installed_specs

    #-------------------------------------------------------------------------#

    private

    # @!group Installation steps

    # Performs the analysis.
    #
    # @param  [Analyzer] analyzer the analyzer to use for analysis
    #
    # @return [void]
    #
    def analyze(analyzer = create_analyzer)
      @analysis_result = analyzer.analyze
      @aggregate_targets = @analysis_result.targets
      @pod_targets = @analysis_result.pod_targets
    end

    def create_analyzer(plugin_sources = nil)
      Analyzer.new(sandbox, podfile, lockfile, plugin_sources, has_dependencies?, update)
    end

    # Ensures that the white-listed build configurations are known to prevent
    # silent typos.
    #
    # @raise  If an unknown user configuration is found.
    #
    def validate_build_configurations
      whitelisted_configs = pod_targets.
        flat_map(&:target_definitions).
        flat_map(&:all_whitelisted_configurations).
        map(&:downcase).
        uniq
      all_user_configurations = analysis_result.all_user_build_configurations.keys.map(&:downcase)

      remainder = whitelisted_configs - all_user_configurations
      unless remainder.empty?
        raise Informative,
              "Unknown #{'configuration'.pluralize(remainder.size)} whitelisted: #{remainder.sort.to_sentence}. " \
              "CocoaPods found #{all_user_configurations.sort.to_sentence}, did you mean one of these?"
      end
    end

    # @return [void] Performs a general clean up of the sandbox related to the sandbox state that was
    #                calculated. For example, pods that were marked for deletion are removed.
    #
    def clean_sandbox
      unless sandbox_state.deleted.empty?
        title_options = { :verbose_prefix => '-> '.red }
        sandbox_state.deleted.each do |pod_name|
          UI.titled_section("Removing #{pod_name}".red, title_options) do
            root_name = Specification.root_name(pod_name)
            pod_dir = sandbox.local?(root_name) ? nil : sandbox.pod_dir(root_name)
            sandbox.clean_pod(pod_name, pod_dir)
          end
        end
      end

      # Check any changed pods that became local pods and used to be remote pods and
      # ensure the sandbox is cleaned up.
      unless sandbox_state.changed.empty?
        sandbox_state.changed.each do |pod_name|
          previous_spec_repo = sandbox.manifest.spec_repo(pod_name)
          should_clean = !previous_spec_repo.nil? && sandbox.local?(pod_name)
          sandbox.clean_pod(pod_name, sandbox.sources_root + Specification.root_name(pod_name)) if should_clean
        end
      end
    end

    # @raise [Informative] If there are any Podfile changes
    #
    def verify_no_podfile_changes!
      return unless analysis_result.podfile_needs_install?

      changed_state = analysis_result.podfile_state.to_s(:states => %i(added deleted changed))
      raise Informative, "There were changes to the podfile in deployment mode:\n#{changed_state}"
    end

    # @raise [Informative] If there are any Lockfile changes
    #
    def verify_no_lockfile_changes!
      new_lockfile = generate_lockfile
      return if new_lockfile == lockfile

      return unless diff = Xcodeproj::Differ.hash_diff(lockfile.to_hash, new_lockfile.to_hash, :key_1 => 'Old Lockfile', :key_2 => 'New Lockfile')
      pretty_diff = YAMLHelper.convert_hash(diff, Lockfile::HASH_KEY_ORDER, "\n\n")
      pretty_diff.gsub!(':diff:', 'diff:'.yellow)

      raise Informative, "There were changes to the lockfile in deployment mode:\n#{pretty_diff}"
    end

    # Downloads, installs the documentation and cleans the sources of the Pods
    # which need to be installed.
    #
    # @return [void]
    #
    def install_pod_sources
      @downloaded_specs = []
      @installed_specs = []
      pods_to_install = sandbox_state.added | sandbox_state.changed
      title_options = { :verbose_prefix => '-> '.green }

      sorted_root_specs = root_specs.sort_by(&:name)

      # Download pods in parallel before installing if the option is set
      if installation_options.parallel_pod_downloads
        require 'concurrent/executor/fixed_thread_pool'
        thread_pool_size = installation_options.parallel_pod_download_thread_pool_size
        thread_pool = Concurrent::FixedThreadPool.new(thread_pool_size, :idletime => 300)

        sorted_root_specs.each do |spec|
          if pods_to_install.include?(spec.name)
            title = section_title(spec, 'Downloading')
            UI.titled_section(title.green, title_options) do
              thread_pool.post do
                download_source_of_pod(spec.name)
              end
            end
          end
        end

        thread_pool.shutdown
        thread_pool.wait_for_termination
      end

      # Install pods, which includes downloading only if parallel_pod_downloads is set to false
      sorted_root_specs.each do |spec|
        if pods_to_install.include?(spec.name)
          title = section_title(spec, 'Installing')
          UI.titled_section(title.green, title_options) do
            install_source_of_pod(spec.name)
          end
        else
          UI.section("Using #{spec}", title_options[:verbose_prefix]) do
            create_pod_installer(spec.name)
          end
        end
      end
    end

    def section_title(spec, current_action)
      if sandbox_state.changed.include?(spec.name) && sandbox.manifest
        current_version = spec.version
        previous_version = sandbox.manifest.version(spec.name)
        has_changed_version = current_version != previous_version
        current_repo = analysis_result.specs_by_source.detect { |key, values| break key if values.map(&:name).include?(spec.name) }
        current_repo &&= (Pod::TrunkSource::TRUNK_REPO_NAME if current_repo.name == Pod::TrunkSource::TRUNK_REPO_NAME) || current_repo.url || current_repo.name
        previous_spec_repo = sandbox.manifest.spec_repo(spec.name)
        has_changed_repo = !previous_spec_repo.nil? && current_repo && !current_repo.casecmp(previous_spec_repo).zero?
        title = "#{current_action} #{spec.name} #{spec.version}"
        title << " (was #{previous_version} and source changed to `#{current_repo}` from `#{previous_spec_repo}`)" if has_changed_version && has_changed_repo
        title << " (was #{previous_version})" if has_changed_version && !has_changed_repo
        title << " (source changed to `#{current_repo}` from `#{previous_spec_repo}`)" if !has_changed_version && has_changed_repo
      else
        title = "#{current_action} #{spec}"
      end
      title
    end

    def create_pod_installer(pod_name)
      specs_by_platform = specs_for_pod(pod_name)

      if specs_by_platform.empty?
        requiring_targets = pod_targets.select { |pt| pt.recursive_dependent_targets.any? { |dt| dt.pod_name == pod_name } }
        message = "Could not install '#{pod_name}' pod"
        message += ", depended upon by #{requiring_targets.to_sentence}" unless requiring_targets.empty?
        message += '. There is either no platform to build for, or no target to build.'
        raise StandardError, message
      end

      pod_installer = PodSourceInstaller.new(sandbox, podfile, specs_by_platform, :can_cache => installation_options.clean?)
      pod_installers << pod_installer
      pod_installer
    end

    def create_pod_downloader(pod_name)
      specs_by_platform = specs_for_pod(pod_name)

      if specs_by_platform.empty?
        requiring_targets = pod_targets.select { |pt| pt.recursive_dependent_targets.any? { |dt| dt.pod_name == pod_name } }
        message = "Could not download '#{pod_name}' pod"
        message += ", depended upon by #{requiring_targets.to_sentence}" unless requiring_targets.empty?
        message += '. There is either no platform to build for, or no target to build.'
        raise StandardError, message
      end

      PodSourceDownloader.new(sandbox, podfile, specs_by_platform, :can_cache => installation_options.clean?)
    end

    # The specifications matching the specified pod name
    #
    # @param  [String] pod_name the name of the pod
    #
    # @return [Hash{Platform => Array<Specification>}] the specifications grouped by platform
    #
    def specs_for_pod(pod_name)
      pod_targets.each_with_object({}) do |pod_target, hash|
        if pod_target.root_spec.name == pod_name
          hash[pod_target.platform] ||= []
          hash[pod_target.platform].concat(pod_target.specs)
        end
      end
    end

    # Install the Pods. If the resolver indicated that a Pod should be
    # installed and it exits, it is removed and then reinstalled. In any case if
    # the Pod doesn't exits it is installed.
    #
    # @return [void]
    #
    def install_source_of_pod(pod_name)
      pod_installer = create_pod_installer(pod_name)
      pod_installer.install!
      @installed_specs.concat(pod_installer.specs_by_platform.values.flatten.uniq)
    end

    # Download the pod unless it is local or has been predownloaded from an
    # external source.
    #
    # @return [void]
    #
    def download_source_of_pod(pod_name)
      return if sandbox.local?(pod_name) || sandbox.predownloaded?(pod_name)

      pod_downloader = create_pod_downloader(pod_name)
      pod_downloader.download!
    end

    # Cleans the sources of the Pods if the config instructs to do so.
    #
    def clean_pod_sources
      return unless installation_options.clean?
      return if installed_specs.empty?
      pod_installers.each(&:clean!)
    end

    # Unlocks the sources of the Pods.
    #
    def unlock_pod_sources
      pod_installers.each do |installer|
        pod_target = pod_targets.find { |target| target.pod_name == installer.name }
        installer.unlock_files!(pod_target.file_accessors)
      end
    end

    # Locks the sources of the Pods if the config instructs to do so.
    #
    def lock_pod_sources
      return unless installation_options.lock_pod_sources?
      pod_installers.each do |installer|
        pod_target = pod_targets.find { |target| target.pod_name == installer.name }
        installer.lock_files!(pod_target.file_accessors)
      end
    end

    def validate_targets
      validator = Xcode::TargetValidator.new(aggregate_targets, pod_targets, installation_options)
      validator.validate!
    end

    # Runs the registered callbacks for the plugins pre install hooks.
    #
    # @return [void]
    #
    def run_plugins_pre_install_hooks
      context = PreInstallHooksContext.generate(sandbox, podfile, lockfile)
      HooksManager.run(:pre_install, context, plugins)
    end

    # Performs any post-installation actions
    #
    # @return [void]
    #
    def perform_post_install_actions
      run_plugins_post_install_hooks
      warn_for_deprecations
      warn_for_installed_script_phases
      warn_for_removing_git_master_specs_repo
      print_post_install_message
    end

    def print_post_install_message
      podfile_dependencies = analysis_result.podfile_dependency_cache.podfile_dependencies.size
      pods_installed = root_specs.size
      title_options = { :verbose_prefix => '-> '.green }
      UI.titled_section('Pod installation complete! ' \
                        "There #{podfile_dependencies == 1 ? 'is' : 'are'} #{podfile_dependencies} " \
                        "#{'dependency'.pluralize(podfile_dependencies)} from the Podfile " \
                        "and #{pods_installed} total #{'pod'.pluralize(pods_installed)} installed.".green,
                        title_options)
    end

    # Runs the registered callbacks for the plugins pre integrate hooks.
    #
    def run_plugins_pre_integrate_hooks
      if any_plugin_pre_integrate_hooks?
        context = PreIntegrateHooksContext.generate(sandbox, pods_project, pod_target_subprojects, aggregate_targets)
        HooksManager.run(:pre_integrate, context, plugins)
      end
    end

    # Runs the registered callbacks for the plugins post install hooks.
    #
    def run_plugins_post_install_hooks
      # This short-circuits because unlocking pod sources is expensive
      if any_plugin_post_install_hooks?
        unlock_pod_sources

        context = PostInstallHooksContext.generate(sandbox, pods_project, pod_target_subprojects, aggregate_targets)
        HooksManager.run(:post_install, context, plugins)
      end

      lock_pod_sources
    end

    # Runs the registered callbacks for the plugins post integrate hooks.
    #
    def run_plugins_post_integrate_hooks
      if any_plugin_post_integrate_hooks?
        context = PostIntegrateHooksContext.generate(sandbox, pods_project, pod_target_subprojects, aggregate_targets)
        HooksManager.run(:post_integrate, context, plugins)
      end
    end

    # @return [Boolean] whether there are any plugin pre-integrate hooks to run
    #
    def any_plugin_pre_integrate_hooks?
      HooksManager.hooks_to_run(:pre_integrate, plugins).any?
    end

    # @return [Boolean] whether there are any plugin post-install hooks to run
    #
    def any_plugin_post_install_hooks?
      HooksManager.hooks_to_run(:post_install, plugins).any?
    end

    # @return [Boolean] whether there are any plugin post-integrate hooks to run
    #
    def any_plugin_post_integrate_hooks?
      HooksManager.hooks_to_run(:post_integrate, plugins).any?
    end

    # Runs the registered callbacks for the source provider plugin hooks.
    #
    # @return [Array<Pod::Source>] the plugin sources
    #
    def run_source_provider_hooks
      context = SourceProviderHooksContext.generate
      HooksManager.run(:source_provider, context, plugins)
      context.sources
    end

    # Run the deintegrator against all projects in the installation root if the
    # current CocoaPods major version part is different than the one in the
    # lockfile.
    #
    # @return [void]
    #
    def deintegrate_if_different_major_version
      return unless lockfile
      return if lockfile.cocoapods_version.major == Version.create(VERSION).major
      UI.section('Re-creating CocoaPods due to major version update.') do
        projects = Pathname.glob(config.installation_root + '*.xcodeproj').map { |path| Xcodeproj::Project.open(path) }
        deintegrator = Deintegrator.new
        projects.each do |project|
          config.with_changes(:silent => true) { deintegrator.deintegrate_project(project) }
          project.save if project.dirty?
        end
      end
    end

    # Ensures that all plugins specified in the {#podfile} are loaded.
    #
    # @return [void]
    #
    def ensure_plugins_are_installed!
      require 'claide/command/plugin_manager'

      loaded_plugins = Command::PluginManager.specifications.map(&:name)

      podfile.plugins.keys.each do |plugin|
        unless loaded_plugins.include? plugin
          raise Informative, "Your Podfile requires that the plugin `#{plugin}` be installed. Please install it and try installation again."
        end
      end
    end

    DEFAULT_PLUGINS = {}

    # Returns the plugins that should be run, as indicated by the default
    # plugins and the podfile's plugins
    #
    # @return [Hash<String, Hash>] The plugins to be used
    #
    def plugins
      if use_default_plugins?
        DEFAULT_PLUGINS.merge(podfile.plugins)
      else
        podfile.plugins
      end
    end

    # Prints a warning for any pods that are deprecated
    #
    # @return [void]
    #
    def warn_for_deprecations
      deprecated_pods = root_specs.select do |spec|
        spec.deprecated || spec.deprecated_in_favor_of
      end
      deprecated_pods.each do |spec|
        if spec.deprecated_in_favor_of
          UI.warn "#{spec.name} has been deprecated in " \
            "favor of #{spec.deprecated_in_favor_of}"
        else
          UI.warn "#{spec.name} has been deprecated"
        end
      end
    end

    # Prints a warning for any pods that included script phases
    #
    # @return [void]
    #
    def warn_for_installed_script_phases
      pods_to_install = sandbox_state.added | sandbox_state.changed
      pod_targets.group_by(&:pod_name).each do |name, pod_targets|
        if pods_to_install.include?(name) && !sandbox.local?(name)
          script_phase_count = pod_targets.inject(0) { |sum, target| sum + target.script_phases.count }
          unless script_phase_count.zero?
            UI.warn "#{name} has added #{script_phase_count} #{'script phase'.pluralize(script_phase_count)}. " \
              'Please inspect before executing a build. See `https://guides.cocoapods.org/syntax/podspec.html#script_phases` for more information.'
          end
        end
      end
    end

    # Prints a warning if the project is not explicitly using the git based master specs repo.
    #
    # Helps users to delete the git based master specs repo from the repos directory which reduces `--repo-update`
    # speed and hopefully reduces Github workload.
    #
    # @return [void]
    #
    def warn_for_removing_git_master_specs_repo
      return unless installation_options.warn_for_unused_master_specs_repo?
      plugin_sources = run_source_provider_hooks
      all_sources = podfile.sources + plugin_sources.map(&:url)
      master_source = all_sources.find { |source| source == MASTER_SPECS_REPO_GIT_URL }
      master_repo = config.sources_manager.all.find { |s| s.url == MASTER_SPECS_REPO_GIT_URL }
      if master_source.nil? && !master_repo.nil?
        UI.warn 'Your project does not explicitly specify the CocoaPods master specs repo. Since CDN is now used as the' \
        ' default, you may safely remove it from your repos directory via `pod repo remove master`. To suppress this warning' \
        ' please add `warn_for_unused_master_specs_repo => false` to your Podfile.'
      end
    end

    # @return [Lockfile] The lockfile to write to disk.
    #
    def generate_lockfile
      external_source_pods = analysis_result.podfile_dependency_cache.podfile_dependencies.select(&:external_source).map(&:root_name).uniq
      checkout_options = sandbox.checkout_sources.select { |root_name, _| external_source_pods.include? root_name }
      Lockfile.generate(podfile, analysis_result.specifications, checkout_options, analysis_result.specs_by_source)
    end

    # Writes the Podfile and the lock files.
    #
    # @return [void]
    #
    def write_lockfiles
      @lockfile = generate_lockfile

      UI.message "- Writing Lockfile in #{UI.path config.lockfile_path}" do
        # No need to invoke Sandbox#update_changed_file here since this logic already handles checking if the
        # contents of the file are the same.
        @lockfile.write_to_disk(config.lockfile_path)
      end

      UI.message "- Writing Manifest in #{UI.path sandbox.manifest_path}" do
        # No need to invoke Sandbox#update_changed_file here since this logic already handles checking if the
        # contents of the file are the same.
        @lockfile.write_to_disk(sandbox.manifest_path)
      end
    end

    # @param [ProjectCacheAnalysisResult] cache_analysis_result
    #        The cache analysis result for the current installation.
    #
    # @param [Hash{String => TargetInstallationResult}] target_installation_results
    #        The installation results for pod targets installed.
    #
    def update_project_cache(cache_analysis_result, target_installation_results)
      return unless installation_cache || metadata_cache
      installation_cache.update_cache_key_by_target_label!(cache_analysis_result.cache_key_by_target_label)
      installation_cache.update_project_object_version!(cache_analysis_result.project_object_version)
      installation_cache.update_build_configurations!(cache_analysis_result.build_configurations)
      installation_cache.update_podfile_plugins!(plugins)
      installation_cache.update_installation_options!(installation_options.to_h)
      installation_cache.save_as(sandbox.project_installation_cache_path)

      metadata_cache.update_metadata!(target_installation_results.pod_target_installation_results || {},
                                      target_installation_results.aggregate_target_installation_results || {})
      metadata_cache.save_as(sandbox.project_metadata_cache_path)

      cache_version = ProjectCache::ProjectCacheVersion.new(VersionMetadata.project_cache_version)
      cache_version.save_as(sandbox.project_version_cache_path)
    end

    # Integrates the user projects adding the dependencies on the CocoaPods
    # libraries, setting them up to use the xcconfigs and performing other
    # actions. This step is also responsible of creating the workspace if
    # needed.
    #
    # @return [void]
    #
    def integrate_user_project
      UI.section "Integrating client #{'project'.pluralize(aggregate_targets.map(&:user_project_path).uniq.count)}" do
        installation_root = config.installation_root
        integrator = UserProjectIntegrator.new(podfile, sandbox, installation_root, aggregate_targets, generated_aggregate_targets,
                                               :use_input_output_paths => !installation_options.disable_input_output_paths?)
        integrator.integrate!
        run_podfile_post_integrate_hooks
      end
    end

    #-------------------------------------------------------------------------#

    private

    # @!group Hooks

    # Runs the pre install hooks of the installed specs and of the Podfile.
    #
    # @return [void]
    #
    def run_podfile_pre_install_hooks
      UI.message '- Running pre install hooks' do
        executed = run_podfile_pre_install_hook
        UI.message '- Podfile' if executed
      end
    end

    # Runs the pre install hook of the Podfile
    #
    # @raise  Raises an informative if the hooks raises.
    #
    # @return [Boolean] Whether the hook was run.
    #
    def run_podfile_pre_install_hook
      podfile.pre_install!(self)
    rescue => e
      raise Informative, 'An error occurred while processing the pre-install ' \
        'hook of the Podfile.' \
        "\n\n#{e.message}\n\n#{e.backtrace * "\n"}"
    end

    # Runs the pre integrate hooks of the installed specs and of the Podfile.
    #
    # @note   Pre integrate hooks run _before_ generation of the Pods project.
    #
    # @return [void]
    #
    def run_podfile_pre_integrate_hooks
      UI.message '- Running pre integrate hooks' do
        executed = run_podfile_pre_integrate_hook
        UI.message '- Podfile' if executed
      end
    end

    # Runs the pre integrate hook of the Podfile.
    #
    # @raise  Raises an informative if the hooks raises.
    #
    # @return [Boolean] Whether the hook was run.
    #
    def run_podfile_pre_integrate_hook
      podfile.pre_integrate!(self)
    rescue => e
      raise Informative, 'An error occurred while processing the pre-integrate ' \
        'hook of the Podfile.' \
        "\n\n#{e.message}\n\n#{e.backtrace * "\n"}"
    end

    # Runs the post install hooks of the installed specs and of the Podfile.
    #
    # @note   Post install hooks run _before_ saving of project, so that they
    #         can alter it before it is written to the disk.
    #
    # @return [void]
    #
    def run_podfile_post_install_hooks
      UI.message '- Running post install hooks' do
        executed = run_podfile_post_install_hook
        UI.message '- Podfile' if executed
      end
    end

    # Runs the post install hook of the Podfile
    #
    # @raise  Raises an informative if the hooks raises.
    #
    # @return [Boolean] Whether the hook was run.
    #
    def run_podfile_post_install_hook
      podfile.post_install!(self)
    rescue => e
      raise Informative, 'An error occurred while processing the post-install ' \
        'hook of the Podfile.' \
        "\n\n#{e.message}\n\n#{e.backtrace * "\n"}"
    end

    # Runs the post integrate hooks of the installed specs and of the Podfile.
    #
    # @note   Post integrate hooks run _after_ saving of project, so that they
    #         can alter it after it is written to the disk.
    #
    # @return [void]
    #
    def run_podfile_post_integrate_hooks
      UI.message '- Running post integrate hooks' do
        executed = run_podfile_post_integrate_hook
        UI.message '- Podfile' if executed
      end
    end

    # Runs the post integrate hook of the Podfile.
    #
    # @raise  Raises an informative if the hooks raises.
    #
    # @return [Boolean] Whether the hook was run.
    #
    def run_podfile_post_integrate_hook
      podfile.post_integrate!(self)
    rescue => e
      raise Informative, 'An error occurred while processing the post-integrate ' \
        'hook of the Podfile.' \
        "\n\n#{e.message}\n\n#{e.backtrace * "\n"}"
    end
    #-------------------------------------------------------------------------#

    public

    # @param [Array<PodTarget>] targets
    #
    # @return [Array<PodTarget>] The targets of the development pods generated by
    #         the installation process. This can be used as a convenience method for external scripts.
    #
    def development_pod_targets(targets = pod_targets)
      targets.select do |pod_target|
        sandbox.local?(pod_target.pod_name)
      end
    end

    #-------------------------------------------------------------------------#

    private

    # @!group Private helpers

    # @return [Array<Specification>] All the root specifications of the
    #         installation.
    #
    def root_specs
      analysis_result.specifications.map(&:root).uniq
    end

    # @return [SpecsState] The state of the sandbox returned by the analyzer.
    #
    def sandbox_state
      analysis_result.sandbox_state
    end

    # @return [InstallationOptions] the installation options to use during install
    #
    def installation_options
      podfile.installation_options
    end

    #-------------------------------------------------------------------------#

    public

    # @!group Convenience Methods

    def self.targets_from_sandbox(sandbox, podfile, lockfile)
      raise Informative, 'You must run `pod install` to be able to generate target information' unless lockfile

      new(sandbox, podfile, lockfile).instance_exec do
        plugin_sources = run_source_provider_hooks
        analyzer = create_analyzer(plugin_sources)
        analyze(analyzer)
        if analysis_result.podfile_needs_install?
          raise Pod::Informative, 'The Podfile has changed, you must run `pod install`'
        elsif analysis_result.sandbox_needs_install?
          raise Pod::Informative, 'The `Pods` directory is out-of-date, you must run `pod install`'
        end

        aggregate_targets
      end
    end

    #-------------------------------------------------------------------------#
  end
end
