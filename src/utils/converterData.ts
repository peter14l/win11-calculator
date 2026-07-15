export interface Unit {
  id: string;
  name: string;
  factor: number; // relative to base unit
  symbol?: string;
}

export interface ConverterCategory {
  id: string;
  name: string;
  baseUnitId: string;
  units: Unit[];
  getComparison?: (value: number, unitId: string) => string;
}

export const CONVERTER_CATEGORIES: ConverterCategory[] = [
  {
    id: "currency",
    name: "Currency",
    baseUnitId: "USD",
    units: [
      { id: "USD", name: "United States Dollar", factor: 1.0, symbol: "$" },
      { id: "EUR", name: "Euro", factor: 0.92, symbol: "€" },
      { id: "GBP", name: "British Pound", factor: 0.78, symbol: "£" },
      { id: "CAD", name: "Canadian Dollar", factor: 1.36, symbol: "C$" },
      { id: "AUD", name: "Australian Dollar", factor: 1.51, symbol: "A$" },
      { id: "JPY", name: "Japanese Yen", factor: 156.0, symbol: "¥" },
      { id: "INR", name: "Indian Rupee", factor: 83.5, symbol: "₹" },
    ],
    getComparison: (value, unitId) => {
      const usdValue = unitId === "USD" ? value : value / (CONVERTER_CATEGORIES.find(c => c.id === "currency")?.units.find(u => u.id === unitId)?.factor || 1);
      const coffees = Math.round(usdValue / 4.5);
      return `Equivalent to about ${coffees.toLocaleString()} cup${coffees !== 1 ? "s" : ""} of coffee (at $4.50 USD each).`;
    }
  },
  {
    id: "volume",
    name: "Volume",
    baseUnitId: "L",
    units: [
      { id: "mL", name: "Milliliters", factor: 0.001 },
      { id: "L", name: "Liters", factor: 1.0 },
      { id: "gal_us", name: "Gallons (US)", factor: 3.78541 },
      { id: "gal_uk", name: "Gallons (UK)", factor: 4.54609 },
      { id: "qt", name: "Quarts (US)", factor: 0.946353 },
      { id: "pt", name: "Pints (US)", factor: 0.473176 },
      { id: "cup", name: "Cups (US)", factor: 0.24 },
      { id: "tbsp", name: "Tablespoons (US)", factor: 0.0147868 },
      { id: "tsp", name: "Teaspoons (US)", factor: 0.00492892 },
      { id: "m3", name: "Cubic meters", factor: 1000.0 },
      { id: "ft3", name: "Cubic feet", factor: 28.3168 },
      { id: "in3", name: "Cubic inches", factor: 0.0163871 },
    ],
    getComparison: (value, unitId) => {
      const liters = value * (CONVERTER_CATEGORIES.find(c => c.id === "volume")?.units.find(u => u.id === unitId)?.factor || 1);
      const baths = (liters / 150).toFixed(2);
      return `Equivalent to about ${baths} standard bathtubs of water (approx. 150 L each).`;
    }
  },
  {
    id: "length",
    name: "Length",
    baseUnitId: "m",
    units: [
      { id: "nm", name: "Nanometers", factor: 1e-9 },
      { id: "um", name: "Micrometers", factor: 1e-6 },
      { id: "mm", name: "Millimeters", factor: 0.001 },
      { id: "cm", name: "Centimeters", factor: 0.01 },
      { id: "m", name: "Meters", factor: 1.0 },
      { id: "km", name: "Kilometers", factor: 1000.0 },
      { id: "in", name: "Inches", factor: 0.0254 },
      { id: "ft", name: "Feet", factor: 0.3048 },
      { id: "yd", name: "Yards", factor: 0.9144 },
      { id: "mi", name: "Miles", factor: 1609.344 },
      { id: "nmi", name: "Nautical miles", factor: 1852.0 },
    ],
    getComparison: (value, unitId) => {
      const meters = value * (CONVERTER_CATEGORIES.find(c => c.id === "length")?.units.find(u => u.id === unitId)?.factor || 1);
      if (meters < 1) {
        const paperThickness = (meters / 0.0001).toFixed(1);
        return `About ${paperThickness} sheets of paper stacked.`;
      }
      if (meters < 1000) {
        const footballFields = (meters / 91.44).toFixed(2);
        return `About ${footballFields} American football fields.`;
      }
      const marathonCount = (meters / 42195).toFixed(2);
      return `About ${marathonCount} full marathon runs.`;
    }
  },
  {
    id: "weight",
    name: "Weight and Mass",
    baseUnitId: "kg",
    units: [
      { id: "carat", name: "Carats", factor: 0.0002 },
      { id: "mg", name: "Milligrams", factor: 1e-6 },
      { id: "g", name: "Grams", factor: 0.001 },
      { id: "kg", name: "Kilograms", factor: 1.0 },
      { id: "ton", name: "Metric Tons", factor: 1000.0 },
      { id: "oz", name: "Ounces", factor: 0.02834952 },
      { id: "lb", name: "Pounds", factor: 0.45359237 },
      { id: "stone", name: "Stones", factor: 6.350293 },
    ],
    getComparison: (value, unitId) => {
      const kgs = value * (CONVERTER_CATEGORIES.find(c => c.id === "weight")?.units.find(u => u.id === unitId)?.factor || 1);
      if (kgs < 1) {
        const paperclips = Math.round(kgs / 0.001);
        return `About the weight of ${paperclips.toLocaleString()} paperclip${paperclips !== 1 ? "s" : ""}.`;
      }
      if (kgs < 100) {
        const cats = (kgs / 4.5).toFixed(1);
        return `About the weight of ${cats} domestic cat${cats !== "1.0" ? "s" : ""}.`;
      }
      const elephants = (kgs / 5400).toFixed(3);
      return `About ${elephants} adult African elephants.`;
    }
  },
  {
    id: "temperature",
    name: "Temperature",
    baseUnitId: "C",
    units: [
      { id: "C", name: "Celsius", factor: 1.0, symbol: "°C" },
      { id: "F", name: "Fahrenheit", factor: 1.0, symbol: "°F" },
      { id: "K", name: "Kelvin", factor: 1.0, symbol: "K" },
    ],
    getComparison: (value, unitId) => {
      let celsius = value;
      if (unitId === "F") {
        celsius = (value - 32) * 5 / 9;
      } else if (unitId === "K") {
        celsius = value - 273.15;
      }
      if (celsius <= 0) return "Below freezing point of water.";
      if (celsius >= 100) return "Above boiling point of water.";
      if (celsius >= 36 && celsius <= 38) return "Around normal human body temperature.";
      return "Moderate temperature range.";
    }
  },
  {
    id: "energy",
    name: "Energy",
    baseUnitId: "J",
    units: [
      { id: "J", name: "Joules", factor: 1.0 },
      { id: "kJ", name: "Kilojoules", factor: 1000.0 },
      { id: "cal", name: "Calories (thermal)", factor: 4.184 },
      { id: "kcal", name: "Kilocalories (food)", factor: 4184.0 },
      { id: "Wh", name: "Watt-hours", factor: 3600.0 },
      { id: "kWh", name: "Kilowatt-hours", factor: 3.6e6 },
      { id: "eV", name: "Electronvolts", factor: 1.60218e-19 },
      { id: "btu", name: "British Thermal Units (BTU)", factor: 1055.056 },
      { id: "ft_lb", name: "Foot-pounds", factor: 1.355818 },
    ],
    getComparison: (value, unitId) => {
      const joules = value * (CONVERTER_CATEGORIES.find(c => c.id === "energy")?.units.find(u => u.id === unitId)?.factor || 1);
      const bananas = (joules / 3.7e5).toFixed(2);
      return `Equivalent to energy stored in about ${bananas} average bananas.`;
    }
  },
  {
    id: "area",
    name: "Area",
    baseUnitId: "m2",
    units: [
      { id: "mm2", name: "Square millimeters", factor: 1e-6 },
      { id: "cm2", name: "Square centimeters", factor: 0.0001 },
      { id: "m2", name: "Square meters", factor: 1.0 },
      { id: "hectare", name: "Hectares", factor: 10000.0 },
      { id: "km2", name: "Square kilometers", factor: 1e6 },
      { id: "in2", name: "Square inches", factor: 0.00064516 },
      { id: "ft2", name: "Square feet", factor: 0.09290304 },
      { id: "yd2", name: "Square yards", factor: 0.83612736 },
      { id: "acre", name: "Acres", factor: 4046.85642 },
      { id: "mi2", name: "Square miles", factor: 2.589988e6 },
    ],
    getComparison: (value, unitId) => {
      const m2 = value * (CONVERTER_CATEGORIES.find(c => c.id === "area")?.units.find(u => u.id === unitId)?.factor || 1);
      const tennisCourts = (m2 / 260).toFixed(2);
      return `Equivalent to about ${tennisCourts} tennis courts.`;
    }
  },
  {
    id: "speed",
    name: "Speed",
    baseUnitId: "m/s",
    units: [
      { id: "m/s", name: "Meters per second", factor: 1.0 },
      { id: "km/h", name: "Kilometers per hour", factor: 0.277778 },
      { id: "mph", name: "Miles per hour", factor: 0.44704 },
      { id: "knot", name: "Knots", factor: 0.514444 },
      { id: "mach", name: "Mach", factor: 343.0 },
    ],
    getComparison: (value, unitId) => {
      const ms = value * (CONVERTER_CATEGORIES.find(c => c.id === "speed")?.units.find(u => u.id === unitId)?.factor || 1);
      const cheetahRatio = (ms / 27).toFixed(2);
      return `About ${cheetahRatio} times the top speed of a cheetah.`;
    }
  },
  {
    id: "time",
    name: "Time",
    baseUnitId: "s",
    units: [
      { id: "us", name: "Microseconds", factor: 1e-6 },
      { id: "ms", name: "Milliseconds", factor: 0.001 },
      { id: "s", name: "Seconds", factor: 1.0 },
      { id: "min", name: "Minutes", factor: 60.0 },
      { id: "h", name: "Hours", factor: 3600.0 },
      { id: "day", name: "Days", factor: 86400.0 },
      { id: "week", name: "Weeks", factor: 604800.0 },
      { id: "year", name: "Years", factor: 3.1536e7 },
    ],
    getComparison: (value, unitId) => {
      const secs = value * (CONVERTER_CATEGORIES.find(c => c.id === "time")?.units.find(u => u.id === unitId)?.factor || 1);
      if (secs < 60) return "Less than a minute.";
      const movies = (secs / 7200).toFixed(1);
      return `Enough time to watch about ${movies} feature-length movies.`;
    }
  },
  {
    id: "power",
    name: "Power",
    baseUnitId: "W",
    units: [
      { id: "W", name: "Watts", factor: 1.0 },
      { id: "kW", name: "Kilowatts", factor: 1000.0 },
      { id: "hp_us", name: "Horsepower (US)", factor: 745.699872 },
      { id: "hp_m", name: "Horsepower (Metric)", factor: 735.49875 },
      { id: "ft_lb_min", name: "Foot-pounds/minute", factor: 0.02259697 },
      { id: "btu_min", name: "BTUs/minute", factor: 17.584264 },
    ],
    getComparison: (value, unitId) => {
      const watts = value * (CONVERTER_CATEGORIES.find(c => c.id === "power")?.units.find(u => u.id === unitId)?.factor || 1);
      const lightbulbs = Math.round(watts / 60);
      return `Equivalent to powering about ${lightbulbs.toLocaleString()} standard 60W lightbulbs.`;
    }
  },
  {
    id: "data",
    name: "Data",
    baseUnitId: "B",
    units: [
      { id: "bit", name: "Bits", factor: 0.125 },
      { id: "B", name: "Bytes", factor: 1.0 },
      { id: "KB", name: "Kilobytes (KB)", factor: 1024.0 },
      { id: "MB", name: "Megabytes (MB)", factor: 1048576.0 },
      { id: "GB", name: "Gigabytes (GB)", factor: 1073741824.0 },
      { id: "TB", name: "Terabytes (TB)", factor: 1099511627776.0 },
      { id: "PB", name: "Petabytes (PB)", factor: 1125899906842624.0 },
    ],
    getComparison: (value, unitId) => {
      const bytes = value * (CONVERTER_CATEGORIES.find(c => c.id === "data")?.units.find(u => u.id === unitId)?.factor || 1);
      const mp3s = Math.round(bytes / 4e6);
      return `Equivalent to about ${mp3s.toLocaleString()} high-quality MP3 songs (approx. 4MB each).`;
    }
  },
  {
    id: "pressure",
    name: "Pressure",
    baseUnitId: "Pa",
    units: [
      { id: "Pa", name: "Pascals", factor: 1.0 },
      { id: "kPa", name: "Kilopascals", factor: 1000.0 },
      { id: "bar", name: "Bars", factor: 100000.0 },
      { id: "atm", name: "Atmospheres", factor: 101325.0 },
      { id: "mmHg", name: "Millimeters of mercury", factor: 133.322 },
      { id: "psi", name: "Pounds per square inch (psi)", factor: 6894.757 },
    ],
    getComparison: (value, unitId) => {
      const pascals = value * (CONVERTER_CATEGORIES.find(c => c.id === "pressure")?.units.find(u => u.id === unitId)?.factor || 1);
      const tirePressureRatio = (pascals / 220000).toFixed(2);
      return `About ${tirePressureRatio} times typical car tire pressure (32 psi).`;
    }
  },
  {
    id: "angle",
    name: "Angle",
    baseUnitId: "deg",
    units: [
      { id: "deg", name: "Degrees", factor: 1.0 },
      { id: "rad", name: "Radians", factor: 57.2957795 },
      { id: "grad", name: "Gradians", factor: 0.9 },
    ],
    getComparison: (value, unitId) => {
      const degs = value * (CONVERTER_CATEGORIES.find(c => c.id === "angle")?.units.find(u => u.id === unitId)?.factor || 1);
      const rotations = (degs / 360).toFixed(2);
      return `Equivalent to about ${rotations} full 360° rotations.`;
    }
  }
];

export function convertValue(value: number, fromUnitId: string, toUnitId: string, categoryId: string): number {
  const category = CONVERTER_CATEGORIES.find(c => c.id === categoryId);
  if (!category) return value;

  if (categoryId === "temperature") {
    if (fromUnitId === toUnitId) return value;
    let celsius = value;
    if (fromUnitId === "F") celsius = (value - 32) * 5 / 9;
    else if (fromUnitId === "K") celsius = value - 273.15;

    if (toUnitId === "C") return celsius;
    if (toUnitId === "F") return celsius * 9 / 5 + 32;
    if (toUnitId === "K") return celsius + 273.15;
    return value;
  }

  const fromUnit = category.units.find(u => u.id === fromUnitId);
  const toUnit = category.units.find(u => u.id === toUnitId);

  if (!fromUnit || !toUnit) return value;

  const valueInBase = value * fromUnit.factor;
  return valueInBase / toUnit.factor;
}
