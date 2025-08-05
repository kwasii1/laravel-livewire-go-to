import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export class ComponentDocumentLinkProvider
  implements vscode.DocumentLinkProvider
{
  provideDocumentLinks(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.DocumentLink[]> {
    const links: vscode.DocumentLink[] = [];
    const text = document.getText();
    const lines = text.split("\n");

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];

      const patterns = [
        {
          regex: /<x-([a-zA-Z0-9\-_.]+)/g,
          type: "blade" as const,
          getRange: (match: RegExpExecArray, lineIndex: number) => {
            const startCol = match.index! + 1;
            const endCol = match.index! + match[0].length;
            return new vscode.Range(lineIndex, startCol, lineIndex, endCol);
          },
        },
        {
          regex: /<flux:([a-zA-Z0-9\-_.]+)/g,
          type: "flux" as const,
          getRange: (match: RegExpExecArray, lineIndex: number) => {
            const startCol = match.index! + 1;
            const endCol = match.index! + match[0].length;
            return new vscode.Range(lineIndex, startCol, lineIndex, endCol);
          },
        },
        {
          regex: /@livewire\s*\(\s*['"]([^'"]+)['"]/g,
          type: "livewire" as const,
          getRange: (match: RegExpExecArray, lineIndex: number) => {
            const fullMatch = match[0];
            const componentName = match[1];
            const quoteStart = fullMatch.indexOf(componentName);
            const startCol = match.index! + quoteStart;
            const endCol = startCol + componentName.length;
            return new vscode.Range(lineIndex, startCol, lineIndex, endCol);
          },
        },
        {
          regex: /<livewire:([a-zA-Z0-9\-_.]+)/g,
          type: "livewire-tag" as const,
          getRange: (match: RegExpExecArray, lineIndex: number) => {
            const startCol = match.index! + 1;
            const endCol = match.index! + match[0].length;
            return new vscode.Range(lineIndex, startCol, lineIndex, endCol);
          },
        },
        {
          regex: /@include\s*\(\s*['"]([^'"]+)['"]/g,
          type: "include" as const,
          getRange: (match: RegExpExecArray, lineIndex: number) => {
            const fullMatch = match[0];
            const includeName = match[1];
            const quoteStart = fullMatch.indexOf(includeName);
            const startCol = match.index! + quoteStart;
            const endCol = startCol + includeName.length;
            return new vscode.Range(lineIndex, startCol, lineIndex, endCol);
          },
        },
        {
          regex: /@extends\s*\(\s*['"]([^'"]+)['"]/g,
          type: "extends" as const,
          getRange: (match: RegExpExecArray, lineIndex: number) => {
            const fullMatch = match[0];
            const layoutName = match[1];
            const quoteStart = fullMatch.indexOf(layoutName);
            const startCol = match.index! + quoteStart;
            const endCol = startCol + layoutName.length;
            return new vscode.Range(lineIndex, startCol, lineIndex, endCol);
          },
        },
        {
          regex:
            /Volt::route\s*\(\s*['"][^'"]*['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g,
          type: "volt" as const,
          getRange: (match: RegExpExecArray, lineIndex: number) => {
            const fullMatch = match[0];
            const componentName = match[1];

            const firstQuoteEnd = fullMatch.indexOf(
              "'",
              fullMatch.indexOf("'") + 1
            );
            const secondQuoteStart = fullMatch.indexOf("'", firstQuoteEnd + 1);
            const componentStart = fullMatch.indexOf(
              componentName,
              secondQuoteStart
            );
            const startCol = match.index! + componentStart;
            const endCol = startCol + componentName.length;
            return new vscode.Range(lineIndex, startCol, lineIndex, endCol);
          },
        },

        {
          regex: /@livewire\s*\(\s*([A-Z][a-zA-Z0-9\\]*?)::class/g,
          type: "livewire-directive-class" as const,
          getRange: (match: RegExpExecArray, lineIndex: number) => {
            const className = match[1];
            const classStart = match[0].indexOf(className);
            const startCol = match.index! + classStart;
            const endCol = startCol + className.length;
            return new vscode.Range(lineIndex, startCol, lineIndex, endCol);
          },
        },
      ];

      for (const pattern of patterns) {
        let match: RegExpExecArray | null;
        pattern.regex.lastIndex = 0;

        while ((match = pattern.regex.exec(line)) !== null) {
          try {
            const range = pattern.getRange(match, lineIndex);
            const link = new vscode.DocumentLink(range);
            link.tooltip = `Go to component: ${match[1]}`;

            const targetUri = this.findComponentFile(
              match[1],
              pattern.type,
              document.uri
            );
            if (targetUri) {
              link.target = targetUri;
            }

            links.push(link);
          } catch (error) {
            console.error("Error creating document link:", error);
          }
        }
      }
    }

    console.log(`Found ${links.length} document links`);
    return links;
  }

  private findComponentFile(
    componentName: string,
    type: string,
    currentUri: vscode.Uri
  ): vscode.Uri | null {
    const workspaceRoot =
      vscode.workspace.getWorkspaceFolder(currentUri)?.uri.fsPath;
    if (!workspaceRoot) {
      console.log("No workspace root found");
      return null;
    }

    let possiblePaths: string[] = [];

    switch (type) {
      case "blade":
        possiblePaths = this.getBladeComponentPaths(
          componentName,
          workspaceRoot
        );
        break;
      case "flux":
        possiblePaths = this.getFluxComponentPaths(
          componentName,
          workspaceRoot
        );
        break;
      case "livewire":
      case "livewire-tag":
        possiblePaths = this.getLivewireComponentPaths(
          componentName,
          workspaceRoot
        );
        break;
      case "livewire-directive-class":
        possiblePaths = this.getLivewireClassComponentPaths(
          componentName,
          workspaceRoot
        );
        break;
      case "include":
        possiblePaths = this.getIncludePaths(componentName, workspaceRoot);
        break;
      case "extends":
        possiblePaths = this.getExtendsPaths(componentName, workspaceRoot);
        break;
      case "volt":
        possiblePaths = this.getVoltComponentPaths(
          componentName,
          workspaceRoot
        );
        break;
    }

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        return vscode.Uri.file(filePath);
      }
    }

    return null;
  }

  private getBladeComponentPaths(
    name: string,
    workspaceRoot: string
  ): string[] {
    const componentPath = name.replace(/\./g, "/");
    return [
      path.join(
        workspaceRoot,
        "resources/views/components",
        `${componentPath}.blade.php`
      ),
      path.join(
        workspaceRoot,
        "resources/views/components",
        componentPath,
        "index.blade.php"
      ),
    ];
  }

  private getFluxComponentPaths(name: string, workspaceRoot: string): string[] {
    const componentPath = name.replace(/\./g, "/");
    return [
      path.join(
        workspaceRoot,
        "vendor/livewire/flux/stubs/resources/views/flux",
        componentPath,
        "index.blade.php"
      ),

      path.join(
        workspaceRoot,
        "vendor/livewire/flux/stubs/resources/views/flux",
        `${componentPath}.blade.php`
      ),

      path.join(
        workspaceRoot,
        "resources/views/flux",
        componentPath,
        "index.blade.php"
      ),

      path.join(
        workspaceRoot,
        "resources/views/flux",
        `${componentPath}.blade.php`
      ),

      path.join(
        workspaceRoot,
        "resources/views/components/flux",
        componentPath,
        "index.blade.php"
      ),

      path.join(
        workspaceRoot,
        "resources/views/components/flux",
        `${componentPath}.blade.php`
      ),
    ];
  }

  private getLivewireComponentPaths(
    name: string,
    workspaceRoot: string
  ): string[] {
    const parts = name.split(".");
    const className = parts
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("/");

    const viewPath = parts.join("/");

    return [
      path.join(workspaceRoot, "app/Livewire", `${className}.php`),
      path.join(workspaceRoot, "app/Http/Livewire", `${className}.php`),

      path.join(
        workspaceRoot,
        "resources/views/livewire",
        `${viewPath}.blade.php`
      ),
    ];
  }

  private getLivewireClassComponentPaths(
    className: string,
    workspaceRoot: string
  ): string[] {
    return [
      path.join(workspaceRoot, "app/Livewire", `${className}.php`),
      path.join(workspaceRoot, "app/Http/Livewire", `${className}.php`),

      path.join(
        workspaceRoot,
        "app/Livewire",
        className.replace(/([A-Z])/g, (match, letter, index) => {
          return index === 0 ? letter : `/${letter}`;
        }) + ".php"
      ),
      path.join(
        workspaceRoot,
        "app/Http/Livewire",
        className.replace(/([A-Z])/g, (match, letter, index) => {
          return index === 0 ? letter : `/${letter}`;
        }) + ".php"
      ),

      path.join(
        workspaceRoot,
        "resources/views/livewire",
        className.replace(/([A-Z])/g, (match, letter, index) => {
          return index === 0
            ? letter.toLowerCase()
            : `-${letter.toLowerCase()}`;
        }) + ".blade.php"
      ),

      path.join(
        workspaceRoot,
        "resources/views/livewire",
        className.toLowerCase().replace(/([A-Z])/g, "-$1") + ".blade.php"
      ),
    ];
  }

  private getIncludePaths(name: string, workspaceRoot: string): string[] {
    const viewPath = name.replace(/\./g, "/");
    return [
      path.join(workspaceRoot, "resources/views", `${viewPath}.blade.php`),
      path.join(workspaceRoot, "resources/views", viewPath, "index.blade.php"),
    ];
  }

  private getExtendsPaths(name: string, workspaceRoot: string): string[] {
    const viewPath = name.replace(/\./g, "/");
    return [
      path.join(
        workspaceRoot,
        "resources/views/layouts",
        `${viewPath}.blade.php`
      ),
      path.join(
        workspaceRoot,
        "resources/views/layouts",
        viewPath,
        "index.blade.php"
      ),

      path.join(workspaceRoot, "resources/views", `${viewPath}.blade.php`),
      path.join(workspaceRoot, "resources/views", viewPath, "index.blade.php"),
    ];
  }

  private getVoltComponentPaths(name: string, workspaceRoot: string): string[] {
    const viewPath = name.replace(/\./g, "/");

    return [
      path.join(
        workspaceRoot,
        "resources/views/pages",
        `${viewPath}.blade.php`
      ),
      path.join(
        workspaceRoot,
        "resources/views/livewire",
        `${viewPath}.blade.php`
      ),
      path.join(workspaceRoot, "resources/views", `${viewPath}.blade.php`),

      path.join(
        workspaceRoot,
        "resources/views/pages",
        viewPath,
        "index.blade.php"
      ),
      path.join(
        workspaceRoot,
        "resources/views/livewire",
        viewPath,
        "index.blade.php"
      ),
    ];
  }
}
