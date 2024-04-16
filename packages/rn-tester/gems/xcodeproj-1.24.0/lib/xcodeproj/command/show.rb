module Xcodeproj
  class Command
    class Show < Command
      self.summary = 'Shows an overview of a project in a YAML representation.'

      def self.options
        [
          ['--format=[hash|tree_hash|raw]', 'YAML output format'],
        ].concat(super)
      end

      self.arguments = [
        CLAide::Argument.new('PROJECT', false),
      ]

      def initialize(argv)
        self.xcodeproj_path = argv.shift_argument
        @output_format = argv.option('format')
        @output_format &&= @output_format.to_sym
        super
      end

      def validate
        super
        unless [nil, :hash, :tree_hash, :raw].include?(@output_format)
          help! "Unknown format `#{@output_format}`"
        end
        open_project!
      end

      def run
        require 'yaml'

        if @output_format
          case @output_format
          when :hash
            puts xcodeproj.to_hash.to_yaml
          when :tree_hash
            puts xcodeproj.to_tree_hash.to_yaml
          when :raw
            puts xcodeproj.to_yaml
          end
          return
        end

        pretty_print = xcodeproj.pretty_print
        sections = []
        pretty_print.each do |key, value|
          section = key.green
          yaml = value.to_yaml
          yaml.gsub!(/^---$/, '')
          yaml.gsub!(/^-/, "\n-")
          yaml.prepend(section)
          sections << yaml
        end
        puts sections * "\n\n"
      end
    end
  end
end
