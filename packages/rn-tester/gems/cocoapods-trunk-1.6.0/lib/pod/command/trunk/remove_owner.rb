module Pod
  class Command
    class Trunk
      # @CocoaPods 0.33.0
      #
      class RemoveOwner < Trunk
        self.summary = 'Remove an owner from a pod'
        self.description = <<-DESC
          Removes the user with specified `OWNER-EMAIL` from being an owner
          of the given `POD`.
          An ‘owner’ is a registered user whom is allowed to make changes to a
          pod, such as pushing new versions and adding and removing other ‘owners’.
        DESC

        self.arguments = [
          CLAide::Argument.new('POD', true),
          CLAide::Argument.new('OWNER-EMAIL', true),
        ]

        def initialize(argv)
          @pod = argv.shift_argument
          @email = argv.shift_argument
          super
        end

        def validate!
          super
          unless token
            help! 'You need to register a session first.'
          end
          unless @pod && @email
            help! 'Specify the pod name and the owner’s email address.'
          end
        end

        def run
          json = json(request_path(:delete, "pods/#{@pod}/owners/#{@email}", auth_headers))
          UI.labeled 'Owners', json.map { |o| "#{o['name']} <#{o['email']}>" }
        rescue REST::Error => e
          raise Informative, "There was an error removing #{@email} from " \
                                   "#{@pod} on trunk: #{e.message}"
        end
      end
    end
  end
end
