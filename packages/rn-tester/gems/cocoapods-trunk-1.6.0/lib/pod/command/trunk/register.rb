module Pod
  class Command
    class Trunk
      # @CocoaPods 0.33.0
      #
      class Register < Trunk
        self.summary = 'Manage sessions'
        self.description = <<-DESC
              Register a new account, or create a new session.

              If this is your first registration, both an `EMAIL` address and
              `YOUR_NAME` are required. If you’ve already registered with trunk, you may
              omit the `YOUR_NAME` (unless you would like to change it).

              It is recommended that you provide a description of the session, so
              that it will be easier to identify later on. For instance, when you
              would like to clean-up your sessions. A common example is to specify
              the location where the machine, that you are using the session for, is
              physically located.

              Examples:

                  $ pod trunk register eloy@example.com 'Eloy Durán' --description='Personal Laptop'
                  $ pod trunk register eloy@example.com --description='Work Laptop'
                  $ pod trunk register eloy@example.com
        DESC

        self.arguments = [
          CLAide::Argument.new('EMAIL', true),
          CLAide::Argument.new('YOUR_NAME', false),
        ]

        def self.options
          [
            ['--description=DESCRIPTION', 'An arbitrary description to ' \
                                              'easily identify your session ' \
                                              'later on.'],
          ].concat(super)
        end

        def initialize(argv)
          @session_description = argv.option('description')
          @email = argv.shift_argument
          @name = argv.shift_argument
          super
        end

        def validate!
          super
          unless @email
            help! 'Specify at least your email address.'
          end
        end

        def run
          body = {
            'email' => @email,
            'name' => @name,
            'description' => @session_description,
          }.to_json
          json = json(request_path(:post, 'sessions', body, default_headers))
          save_token(json['token'])
          # TODO UI.notice inserts an empty line :/
          UI.puts '[!] Please verify the session by clicking the link in the ' \
                  "verification email that has been sent to #{@email}".yellow
        rescue REST::Error => e
          raise Informative, 'There was an error registering with trunk: ' \
                                 "#{e.message}"
        end

        def save_token(token)
          netrc['trunk.cocoapods.org'] = @email, token
          netrc.save
        end
      end
    end
  end
end
