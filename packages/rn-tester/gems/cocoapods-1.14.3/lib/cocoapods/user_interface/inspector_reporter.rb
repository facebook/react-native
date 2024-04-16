require 'addressable'
require 'uri'

module Pod
  module UserInterface
    # Redirects GH-issues delegate callbacks to CocoaPods UI methods.
    #
    class InspectorReporter
      # Called just as the investigation has begun.
      # Lets the user know that it's looking for an issue.
      #
      # @param [GhInspector::Inspector] inspector
      #        The current inspector
      #
      # @return [void]
      #
      def inspector_started_query(_, inspector)
        UI.puts "Looking for related issues on #{inspector.repo_owner}/#{inspector.repo_name}..."
      end

      # Called once the inspector has received a report with more than one issue,
      # showing the top 3 issues, and offering a link to see more.
      #
      # @param [GhInspector::InspectionReport] report
      #        Report a list of the issues
      #
      # @return [void]
      #
      def inspector_successfully_received_report(report, _)
        report.issues[0..2].each { |issue| print_issue_full(issue) }

        if report.issues.count > 3
          UI.puts "and #{report.total_results - 3} more at:"
          UI.puts report.url
        end
      end

      # Called once the report has been received, but when there are no issues found.
      #
      # @param [GhInspector::Inspector] inspector
      #        The current inspector
      #
      # @return [void]
      #
      def inspector_received_empty_report(_, inspector)
        UI.puts 'Found no similar issues. To create a new issue, please visit:'
        UI.puts "https://github.com/#{inspector.repo_owner}/#{inspector.repo_name}/issues/new"
      end

      # Called when there have been networking issues in creating the report.
      #
      # @param [Error] error
      #        The error returned during networking
      #
      # @param [String] query
      #        The original search query
      #
      # @param [GhInspector::Inspector] inspector
      #        The current inspector
      #
      # @return [void]
      #
      def inspector_could_not_create_report(error, query, inspector)
        safe_query = Addressable::URI.escape query
        UI.puts 'Could not access the GitHub API, you may have better luck via the website.'
        UI.puts "https://github.com/#{inspector.repo_owner}/#{inspector.repo_name}/search?q=#{safe_query}&type=Issues&utf8=✓"
        UI.puts "Error: #{error.name}"
      end

      private

      def print_issue_full(issue)
        safe_url = Addressable::URI.escape issue.html_url
        UI.puts " - #{issue.title}"
        UI.puts "   #{safe_url} [#{issue.state}] [#{issue.comments} comment#{issue.comments == 1 ? '' : 's'}]"
        UI.puts "   #{pretty_date(issue.updated_at)}"
        UI.puts ''
      end

      # Taken from https://stackoverflow.com/questions/195740/how-do-you-do-relative-time-in-rails
      def pretty_date(date_string)
        date = Time.parse(date_string)
        a = (Time.now - date).to_i

        case a
        when 0 then 'just now'
        when 1 then 'a second ago'
        when 2..59 then a.to_s + ' seconds ago'
        when 60..119 then 'a minute ago' # 120 = 2 minutes
        when 120..3540 then (a / 60).to_i.to_s + ' minutes ago'
        when 3541..7100 then 'an hour ago' # 3600 = 1 hour
        when 7101..82_800 then ((a + 99) / 3600).to_i.to_s + ' hours ago'
        when 82_801..172_000 then 'a day ago' # 86400 = 1 day
        when 172_001..518_400 then ((a + 800) / (60 * 60 * 24)).to_i.to_s + ' days ago'
        when 518_400..1_036_800 then 'a week ago'
        when 1_036_801..4_147_204 then ((a + 180_000) / (60 * 60 * 24 * 7)).to_i.to_s + ' weeks ago'
        else date.strftime('%d %b %Y')
        end
      end
    end
  end
end
