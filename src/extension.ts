import * as vscode from 'vscode';
import { ComponentHoverProvider } from './hoverProvider';
import { ComponentDefinitionProvider } from './definitionProvider';
import { ComponentDocumentLinkProvider } from './documentLinkProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Laravel Component Navigator extension is now active!');
    
    const selector: vscode.DocumentSelector = [
        { scheme: 'file', language: 'php' },
        { scheme: 'file', language: 'blade' },
        { scheme: 'file', pattern: '**/*.blade.php' },
        { scheme: 'file', pattern: '**/*.php' },
        { scheme: 'file', pattern: '**/routes/*.php' },
        { scheme: 'file', pattern: '**/web.php' },
        { scheme: 'file', pattern: '**/api.php' }
    ];

    const hoverProvider = vscode.languages.registerHoverProvider(selector, new ComponentHoverProvider());
    const definitionProvider = vscode.languages.registerDefinitionProvider(selector, new ComponentDefinitionProvider());
    const linkProvider = vscode.languages.registerDocumentLinkProvider(selector, new ComponentDocumentLinkProvider());

    context.subscriptions.push(hoverProvider, definitionProvider, linkProvider);
}

export function deactivate() {}