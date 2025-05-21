#!/bin/bash

# This script applies the database schema changes for Stripe payment integration
# to the 5GPhones Supabase database

echo "💾 Starting database schema application..."
echo "This script will apply all payment and refund related schema changes."
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed. Please install PostgreSQL client tools first."
    exit 1
fi

# Check for required environment variables
if [ -z "$SUPABASE_CONNECTION_STRING" ]; then
    echo "❌ Error: SUPABASE_CONNECTION_STRING environment variable is not set."
    echo "Please set it to your Supabase connection string."
    echo "You can find this in your Supabase dashboard under Settings > Database > Connection string."
    exit 1
fi

echo "🔍 Connecting to Supabase database..."

# Apply payment settings schema
echo "📊 Creating settings table and payment configuration..."
psql "$SUPABASE_CONNECTION_STRING" -f add-payment-settings.sql
if [ $? -ne 0 ]; then
    echo "❌ Failed to apply payment settings schema."
    exit 1
fi

# Apply refund requests schema
echo "📊 Creating refund requests table and updating orders table..."
psql "$SUPABASE_CONNECTION_STRING" -f add-refund-requests-table.sql
if [ $? -ne 0 ]; then
    echo "❌ Failed to apply refund requests schema."
    exit 1
fi

echo ""
echo "✅ Database schema changes applied successfully!"
echo ""
echo "Next steps:"
echo "1. Configure your Stripe API keys in the admin settings"
echo "2. Test the payment flow using Stripe test cards"
echo "3. Test the refund functionality"
echo ""
echo "For detailed testing instructions, please refer to TESTING-PAYMENT-WORKFLOW.md"
