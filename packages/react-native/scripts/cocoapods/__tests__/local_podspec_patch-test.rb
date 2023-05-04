# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"
require "json"
require_relative "../local_podspec_patch.rb"
require_relative "./test_utils/FileMock.rb"
require_relative "./test_utils/DirMock.rb"
require_relative "./test_utils/PodMock.rb"
require_relative "./test_utils/LocalPodspecPatchMock.rb"

class LocalPodspecPatchTests < Test::Unit::TestCase

    def teardown
        FileMock.reset()
        DirMock.reset()
    end

    # =================== #
    # Test - Pods To Update #
    # =================== #

    def test_podsToUpdate_whenNoFilesExists_returnLocalPodspecs
        # Arrange
        react_native_path = "../node_modules/react-native"
        globs = ["a/path/to/boost.podspec", "a/path/to/DoubleConversion.podspec"]
        mocked_pwd = "a/path/to"
        DirMock.mocked_existing_globs(globs, "#{react_native_path}/third-party-podspecs/*")
        DirMock.set_pwd(mocked_pwd)

        # Act
        local_podspec = LocalPodspecPatch.pods_to_update(:react_native_path => react_native_path, dir_manager: DirMock, file_manager: FileMock)

        # Assert
        assert_equal(local_podspec, [])
        assert_equal(DirMock.glob_invocation, ["#{react_native_path}/third-party-podspecs/*"])
        assert_equal(FileMock.exist_invocation_params, [
            FileMock.join(mocked_pwd, "Pods/Local Podspecs", "boost.podspec.json"),
            FileMock.join(mocked_pwd, "Pods/Local Podspecs", "DoubleConversion.podspec.json"),
        ])
    end

    def test_podsToUpdate_whenFilesExistsWithSameVersions_returnsEmpty
        # Arrange
        react_native_path = "../node_modules/react-native"
        globs = ["a/path/to/boost.podspec", "a/path/to/DoubleConversion.podspec"]
        mocked_pwd = "a/path/to"
        prepare_PodsToUpdate_test_withMatchingVersions(react_native_path, globs, mocked_pwd)

        # Act
        local_podspec = LocalPodspecPatch.pods_to_update(:react_native_path => react_native_path, dir_manager: DirMock, file_manager: FileMock)

        # Assert
        assert_equal(local_podspec, [])
        assert_equal(DirMock.glob_invocation, ["#{react_native_path}/third-party-podspecs/*"])
        assert_equal(FileMock.exist_invocation_params, [
            FileMock.join(mocked_pwd, "Pods/Local Podspecs", "boost.podspec.json"),
            FileMock.join(mocked_pwd, "Pods/Local Podspecs", "DoubleConversion.podspec.json"),
        ])
    end

    def test_podsToUpdate_whenFilesExistsWithDifferentVersions_returnsThem
        # Arrange
        react_native_path = "../node_modules/react-native"
        globs = ["a/path/to/boost.podspec", "a/path/to/DoubleConversion.podspec"]
        mocked_pwd = "a/path/to"
        prepare_PodsToUpdate_test_withDifferentVersions(react_native_path, globs, mocked_pwd)

        # Act
        local_podspec = LocalPodspecPatch.pods_to_update(:react_native_path => react_native_path, dir_manager: DirMock, file_manager: FileMock)

        # Assert
        assert_equal(local_podspec, [
            "boost",
            "DoubleConversion"
        ])
        assert_equal(DirMock.glob_invocation, ["#{react_native_path}/third-party-podspecs/*"])
        assert_equal(FileMock.exist_invocation_params, [
            FileMock.join(mocked_pwd, "Pods/Local Podspecs", "boost.podspec.json"),
            FileMock.join(mocked_pwd, "Pods/Local Podspecs", "DoubleConversion.podspec.json"),
        ])
    end

    # ======================================== #
    # Test - Patch Detect Changes With Podfile #
    # ======================================== #
    def test_patchDetectChangesWithPodfile_whenAlreadyChanged_returnSameChangeSet()
        local_pods = [
            "boost",
            "DoubleConversion"
        ]
        LocalPodspecPatch.mock_local_podspecs(local_pods)
        changes = {
            :unchanged => ["some_pod"],
            :changed => ["boost", "DoubleConversion", "another_pod"]
        }

        Pod::Lockfile.prepend(LocalPodspecPatch)

        new_changes = Pod::Lockfile.new().patch_detect_changes_with_podfile(changes)

        assert_equal(new_changes, {
            :unchanged => ["some_pod"],
            :changed => ["boost", "DoubleConversion", "another_pod"]
        })
    end

    def test_patchDetectChangesWithPodfile_whenLocalPodsUnchanged_movesLocalPodsToChangeSet()
        pods = [
            "boost",
            "DoubleConversion"
        ]
        LocalPodspecPatch.mock_local_podspecs(pods)
        changes = {
            :unchanged => ["first_pod", "boost", "DoubleConversion"],
            :changed => ["another_pod"]
        }

        Pod::Lockfile.prepend(LocalPodspecPatch)

        new_changes = Pod::Lockfile.new().patch_detect_changes_with_podfile(changes)

        assert_equal(new_changes, {
            :unchanged => ["first_pod"],
            :changed => ["another_pod", "boost", "DoubleConversion"]
        })
    end

    # ========= #
    # Utilities #
    # ========= #
    def prepare_PodsToUpdate_test_withMatchingVersions(react_native_path, globs, mocked_pwd)
        FileMock.mocked_existing_files([
            "a/path/to/Pods/Local Podspecs/boost.podspec.json",
            "a/path/to/Pods/Local Podspecs/DoubleConversion.podspec.json"
        ])
        FileMock.files_to_read({
            "a/path/to/Pods/Local Podspecs/boost.podspec.json" => "{ \"version\": \"0.0.1\"}",
            "a/path/to/Pods/Local Podspecs/DoubleConversion.podspec.json" => "{ \"version\": \"1.0.1\"}",
        })
        DirMock.mocked_existing_globs(globs, "#{react_native_path}/third-party-podspecs/*")
        DirMock.set_pwd(mocked_pwd)
        Pod::Specification.specs_from_file({
            "../node_modules/react-native/third-party-podspecs/boost.podspec" => Pod::PodSpecMock.new(:version => "0.0.1"),
            "../node_modules/react-native/third-party-podspecs/DoubleConversion.podspec" => Pod::PodSpecMock.new(:version => "1.0.1"),
        })
    end

    def prepare_PodsToUpdate_test_withDifferentVersions(react_native_path, globs, mocked_pwd)
        FileMock.mocked_existing_files([
            "a/path/to/Pods/Local Podspecs/boost.podspec.json",
            "a/path/to/Pods/Local Podspecs/DoubleConversion.podspec.json"
        ])
        FileMock.files_to_read({
            "a/path/to/Pods/Local Podspecs/boost.podspec.json" => "{ \"version\": \"0.0.1\"}",
            "a/path/to/Pods/Local Podspecs/DoubleConversion.podspec.json" => "{ \"version\": \"1.0.1\"}",
        })
        DirMock.mocked_existing_globs(globs, "#{react_native_path}/third-party-podspecs/*")
        DirMock.set_pwd(mocked_pwd)
        Pod::Specification.specs_from_file({
            "../node_modules/react-native/third-party-podspecs/boost.podspec" => Pod::PodSpecMock.new(:version => "0.1.1"),
            "../node_modules/react-native/third-party-podspecs/DoubleConversion.podspec" => Pod::PodSpecMock.new(:version => "1.1.1"),
        })
    end
end
