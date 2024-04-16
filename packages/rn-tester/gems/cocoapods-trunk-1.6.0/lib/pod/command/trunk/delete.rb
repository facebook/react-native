module Pod
  class Command
    class Trunk
      # @CocoaPods 1.0.0.beta.1
      #
      class Delete < Trunk
        self.summary = 'Deletes a version of a pod.'
        self.description = <<-DESC
              WARNING: It is generally considered bad behavior to remove
              versions of a Pod that others are depending on! Please
              consider using the deprecate command instead.

              Deletes the specified pod version from trunk and the master specs
              repo. Once deleted, this version can never be pushed again.
        DESC

        self.arguments = [
          CLAide::Argument.new('NAME', true),
          CLAide::Argument.new('VERSION', true),
        ]

        def initialize(argv)
          @name = argv.shift_argument
          @version = argv.shift_argument
          super
        end

        def validate!
          super
          help! 'Please specify a pod name.' unless @name
          help! 'Please specify a version.' unless @version
        end

        def run
          return unless confirm_deletion?
          json = delete
          print_messages(json['data_url'], json['messages'], nil, nil)
        end

        private

        WARNING_MESSAGE = 'WARNING: It is generally considered bad behavior ' \
          "to remove versions of a Pod that others are depending on!\n" \
          'Please consider using the `deprecate` command instead.'.freeze

        def confirm_deletion?
          UI.puts(WARNING_MESSAGE.yellow)
          loop do
            UI.print("Are you sure you want to delete this Pod version?\n> ")
            answer = UI.gets.strip.downcase
            UI.puts # ensures a newline is printed after the user input
            affirmatives = %w(y yes true 1)
            negatives = %w(n no false 0)
            return true if affirmatives.include?(answer)
            return false if negatives.include?(answer)
          end
        end

        def delete
          response = request_path(:delete, "pods/#{@name}/#{@version}", auth_headers)
          url = response.headers['location'].first
          json(request_url(:get, url, default_headers))
        rescue REST::Error => e
          raise Informative, 'There was an error deleting the pod version ' \
                                   "from trunk: #{e.message}"
        end
      end
    end
  end
end
