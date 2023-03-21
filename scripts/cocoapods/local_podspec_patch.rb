# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Monkeypatch of `Pod::Lockfile` to ensure automatic update of dependencies integrated with a local podspec when their version changed.
# This is necessary because local podspec dependencies must be otherwise manually updated.
module LocalPodspecPatch
    # Returns local podspecs whose versions differ from the one in the `react-native` package.
    def self.pods_to_update(react_native_path: "../node_modules/react-native")
        @@local_podspecs = Dir.glob("#{react_native_path}/third-party-podspecs/*").map { |file| File.basename(file, ".podspec") }
        @@local_podspecs = @@local_podspecs.select do |podspec_name|

            # Read local podspec to determine the cached version
            local_podspec_path = File.join(
                Dir.pwd, "Pods/Local Podspecs/#{podspec_name}.podspec.json"
            )

            # Local podspec cannot be outdated if it does not exist, yet
            next unless File.exist?(local_podspec_path)

            local_podspec = File.read(local_podspec_path)
            local_podspec_json = JSON.parse(local_podspec)
            local_version = local_podspec_json["version"]

            # Read the version from a podspec from the `react-native` package
            podspec_path = "#{react_native_path}/third-party-podspecs/#{podspec_name}.podspec"
            current_podspec = Pod::Specification.from_file(podspec_path)
            current_version = current_podspec.version.to_s
            current_version != local_version
      end
      @@local_podspecs
    end

    # Patched `detect_changes_with_podfile` method
    def detect_changes_with_podfile(podfile)
      Pod::UI.puts "Invoke detect_changes_with_podfile patched method".red
      changes = super(podfile)
      return patch_detect_changes_with_podfile(changes)
    end

    def patch_detect_changes_with_podfile(changes)
        @@local_podspecs.each do |local_podspec|
            next unless changes[:unchanged].include?(local_podspec)

            changes[:unchanged].delete(local_podspec)
            changes[:changed] << local_podspec
        end
        changes
    end
end
