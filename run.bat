echo OK starting working
cd Utils
echo In path: %cd%
@echo off
call npm install
cd ..
echo Back to path %cd%
@echo off
set list=AlexTask AnotherTask
(for %%a in (%list%) do (
    echo Coping utils directory to: %%a
    xcopy /s Utils %%a /EXCLUDE:Utils\exclude.txt
    ))
rmdir /s /q Utils\node_modules
tfx extension create --manifest-globs vss-extension.json
