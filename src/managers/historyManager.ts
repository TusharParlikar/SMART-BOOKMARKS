import * as vscode from 'vscode';

export interface HistoryEntry {
    uri: vscode.Uri;
    position: vscode.Position;
    fileName: string;
    line: number;
    timestamp: Date;
}

export class HistoryManager {
    private static readonly STORAGE_KEY = 'smartBookmarks.history';
    private history: HistoryEntry[] = [];
    private maxSize: number;

    constructor(private context: vscode.ExtensionContext) {
        this.maxSize = vscode.workspace.getConfiguration('smartBookmarks').get('maxHistorySize', 100);
        this.loadHistory();
    }

    addHistoryEntry(uri: vscode.Uri, position: vscode.Position): void {
        // Avoid duplicate consecutive entries
        const lastEntry = this.history[this.history.length - 1];
        if (lastEntry && 
            lastEntry.uri.toString() === uri.toString() && 
            lastEntry.position.line === position.line &&
            lastEntry.position.character === position.character) {
            return;
        }

        const entry: HistoryEntry = {
            uri,
            position,
            fileName: this.getFileName(uri),
            line: position.line + 1,
            timestamp: new Date()
        };

        this.history.push(entry);

        // Trim to max size
        if (this.history.length > this.maxSize) {
            this.history = this.history.slice(-this.maxSize);
        }

        this.saveHistory();
    }

    async getHistory(): Promise<HistoryEntry[]> {
        return [...this.history].reverse(); // Most recent first
    }

    async clearHistory(): Promise<void> {
        this.history = [];
        await this.saveHistory();
    }

    private getFileName(uri: vscode.Uri): string {
        return uri.fsPath.split('/').pop() || uri.fsPath.split('\\').pop() || 'Unknown';
    }

    private async loadHistory(): Promise<void> {
        try {
            const stored = this.context.globalState.get<any[]>(HistoryManager.STORAGE_KEY, []);
            this.history = stored.map(item => ({
                ...item,
                uri: vscode.Uri.parse(item.uri),
                position: new vscode.Position(item.position.line, item.position.character),
                timestamp: new Date(item.timestamp)
            }));
        } catch (error) {
            console.error('Failed to load history:', error);
            this.history = [];
        }
    }

    private async saveHistory(): Promise<void> {
        try {
            const toStore = this.history.map(entry => ({
                ...entry,
                uri: entry.uri.toString(),
                position: {
                    line: entry.position.line,
                    character: entry.position.character
                }
            }));
            await this.context.globalState.update(HistoryManager.STORAGE_KEY, toStore);
        } catch (error) {
            console.error('Failed to save history:', error);
        }
    }
}
