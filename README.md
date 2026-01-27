# 🎯 AI Task Master

> **Advanced AI-powered Task Management System with Google Gemini Integration**

## ✨ Features

### 🤖 **AI-Powered Analysis**
- **Gemini Integration**: Uses Google's most advanced AI model
- **Smart Summarization**: Extracts 7-10 key points from documents
- **Q&A Generation**: Auto-generates 4-6 questions and answers
- **Action Item Extraction**: Identifies and prioritizes tasks
- **Sentiment Analysis**: Analyzes tone and emotional context
- **Metadata Generation**: Auto-generates titles and descriptions

### 🎯 **Smart Recommendations** (NEW)
- **Task Recommendations**: AI suggests what to focus on next
- **Intelligent Priority**: Auto-adjusts priorities based on deadlines and complexity
- **Productivity Insights**: Real-time insights on your work patterns
- **Performance Metrics**: Track completion rate, streaks, and productivity velocity

### 📊 **Advanced Analytics** (NEW)
- **Recommendations Dashboard**: 5 types of smart suggestions with confidence scores
- **Productivity Metrics**: Completion rate, average task time, focus streaks
- **Subject Balance**: Alerts when studying specific subjects too much
- **Weekly Stats**: Track tasks completed this week and month
- **Pattern Recognition**: AI learns your most productive times

### 💾 **Data Export** (NEW)
- **CSV Export**: Export tasks to Excel/Sheets
- **PDF Reports**: Generate professional task reports with statistics
- **One-click Export**: Quick export buttons in header

### 📄 **File Processing**
- Supports: PDF, DOCX, PPTX, XLSX, TXT
- Intelligent text extraction
- Automatic AI analysis on upload
- Beautiful file preview

### 📊 **Task Management**
- Multi-view modes (List, Grid, Subject)
- Priority levels (Urgent, High, Medium, Low)
- Status tracking (Todo, In Progress, Done)
- Real-time notifications
- Analytics dashboard
- Weekly reports

### 🎨 **Beautiful UI**
- Dark/Light mode toggle
- Responsive design (mobile to 4K)
- Smooth animations
- Color-coded priorities
- Professional glassmorphism design

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ (Recommended: 18 LTS)
- npm or yarn
- Google Gemini API key ([Get here](https://aistudio.google.com/app/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ai-task-master.git
cd ai-task-master

# Install dependencies
npm install

# Create environment file
echo VITE_GOOGLE_GEMINI_API_KEY=your_key_here > .env.local

# Start development server
npm run dev

# Open http://localhost:5173
```

### Build for Production

```bash
npm run build
npm run preview
```

## 🌐 Deployment

See [GITHUB_VERCEL_SETUP.md](./GITHUB_VERCEL_SETUP.md) for complete deployment guide.

**Quick Deploy:**
1. Push to GitHub
2. Import to Vercel
3. Add environment variable
4. Done! 🎉

## 📦 Tech Stack

- **React 19** - Modern UI library
- **TypeScript 5.9** - Type safety
- **Vite 7.3** - Fast build tool
- **Tailwind CSS 4.1** - Styling
- **Framer Motion 12** - Animations
- **Google Generative AI** - Gemini API
- **Zustand** - State management

## 📊 Build Status

```
✓ 3059 modules transformed
✓ TypeScript: 0 errors
✓ Bundle: 280 KB (gzipped)
✓ Build time: ~7.5 seconds
✓ Production ready
```

## 📁 Project Structure

```
src/
├── App.tsx              # Main app
├── components.tsx       # All UI components
├── SummaryModal.tsx     # AI summary modal
├── ai-service.ts        # AI functions
├── ai-config.ts         # API config
├── store.ts             # State management
└── main.tsx             # Entry point
```

## 🎮 How to Use

1. **Create Task**: Click "New Task" → Enter details
2. **Upload File**: Add PDF, DOCX, PPTX, XLSX, or TXT
3. **Get AI Summary**: AI automatically analyzes content
4. **View Analysis**: Click Brain icon for detailed modal
5. **Track Progress**: Mark tasks as done → Score updates

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+K / Cmd+K | Quick add task |
| Escape | Close modals |

## 🐛 Troubleshooting

### API Key Not Working
- Get key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- Add to `.env.local` for local dev
- Add to Vercel environment variables for production

### Build Fails
- Run `npm install`
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

### 404 Errors on Vercel
- `vercel.json` is already configured ✓
- Check build succeeds: `npm run build`

## 📚 Documentation

- [NEW_FEATURES.md](./NEW_FEATURES.md) - Detailed guide to all new AI features
- [GITHUB_VERCEL_SETUP.md](./GITHUB_VERCEL_SETUP.md) - Deployment guide
- [.env.example](./.env.example) - Environment template
- [package.json](./package.json) - Dependencies
- [vercel.json](./vercel.json) - Vercel config

## 🎯 What's New (v2.0)

**Smart Recommendations System**
- AI-powered task suggestions based on urgency and importance
- 5 different recommendation types (deadline, focus, pattern, streak, balance)
- Confidence scoring for each recommendation

**Advanced Analytics**
- Real-time productivity metrics and insights
- Performance tracking (completion rate, streaks, velocity)
- Subject-based analytics and load balancing

**Data Export**
- Export tasks to CSV for spreadsheet analysis
- Generate PDF reports with statistics
- One-click export from header

See [NEW_FEATURES.md](./NEW_FEATURES.md) for complete details!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit and push
5. Open a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🎉 Live Demo

After deployment, visit: `https://your-project-name.vercel.app`

---

**Made with ❤️ using React, TypeScript, and Google Gemini AI** ✨
