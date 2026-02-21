import * as vscode from "vscode";
import { ComponentUtils } from "./componentUtils";

export class ComponentHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    console.log(
      `Hover requested at line ${position.line}, character ${position.character}`
    );

    const line = document.lineAt(position.line).text;
    const componentInfo = ComponentUtils.extractComponentInfo(
      line,
      position.character
    );

    if (!componentInfo) {
      console.log("No component info found for hover");
      return null;
    }

    console.log("Creating hover for component:", componentInfo);

    const componentTypeName = this.getComponentTypeName(componentInfo.type);
    const hoverText = new vscode.MarkdownString();
    hoverText.appendMarkdown(`**${componentTypeName}**\n\n`);
    
    // Show namespace if present
    if (componentInfo.namespace) {
      hoverText.appendMarkdown(`*Namespace:* \`${componentInfo.namespace}\`\n\n`);
    }
    
    // Show class name for class-based references
    if (componentInfo.className) {
      hoverText.appendCodeblock(`${componentInfo.className}`, "php");
    } else {
      hoverText.appendCodeblock(`${componentInfo.name}`, "php");
    }
    hoverText.appendMarkdown("\n\n**Ctrl+Click** to go to definition");

    const range = new vscode.Range(
      position.line,
      componentInfo.startIndex,
      position.line,
      componentInfo.endIndex
    );

    return new vscode.Hover(hoverText, range);
  }

  private getComponentTypeName(type: string): string {
    switch (type) {
      case "blade":
        return "Blade Component";
      case "flux":
        return "Flux Component";
      case "livewire":
      case "livewire-tag":
        return "Livewire Component";
      case "livewire-class":
        return "Livewire Component (Class)";
      case "include":
        return "Include";
      case "extends":
        return "Layout";
      case "volt":
        return "Volt";
      case "layout":
        return "Livewire Layout";
      case "route-livewire-class":
        return "Livewire Route (Class)";
      case "route-livewire-string":
        return "Livewire Route";
      default:
        return "Component";
    }
  }
}
