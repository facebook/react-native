#!/bin/bash

set -ex

buck fetch ReactAndroid/src/test/java/com/facebook/react/modules
buck fetch ReactAndroid/src/main/java/com/facebook/react
buck fetch ReactAndroid/src/main/java/com/facebook/react/shell
buck fetch ReactAndroid/src/test/...
buck fetch ReactAndroid/src/androidTest/...
