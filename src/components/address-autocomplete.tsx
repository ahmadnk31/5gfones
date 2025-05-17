import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import Script from "next/script";

interface AddressAutocompleteProps {
  onAddressSelect: (address: {
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }) => void;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({
  onAddressSelect,
  defaultValue = "",
  placeholder = "Enter your address",
  className,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    if (!isScriptLoaded || !inputRef.current) return;

    const options = {
      componentRestrictions: { country: ["us", "ca"] },
      fields: ["address_components", "formatted_address"],
      types: ["address"],
    };

    autocompleteRef.current = new google.maps.places.Autocomplete(
      inputRef.current,
      options
    );

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();
      if (!place || !place.address_components) return;

      let streetNumber = "";
      let route = "";
      let city = "";
      let state = "";
      let postalCode = "";
      let country = "";

      // Extract address components
      for (const component of place.address_components) {
        const types = component.types;

        if (types.includes("street_number")) {
          streetNumber = component.long_name;
        } else if (types.includes("route")) {
          route = component.long_name;
        } else if (types.includes("locality")) {
          city = component.long_name;
        } else if (types.includes("administrative_area_level_1")) {
          state = component.short_name;
        } else if (types.includes("postal_code")) {
          postalCode = component.long_name;
        } else if (types.includes("country")) {
          country = component.long_name;
        }
      }

      const address =
        streetNumber && route
          ? `${streetNumber} ${route}`
          : place.formatted_address || "";

      setInputValue(place.formatted_address || "");

      onAddressSelect({
        address,
        city,
        state,
        postalCode,
        country,
      });
    });

    // Clean up event listener
    return () => {
      if (window.google && autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isScriptLoaded, onAddressSelect]);

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onLoad={() => setIsScriptLoaded(true)}
      />
      <Input
        ref={inputRef}
        type='text'
        placeholder={placeholder}
        className={className}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
    </>
  );
}
