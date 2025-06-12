import * as vscode from 'vscode';
import { BookmarkProvider, BookmarkItem } from './providers/bookmarkProvider';
import { HistoryProvider } from './providers/historyProvider';
import { BookmarkWebviewProvider } from './providers/webviewProvider';
import { BookmarkManager, Bookmark } from './managers/bookmarkManager';
import { HistoryManager, HistoryEntry } from './managers/historyManager';
import { BookmarkDecorationManager } from './managers/decorationManager';
import { StatusBarManager } from './managers/statusBarManager';

export function activate(context: vscode.ExtensionContext) {
    console.log('🎨 Smart Bookmarks extension is now active!');

    // Initialize managers
    const bookmarkManager = new BookmarkManager(context);
    const historyManager = new HistoryManager(context);
    const decorationManager = new BookmarkDecorationManager();
    const statusBarManager = new StatusBarManager(bookmarkManager);

    // Initialize providers
    const bookmarkProvider = new BookmarkProvider(bookmarkManager);
    const historyProvider = new HistoryProvider(historyManager);
    const webviewProvider = new BookmarkWebviewProvider(
        vscode.Uri.joinPath(context.extensionUri, 'media'),
        bookmarkManager,
        historyManager
    );

    // Register tree data providers
    const bookmarksTree = vscode.window.createTreeView('bookmarksList', {
        treeDataProvider: bookmarkProvider,
        showCollapseAll: true
    });

    const historyTree = vscode.window.createTreeView('historyView', {
        treeDataProvider: historyProvider,
        showCollapseAll: true
    });

    // Register webview provider
    const webviewProviderDisposable = vscode.window.registerWebviewViewProvider(
        BookmarkWebviewProvider.viewType,
        webviewProvider
    );

    // Register commands
    const commands = [
        vscode.commands.registerCommand('smartBookmarks.addBookmark', async () => {
            await addBookmark(bookmarkManager, bookmarkProvider, decorationManager, statusBarManager, webviewProvider);
        }),

        vscode.commands.registerCommand('smartBookmarks.removeBookmark', async (item: BookmarkItem) => {
            await removeBookmark(bookmarkManager, bookmarkProvider, item, decorationManager, statusBarManager, webviewProvider);
        }),

        vscode.commands.registerCommand('smartBookmarks.clearAll', async () => {
            await clearAllBookmarks(bookmarkManager, bookmarkProvider, decorationManager, statusBarManager, webviewProvider);
        }),

        vscode.commands.registerCommand('smartBookmarks.goToBookmark', async () => {
            await goToBookmark(bookmarkManager);
        }),

        vscode.commands.registerCommand('smartBookmarks.showHistory', async () => {
            await showHistory(historyManager);
        }),

        vscode.commands.registerCommand('smartBookmarks.refreshBookmarks', async () => {
            await refreshBookmarks(bookmarkProvider, historyProvider, webviewProvider);
        }),

        vscode.commands.registerCommand('smartBookmarks.exportBookmarks', async () => {
            await exportBookmarks(bookmarkManager);
        }),

        vscode.commands.registerCommand('smartBookmarks.importBookmarks', async () => {
            await importBookmarks(bookmarkManager, bookmarkProvider, decorationManager, webviewProvider);
        })
    ];    // Register event listeners
    const listeners = [
        // Auto-save last activity position when files are closed
        vscode.workspace.onDidCloseTextDocument(async (document) => {
            await saveLastActivityBookmark(document, bookmarkManager, bookmarkProvider, webviewProvider);
        }),

        // Track editor changes and cursor position
        vscode.window.onDidChangeActiveTextEditor(async (editor) => {
            if (editor) {
                // Update last position for this file
                await updateLastActivityPosition(editor, bookmarkManager);
                historyManager.addHistoryEntry(editor.document.uri, editor.selection.active);
                historyProvider.refresh();
                decorationManager.onDidChangeActiveEditor(editor);
            }
        }),

        // Track cursor movement within files
        vscode.window.onDidChangeTextEditorSelection((event) => {
            const editor = event.textEditor;
            if (editor && event.selections.length > 0) {
                // Update last activity position for auto-save
                updateLastActivityPosition(editor, bookmarkManager);
                historyManager.addHistoryEntry(editor.document.uri, event.selections[0].active);
            }
        })
    ];

    // Update context for view visibility
    updateContext(bookmarkManager);
    
    // Initialize decorations for existing bookmarks
    bookmarkManager.getBookmarks().then((bookmarks: Bookmark[]) => {
        decorationManager.updateBookmarkDecorations(bookmarks);
    });

    // Add to subscriptions
    context.subscriptions.push(
        ...commands, 
        ...listeners, 
        decorationManager, 
        statusBarManager,
        webviewProviderDisposable,
        bookmarksTree,
        historyTree
    );
}

// Command implementations
async function addBookmark(
    manager: BookmarkManager, 
    provider: BookmarkProvider, 
    decorationManager: BookmarkDecorationManager, 
    statusBarManager: StatusBarManager,
    webviewProvider: BookmarkWebviewProvider
) {
    try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('⚠️ No active editor to bookmark. Please open a file first.');
            return;
        }

        const defaultLabel = generateDefaultLabel(editor);
        
        const label = await vscode.window.showInputBox({
            prompt: '🏷️ Enter bookmark label (or press Enter for default)',
            value: defaultLabel,
            placeHolder: 'e.g., "Important function", "Bug fix location", "TODO item"',
            valueSelection: [0, defaultLabel.length],
            validateInput: (text) => {
                if (text && text.length > 100) {
                    return 'Label is too long (max 100 characters)';
                }
                return null;
            }
        });        if (label !== undefined) {
            const finalLabel = label.trim() || defaultLabel;
            await manager.addBookmark(
                editor.document.uri,
                editor.selection.active,
                finalLabel
            );
            
            // Refresh all views
            provider.refresh();
            webviewProvider.refresh();
            updateContext(manager);
            
            // Update decorations
            const bookmarks = await manager.getBookmarks();
            decorationManager.updateBookmarkDecorations(bookmarks);
            statusBarManager.updateStatusBar();
            
            // Show success message with bookmark details
            const message = `✅ Bookmark "${finalLabel}" added!`;
            const action = await vscode.window.showInformationMessage(
                message, 
                'Go to Bookmarks', 
                'Add Another'
            );
            
            if (action === 'Go to Bookmarks') {
                vscode.commands.executeCommand('smartBookmarks.goToBookmark');
            } else if (action === 'Add Another') {
                vscode.commands.executeCommand('smartBookmarks.addBookmark');
            }
        }
    } catch (error) {
        vscode.window.showErrorMessage(`❌ Failed to add bookmark: ${error}`);
    }
}

async function removeBookmark(
    manager: BookmarkManager, 
    provider: BookmarkProvider, 
    item: BookmarkItem, 
    decorationManager: BookmarkDecorationManager, 
    statusBarManager: StatusBarManager,
    webviewProvider: BookmarkWebviewProvider
) {
    try {
        await manager.removeBookmark(item.id);
        
        // Refresh all views
        provider.refresh();
        webviewProvider.refresh();
        updateContext(manager);
        
        // Update decorations
        const bookmarks = await manager.getBookmarks();
        decorationManager.updateBookmarkDecorations(bookmarks);
        statusBarManager.updateStatusBar();
        
        const action = await vscode.window.showInformationMessage(
            `🗑️ Bookmark "${item.bookmark.label}" removed!`,
            'Undo',
            'Clear All'
        );
        
        if (action === 'Undo') {
            // Re-add the bookmark
            await manager.addBookmark(
                item.bookmark.uri,
                item.bookmark.position,
                item.bookmark.label
            );
            provider.refresh();
            webviewProvider.refresh();
            updateContext(manager);
            const restoredBookmarks = await manager.getBookmarks();
            decorationManager.updateBookmarkDecorations(restoredBookmarks);
            statusBarManager.updateStatusBar();
            vscode.window.showInformationMessage(`↩️ Bookmark "${item.bookmark.label}" restored!`);
        } else if (action === 'Clear All') {
            vscode.commands.executeCommand('smartBookmarks.clearAll');
        }
    } catch (error) {
        vscode.window.showErrorMessage(`❌ Failed to remove bookmark: ${error}`);
    }
}

async function clearAllBookmarks(
    manager: BookmarkManager, 
    provider: BookmarkProvider, 
    decorationManager: BookmarkDecorationManager, 
    statusBarManager: StatusBarManager,
    webviewProvider: BookmarkWebviewProvider
) {
    try {
        const bookmarks = await manager.getBookmarks();
        const count = bookmarks.length;
        
        if (count === 0) {
            vscode.window.showInformationMessage('📚 No bookmarks to clear.');
            return;
        }
        
        const result = await vscode.window.showWarningMessage(
            `🗑️ Are you sure you want to clear all ${count} bookmark${count > 1 ? 's' : ''}?`,
            { modal: true },
            'Yes, Clear All',
            'No, Keep Them'
        );

        if (result === 'Yes, Clear All') {
            await manager.clearAll();
            
            // Refresh all views
            provider.refresh();
            webviewProvider.refresh();
            updateContext(manager);
            decorationManager.updateBookmarkDecorations([]);
            statusBarManager.updateStatusBar();
            
            vscode.window.showInformationMessage(`✅ All ${count} bookmark${count > 1 ? 's' : ''} cleared!`);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`❌ Failed to clear bookmarks: ${error}`);
    }
}

async function goToBookmark(manager: BookmarkManager) {
    try {
        const bookmarks = await manager.getBookmarks();
        if (bookmarks.length === 0) {
            vscode.window.showInformationMessage('📚 No bookmarks found. Create one with Ctrl+Shift+B!');
            return;
        }

        interface BookmarkQuickPickItem extends vscode.QuickPickItem {
            bookmark: Bookmark;
        }

        const items: BookmarkQuickPickItem[] = bookmarks.map((bookmark: Bookmark) => ({
            label: `$(bookmark) ${bookmark.label}`,
            description: `${bookmark.fileName}:${bookmark.line}`,
            detail: `Created: ${bookmark.timestamp.toLocaleString()}`,
            bookmark
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: '🔍 Select a bookmark to navigate to',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (selected) {
            await navigateToBookmark(selected.bookmark);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`❌ Failed to navigate to bookmark: ${error}`);
    }
}

async function showHistory(manager: HistoryManager) {
    try {
        const history = await manager.getHistory();
        if (history.length === 0) {
            vscode.window.showInformationMessage('🕒 No navigation history found. Navigate between files to build history!');
            return;
        }

        interface HistoryQuickPickItem extends vscode.QuickPickItem {
            entry: HistoryEntry;
        }

        const items: HistoryQuickPickItem[] = history.map((entry: HistoryEntry) => ({
            label: `$(history) ${entry.fileName}`,
            description: `Line ${entry.line}`,
            detail: `${entry.timestamp.toLocaleString()}`,
            entry
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: '🕒 Select a history entry to navigate to',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (selected) {
            await navigateToPosition(selected.entry.uri, selected.entry.position);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`❌ Failed to show history: ${error}`);
    }
}

async function refreshBookmarks(
    bookmarkProvider: BookmarkProvider, 
    historyProvider: HistoryProvider,
    webviewProvider: BookmarkWebviewProvider
) {
    try {
        bookmarkProvider.refresh();
        historyProvider.refresh();
        webviewProvider.refresh();
        vscode.window.showInformationMessage('🔄 Bookmarks and history refreshed!');
    } catch (error) {
        vscode.window.showErrorMessage(`❌ Failed to refresh: ${error}`);
    }
}

async function exportBookmarks(manager: BookmarkManager) {
    try {
        const bookmarks = await manager.getBookmarks();
        if (bookmarks.length === 0) {
            vscode.window.showInformationMessage('📚 No bookmarks to export.');
            return;
        }

        const exportData = {
            version: "1.0.0",
            timestamp: new Date().toISOString(),
            bookmarks: bookmarks.map((bookmark: Bookmark) => ({
                label: bookmark.label,
                fileName: bookmark.fileName,
                line: bookmark.line,
                uri: bookmark.uri.toString(),
                position: {
                    line: bookmark.position.line,
                    character: bookmark.position.character
                },
                timestamp: bookmark.timestamp.toISOString()
            }))
        };

        const defaultFileName = `bookmarks-export-${new Date().toISOString().split('T')[0]}.json`;
        
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(defaultFileName),
            filters: {
                'JSON Files': ['json'],
                'All Files': ['*']
            },
            saveLabel: 'Export Bookmarks'
        });

        if (saveUri) {
            const content = JSON.stringify(exportData, null, 2);
            await vscode.workspace.fs.writeFile(saveUri, Buffer.from(content, 'utf8'));
            
            const action = await vscode.window.showInformationMessage(
                `✅ Exported ${bookmarks.length} bookmark${bookmarks.length > 1 ? 's' : ''} to ${saveUri.fsPath}`,
                'Open File',
                'Open Folder'
            );
            
            if (action === 'Open File') {
                vscode.commands.executeCommand('vscode.open', saveUri);
            } else if (action === 'Open Folder') {
                vscode.commands.executeCommand('revealFileInOS', saveUri);
            }
        }
    } catch (error) {
        vscode.window.showErrorMessage(`❌ Failed to export bookmarks: ${error}`);
    }
}

async function importBookmarks(
    manager: BookmarkManager, 
    provider: BookmarkProvider, 
    decorationManager: BookmarkDecorationManager,
    webviewProvider: BookmarkWebviewProvider
) {
    try {
        const openUri = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'JSON Files': ['json'],
                'All Files': ['*']
            },
            openLabel: 'Import Bookmarks'
        });

        if (!openUri || openUri.length === 0) {
            return;
        }

        const fileContent = await vscode.workspace.fs.readFile(openUri[0]);
        const importData = JSON.parse(fileContent.toString());

        if (!importData.bookmarks || !Array.isArray(importData.bookmarks)) {
            vscode.window.showErrorMessage('❌ Invalid bookmark file format.');
            return;
        }

        let importedCount = 0;
        for (const bookmarkData of importData.bookmarks) {
            try {
                const uri = vscode.Uri.parse(bookmarkData.uri);
                const position = new vscode.Position(
                    bookmarkData.position.line,
                    bookmarkData.position.character
                );
                
                await manager.addBookmark(uri, position, bookmarkData.label);
                importedCount++;
            } catch (error) {
                console.warn('Failed to import bookmark:', bookmarkData, error);
            }
        }

        // Refresh all views
        provider.refresh();
        webviewProvider.refresh();
        updateContext(manager);
        
        // Update decorations
        const bookmarks = await manager.getBookmarks();
        decorationManager.updateBookmarkDecorations(bookmarks);
        
        vscode.window.showInformationMessage(
            `✅ Imported ${importedCount} bookmark${importedCount > 1 ? 's' : ''} successfully!`
        );
    } catch (error) {
        vscode.window.showErrorMessage(`❌ Failed to import bookmarks: ${error}`);
    }
}

// Helper functions
function generateDefaultLabel(editor: vscode.TextEditor): string {
    const fileName = editor.document.fileName.split('/').pop() || editor.document.fileName.split('\\').pop() || 'Unknown';
    const line = editor.selection.active.line + 1;
    return `${fileName}:${line}`;
}

async function navigateToBookmark(bookmark: Bookmark) {
    await navigateToPosition(bookmark.uri, bookmark.position);
}

async function navigateToPosition(uri: vscode.Uri, position: vscode.Position) {
    try {
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);
        
        // Highlight the line temporarily
        const range = new vscode.Range(position, position);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        
        // Add temporary highlight decoration
        const decorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
            border: '2px solid',
            borderColor: new vscode.ThemeColor('editor.findMatchBorder'),
            borderRadius: '3px'
        });
        
        const lineRange = document.lineAt(position.line).range;
        editor.setDecorations(decorationType, [lineRange]);
        
        // Remove highlight after 2 seconds
        setTimeout(() => {
            decorationType.dispose();
        }, 2000);
        
        // Show status bar message
        vscode.window.setStatusBarMessage(
            `📍 Navigated to ${document.fileName.split(/[\\/]/).pop()}:${position.line + 1}`,
            3000
        );
        
    } catch (error) {
        vscode.window.showErrorMessage(`❌ Failed to navigate: ${error}`);
    }
}

// Auto-save last activity bookmark functionality
const lastActivityPositions = new Map<string, vscode.Position>();

async function saveLastActivityBookmark(
    document: vscode.TextDocument, 
    manager: BookmarkManager, 
    provider: BookmarkProvider,
    webviewProvider: BookmarkWebviewProvider
) {
    try {
        // Skip untitled documents and certain file types
        if (document.isUntitled || 
            document.uri.scheme !== 'file' ||
            document.fileName.endsWith('.git') ||
            document.fileName.includes('node_modules')) {
            return;
        }

        const lastPosition = lastActivityPositions.get(document.uri.toString());
        if (!lastPosition) {
            return; // No last position recorded
        }

        // Check if we already have a recent "Last Activity" bookmark for this file
        const existingBookmarks = await manager.getBookmarks();
        const fileName = document.fileName.split(/[\\/]/).pop() || 'Unknown';
        const lastActivityPattern = /^🔄 Last Activity:/;
        
        // Remove old last activity bookmarks for this file (keep only the most recent)
        const oldLastActivityBookmarks = existingBookmarks.filter(bookmark => 
            bookmark.uri.toString() === document.uri.toString() && 
            lastActivityPattern.test(bookmark.label)
        );
        
        for (const oldBookmark of oldLastActivityBookmarks) {
            await manager.removeBookmark(oldBookmark.id);
        }

        // Create new last activity bookmark
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const label = `🔄 Last Activity: ${fileName} (${timestamp})`;
        
        await manager.addBookmark(document.uri, lastPosition, label);
        
        // Refresh views
        provider.refresh();
        webviewProvider.refresh();
        
        // Show subtle notification
        vscode.window.setStatusBarMessage(
            `💾 Last activity saved for ${fileName}`, 
            2000
        );
        
        // Clean up the position tracking
        lastActivityPositions.delete(document.uri.toString());
        
    } catch (error) {
        console.error('Failed to save last activity bookmark:', error);
    }
}

async function updateLastActivityPosition(
    editor: vscode.TextEditor,
    manager: BookmarkManager
) {
    try {
        // Store the current cursor position for this file
        if (editor && editor.document && !editor.document.isUntitled) {
            lastActivityPositions.set(
                editor.document.uri.toString(), 
                editor.selection.active
            );
        }
    } catch (error) {
        console.error('Failed to update last activity position:', error);
    }
}

function updateContext(manager: BookmarkManager) {
    manager.getBookmarks().then((bookmarks: Bookmark[]) => {
        vscode.commands.executeCommand('setContext', 'smartBookmarks.hasBookmarks', bookmarks.length > 0);
    });
}

export function deactivate() {
    console.log('🎨 Smart Bookmarks extension is now deactivated');
}
