@echo off
chcp 65001 >nul
title HE THONG WEB BAN TAI KHOAN 24/7 - PUBLIC CLOUDFLARE TUNNEL
echo ================================================================
echo   KHOI DONG WEB BAN TAI KHOAN SO 24/7 + TEN MIEN FREE HTTPS
echo ================================================================
echo.
echo [1/2] Dang khoi dong may chu Next.js tai cong 3001...
start "NextJS-Server-3001" cmd /c "npx next start -p 3001"
timeout /t 4 /nobreak >nul

echo [2/2] Dang mo duong truyen Internet (Cloudflare Tunnel)...
echo 👉 Hay copy duong link https://....trycloudflare.com hien ra ben duoi de gui cho khach!
echo.
"scripts\cloudflared.exe" tunnel --url http://localhost:3001
pause
