#!/bin/bash
# Run the SQL script to add Stripe payment fields to the database

# Replace with your actual connection details
DB_NAME="your_database"
DB_USER="your_username"
DB_PASS="your_password"
DB_HOST="localhost"

echo "Adding Stripe payment fields to the database..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f add-stripe-payment-fields.sql

echo "Database update completed!"
