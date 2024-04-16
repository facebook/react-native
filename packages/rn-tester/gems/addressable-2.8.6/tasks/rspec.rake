# frozen_string_literal: true

require "rspec/core/rake_task"

namespace :spec do
  RSpec::Core::RakeTask.new(:simplecov) do |t|
    t.pattern = FileList['spec/**/*_spec.rb']
    t.rspec_opts = %w[--color --format documentation] unless ENV["CI"]
  end

  namespace :simplecov do
    desc "Browse the code coverage report."
    task :browse => "spec:simplecov" do
      require "launchy"
      Launchy.open("coverage/index.html")
    end
  end
end

desc "Alias to spec:simplecov"
task "spec" => "spec:simplecov"

task "clobber" => ["spec:clobber_simplecov"]
