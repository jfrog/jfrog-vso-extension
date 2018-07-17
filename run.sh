#!/bin/bash
echo OK starting working
cd jfrog-utils
echo In path: $(pwd)
npm pack
cd ..
echo In path: $(pwd)
declare -a arr=("ArtifactoryGenericUpload")

for i in "${arr[@]}"
do
   #echo "Copying jfrog-utils to: $i"
   cd $i
   echo In path: $(i)
   echo Running npm install
   npm install
   #rsync -r --exclude='package-lock.json' ../jfrog-utils/ node_modules/jfrog-utils/
   cd ..
done

rm -rf jfrog-utils/node_modules

tfx extension create --manifest-globs vss-extension.json
#source pack_publish_extension.sh
