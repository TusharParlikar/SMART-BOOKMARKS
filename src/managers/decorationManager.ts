import * as vscode from 'vscode';
import { Bookmark } from './bookmarkManager';

export class BookmarkDecorationManager {
    private decorationType: vscode.TextEditorDecorationType;
    private activeDecorations: Map<string, vscode.Range[]> = new Map();

    constructor() {        this.decorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
            border: '1px solid',
            borderColor: new vscode.ThemeColor('charts.yellow'),
            borderRadius: '3px',
            isWholeLine: false,
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
            overviewRulerColor: new vscode.ThemeColor('charts.yellow'),
            overviewRulerLane: vscode.OverviewRulerLane.Right
        });
    }

    updateBookmarkDecorations(bookmarks: Bookmark[]) {
        // Clear existing decorations
        this.activeDecorations.clear();
        
        // Group bookmarks by file
        const bookmarksByFile = new Map<string, Bookmark[]>();
        for (const bookmark of bookmarks) {
            const fileKey = bookmark.uri.toString();
            if (!bookmarksByFile.has(fileKey)) {
                bookmarksByFile.set(fileKey, []);
            }
            bookmarksByFile.get(fileKey)!.push(bookmark);
        }

        // Apply decorations to each file
        for (const [fileUri, fileBookmarks] of bookmarksByFile) {
            const ranges = fileBookmarks.map(bookmark => 
                new vscode.Range(bookmark.position, bookmark.position)
            );
            this.activeDecorations.set(fileUri, ranges);
        }

        // Update visible editors
        this.updateVisibleEditors();
    }

    private updateVisibleEditors() {
        for (const editor of vscode.window.visibleTextEditors) {
            const fileKey = editor.document.uri.toString();
            const ranges = this.activeDecorations.get(fileKey) || [];
            editor.setDecorations(this.decorationType, ranges);
        }
    }

    onDidChangeActiveEditor(editor: vscode.TextEditor | undefined) {
        if (editor) {
            const fileKey = editor.document.uri.toString();
            const ranges = this.activeDecorations.get(fileKey) || [];
            editor.setDecorations(this.decorationType, ranges);
        }
    }

    dispose() {
        this.decorationType.dispose();
        this.activeDecorations.clear();
    }
}
