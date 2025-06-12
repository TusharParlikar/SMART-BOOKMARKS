# 🔖 Smart Bookmarks

> **Created by [Tushar Parlikar](https://github.com/TusharParlikar)**  
> Advanced VS Code extension for intelligent bookmarking with automatic "Last Activity" saving

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://marketplace.visualstudio.com/items?itemName=TusharParlikar.smart-bookmarks)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.74.0+-green.svg)](https://code.visualstudio.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Author](https://img.shields.io/badge/author-Tushar%20Parlikar-brightgreen.svg)](https://github.com/TusharParlikar)

Never lose your place in code again! Smart Bookmarks automatically saves your cursor position and provides intelligent bookmark management with a beautiful, modern interface.

## ✨ Key Features

- 🔄 **Auto-Save Last Activity**: Automatically bookmarks cursor position when closing files
- 📌 **Smart Bookmarking**: Add custom bookmarks with labels at any position
- 🎨 **Premium UI**: Beautiful, colorful interface with 27+ file type indicators
- 🕒 **Navigation History**: Automatic tracking of your code navigation patterns
- 🔍 **Advanced Search**: Find bookmarks and history instantly
- 💾 **Import/Export**: Backup and restore your bookmarks
- ⌨️ **Keyboard Shortcuts**: Efficient workflow integration
- 📊 **Activity Bar Panel**: Dedicated sidebar for managing bookmarks and history

![Smart Bookmarks Demo](https://raw.githubusercontent.com/TusharParlikar/SMART-BOOKMARKS/main/images/demo.gif)

## 🚀 Quick Start

### Installation

#### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for "Smart Bookmarks"
4. Click Install

#### From Command Line
```bash
code --install-extension TusharParlikar.smart-bookmarks
```

### Basic Usage

1. **Add Bookmark**: `Ctrl+Shift+B` (or `Cmd+Shift+B` on Mac)
2. **Navigate**: `Ctrl+Shift+G` (or `Cmd+Shift+G` on Mac) 
3. **Auto-Save**: Just close files - bookmarks created automatically!

### 🔄 Auto-Save Feature

The extension automatically saves your cursor position when you close files:
- Creates bookmarks labeled `🔄 Last Activity: filename.ext (HH:MM)`
- Saves exact cursor position for precise navigation
- Works across VS Code sessions
- Smart cleanup prevents bookmark clutter

## 📖 Features & Usage

### 📌 Smart Bookmarking System

#### Adding Bookmarks
- Use `Ctrl+Shift+B` (or `Cmd+Shift+B` on Mac) to add a bookmark at current cursor position
- Right-click in editor and select "Add Bookmark" from context menu
- Enter a custom label or use the default filename:line format

#### Managing Bookmarks
- Remove individual bookmarks using the trash icon in the sidebar
- Clear all bookmarks using the "Clear All" button in the sidebar
- Export bookmarks to JSON file for backup
- Import bookmarks from JSON file
- Bookmarks show file name, line number, and creation timestamp

#### Navigation
- Use `Ctrl+Shift+G` (or `Cmd+Shift+G` on Mac) to open bookmark quick picker
- Click on any bookmark in the Smart Bookmarks sidebar panel
- Use Command Palette: "Smart Bookmarks: Go to Bookmark"
- Navigate with temporary yellow highlighting for visual feedback

### 🕒 Navigation History
- Navigation history is automatically tracked as you move between files and positions
- View recent navigation history in the dedicated sidebar panel
- Click any history entry to jump back to that position
- History entries show file name, line number, and timestamp
- Configurable maximum history size (default: 100 entries)

### 🎨 Premium UI Features

#### Modern Interface
- **Gradient backgrounds** with professional color schemes
- **Floating animations** for interactive elements
- **Responsive design** that works on different screen sizes
- **Search functionality** for bookmarks and history
- **Quick action buttons** for common tasks

#### File Type Recognition
The extension recognizes 27+ file types with unique icons:
- 🟦 TypeScript (.ts)
- 🟨 JavaScript (.js)
- 🐍 Python (.py)
- 📄 Markdown (.md)
- 🎨 CSS (.css)
- 📋 JSON (.json)
- ⚛️ React (.jsx, .tsx)
- And many more...

#### Time-Based Color Coding
- ⚡ **Just now** (< 1 minute) - Red indicator
- 🔥 **Very recent** (< 5 minutes) - Orange indicator
- 🟢 **Recent** (< 30 minutes) - Green indicator
- 🔵 **Moderate** (< 2 hours) - Blue indicator
- ⚪ **Old** (> 2 hours) - Gray indicator

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Shift+B` | Add Bookmark | Create bookmark at cursor |
| `Ctrl+Shift+G` | Go to Bookmark | Open bookmark quick picker |
| Right-click | Context Menu | Add Bookmark option |

*Mac users: Replace `Ctrl` with `Cmd`*

## 🛠️ Configuration

You can customize the extension behavior through VS Code settings:

```json
{
  "smartBookmarks.maxHistorySize": 100,
  "smartBookmarks.autoSave": true,
  "smartBookmarks.showDecorations": true,
  "smartBookmarks.highlightDuration": 2000
}
```

### Available Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `maxHistorySize` | number | 100 | Maximum number of history entries to keep |
| `autoSave` | boolean | true | Automatically save bookmarks to workspace storage |
| `showDecorations` | boolean | true | Show line decorations for bookmarks |
| `highlightDuration` | number | 2000 | Duration of highlight when navigating (ms) |

## 🎛️ Commands

The extension provides the following commands accessible through the Command Palette:

- `Smart Bookmarks: Add Bookmark` - Add a bookmark at current position
- `Smart Bookmarks: Go to Bookmark` - Show bookmark picker
- `Smart Bookmarks: Remove Bookmark` - Remove selected bookmark
- `Smart Bookmarks: Clear All Bookmarks` - Clear all bookmarks
- `Smart Bookmarks: Show Navigation History` - Show history picker
- `Smart Bookmarks: Export Bookmarks` - Export bookmarks to JSON
- `Smart Bookmarks: Import Bookmarks` - Import bookmarks from JSON

## 🧪 Auto-Save Last Activity

### How It Works
1. **Position Tracking**: The extension monitors your cursor position in each open file
2. **Auto-Save on Close**: When you close a file (`Ctrl+W`), it automatically:
   - Creates a bookmark with label: `🔄 Last Activity: filename.ext (HH:MM)`
   - Saves your exact cursor position (line and column)
   - Removes any previous "Last Activity" bookmark for that file
3. **Smart Filtering**: Skips temporary files, git files, and node_modules
4. **Persistence**: Auto-saved bookmarks survive VS Code restarts

### Features
- ✅ **Automatic**: No manual action required
- ✅ **Smart Cleanup**: Removes old "Last Activity" bookmarks to prevent clutter
- ✅ **Time Stamped**: Shows when the position was saved
- ✅ **Position Accuracy**: Saves exact cursor position (line and column)
- ✅ **File Filtering**: Ignores system and temporary files

### Visual Indicators
- **Status Bar Message**: "💾 Last activity saved for [filename]"
- **Bookmark Entry**: `🔄 Last Activity: filename.ext (timestamp)`
- **Navigation Highlight**: Yellow highlight when navigating to bookmark

## 🏗️ Architecture

### Core Components
1. **BookmarkManager** - Handles bookmark CRUD operations and persistent storage
2. **HistoryManager** - Tracks navigation history and manages size limits
3. **DecorationManager** - Provides visual line highlighting with theme colors
4. **StatusBarManager** - Shows bookmark count in status bar with real-time updates
5. **WebviewProvider** - Premium UI interface with search and import/export features

### Auto-Save Implementation
```typescript
// Key functions in extension.ts:
- saveLastActivityBookmark() - Creates auto-bookmark on file close
- updateLastActivityPosition() - Tracks cursor position changes
- Event listeners for file close and cursor movement
```

## 🎯 What Makes It Special

- **Zero Configuration**: Works perfectly out of the box
- **Intelligent Design**: Recognizes 27+ file types with unique icons
- **Performance Optimized**: Fast, efficient, and memory-friendly
- **Cross-Platform**: Windows, macOS, and Linux support
- **Professional Polish**: Enterprise-grade UI and user experience

## 🔧 Development

### Prerequisites
- Node.js 16 or higher
- VS Code 1.74.0 or higher
- TypeScript 4.9 or higher

### Building from Source
```bash
# Clone the repository
git clone https://github.com/TusharParlikar/SMART-BOOKMARKS.git
cd smart-bookmarks

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes during development
npm run watch
```

### Development Commands
```bash
npm run compile          # Compile TypeScript to JavaScript
npm run watch           # Watch mode for development
npm run lint            # Run ESLint
npm test               # Run tests
```

### Testing
```bash
# Open Extension Development Host
F5 or Run > Start Debugging
```

## 📄 Changelog

### [1.0.0] - 2025-06-12

#### ✨ Added
- **Auto-Save Last Activity**: Automatic bookmark creation when closing files
- **Premium UI Interface**: Beautiful webview with gradients and animations
- **Enhanced File Type Support**: 27+ file types with emoji indicators
- **Time-Based Color Coding**: Visual indicators for bookmark age
- **Search Functionality**: Real-time search for bookmarks and history
- **Import/Export Features**: Backup and restore bookmarks
- **Status Bar Integration**: Real-time bookmark count display
- **Line Highlighting**: Visual feedback when navigating to bookmarks
- **Welcome View**: Getting started interface for new users

#### 🔧 Core Features
- Smart bookmarking system with custom labels
- Automatic navigation history tracking
- Keyboard shortcuts for quick access (`Ctrl+Shift+B`, `Ctrl+Shift+G`)
- Context menu integration for bookmark creation
- Dedicated activity bar panel with tree views
- Persistent storage for bookmarks and history
- Configuration options for history size and auto-save
- Quick picker interface for bookmark and history navigation
- Inline bookmark management with remove and clear all actions
- Cross-platform support (Windows, macOS, Linux)

#### 🎨 UI/UX Improvements
- **Modern Design**: Professional color schemes and gradients
- **Responsive Layout**: Works on different screen sizes
- **Floating Animations**: Interactive elements with smooth transitions
- **Color-Coded Indicators**: Different colors for file types and time periods
- **Quick Action Buttons**: Easy access to common functions

#### 🛠️ Technical Enhancements
- **TypeScript Compilation**: Fixed all compilation errors
- **Error Handling**: Comprehensive try-catch blocks with user feedback
- **Performance**: Optimized bookmark and history management
- **Memory Management**: Proper disposal patterns and cleanup
- **Cross-Platform Support**: Windows, macOS, and Linux compatibility

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any problems or have feature requests:

1. Check the [issues](https://github.com/TusharParlikar/SMART-BOOKMARKS/issues) page
2. Create a new issue with detailed information
3. Include your VS Code version and extension version

## 🌟 Show Your Support

If you find this extension helpful, please:
- ⭐ Star the repository on GitHub
- 📝 Leave a review on the VS Code Marketplace
- 🐛 Report bugs or suggest features
- 💡 Share with your fellow developers

## 👨‍💻 About the Developer

**Tushar Parlikar** is a passionate developer focused on creating productivity tools for developers. This extension represents dedication to solving real developer problems and improving coding workflows.

### 🔗 Connect With Me
- 🌐 **GitHub**: [TusharParlikar](https://github.com/TusharParlikar)
- 📧 **Email**: tparlikar497@gmail.com
- 💼 **Extension**: [Smart Bookmarks on Marketplace](https://marketplace.visualstudio.com/items?itemName=TusharParlikar.smart-bookmarks)

### 💭 Developer Note
This extension was crafted with care to solve the common problem of losing your place in code. Every feature was designed based on real developer needs and testing. If you have suggestions or encounter issues, I'm always happy to help!

---

**🚀 Transform your VS Code experience with Smart Bookmarks - Never lose your place in code again!**

*Created by [Tushar Parlikar](https://github.com/TusharParlikar) with Claude AI assistance*

*Made with ❤️ for the developer community*
