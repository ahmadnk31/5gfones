# Refund Request Management Guide

This document explains how the refund request system works in the 5GPhones e-commerce platform, connecting user-initiated refund requests to admin processing.

## System Overview

The refund system consists of two main components:
1. **User-side** - Where customers can request refunds for their orders
2. **Admin-side** - Where staff can review and process these refund requests

### Database Structure

The system uses the following tables:
- `refund_requests` - Stores all customer refund requests
- `orders` - Contains a `refund_status` field showing if a refund is pending/approved/rejected

## User Refund Request Flow

1. **Request Initiation**
   - Users visit their order details page
   - If the order is eligible (delivered and within time window), they see a "Request Refund" button
   - They enter a reason and optional additional information
   - The request is submitted to the `/api/refund-request` endpoint

2. **Request Storage**
   - The request is stored in the `refund_requests` table with status "pending"
   - The associated order is updated with `refund_status: "pending"`
   - Row-level security ensures users can only see their own refund requests

## Admin Refund Management Flow

1. **View Refund Requests**
   - Admins access the dedicated refund requests page at `/admin/refund-requests`
   - They can see all requests with filterable status (pending/approved/rejected)
   - Each request shows key information: order ID, customer, date, reason, amount, status

2. **Process Refund Requests**
   - Admins click "Process" on a pending request
   - They can review request details and add admin notes
   - Options to approve (with refund through Stripe) or reject
   - The refund request status and order are updated accordingly

3. **Refund Execution**
   - When approved, the system:
     - Processes the refund through Stripe API
     - Updates the request status to "approved"
     - Updates the order's payment_status to "refunded" or "partially_refunded"
     - Records the transaction in the `payment_transactions` table

## Key Features

### Admin Refund Requests Page
- Dedicated management interface for refund requests
- Filterable view by status
- Complete request details with customer information
- Ability to process full or partial refunds

### Integration with Order Management
- Refund status visible in order details
- Connected to payment processing system
- Updates reflected in customer's order history

## Security Considerations

- **Row Level Security**: Database policies ensure customers can only see their own refund requests
- **Admin Access Control**: Only users with admin role can view and process refund requests
- **Audit Trail**: Records of who processed refunds and when

## Best Practices

1. **Respond Promptly**: Process refund requests in a timely manner
2. **Document Decisions**: Use admin notes field to explain approved/rejected decisions
3. **Partial Refunds**: Consider partial refunds when appropriate (e.g., only some items damaged)
4. **Double-check**: Verify order details before processing refunds

## Common Issues & Troubleshooting

- **Stripe API Errors**: Ensure payment_id is valid and refund amount doesn't exceed original payment
- **Missing Payment Info**: If payment_id is missing, check the payment_details JSON field
- **Role Permissions**: Ensure user has admin role to access refund management
