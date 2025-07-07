# Sitecore.ai Clone with AI-Powered Recommendations

A beautiful clone of sitecore.ai with intelligent case study recommendations powered by AI. Built with Next.js, TypeScript, and the Vercel AI SDK.

## ✨ Features

- **Pixel-perfect Sitecore.ai Design** - Matches the original with gradient backgrounds and floating elements
- **Interactive Questionnaire** - Collects business model, persona, and desired outcomes
- **AI-Powered Recommendations** - Uses Azure OpenAI to intelligently match case studies to user needs
- **Dynamic Bento Layout** - Beautiful case study cards with relevance scores and reasoning
- **Vercel Serverless Functions** - API routes that scale automatically
- **TypeScript** - Fully typed for better development experience

## 🚀 Deploy to Vercel

### Quick Deploy (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/sitecore-ai-clone)

### Manual Deployment

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd sitecore-ai-clone
   bun install
   ```

2. **Deploy to Vercel**
   ```bash
   bunx vercel --prod
   ```

3. **Configure Environment Variables** (Optional - for Azure OpenAI)
   In your Vercel dashboard, add these environment variables:
   ```
   AZURE_OPENAI_API_KEY=your_azure_openai_api_key
   AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
   AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
   ```

## 🔧 Azure OpenAI Integration

The app works with mock AI logic by default, but you can enable real Azure OpenAI:

1. **Get Azure OpenAI Access**
   - Sign up for Azure OpenAI Service
   - Create a deployment (e.g., GPT-4)
   - Get your API key and endpoint

2. **Add Environment Variables**
   ```bash
   # In Vercel dashboard or .env.local
   AZURE_OPENAI_API_KEY=your_key_here
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_DEPLOYMENT_NAME=your-gpt4-deployment
   ```

3. **Enable Azure OpenAI** in `src/app/api/recommendations/route.ts`
   - Uncomment the Azure OpenAI import and configuration
   - Remove the mock fallback logic

## 📁 Project Structure

```
src/
├── app/
│   ├── api/recommendations/    # Vercel serverless function
│   ├── globals.css            # Sitecore.ai styles
│   └── page.tsx               # Main page
├── components/
│   ├── navigation.tsx         # Header with logo
│   ├── hero.tsx              # Hero section with floating elements
│   ├── questionnaire.tsx     # Interactive form
│   ├── case-studies.tsx      # All case studies bento grid
│   └── filtered-case-studies.tsx  # AI-filtered results
├── data/
│   └── case-studies.ts       # Sample case study data
└── types/
    └── recommendations.ts     # TypeScript interfaces
```

## 🛠 Development

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Build for production
bun build

# Run linter
bun run lint
```

## 🎯 How It Works

1. **User fills questionnaire** - Business model, persona, desired outcomes
2. **API analyzes responses** - Scores each case study for relevance
3. **AI provides reasoning** - Explains why each case study matches
4. **Results displayed** - Filtered case studies with scores and explanations

## 📊 Case Study Scoring Algorithm

The AI scoring considers:
- **Business Model Match** (30 points) - Exact match or "Both" compatibility
- **Persona Alignment** (25 points) - Marketing, IT, or Business role match
- **Outcome Relevance** (25 points) - Impact areas that align with goals
- **Base Relevance** (50 points) - All case studies have baseline value

## 🎨 Customization

- **Add more case studies** - Edit `src/data/case-studies.ts`
- **Modify scoring logic** - Update `generateMockRecommendations()` function
- **Change design** - Customize Tailwind classes and colors
- **Add new question types** - Extend the questionnaire component

## 🔍 API Endpoints

- `GET /api/recommendations` - Check configuration status
- `POST /api/recommendations` - Get AI-powered case study recommendations

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key | Optional |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint URL | Optional |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | GPT model deployment name | Optional |

## 🚨 Notes

- App works perfectly without Azure OpenAI using intelligent mock logic
- Vercel serverless functions handle the AI processing
- All styling matches the original sitecore.ai design
- TypeScript ensures type safety throughout

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this for your own projects!
