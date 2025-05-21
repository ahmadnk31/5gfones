@echo off
REM This script applies the database schema changes for Stripe payment integration
REM to the 5GPhones Supabase database on Windows

echo 💾 Starting database schema application...
echo This script will apply all payment and refund related schema changes.
echo.

REM Check if user has psql installed and in PATH
where psql > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: psql is not installed or not in PATH.
    echo Please install PostgreSQL client tools first or add them to your PATH.
    exit /b 1
)

REM Check for required environment variables
if "%SUPABASE_CONNECTION_STRING%"=="" (
    echo ❌ Error: SUPABASE_CONNECTION_STRING environment variable is not set.
    echo Please set it to your Supabase connection string.
    echo You can find this in your Supabase dashboard under Settings ^> Database ^> Connection string.
    exit /b 1
)

echo 🔍 Connecting to Supabase database...

REM Apply payment settings schema
echo 📊 Creating settings table and payment configuration...
psql "%SUPABASE_CONNECTION_STRING%" -f add-payment-settings.sql
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to apply payment settings schema.
    exit /b 1
)

REM Apply refund requests schema
echo 📊 Creating refund requests table and updating orders table...
psql "%SUPABASE_CONNECTION_STRING%" -f add-refund-requests-table.sql
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to apply refund requests schema.
    exit /b 1
)

echo.
echo ✅ Database schema changes applied successfully!
echo.
echo Next steps:
echo 1. Configure your Stripe API keys in the admin settings
echo 2. Test the payment flow using Stripe test cards
echo 3. Test the refund functionality
echo.
echo For detailed testing instructions, please refer to TESTING-PAYMENT-WORKFLOW.md
