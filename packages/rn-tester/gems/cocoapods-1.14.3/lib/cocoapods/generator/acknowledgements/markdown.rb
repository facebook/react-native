module Pod
  module Generator
    class Markdown < Acknowledgements
      def self.path_from_basepath(path)
        Pathname.new(path.dirname + "#{path.basename}.markdown")
      end

      def save_as(path)
        file = File.new(path, 'w')
        file.write(licenses)
        file.close
      end

      # @return [String] The contents of the acknowledgements in Markdown format.
      #
      def generate
        licenses
      end

      def title_from_string(string, level)
        unless string.empty?
          '#' * level << " #{string}"
        end
      end

      def string_for_spec(spec)
        if (license_text = license_text(spec))
          "\n" << title_from_string(spec.name, 2) << "\n\n" << license_text << "\n"
        end
      end

      def licenses
        licenses_string = "#{title_from_string(header_title, 1)}\n#{header_text}\n"
        specs.each do |spec|
          if (license = string_for_spec(spec))
            license = license.force_encoding('UTF-8') if license.respond_to?(:force_encoding)
            licenses_string += license
          end
        end
        licenses_string += "#{title_from_string(footnote_title, 2)}#{footnote_text}\n"
      end
    end
  end
end
