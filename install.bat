@echo off
echo Installing SafeTruck Dashboard dependencies...
echo.
echo Using --legacy-peer-deps to resolve React version conflicts...
echo.
npm install --legacy-peer-deps
echo.
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Installation successful!
    echo ========================================
    echo.
    echo To start the development server, run:
    echo   npm run dev
    echo.
    echo Then open http://localhost:3000 in your browser
    echo.
) else (
    echo.
    echo ========================================
    echo Installation failed!
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo.
)
pause
