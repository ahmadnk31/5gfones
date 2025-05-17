#!/bin/bash

# This script adds the newsletter subscribers table to the database
# Prerequisites:
# 1. Make sure to have the Supabase CLI installed (https://supabase.com/docs/guides/cli)
# 2. Be logged in to the Supabase CLI (run: supabase login)
# 3. Have a .env file with NEXT_PUBLIC_SUPABASE_URL set
#
# For manual setup (without CLI):
# You can execute the SQL script directly in the Supabase dashboard:
# - Go to https://app.supabase.com and select your project
# - Navigate to SQL Editor and create a new query
# - Copy the contents of sql/create-newsletter-table.sql and run it

# Load environment variables
set -a
source .env
set +a

echo "Adding newsletter subscribers table to database..."

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "Error: NEXT_PUBLIC_SUPABASE_URL is not set in .env file"
  exit 1
fi

# Extract project reference from URL
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | awk -F[/:] '{print $4}')

if [ -z "$PROJECT_REF" ]; then
  echo "Error: Could not extract project reference from NEXT_PUBLIC_SUPABASE_URL"
  exit 1
fi

# Run the SQL script
supabase db push --file sql/create-newsletter-table.sql -p $PROJECT_REF

echo "Newsletter subscribers table created successfully!"
