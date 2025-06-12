import * as vscode from 'vscode';

export interface Bookmark {
    id: string;
    uri: vscode.Uri;
    position: vscode.Position;
    label: string;
    fileName: string;
    line: number;
    timestamp: Date;
}

export class BookmarkManager {
    private static readonly STORAGE_KEY = 'smartBookmarks.bookmarks';
    private bookmarks: Bookmark[] = [];

    constructor(private context: vscode.ExtensionContext) {
        this.loadBookmarks();
    }

    async addBookmark(uri: vscode.Uri, position: vscode.Position, label: string): Promise<void> {
        const bookmark: Bookmark = {
            id: this.generateId(),
            uri,
            position,
            label,
            fileName: this.getFileName(uri),
            line: position.line + 1,
            timestamp: new Date()
        };

        this.bookmarks.push(bookmark);
        await this.saveBookmarks();
    }

    async removeBookmark(id: string): Promise<void> {
        this.bookmarks = this.bookmarks.filter(b => b.id !== id);
        await this.saveBookmarks();
    }

    async clearAll(): Promise<void> {
        this.bookmarks = [];
        await this.saveBookmarks();
    }

    async getBookmarks(): Promise<Bookmark[]> {
        return [...this.bookmarks];
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    private getFileName(uri: vscode.Uri): string {
        return uri.fsPath.split('/').pop() || uri.fsPath.split('\\').pop() || 'Unknown';
    }

    private async loadBookmarks(): Promise<void> {
        try {
            const stored = this.context.globalState.get<any[]>(BookmarkManager.STORAGE_KEY, []);
            this.bookmarks = stored.map(item => ({
                ...item,
                uri: vscode.Uri.parse(item.uri),
                position: new vscode.Position(item.position.line, item.position.character),
                timestamp: new Date(item.timestamp)
            }));
        } catch (error) {
            console.error('Failed to load bookmarks:', error);
            this.bookmarks = [];
        }
    }

    private async saveBookmarks(): Promise<void> {
        try {
            const toStore = this.bookmarks.map(bookmark => ({
                ...bookmark,
                uri: bookmark.uri.toString(),
                position: {
                    line: bookmark.position.line,
                    character: bookmark.position.character
                }
            }));
            await this.context.globalState.update(BookmarkManager.STORAGE_KEY, toStore);
        } catch (error) {
            console.error('Failed to save bookmarks:', error);
        }
    }
}
