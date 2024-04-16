module Xcodeproj
  class Command
    class ConfigDump < Command
      self.description = <<-eos
        Dumps the build settings of all project targets for all configurations in
        directories named by the target in given output directory.

        It extracts common build settings in a per target base.xcconfig file.

        If no `PROJECT` is specified then the current work directory is searched
        for one.

        If no `OUTPUT` is specified then the project directory will be used.
        eos

      self.summary = 'Dumps the build settings of all project targets for ' \
                     'all configurations in directories named by the target ' \
                     'in the given output directory.'

      self.arguments = [
        CLAide::Argument.new('PROJECT', false),
        CLAide::Argument.new('OUTPUT', false),
      ]

      def initialize(argv)
        self.xcodeproj_path = argv.shift_argument
        @output_path = Pathname(argv.shift_argument || '.')

        super
      end

      def validate!
        super

        raise Informative, 'The output path must be a directory.' unless @output_path.directory?
        open_project!
      end

      def run
        dump_all_configs(xcodeproj, 'Project')

        xcodeproj.targets.each do |target|
          dump_all_configs(target, target.name)
        end
      end

      def dump_all_configs(configurable, name)
        path = Pathname(name)

        # Dump base configuration to file
        base_settings = extract_common_settings!(configurable.build_configurations)
        base_file_path = path + "#{name}_base.xcconfig"
        dump_config_to_file(base_settings, base_file_path)

        # Dump each configuration to file
        configurable.build_configurations.each do |config|
          settings = config.build_settings
          dump_config_to_file(settings, path + "#{name}_#{config.name.downcase}.xcconfig", [base_file_path])
        end
      end

      def extract_common_settings!(build_configurations)
        # Grasp all common build settings
        all_build_settings = build_configurations.map(&:build_settings)
        common_build_settings = all_build_settings.reduce do |settings, config_build_settings|
          settings.select { |key, value| value == config_build_settings[key] }
        end

        # Remove all common build settings from each configuration specific build settings
        build_configurations.each do |config|
          config.build_settings.reject! { |key| !common_build_settings[key].nil? }
        end

        common_build_settings
      end

      def dump_config_to_file(settings, file_path, includes = [])
        dir = @output_path + file_path + '..'
        dir.mkpath

        settings = Hash[settings.map do |k, v|
          [k, Array(v).join(' ')]
        end]

        config = Config.new(settings)
        config.includes = includes
        config.save_as(@output_path + file_path)
      end
    end
  end
end
