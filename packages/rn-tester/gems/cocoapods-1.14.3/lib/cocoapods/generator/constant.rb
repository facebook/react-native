module Pod
  module Generator
    # Generates a constant file.
    #
    class Constant
      def initialize(contents)
        @generate = contents
      end

      attr_reader :generate

      def save_as(path)
        path.open('w') do |f|
          f.write(generate)
        end
      end
    end
  end
end
