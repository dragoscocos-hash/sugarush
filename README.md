# SugaRush

**AI-Powered Glycemic Index & Calorie Tracking**

Track your glycemic load and calories with precision using OpenAI's Assistant API. Scan barcodes, capture food photos, or manually enter meals to get instant GL/GI analysis and health recommendations.

## Features

- 🔬 **High-Precision Analysis** - OpenAI Assistant API for accurate GL/GI calculations
- 📊 **Three Input Methods**
  - Manual food entry
  - Barcode scanning (Open Food Facts database)
  - Photo capture with AI vision
- 📈 **Meal Logging** - Track daily, weekly, and monthly trends
- 🎨 **Modern UI** - Dark mode, glassmorphism, smooth animations
- 📱 **Mobile-First** - Responsive design, works on all devices

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Vercel Serverless Functions
- **AI:** OpenAI Assistant API + GPT-4 Vision
- **APIs:** Open Food Facts (barcode lookup)
- **Storage:** LocalStorage (can upgrade to database)

## Quick Start

### Prerequisites

- Node.js 18+
- OpenAI API key
- Assistant ID (already created: `asst_OwTl4sIM9SP7fhGGKOSrA9Tp`)

### Installation

```bash
# Clone repository
git clone https://github.com/dragoscocos-hash/sugarush.git
cd sugarush

# Install dependencies
npm install

# Add UI components
npx shadcn-ui@latest add button card dialog tabs input

# Set up environment variables
cp .env.example .env
# Edit .env and add your OpenAI API key
```

### Development

```bash
npm run dev
```

Open http://localhost:5173

### Build

```bash
npm run build
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel dashboard for automatic deployments.

## Environment Variables

Required environment variables:

```bash
OPENAI_API_KEY=your_openai_api_key
ASSISTANT_ID=asst_OwTl4sIM9SP7fhGGKOSrA9Tp
```

Add these in Vercel dashboard under Settings > Environment Variables.

## Project Structure

```
sugarush/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── ui/         # shadcn/ui primitives
│   │   ├── BarcodeScanner.tsx
│   │   ├── CameraCapture.tsx
│   │   ├── ManualEntry.tsx
│   │   ├── ResultsCard.tsx
│   │   ├── MealLog.tsx
│   │   └── Charts.tsx
│   ├── lib/            # Utilities
│   │   ├── api.ts      # API client
│   │   ├── storage.ts  # LocalStorage helpers
│   │   └── utils.ts    # Helpers
│   ├── pages/          # Page components
│   │   ├── Home.tsx
│   │   └── Log.tsx
│   ├── types/          # TypeScript types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/                # Vercel serverless functions
│   ├── analyze-manual.ts
│   ├── analyze-barcode.ts
│   ├── analyze-image.ts
│   └── _lib/
│       ├── openai.ts
│       └── openfoodfacts.ts
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── vercel.json
```

## API Routes

### POST /api/analyze-manual

Analyze food by name and optional nutrients.

**Request:**
```json
{
  "foodName": "Brown rice",
  "portionSize": "1 cup",
  "nutrients": {
    "carbs": 45,
    "fiber": 3.5
  }
}
```

**Response:**
```json
{
  "foodName": "Brown rice",
  "gi": 50,
  "gl": 16,
  "calories": 215,
  "portionSize": "1 cup",
  "recommendations": "Good complex carb choice...",
  "source": "manual"
}
```

### POST /api/analyze-barcode

Analyze food by barcode.

**Request:**
```json
{
  "barcode": "3017620422003"
}
```

**Response:**
```json
{
  "foodName": "Nutella",
  "gi": 55,
  "gl": 13,
  "calories": 539,
  "portionSize": "100g",
  "imageUrl": "https://...",
  "source": "barcode"
}
```

### POST /api/analyze-image

Analyze food from photo.

**Request:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

**Response:**
```json
{
  "foodName": "Chicken breast with broccoli",
  "gi": 0,
  "gl": 0,
  "calories": 250,
  "portionSize": "estimated serving",
  "recommendations": "Excellent low-GI meal...",
  "source": "photo"
}
```

## Usage

### 1. Check GL & Calories

1. Choose input method (Manual, Barcode, Photo)
2. Enter food details or scan/capture
3. View GI, GL, calories, and recommendations
4. Optionally log the meal

### 2. Log Meals

1. After checking food, click "Log This Meal"
2. Select meal type (breakfast/lunch/dinner/snack)
3. Meal is saved to local storage

### 3. View Logs

1. Click "View Log" button
2. See today's meals and totals
3. Switch to Week or Month view for trends
4. View charts showing GL and calorie patterns

## Customization

### Theme

Edit `src/index.css` to customize the dark theme colors:

```css
:root {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  /* ... */
}
```

### Assistant Prompt

Edit `api/_lib/openai.ts` to customize how the Assistant analyzes food:

```typescript
const prompt = `Analyze this food: "${foodName}"
Provide:
1. Glycemic Index (GI)
2. Glycemic Load (GL) for the portion
3. Calories for the portion
4. Health recommendations`
```

## Troubleshooting

### Camera not working

- Ensure you're using HTTPS (required for camera access)
- Check browser permissions for camera
- Try in different browser (Chrome recommended)

### Barcode scanner not working

- Ensure good lighting
- Hold barcode steady and centered
- Try different angles
- Some barcodes may not be in Open Food Facts database

### API errors

- Check environment variables are set correctly
- Verify OpenAI API key is valid
- Check Vercel function logs for errors

## Contributing

This is a personal project, but suggestions welcome via GitHub issues.

## License

MIT

## Credits

- OpenAI Assistant API for food analysis
- Open Food Facts for barcode database
- shadcn/ui for UI components
- ZXing for barcode scanning

## Support

For issues or questions:
- GitHub Issues: https://github.com/dragoscocos-hash/sugarush/issues
- Email: dragoscocos@gmail.com

---

**Built with ❤️ by Dragos using Claude AI**
