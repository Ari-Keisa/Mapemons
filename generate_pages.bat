@echo off
echo Generating region pages...
python generate.py
if %ERRORLEVEL% EQU 0 (
    echo Successfully generated johto.html, hoenn.html, sinnoh.html, and unova.html!
) else (
    echo An error occurred during generation.
)
pause
