module Pod
  class Command
    class Trunk
      # @CocoaPods 0.33.0
      #
      class Me < Trunk
        self.summary = 'Display information about your sessions'
        self.description = <<-DESC
                Includes information about your registration, followed by all your
                sessions.

                These are your current session, other valid sessions, unverified
                sessions, and expired sessions.
        DESC

        def validate!
          super
          unless token
            help! 'You need to register a session first.'
          end
        end

        def run
          me = json(request_path(:get, 'sessions', auth_headers))
          owner = json(request_path(:get, "owners/#{me['email']}"))
          UI.labeled 'Name', owner['name']
          UI.labeled 'Email', owner['email']
          UI.labeled 'Since', formatted_time(owner['created_at'])

          pods = owner['pods'] || []
          pods = pods.map { |pod| pod['name'] }
          pods = 'None' unless pods.any?
          UI.labeled 'Pods', pods

          sessions = me['sessions'].map do |session|
            hash = {
              :created_at => formatted_time(session['created_at']),
              :valid_until => formatted_time(session['valid_until']),
              :created_from_ip => session['created_from_ip'],
              :description => session['description'],
            }
            if Time.parse(session['valid_until']) <= Time.now.utc
              hash[:color] = :red
            elsif session['verified']
              hash[:color] = session['current'] ? :cyan : :green
            else
              hash[:color] = :yellow
              hash[:valid_until] = 'Unverified'
            end
            hash
          end

          columns = [:created_at, :valid_until, :created_from_ip, :description].map do |key|
            find_max_size(sessions, key)
          end

          sessions = sessions.map do |session|
            created_at      = session[:created_at].ljust(columns[0])
            valid_until     = session[:valid_until].rjust(columns[1])
            created_from_ip = session[:created_from_ip].ljust(columns[2])
            description     = session[:description]
            msg = "#{created_at} - #{valid_until}. IP: #{created_from_ip}"
            msg << " Description: #{description}" if description
            msg.send(session[:color])
          end

          UI.labeled 'Sessions', sessions

        rescue REST::Error => e
          raise Informative, 'There was an error fetching your info ' \
                                   "from trunk: #{e.message}"
        end

        private

        def find_max_size(sessions, key)
          sessions.map { |s| (s[key] || '').size }.max
        end

        class CleanSessions < Me
          self.summary = 'Remove sessions'
          self.description = <<-DESC
                  By default this will clean-up your sessions by removing expired and
                  unverified sessions.

                  To remove all your sessions, except for the one you are currently
                  using, specify the `--all` flag.
          DESC

          def self.options
            [
              ['--all', 'Removes all your sessions, except for the current one'],
            ].concat(super)
          end

          def initialize(argv)
            @remove_all = argv.flag?('all', false)
            super
          end

          def validate!
            super
            unless token
              help! 'You need to register a session first.'
            end
          end

          def run
            path = @remove_all ? 'sessions/all' : 'sessions'
            request_path(:delete, path, auth_headers)
          rescue REST::Error => e
            raise Informative, 'There was an error cleaning up your ' \
                                     "sessions from trunk: #{e.message}"
          end
        end
      end
    end
  end
end
