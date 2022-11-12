#!/bin/bash

if [ -f .env ]
then
  export $(cat .env | sed 's/#.*//g' | xargs)
fi

if [ -z $CODEBUILD_CI ]
then
  export GIT_BRANCH=$(git status|head -n 1|cut -d ' ' -f3)
fi

export ASPAN_STACK_NAME=$ASPAN_PROJECT-$GIT_BRANCH
