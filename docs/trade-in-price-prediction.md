# Phone Trade-in Price Prediction System

This documentation covers the trade-in price prediction system for 5GPhones. The system provides customers with accurate estimates of their device's value when trading it in at our store.

## Overview

The price prediction system uses a sophisticated algorithm that takes into account multiple factors:

- Base prices for specific device models
- Device condition (using condition multipliers)
- Storage capacity adjustments
- Color-specific adjustments
- Value of included accessories
- Market trend adjustments

## Database Structure

The price prediction system relies on the following database tables:

1. **trade_in_prices**: Base prices for each device model
2. **phone_conditions**: Condition options and their multipliers
3. **storage_price_adjustments**: Price adjustments based on storage capacity
4. **color_price_adjustments**: Price adjustments based on device color
5. **accessory_price_adjustments**: Price adjustments for included accessories
6. **market_value_trends**: Market value trend data for device models
7. **price_prediction_parameters**: Configurable parameters for the prediction algorithm

## Price Calculation

The price is calculated using the following algorithm:

1. Determine the base price for the device from the `trade_in_prices` table
2. Apply condition multiplier from the `phone_conditions` table
3. Add storage capacity adjustment if applicable
4. Add color adjustment if applicable
5. Add value for included accessories (charger, box, etc.)
6. Apply market trend adjustment
7. Ensure the value doesn't drop below a minimum threshold

## Admin Configuration

Administrators can configure the price prediction system through the admin interface:

- Set global parameters for the prediction algorithm
- Define storage capacity adjustments for specific device models
- Configure color-based price adjustments
- Set accessory values by brand
- Update market trend data

## Technical Implementation

The price prediction logic is implemented as a PostgreSQL function (`calculate_trade_in_price`) that:

1. Takes device parameters as input (model, condition, storage, color, accessories)
2. Queries the necessary adjustment tables
3. Applies the appropriate multipliers and adjustments
4. Returns the calculated trade-in value

## Customer-Facing Features

Customers can:

1. Select their device details (brand, model, storage, condition)
2. Indicate whether they have accessories (charger, original box, etc.)
3. Upload images of their device
4. Get an instant estimated trade-in value
5. Submit their device for trade-in assessment

## Notes for Further Development

- Consider implementing machine learning models for more accurate price predictions
- Add automated market trend data collection
- Implement visual assessment of device images using computer vision
- Set up regular price adjustment updates based on market data
