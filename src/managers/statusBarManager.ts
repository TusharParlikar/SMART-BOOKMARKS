import * as vscode from 'vscode';
import { BookmarkManager } from './bookmarkManager';

export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;
    
    constructor(private bookmarkManager: BookmarkManager) {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, 
            100
        );
        this.statusBarItem.command = 'smartBookmarks.goToBookmark';
        this.statusBarItem.show();
        this.updateStatusBar();
    }

    async updateStatusBar() {
        try {
            const bookmarks = await this.bookmarkManager.getBookmarks();
            const count = bookmarks.length;
            
            if (count === 0) {
                this.statusBarItem.text = '$(bookmark) No Bookmarks';
                this.statusBarItem.tooltip = 'Click to add your first bookmark (Ctrl+Shift+B)';
                this.statusBarItem.command = 'smartBookmarks.addBookmark';
            } else {
                this.statusBarItem.text = `$(bookmark) ${count} Bookmark${count > 1 ? 's' : ''}`;
                this.statusBarItem.tooltip = 'Click to navigate to bookmarks (Ctrl+Shift+G)';
                this.statusBarItem.command = 'smartBookmarks.goToBookmark';
            }
        } catch (error) {
            this.statusBarItem.text = '$(bookmark) Bookmarks';
            this.statusBarItem.tooltip = 'Smart Bookmarks';
        }
    }

    showMessage(message: string, timeout: number = 3000) {
        const originalText = this.statusBarItem.text;
        this.statusBarItem.text = message;
        
        setTimeout(() => {
            this.statusBarItem.text = originalText;
        }, timeout);
    }

    dispose() {
        this.statusBarItem.dispose();
    }
}
