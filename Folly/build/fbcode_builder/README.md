# Easy builds for Facebook projects

This is a Python 2.6+ library designed to simplify continuous-integration
(and other builds) of Facebook projects.

For external Travis builds, the entry point is `travis_docker_build.sh`.


## Using Docker to reproduce a CI build

If you are debugging or enhancing a CI build, you will want to do so from
host or virtual machine that can run a reasonably modern version of Docker:

``` sh
./make_docker_context.py --help  # See available options for OS & compiler
# Tiny wrapper that starts a Travis-like build with compile caching:
os_image=ubuntu:16.04 \
  gcc_version=5 \
  make_parallelism=2 \
  travis_cache_dir=~/travis_ccache \
    ./travis_docker_build.sh &> build_at_$(date +'%Y%m%d_%H%M%S').log
```

**IMPORTANT**: Read `fbcode_builder/README.docker` before diving in!

Setting `travis_cache_dir` turns on [ccache](https://ccache.samba.org/),
saving a fresh copy of `ccache.tgz` after every build.  This will invalidate
Docker's layer cache, foring it to rebuild starting right after OS package
setup, but the builds will be fast because all the compiles will be cached.
To iterate without invalidating the Docker layer cache, just `cd
/tmp/docker-context-*` and interact with the `Dockerfile` normally.  Note
that the `docker-context-*` dirs preserve a copy of `ccache.tgz` as they
first used it.


# What to read next

The *.py files are fairly well-documented. You might want to peruse them
in this order:
 - shell_quoting.py
 - fbcode_builder.py
 - docker_builder.py
 - make_docker_context.py

As far as runs on Travis go, the control flow is:
 - .travis.yml calls
 - travis_docker_build.sh calls
 - docker_build_with_ccache.sh

This library also has an (unpublished) component targeting Facebook's
internal continuous-integration platform using the same build-step DSL.


# Contributing

Please follow the ambient style (or PEP-8), and keep the code Python 2.6
compatible -- since `fbcode_builder`'s only dependency is Docker, we want to
allow building projects on even fairly ancient base systems.   We also wish
to be compatible with Python 3, and would appreciate it if you kept that
in mind while making changes also.
