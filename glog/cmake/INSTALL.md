Building Glog with CMake
========================

1. Create a build directory and `cd` to it.
2. Run
    ```bash
    cmake path/to/glog
    ```

3. Afterwards, generated files (GNU make, Visual Studio, etc.) can be used to
   compile the project.


Consuming Glog in a CMake Project
=================================

To use Glog in your project `myproj`, use:

```cmake
cmake_minimum_required (VERSION 3.0)
project (myproj)

find_package (glog 0.3.5 REQUIRED)

add_executable (myapp main.cpp)
target_link_libraries (myapp glog::glog)
```

Compile definitions and options will be added automatically to your target as
needed.
