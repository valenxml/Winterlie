@echo off
REM Run from the project root after pulling or extracting a new version.
REM Stops at the first failing step. Does NOT touch .env files.
setlocal

echo [1/6] Installing dependencies...
call pnpm install || goto :fail

echo [2/6] Applying database migrations (non-interactive)...
call pnpm --filter @workshop/database migrate:deploy || goto :fail

echo [3/6] Regenerating Prisma client...
call pnpm --filter @workshop/database generate || goto :fail

echo [4/6] Building internal packages...
call pnpm --filter @workshop/validators build || goto :fail
call pnpm --filter @workshop/design-schema build || goto :fail

echo [5/6] Type checking...
call pnpm typecheck || goto :fail

echo [6/6] Running tests...
call pnpm test || goto :fail

echo.
echo Update OK. Restart the API and web servers now.
exit /b 0

:fail
echo.
echo Update FAILED at the step above. Copy the first error line and send it.
exit /b 1
