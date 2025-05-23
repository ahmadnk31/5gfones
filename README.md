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

- `src/app/`: Next.js app router pages
- `src/components/`: Reusable React components
- `src/lib/`: Utility functions and Supabase client
- `schema.sql`: Database schema

## Key Pages

- `/admin`: Main dashboard
- `/admin/products`: Product management
- `/admin/customers`: Customer management
- `/admin/orders`: Order management
- `/admin/pos`: Point of Sale interface

## Database Schema

The project uses a PostgreSQL database with the following main tables:

- `products`: Store product information
- `customers`: Customer details
- `orders`: Order information
- `order_items`: Items within each order
- `transactions`: Financial transactions
- `payment_methods`: Available payment methods

For the complete schema, refer to `schema.sql`.

## Authentication

User authentication is handled through Supabase. The login page is available at `/login`.

## Error Handling

A basic error page is implemented at `/error` to handle and display any errors that occur during runtime.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
