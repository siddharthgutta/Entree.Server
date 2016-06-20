#!/usr/bin/env sh

# This script calls the other DB initialization scripts. Pretty straight forward stuff

DIR=$(dirname $0)

mongo $DIR/mongoInit.js

