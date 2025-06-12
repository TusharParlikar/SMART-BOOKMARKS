import * as vscode from 'vscode';
import { HistoryManager, HistoryEntry } from '../managers/historyManager';

export class HistoryItem extends vscode.TreeItem {
    constructor(
        public readonly entry: HistoryEntry,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(entry.fileName, collapsibleState);
        
        // Clean, professional styling
        const shortFileName = this.getShortFileName(entry.fileName);
        const timeAgo = this.getTimeAgo(entry.timestamp);
        
        // Professional label and description  
        this.label = shortFileName;
        this.description = `Line ${entry.line} • ${timeAgo}`;
        
        // Clean, professional tooltip
        this.tooltip = new vscode.MarkdownString(`
**${shortFileName}** (Line ${entry.line})

🕒 Visited ${entry.timestamp.toLocaleString()}  
⏱️ ${timeAgo}  

*Click to navigate back to this location*
        `);
        
        // Navigation command
        this.command = {
            command: 'vscode.open',
            title: 'Navigate to History Entry',
            arguments: [
                entry.uri,
                { 
                    selection: new vscode.Range(entry.position, entry.position),
                    preview: false
                }
            ]
        };
        
        // Simple, clean icon with time-based coloring
        const isRecent = Date.now() - entry.timestamp.getTime() < 300000; // 5 minutes
        const iconColor = isRecent ? 'charts.orange' : 'charts.blue';
        this.iconPath = new vscode.ThemeIcon('history', new vscode.ThemeColor(iconColor));
        
        // Add resource URI
        this.resourceUri = entry.uri;
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

export class HistoryProvider implements vscode.TreeDataProvider<HistoryItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<HistoryItem | undefined | null | void> = 
        new vscode.EventEmitter<HistoryItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<HistoryItem | undefined | null | void> = 
        this._onDidChangeTreeData.event;

    constructor(private historyManager: HistoryManager) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: HistoryItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: HistoryItem): Promise<HistoryItem[]> {
        if (!element) {
            const history = await this.historyManager.getHistory();
            
            if (history.length === 0) {
                return [];
            }

            // Sort by timestamp (newest first) and limit to recent entries
            const sortedHistory = history
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, 15); // Show only 15 most recent entries

            // Create clean, professional list
            return sortedHistory.map(entry => 
                new HistoryItem(entry, vscode.TreeItemCollapsibleState.None)
            );
        }
        return [];
    }
}
