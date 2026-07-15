# Windows 11 Calculator Clone 🧮

A high-fidelity, feature-rich reproduction of the native Windows 11 Calculator app. Built using **React + TypeScript + Vite** for the web and packaged with **Capacitor** for Android.

## 🌟 Key Features

The app implements all the standard utility divisions of the native Windows 11 Calculator:

### 1. Standard Calculator
- Standard arithmetic calculations with proper operator precedence.
- Unary operators: Reciprocal (`1/x`), Square (`x²`), Square Root (`√x`), and Percentage (`%`).
- Standard Memory functions (`MC`, `MR`, `M+`, `M-`, `MS`, `Mv`).
- Collapsible side pane for **History** and **Memory** entries.

### 2. Scientific Calculator
- Advanced math computations.
- Full trigonometry suite (`sin`, `cos`, `tan`, `asin`, `acos`, `atan`) and hyperbolic equivalents (`sinh`, `cosh`, `tanh`).
- Exponential, log, natural log, roots, and modulo operations.
- Constants: $\pi$ (Pi) and $e$.
- Supporting three angle modes: **Degrees (DEG)**, **Radians (RAD)**, and **Gradians (GRAD)**.

### 3. Programmer Calculator
- Conversions in real-time across four bases: **Hexadecimal (HEX)**, **Decimal (DEC)**, **Octal (OCT)**, and **Binary (BIN)**.
- Configurable word sizes: `QWORD` (64-bit), `DWORD` (32-bit), `WORD` (16-bit), and `BYTE` (8-bit).
- Bitwise operators: `AND`, `OR`, `XOR`, `NOT`, `LSH` (Left Shift), `RSH` (Right Shift).
- Custom **64-Bit Visualizer**: A visual grid of 8 rows of bits. You can click on any individual bit to toggle it (0/1) and instantly see the calculated value updated in all bases.

### 4. Date Calculator
- **Difference between dates**: Calculates the precise interval between two selected dates in Years, Months, Weeks, and Days, plus the total elapsed days.
- **Add or subtract days**: Computes a new calendar date after offset values (Years, Months, Days) are added or subtracted.

### 5. Unit Converters (13 Categories)
Supports conversions and displays real-time unit equivalences:
- **Currency** (USD, EUR, GBP, CAD, AUD, JPY, INR)
- **Volume** (mL, L, Gallons, Quarts, Cubic meters, etc.)
- **Length** (nm, µm, mm, cm, m, km, inches, feet, yards, miles, nautical miles)
- **Weight and Mass** (Carats, mg, grams, kg, tons, ounces, pounds, stones)
- **Temperature** (Celsius, Fahrenheit, Kelvin)
- **Energy** (Joules, kJ, Calories, kcal, Wh, kWh, BTUs, etc.)
- **Area** (Sq mm, Sq cm, Sq m, Hectares, Sq km, Sq inches, Sq feet, Acres, Sq miles)
- **Speed** (m/s, km/h, mph, Knots, Mach)
- **Time** (µs, ms, seconds, minutes, hours, days, weeks, years)
- **Power** (Watts, kW, Horsepower, BTUs/min)
- **Data** (Bits, Bytes, KB, MB, GB, TB, PB)
- **Pressure** (Pa, kPa, Bars, Atmospheres, mmHg, psi)
- **Angle** (Degrees, Radians, Gradians)
- Includes dynamic comparison callouts (e.g. comparing area to tennis courts or speed to a cheetah).

---

## 🛠️ Technology Stack
- **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Native Wrapper**: [Capacitor CLI](https://capacitorjs.com/) (Android)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Theme**: Fluent UI theme (CSS variable-based Light/Dark switching)

---

## 🚀 Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/)

### Steps
1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/win11-calculator.git
   cd win11-calculator
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Run the development web server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

4. **Build the production web assets**:
   ```bash
   npm run build
   ```

---

## 📱 Building the Android APK

1. **Ensure you have Android SDK and Java installed**.
2. **Sync the Capacitor project**:
   ```bash
   npx cap sync android
   ```
3. **Compile the debug APK**:
   ```bash
   cd android && ./gradlew assembleDebug
   ```
   The built APK will be located at `android/app/build/outputs/apk/debug/app-debug.apk`.
