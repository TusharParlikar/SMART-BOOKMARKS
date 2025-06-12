import * as vscode from 'vscode';
import { BookmarkManager, Bookmark } from '../managers/bookmarkManager';
import { HistoryManager, HistoryEntry } from '../managers/historyManager';

export class BookmarkWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'smartBookmarks.webview';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private bookmarkManager: BookmarkManager,
        private historyManager: HistoryManager
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'navigateToBookmark':
                    await this.navigateToBookmark(data.bookmarkId);
                    break;
                case 'deleteBookmark':
                    await this.deleteBookmark(data.bookmarkId);
                    break;
                case 'navigateToHistory':
                    await this.navigateToHistory(data.historyIndex);
                    break;
                case 'refresh':
                    this.refresh();
                    break;
                case 'addBookmark':
                    vscode.commands.executeCommand('smartBookmarks.addBookmark');
                    break;
                case 'exportBookmarks':
                    vscode.commands.executeCommand('smartBookmarks.exportBookmarks');
                    break;
                case 'clearAllBookmarks':
                    vscode.commands.executeCommand('smartBookmarks.clearAll');
                    break;
            }
        });

        this.refresh();
    }

    public refresh() {
        if (this._view) {
            this._view.webview.postMessage({ type: 'refresh' });
            this._updateWebview();
        }
    }

    private async _updateWebview() {
        if (!this._view) return;

        const bookmarks = await this.bookmarkManager.getBookmarks();
        const history = await this.historyManager.getHistory();

        this._view.webview.postMessage({
            type: 'update',
            bookmarks: bookmarks.map(b => ({
                id: b.id,
                label: b.label,
                fileName: b.fileName,
                line: b.line,
                timestamp: b.timestamp.toISOString()
            })),
            history: history.slice(0, 10).map((h, index) => ({
                index,
                fileName: h.fileName,
                line: h.line,
                timestamp: h.timestamp.toISOString()
            }))
        });
    }

    private async navigateToBookmark(bookmarkId: string) {
        const bookmarks = await this.bookmarkManager.getBookmarks();
        const bookmark = bookmarks.find(b => b.id === bookmarkId);
        if (bookmark) {
            const document = await vscode.workspace.openTextDocument(bookmark.uri);
            const editor = await vscode.window.showTextDocument(document);
            editor.selection = new vscode.Selection(bookmark.position, bookmark.position);
            editor.revealRange(new vscode.Range(bookmark.position, bookmark.position));
        }
    }

    private async deleteBookmark(bookmarkId: string) {
        await this.bookmarkManager.removeBookmark(bookmarkId);
        this.refresh();
    }

    private async navigateToHistory(historyIndex: number) {
        const history = await this.historyManager.getHistory();
        const entry = history[historyIndex];
        if (entry) {
            const document = await vscode.workspace.openTextDocument(entry.uri);
            const editor = await vscode.window.showTextDocument(document);
            editor.selection = new vscode.Selection(entry.position, entry.position);
            editor.revealRange(new vscode.Range(entry.position, entry.position));
        }
    }    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart Bookmarks Pro</title>
    <style>
        :root {
            --primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            --secondary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            --success: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            --warning: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
            --danger: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            --dark: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
            --shadow: 0 10px 30px rgba(0,0,0,0.1);
            --shadow-hover: 0 15px 35px rgba(0,0,0,0.2);
            --border-radius: 15px;
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            color: var(--vscode-foreground);
            background: linear-gradient(135deg, 
                var(--vscode-editor-background) 0%, 
                var(--vscode-sideBar-background) 50%,
                var(--vscode-panel-background) 100%);
            padding: 20px;
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
        }

        .background-pattern {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                radial-gradient(circle at 25% 25%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, rgba(118, 75, 162, 0.1) 0%, transparent 50%);
            pointer-events: none;
            z-index: -1;
        }
        
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 30px;
            padding: 25px 30px;
            background: var(--primary);
            border-radius: var(--border-radius);
            color: white;
            box-shadow: var(--shadow);
            position: relative;
            overflow: hidden;
        }

        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            pointer-events: none;
        }
        
        .header-content {
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 1;
            position: relative;
        }

        .header-icon {
            font-size: 32px;
            animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            letter-spacing: -0.5px;
        }

        .header-subtitle {
            font-size: 12px;
            opacity: 0.9;
            font-weight: 400;
        }
        
        .refresh-btn {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.3);
            padding: 12px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: var(--transition);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 1;
            position: relative;
        }
        
        .refresh-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.5);
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }

        .refresh-btn:active {
            transform: translateY(0) scale(0.98);
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: var(--success);
            padding: 25px;
            border-radius: var(--border-radius);
            color: white;
            box-shadow: var(--shadow);
            transition: var(--transition);
            position: relative;
            overflow: hidden;
        }

        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 100px;
            height: 100px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            transform: translate(30px, -30px);
        }

        .stat-card:nth-child(2) {
            background: var(--warning);
        }

        .stat-card:hover {
            transform: translateY(-5px) scale(1.02);
            box-shadow: var(--shadow-hover);
        }
        
        .stat-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
        }

        .stat-icon {
            font-size: 28px;
            background: rgba(255, 255, 255, 0.2);
            padding: 12px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 52px;
            height: 52px;
            z-index: 1;
            position: relative;
        }
        
        .stat-value {
            font-size: 32px;
            font-weight: 700;
            line-height: 1;
            z-index: 1;
            position: relative;
        }
        
        .stat-label {
            font-size: 14px;
            opacity: 0.9;
            font-weight: 500;
            z-index: 1;
            position: relative;
        }
        
        .section {
            margin-bottom: 30px;
            background: var(--vscode-editor-background);
            border-radius: var(--border-radius);
            padding: 25px;
            box-shadow: var(--shadow);
            border: 1px solid var(--vscode-widget-border);
            transition: var(--transition);
            position: relative;
            overflow: hidden;
        }

        .section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: var(--primary);
        }

        .section:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-hover);
        }
        
        .section-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 20px;
            color: var(--vscode-foreground);
            display: flex;
            align-items: center;
            gap: 10px;
            padding-left: 15px;
        }

        .section-title::before {
            content: '';
            width: 8px;
            height: 8px;
            background: var(--primary);
            border-radius: 50%;
            animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.2); }
        }
        
        .bookmark-item, .history-item {
            display: flex;
            align-items: center;
            padding: 20px;
            margin-bottom: 12px;
            border-radius: 12px;
            cursor: pointer;
            transition: var(--transition);
            border: 2px solid transparent;
            background: linear-gradient(135deg, 
                var(--vscode-sideBar-background) 0%, 
                var(--vscode-editor-inactiveSelectionBackground) 100%);
            position: relative;
            overflow: hidden;
        }

        .bookmark-item::before, .history-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
            opacity: 0;
            transition: var(--transition);
        }
        
        .bookmark-item:hover, .history-item:hover {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            border-color: rgba(102, 126, 234, 0.3);
            transform: translateY(-3px) scale(1.02);
            box-shadow: var(--shadow-hover);
        }

        .bookmark-item:hover::before, .history-item:hover::before {
            opacity: 1;
        }
        
        .bookmark-item.active, .history-item.active {
            background: var(--primary);
            color: white;
            border-color: rgba(102, 126, 234, 0.5);
            box-shadow: var(--shadow-hover);
        }
        
        .item-icon {
            margin-right: 15px;
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
            transition: var(--transition);
            position: relative;
            z-index: 1;
        }

        .bookmark-item:hover .item-icon, .history-item:hover .item-icon {
            transform: scale(1.1) rotate(5deg);
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
        }
        
        .item-content {
            flex: 1;
            overflow: hidden;
            z-index: 1;
            position: relative;
        }
        
        .item-label {
            font-size: 16px;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 6px;
            line-height: 1.2;
        }
        
        .item-details {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }
        
        .item-actions {
            display: flex;
            gap: 10px;
            opacity: 0;
            transition: var(--transition);
            z-index: 1;
            position: relative;
        }
        
        .bookmark-item:hover .item-actions,
        .history-item:hover .item-actions {
            opacity: 1;
            transform: translateX(0);
        }
        
        .action-btn {
            background: var(--danger);
            border: none;
            color: white;
            cursor: pointer;
            padding: 10px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            transition: var(--transition);
            box-shadow: 0 4px 15px rgba(250, 112, 154, 0.3);
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .action-btn:hover {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 6px 20px rgba(250, 112, 154, 0.4);
        }

        .action-btn:active {
            transform: translateY(0) scale(0.98);
        }
        
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--vscode-descriptionForeground);
        }
        
        .empty-icon {
            font-size: 64px;
            margin-bottom: 20px;
            opacity: 0.6;
            filter: grayscale(30%);
            animation: float 3s ease-in-out infinite;
        }
        
        .empty-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 10px;
            color: var(--vscode-foreground);
        }

        .empty-subtitle {
            font-size: 14px;
            margin-bottom: 20px;
            line-height: 1.5;
        }
        
        .empty-cta {
            font-size: 12px;
            padding: 12px 20px;
            background: var(--primary);
            color: white;
            border-radius: 25px;
            display: inline-block;
            font-weight: 600;
            box-shadow: var(--shadow);
            transition: var(--transition);
        }

        .empty-cta:hover {
            transform: translateY(-2px) scale(1.05);
            box-shadow: var(--shadow-hover);
        }
        
        .loading {
            text-align: center;
            padding: 60px;
            color: var(--vscode-descriptionForeground);
        }
        
        .loading-spinner {
            font-size: 32px;
            animation: spin 2s linear infinite;
            margin-bottom: 15px;
        }

        .loading-text {
            font-size: 16px;
            font-weight: 500;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .tag {
            background: var(--secondary);
            color: white;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 2px 8px rgba(240, 147, 251, 0.3);
        }
        
        .bookmark-item .tag {
            background: var(--secondary);
        }
        
        .history-item .tag {
            background: var(--warning);
        }

        .quick-actions {
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 1000;
        }

        .quick-action-btn {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: var(--primary);
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: var(--shadow);
            transition: var(--transition);
        }

        .quick-action-btn:hover {
            transform: scale(1.1);
            box-shadow: var(--shadow-hover);
        }

        .search-box {
            width: 100%;
            padding: 15px 20px;
            border: 2px solid var(--vscode-widget-border);
            border-radius: 25px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-size: 14px;
            margin-bottom: 20px;
            transition: var(--transition);
        }

        .search-box:focus {
            outline: none;
            border-color: rgba(102, 126, 234, 0.5);
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        @media (max-width: 768px) {
            .stats {
                grid-template-columns: 1fr;
            }
            
            .header {
                padding: 20px;
            }
            
            .header h1 {
                font-size: 20px;
            }
            
            .section {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="background-pattern"></div>
    
    <div class="header">
        <div class="header-content">
            <div class="header-icon">📚</div>
            <div>
                <h1>Smart Bookmarks Pro</h1>
                <div class="header-subtitle">Advanced Code Navigation & Management</div>
            </div>
        </div>
        <button class="refresh-btn" onclick="refresh()">
            <span>🔄</span>
            <span>Refresh</span>
        </button>
    </div>
    
    <div class="stats" id="stats" style="display: none;">
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon">📖</div>
            </div>
            <div class="stat-value" id="bookmark-count">0</div>
            <div class="stat-label">Active Bookmarks</div>
        </div>
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon">🕒</div>
            </div>
            <div class="stat-value" id="history-count">0</div>
            <div class="stat-label">History Entries</div>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">📚 Smart Bookmarks</div>
        <input type="text" class="search-box" placeholder="🔍 Search bookmarks..." id="bookmark-search" onkeyup="filterBookmarks()">
        <div id="bookmarks-container">
            <div class="loading">
                <div class="loading-spinner">⏳</div>
                <div class="loading-text">Loading your bookmarks...</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">🕒 Navigation History</div>
        <input type="text" class="search-box" placeholder="🔍 Search history..." id="history-search" onkeyup="filterHistory()">
        <div id="history-container">
            <div class="loading">
                <div class="loading-spinner">⏳</div>
                <div class="loading-text">Loading navigation history...</div>
            </div>
        </div>
    </div>

    <div class="quick-actions">
        <button class="quick-action-btn" onclick="addQuickBookmark()" title="Quick Add Bookmark">➕</button>
        <button class="quick-action-btn" onclick="exportBookmarks()" title="Export Bookmarks">📤</button>
        <button class="quick-action-btn" onclick="clearAllBookmarks()" title="Clear All">🗑️</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let allBookmarks = [];
        let allHistory = [];
        
        function refresh() {
            vscode.postMessage({ type: 'refresh' });
        }
        
        function navigateToBookmark(bookmarkId) {
            vscode.postMessage({ type: 'navigateToBookmark', bookmarkId });
        }
        
        function deleteBookmark(bookmarkId) {
            vscode.postMessage({ type: 'deleteBookmark', bookmarkId });
        }
        
        function navigateToHistory(historyIndex) {
            vscode.postMessage({ type: 'navigateToHistory', historyIndex });
        }

        function addQuickBookmark() {
            vscode.postMessage({ type: 'addBookmark' });
        }

        function exportBookmarks() {
            vscode.postMessage({ type: 'exportBookmarks' });
        }

        function clearAllBookmarks() {
            vscode.postMessage({ type: 'clearAllBookmarks' });
        }

        function filterBookmarks() {
            const searchTerm = document.getElementById('bookmark-search').value.toLowerCase();
            const filteredBookmarks = allBookmarks.filter(bookmark => 
                bookmark.label.toLowerCase().includes(searchTerm) ||
                bookmark.fileName.toLowerCase().includes(searchTerm)
            );
            updateBookmarksDisplay(filteredBookmarks);
        }

        function filterHistory() {
            const searchTerm = document.getElementById('history-search').value.toLowerCase();
            const filteredHistory = allHistory.filter(entry => 
                entry.fileName.toLowerCase().includes(searchTerm)
            );
            updateHistoryDisplay(filteredHistory);
        }
        
        function formatTime(isoString) {
            const date = new Date(isoString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);
            
            if (diffMins < 1) return '⚡ just now';
            if (diffMins < 5) return '🔥 very recent';
            if (diffMins < 30) return \`🟢 \${diffMins}m ago\`;
            if (diffMins < 60) return \`🟡 \${diffMins}m ago\`;
            if (diffHours < 24) return \`🟠 \${diffHours}h ago\`;
            if (diffDays < 7) return \`🔴 \${diffDays}d ago\`;
            return \`📅 \${date.toLocaleDateString()}\`;
        }
        
        function getFileIcon(fileName) {
            const ext = fileName.split('.').pop()?.toLowerCase() || '';
            const iconMap = {
                'ts': '🟦', 'tsx': '🟦',
                'js': '🟨', 'jsx': '🟨', 'mjs': '🟨',
                'py': '🐍', 'pyw': '🐍',
                'java': '☕', 'class': '☕',
                'cpp': '⚙️', 'c': '⚙️', 'cc': '⚙️', 'cxx': '⚙️',
                'cs': '🔷', 'csproj': '🔷',
                'php': '🐘', 'phtml': '🐘',
                'rb': '💎', 'rake': '💎',
                'go': '🐹', 'mod': '🐹',
                'rs': '🦀', 'toml': '🦀',
                'swift': '🍎', 'playground': '🍎',
                'kt': '🎯', 'kts': '🎯',
                'dart': '🎯', 'pubspec': '🎯',
                'html': '🌐', 'htm': '🌐', 'xhtml': '🌐',
                'css': '🎨', 'scss': '🎨', 'sass': '🎨', 'less': '🎨',
                'vue': '💚', 'nuxt': '💚',
                'react': '⚛️', 'jsx': '⚛️',
                'json': '📦', 'jsonc': '📦',
                'xml': '📄', 'xsd': '📄', 'xsl': '📄',
                'md': '📝', 'markdown': '📝', 'mdx': '📝',
                'txt': '📄', 'log': '📄',
                'yml': '⚙️', 'yaml': '⚙️',
                'sql': '🗃️', 'db': '🗃️', 'sqlite': '🗃️',
                'sh': '🐚', 'bash': '🐚', 'zsh': '🐚',
                'ps1': '💙', 'psm1': '💙',
                'dockerfile': '🐳', 'docker': '🐳',
                'gitignore': '🚫', 'gitattributes': '🚫',
                'env': '🔐', 'config': '⚙️',
                'lock': '🔒', 'package-lock': '🔒'
            };
            return iconMap[ext] || '📄';
        }

        function createBookmarkCard(bookmark) {
            const fileIcon = getFileIcon(bookmark.fileName);
            return \`
                <div class="bookmark-item" onclick="navigateToBookmark('\${bookmark.id}')">
                    <div class="item-icon">\${fileIcon}</div>
                    <div class="item-content">
                        <div class="item-label">\${bookmark.label}</div>
                        <div class="item-details">
                            <span class="tag">Line \${bookmark.line}</span>
                            <span>\${bookmark.fileName}</span>
                            <span>\${formatTime(bookmark.timestamp)}</span>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="action-btn" onclick="event.stopPropagation(); deleteBookmark('\${bookmark.id}')" title="Delete Bookmark">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            \`;
        }

        function createHistoryCard(entry) {
            const fileIcon = getFileIcon(entry.fileName);
            return \`
                <div class="history-item" onclick="navigateToHistory(\${entry.index})">
                    <div class="item-icon">\${fileIcon}</div>
                    <div class="item-content">
                        <div class="item-label">\${entry.fileName}</div>
                        <div class="item-details">
                            <span class="tag">Line \${entry.line}</span>
                            <span>\${formatTime(entry.timestamp)}</span>
                        </div>
                    </div>
                </div>
            \`;
        }
        
        window.addEventListener('message', event => {
            const message = event.data;
            
            if (message.type === 'update') {
                allBookmarks = message.bookmarks;
                allHistory = message.history;
                updateBookmarksDisplay(allBookmarks);
                updateHistoryDisplay(allHistory);
                updateStats(allBookmarks.length, allHistory.length);
            }
        });
        
        function updateStats(bookmarkCount, historyCount) {
            document.getElementById('stats').style.display = 'grid';
            document.getElementById('bookmark-count').textContent = bookmarkCount;
            document.getElementById('history-count').textContent = historyCount;
        }

        function updateBookmarksDisplay(bookmarks) {
            const container = document.getElementById('bookmarks-container');
            
            if (bookmarks.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-icon">📚</div>
                        <div class="empty-title">No bookmarks found</div>
                        <div class="empty-subtitle">Start creating bookmarks to organize your important code locations</div>
                        <div class="empty-cta">Press Ctrl+Shift+B to add your first bookmark</div>
                    </div>
                \`;
                return;
            }
            
            container.innerHTML = bookmarks.map(createBookmarkCard).join('');
        }

        function updateHistoryDisplay(history) {
            const container = document.getElementById('history-container');
            
            if (history.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-icon">🕒</div>
                        <div class="empty-title">No navigation history</div>
                        <div class="empty-subtitle">Your recent file navigation will appear here automatically</div>
                    </div>
                \`;
                return;
            }
            
            container.innerHTML = history.slice(0, 15).map(createHistoryCard).join('');
        }
        
        // Auto-refresh every 30 seconds
        setInterval(() => {
            refresh();
        }, 30000);

        // Initialize search functionality
        document.addEventListener('DOMContentLoaded', function() {
            refresh();
        });
    </script>
</body>
</html>`;
    }
}
