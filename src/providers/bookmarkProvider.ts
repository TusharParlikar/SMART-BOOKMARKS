import * as vscode from 'vscode';
import { BookmarkManager, Bookmark } from '../managers/bookmarkManager';

export class BookmarkItem extends vscode.TreeItem {
    constructor(
        public readonly bookmark: Bookmark,
        public readonly id: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(bookmark.label, collapsibleState);
        
        // Clean, professional styling
        const shortFileName = this.getShortFileName(bookmark.fileName);
        const timeAgo = this.getTimeAgo(bookmark.timestamp);
        const fileExtension = this.getFileExtension(bookmark.fileName);
        
        // Professional label and description
        this.label = bookmark.label;
        this.description = `${shortFileName}:${bookmark.line} • ${timeAgo}`;
        
        // Clean, professional tooltip
        this.tooltip = new vscode.MarkdownString(`
**${bookmark.label}**

📁 ${shortFileName} (Line ${bookmark.line})  
🕒 ${bookmark.timestamp.toLocaleString()}  

*Click to navigate to this bookmark*
        `);
        
        // Enhanced context menu
        this.contextValue = 'bookmark';
        
        // Direct navigation command
        this.command = {
            command: 'vscode.open',
            title: 'Navigate to Bookmark',
            arguments: [
                bookmark.uri,
                { 
                    selection: new vscode.Range(bookmark.position, bookmark.position),
                    preview: false
                }
            ]
        };
        
        // Simple, professional icon with file type coloring
        this.iconPath = new vscode.ThemeIcon('bookmark', new vscode.ThemeColor('charts.blue'));
        
        // Add resource URI for better file handling
        this.resourceUri = bookmark.uri;
    }

    private getFileExtension(fileName: string): string {
        const lastDot = fileName.lastIndexOf('.');
        return lastDot > 0 ? fileName.substring(lastDot + 1).toLowerCase() : '';
    }

    private getTimeAgo(timestamp: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - timestamp.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return timestamp.toLocaleDateString();
    }

    private getShortFileName(fullPath: string): string {
        const fileName = fullPath.split(/[\\/]/).pop() || fullPath;
        return fileName;
    }
}

export class BookmarkProvider implements vscode.TreeDataProvider<BookmarkItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<BookmarkItem | undefined | null | void> = 
        new vscode.EventEmitter<BookmarkItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<BookmarkItem | undefined | null | void> = 
        this._onDidChangeTreeData.event;

    constructor(private bookmarkManager: BookmarkManager) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: BookmarkItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: BookmarkItem): Promise<BookmarkItem[]> {
        if (!element) {
            const bookmarks = await this.bookmarkManager.getBookmarks();
            
            if (bookmarks.length === 0) {
                return [];
            }

            // Sort bookmarks by timestamp (newest first) for better UX
            const sortedBookmarks = bookmarks.sort((a, b) => 
                b.timestamp.getTime() - a.timestamp.getTime()
            );

            // Create clean, professional list
            return sortedBookmarks.map(bookmark => 
                new BookmarkItem(bookmark, bookmark.id, vscode.TreeItemCollapsibleState.None)
            );
        }
        return [];
    }
}
