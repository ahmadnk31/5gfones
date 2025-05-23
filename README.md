# 5GPhones - E-commerce Platform for Mobile Devices

This is a modern, full-featured e-commerce platform specialized for mobile phones and accessories, built with Next.js 14, React, and Supabase. It provides a comprehensive solution for selling new and refurbished phones, handling trade-ins, managing repairs, and processing secure payments.

As a developer with extensive experience in creating similar applications, this project represents the culmination of years of expertise in building e-commerce platforms. The codebase is well-structured and implements modern best practices, with internationalization support and responsive design throughout.

This project embraces the spirit of open-source development, making it freely available for the community to use, modify, and improve upon.

## Features

- **Multi-language Support**: Full internationalization with English and Spanish translations
- **Product Catalog**: Comprehensive catalog with category filtering and search functionality
- **Special Offers**: Dynamic discounts for categories and products with time-limited promotions
- **Refurbished Products**: Complete marketplace for refurbished phones with condition rating
- **Shopping Cart**: Full-featured cart with persistent storage
- **Secure Checkout**: Integrated Stripe payment processing with multiple payment options
- **Customer Accounts**: User registration, login, and profile management
- **Order Management**: Complete order history and status tracking
- **Trade-in Program**: System for customers to trade in old devices
- **Repair Services**: Appointment booking for device repairs
- **Admin Dashboard**: Comprehensive backend for inventory and order management

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React 18
- **Styling**: Tailwind CSS with Shadcn UI components
- **Backend**: Supabase (PostgreSQL database with RLS policies)
- **Authentication**: Supabase Auth with social providers
- **Payments**: Stripe integration with Elements and Checkout
- **State Management**: React Context API and Hooks
- **Internationalization**: next-intl for multi-language support
- **Image Handling**: Next.js Image optimization
- **Vector Search**: PostgreSQL pgvector for advanced product search

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up your Supabase project and add the necessary environment variables:
   - Create a `.env.local` file in the root of your project
   - Add the following lines to the file:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```
   - Replace `your_supabase_project_url` and `your_supabase_anon_key` with your actual Supabase project URL and anon key
4. Run the development server:
   ```
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `src/app/`: Next.js app router pages with route groups for localization
- `src/app/[locale]/`: Internationalized routes
- `src/app/api/`: API routes for checkout, payments, webhooks
- `src/components/`: Reusable React components
- `src/lib/`: Utility functions, hooks, and providers
- `messages/`: Translation files for multiple languages
- `public/`: Static assets including product images
- `sql/`: Database migration scripts and schema definitions

## Key Pages

- `/`: Homepage with featured products and promotions
- `/products`: Product catalog with filtering
- `/categories`: Product categories
- `/offers`: Special deals and discounts
- `/cart`: Shopping cart management
- `/checkout`: Secure checkout process
- `/refurbished`: Refurbished products marketplace
- `/account`: User account management
- `/admin`: Administration dashboard

## Database Schema

The project uses a PostgreSQL database with the following main tables:

- `products`: Product catalog with details and inventory
- `categories`: Product categorization system
- `product_variants`: Variant options for products (color, storage, etc.)
- `variant_images`: Multiple images for product variants
- `refurbished_products`: Specialized table for refurbished inventory
- `category_discounts`: Time-based discounts for product categories
- `customers`: User accounts and details
- `orders`: Order information and status
- `order_items`: Individual items within each order
- `payment_transactions`: Complete payment history with Stripe integration
- `repair_requests`: System for managing device repair appointments
- `trade_in_estimates`: Trade-in valuation system

## Payment Integration

The platform includes full Stripe payment integration with:
- Multiple payment methods
- Secure checkout
- Webhook handling for async payment events
- Refund processing
- Error handling and recovery

## Internationalization

Full multi-language support is implemented using next-intl. Currently supported languages:
- English (default)
- Spanish

To add additional languages, create new translation files in the `messages/` directory.

## Advanced Features

### Vector Search
The platform uses PostgreSQL pgvector for enhanced product search capabilities. This allows for semantic search across product descriptions and specifications.

### Trade-in System
Customers can get instant quotes for trading in their old devices. The system uses a pricing algorithm based on device condition, model, and market values.

### Refurbished Products
Complete marketplace for refurbished phones with:
- Condition ratings (Excellent, Good, Fair)
- Special pricing and discounts
- Transparent condition descriptions
- Variant support

### Dynamic Discounts
The platform supports time-limited promotional discounts:
- Category-wide discounts
- Individual product discounts
- Special offers page
- "Ending soon" highlights

## Documentation

Additional documentation for specific features:
- `STRIPE-PAYMENT-GUIDE.md`: Complete guide to the payment system
- `STRIPE-PRODUCTION-GUIDE.md`: Moving to production with Stripe
- `REFURBISHED-VARIANTS-GUIDE.md`: Managing refurbished product variants
- `VECTOR-SEARCH-GUIDE.md`: Implementing and configuring vector search
- `TESTING-PAYMENT-WORKFLOW.md`: Testing the complete payment flow

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
