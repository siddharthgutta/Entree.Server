#!/usr/bin/env sh

if [ "$2" = "prod" ]
then
    ssh ubuntu@ec2-52-38-63-13.us-west-2.compute.amazonaws.com -i ./keys/entree.pem 'bash -s' < $1
elif [ "$2" = "stage" ]
then
    ssh ubuntu@ec2-52-41-69-134.us-west-2.compute.amazonaws.com -i ./keys/entree.pem 'bash -s' < $1
fi
