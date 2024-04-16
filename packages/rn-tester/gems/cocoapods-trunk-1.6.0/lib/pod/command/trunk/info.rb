module Pod
  class Command
    class Trunk
      # @CocoaPods 0.33.0
      #
      class Info < Trunk
        self.summary = 'Returns information about a Pod.'
        self.arguments = [
          CLAide::Argument.new('NAME', true),
        ]

        def initialize(argv)
          @name = argv.shift_argument
          super
        end

        def validate!
          super
          help! 'Please specify a pod name.' unless @name
        end

        def run
          response = json(request_path(:get, "pods/#{@name}", auth_headers))
          versions = response['versions'] || []
          owners = response['owners'] || []

          UI.title(@name) do
            UI.labeled 'Versions', versions.map { |v| "#{v['name']} (#{v['created_at']})" }
            UI.labeled 'Owners', owners.map { |o| "#{o['name']} <#{o['email']}>" }
          end
        end
      end
    end
  end
end
