import json
import logging
import maven_dependency_utils
import os
import re
import shutil
import subprocess
import sys
import time
import zipfile


desired_sdk = os.getenv("ANDROID_SDK_ROOT")
if not desired_sdk:
    logging.error("Envrionment variable ANDROID_SDK_ROOT must be set.")
    exit(-1)

if os.getenv("ANDROID_NDK"):
    desired_ndk = os.getenv("ANDROID_NDK")
elif os.path.exists(os.path.join(desired_sdk, "ndk-bundle")):
    desired_ndk = os.path.join(desired_sdk, "ndk-bundle")
elif os.path.exists(os.path.join(desired_sdk, "ndk")):
    desired_ndk = os.path.join(desired_sdk, "ndk")
else:
    logging.error("Envrionment variable ANDROID_NDK must be set.")
    exit(-1)

desired_jdk = os.getenv("JAVA_HOME")
if not desired_jdk:  
    logging.error("Envrionment variable JAVA_HOME must be set.")
    exit(-1)


def create_folder(folder_path):
    """Create folder if it does not exist

        Parameters
        ----------
        folder_path : str
            folder path to be checked
    """
    if not os.path.exists(folder_path):
        try:
            os.makedirs(folder_path)
        except Exception as inst:
            logging.error("Error while creating directory: " + inst)

def ensure_output_dir(output_dir_path):
    # Move out if already exists.
    if os.path.exists(output_dir_path):
        logging.debug(output_dir_path + " exists ! Trying to move it.")
        output_dir_path_copy = output_dir_path + '-' + time.strftime("%Y%m%d-%H%M%S")
        shutil.move(output_dir_path, output_dir_path_copy )

    # If it still exists, fail the execution.
    if os.path.exists(output_dir_path):
        logging.error("Unable to cleanup existing dependency directory: " + output_dir_path)
        logging.error("Move it away manually and rerun the script.")

def get_office_platform(platform):
    switcher = {'arm64-v8a':'droidarm64', 'armeabi-v7a':'droidarm', 'x86':'droidx86','x86_64':'droidx64'}
    return switcher.get(platform,"")

def extract_so(original_file_root, native_dir, original_file_name):
    logging.info("Attempting to extract native libraries from " + original_file_name)
    archive_filename_without_ext, archive_file_extension = os.path.splitext(original_file_name)
    original_file_path = os.path.join(original_file_root, original_file_name)
    zip_filepath = os.path.join(original_file_root, original_file_name + ".zip")
    shutil.move(original_file_path, zip_filepath)

    # Extract the archive
    with zipfile.ZipFile(zip_filepath) as zip_file:
        zip_target_folder = os.path.join(original_file_root, archive_filename_without_ext)
        zip_file.extractall(zip_target_folder)
                
    # Extract native libraries.
    for candidate_so_root, dirsi, candidate_so_files in os.walk(zip_target_folder):
                    for candidate_so_file in candidate_so_files:
                        if candidate_so_file.endswith(".so"):
                            logging.info("Found native library " + candidate_so_file)
                            so_path = os.path.join(candidate_so_root, candidate_so_file)
                            
                            lib_platform = os.path.basename(candidate_so_root)
                            lib_office_platform = get_office_platform(lib_platform)
                            if not lib_office_platform:
                                logging.error("Invalid platform for native library: " + candidate_so_file)
                                exit(1)

                            so_target_dir = os.path.join(native_dir, lib_office_platform)
                            create_folder(so_target_dir)
                            shutil.move(so_path, so_target_dir)

    # Re-zip back to original file name.
    new_zip_filepath = os.path.join(original_file_root, archive_filename_without_ext + "_rezipped.zip")
    with zipfile.ZipFile(new_zip_filepath, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for rootz, dirsz, filesz in os.walk(zip_target_folder):
            for filez in filesz:
                dest_path = os.path.join(rootz, filez)
                # rel_path = os.path.relpath(dest_path, os.path.join(zip_target_folder, '..'))
                rel_path = os.path.relpath(dest_path, zip_target_folder)
                zip_file.write(dest_path, rel_path)

    # Rename the rezipped file to original file name.
    shutil.move(new_zip_filepath, os.path.join(original_file_root, original_file_name))
    
    # Remove the originally renamed archive and extracted folder.
    shutil.rmtree(zip_target_folder)
    os.remove(zip_filepath)

def extract_sos(maven_dir, native_dir):
    logging.debug("Attempting to extract native libraries")

    for original_file_root, dirs, original_files in os.walk(maven_dir):
        for original_file_name in original_files:
            archive_filename_without_ext, archive_file_extension = os.path.splitext(original_file_name)
            if(archive_file_extension in ['.jar', '.aar']):
                extract_so(original_file_root, native_dir, original_file_name)


## Returns a list of strings, where the strings correspond to standard maven artifacts, i.e. groupId:artifactId:version
def get_dependencies(react_native_dir):
    result = subprocess.run('./gradlew :ReactAndroid:dependencies --configuration api', stderr=subprocess.PIPE, stdout=subprocess.PIPE, cwd=react_native_dir, shell=True)
    if (result.returncode == 0):
        return re.findall(r'^\S---\s+(\S*)', result.stdout.decode('utf-8'), re.MULTILINE)
    else:
        logging.error('Failed to get dependencies. Printing gradle output: ')
        logging.error(result.stderr.decode('utf-8'))
        exit(-1)

def main():
    if len(sys.argv) == 2:
        react_native_dir = sys.argv[1]
    else:
        react_native_dir = os.getcwd()

    # Some smoke checks to ensure that we have a valid react-native checkout.
    packageJsonFile = os.path.join(react_native_dir, "package.json")
    with open(packageJsonFile) as packageJsonText:
        packageJson = json.load(packageJsonText)
        if(packageJson[u'name'] != u'react-native' and packageJson[u'name'] != u'react-native-macos'):
            logging.info("Not a valid RN repo path!")
            exit(-1)

    if (not os.path.join(react_native_dir, "ReactAndroid", "build.gradle")):
        logging.info("Not a valid RN repo path!")
        exit(-1)
   
    dependency_dir_root = os.path.join(react_native_dir, "android", "dependencies")
    dependency_dir_maven = os.path.join(dependency_dir_root, "cross", "cross", "x-none", "maven")
    dependency_dir_native = dependency_dir_root
    dependency_dir_hermes = os.path.join(dependency_dir_root, "hermes")
    log_file_path = os.path.join(react_native_dir, "android", "log_" + time.strftime("%Y%m%d-%H%M%S") + ".txt" )

    if(not os.path.exists(os.path.join(react_native_dir, "android"))):
        os.mkdir(os.path.join(react_native_dir, "android"))

    logging.basicConfig(level = logging.DEBUG, filename = log_file_path)
    logging.info("react_native_dir: " + react_native_dir)
    logging.info("Maven dependency path: " + dependency_dir_maven)
    logging.info("Native dependency path: " + dependency_dir_native)

    # Ensure we have an output directory
    ensure_output_dir(dependency_dir_root) 

    # Download a transitive dependency closure of the ReactAndroid project
    dependencies = get_dependencies(react_native_dir);
    maven_dependency_utils.download_transitive_closure(dependencies, dependency_dir_maven, 'gradlew')

    # Extract the native libraries from maven packages
    extract_sos(dependency_dir_maven, dependency_dir_native)

    # Copy and extract hermes.
    dependency_dir_hermes_android_aar_path = os.path.join(dependency_dir_hermes, "android")
    hermes_engine_node_modules_path = os.path.join(react_native_dir, "node_modules", "hermes-engine")
    shutil.copytree(os.path.join(hermes_engine_node_modules_path, "android"), dependency_dir_hermes_android_aar_path)
    shutil.copytree(os.path.join(hermes_engine_node_modules_path, "linux64-bin"), os.path.join(dependency_dir_hermes, "linux64-bin"))
    shutil.copytree(os.path.join(hermes_engine_node_modules_path, "win64-bin"), os.path.join(dependency_dir_hermes, "win64-bin"))
    shutil.copytree(os.path.join(hermes_engine_node_modules_path, "osx-bin"), os.path.join(dependency_dir_hermes, "osx-bin"))
    shutil.copy(os.path.join(hermes_engine_node_modules_path, "package.json"), dependency_dir_hermes)

    dependency_dir_hermes_android_native_debug = os.path.join(dependency_dir_hermes_android_aar_path, "debug")
    dependency_dir_hermes_android_native_release = os.path.join(dependency_dir_hermes_android_aar_path, "ship")
    extract_so(dependency_dir_hermes_android_aar_path, dependency_dir_hermes_android_native_debug, "hermes-debug.aar")
    extract_so(dependency_dir_hermes_android_aar_path, dependency_dir_hermes_android_native_debug, "hermes-cppruntime-debug.aar")

    extract_so(dependency_dir_hermes_android_aar_path, dependency_dir_hermes_android_native_release, "hermes-release.aar")
    extract_so(dependency_dir_hermes_android_aar_path, dependency_dir_hermes_android_native_release, "hermes-cppruntime-release.aar")
 
    # Copy log file into the dependency root folder.
    shutil.copy(log_file_path, os.path.join(dependency_dir_root))

    with open(log_file_path, "r") as fin:
        print(fin.read())

if __name__ == '__main__':
    main()
