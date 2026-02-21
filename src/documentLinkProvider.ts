import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { ComponentUtils } from "./componentUtils";

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
        // Layout attribute pattern: #[Layout('layouts.app')]
        {
          regex: /#\[Layout\s*\(\s*['"]([^'"]+)['"]\s*\)\]/g,
          type: "layout" as const,
          getRange: (match: RegExpExecArray, lineIndex: number) => {
            const fullMatch = match[0];
            const layoutName = match[1];
            const quoteStart = fullMatch.indexOf(layoutName);
            const startCol = match.index! + quoteStart;
            const endCol = startCol + layoutName.length;
            return new vscode.Range(lineIndex, startCol, lineIndex, endCol);
          },
        },
        // Route::livewire with class: Route::livewire('/path', Dashboard::class)
        {
          regex: /Route::livewire\s*\(\s*['"][^'"]*['"]\s*,\s*([A-Z][a-zA-Z0-9\\]*?)::class/g,
          type: "route-livewire-class" as const,
          getRange: (match: RegExpExecArray, lineIndex: number) => {
            const className = match[1];
            const classStart = match[0].indexOf(className);
            const startCol = match.index! + classStart;
            const endCol = startCol + className.length;
            return new vscode.Range(lineIndex, startCol, lineIndex, endCol);
          },
        },
        // Route::livewire with string: Route::livewire('/path', 'pages::dashboard')
        {
          regex: /Route::livewire\s*\(\s*['"][^'"]*['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g,
          type: "route-livewire-string" as const,
          getRange: (match: RegExpExecArray, lineIndex: number) => {
            const fullMatch = match[0];
            const componentName = match[1];
            const quoteStart = fullMatch.lastIndexOf(componentName);
            const startCol = match.index! + quoteStart;
            const endCol = startCol + componentName.length;
            return new vscode.Range(lineIndex, startCol, lineIndex, endCol);
          },
        },
        {
          regex: /<x-(?:([a-zA-Z0-9_]+)::)?([a-zA-Z0-9\-_.]+)/g,
          type: "blade" as const,
          getRange: (match: RegExpExecArray, lineIndex: number) => {
            const startCol = match.index! + 1;
            const endCol = match.index! + match[0].length;
            return new vscode.Range(lineIndex, startCol, lineIndex, endCol);
          },
          getComponentInfo: (match: RegExpExecArray) => {
            return {
              name: match[2],
              namespace: match[1] || undefined,
            };
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
        // Updated livewire directive to support namespaces: @livewire('pages::dashboard')
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
        // Updated livewire-tag to support namespaces: <livewire:pages::post.create />
        {
          regex: /<livewire:([a-zA-Z0-9\-_.]+::[a-zA-Z0-9\-_.]+|[a-zA-Z0-9\-_.]+)/g,
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

            // Extract component info (name and optionally namespace)
            const patternWithInfo = pattern as { getComponentInfo?: (m: RegExpExecArray) => { name: string; namespace?: string } };
            const componentInfo = patternWithInfo.getComponentInfo?.(match) || { name: match[1] };
            const componentName = componentInfo.name;
            const namespace = componentInfo.namespace;

            link.tooltip = `Go to component: ${namespace ? `${namespace}::${componentName}` : componentName}`;

            const targetUri = this.findComponentFile(
              componentName,
              pattern.type,
              document.uri,
              text,
              namespace
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
    currentUri: vscode.Uri,
    documentText?: string,
    namespace?: string
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
          workspaceRoot,
          namespace
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
      case "layout":
        possiblePaths = this.getLayoutPaths(componentName, workspaceRoot);
        break;
      case "route-livewire-class":
        possiblePaths = this.getRouteLivewireClassPaths(
          componentName,
          workspaceRoot,
          documentText
        );
        break;
      case "route-livewire-string":
        possiblePaths = this.getLivewireComponentPaths(
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
    workspaceRoot: string,
    namespace?: string
  ): string[] {
    const componentPath = name.replace(/\./g, "/");
    const paths: string[] = [];

    // Handle namespaced components (e.g., x-layouts::app.sidebar)
    if (namespace) {
      paths.push(
        path.join(
          workspaceRoot,
          "resources/views",
          namespace,
          `${componentPath}.blade.php`
        ),
        path.join(
          workspaceRoot,
          "resources/views",
          namespace,
          componentPath,
          "index.blade.php"
        ),
        // Also check components/{namespace}/ folder
        path.join(
          workspaceRoot,
          "resources/views/components",
          namespace,
          `${componentPath}.blade.php`
        ),
        path.join(
          workspaceRoot,
          "resources/views/components",
          namespace,
          componentPath,
          "index.blade.php"
        )
      );
    }

    // Standard component paths
    paths.push(
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
      )
    );

    return paths;
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
    const paths: string[] = [];
    const config = ComponentUtils.parseLivewireConfig(workspaceRoot);

    // Check for namespace prefix (e.g., pages::post.create)
    let namespace: string | undefined;
    let componentName = name;
    if (name.includes("::")) {
      const [ns, comp] = name.split("::");
      namespace = ns;
      componentName = comp;
    }

    const parts = componentName.split(".");
    const className = parts
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("/");

    const viewPath = parts.join("/");
    const lastPart = parts[parts.length - 1];

    // Handle namespaced components
    const boltPath = ComponentUtils.toBoltPath(viewPath);
    if (namespace) {
      const nsConfig = config.namespaces.get(namespace);
      const nsViewPath = nsConfig?.viewPath || path.join(workspaceRoot, "resources/views", namespace);

      // Livewire v4 bolt icon single-file components
      paths.push(
        path.join(nsViewPath, `${boltPath}.blade.php`),
      );

      // Livewire v4 multi-file component directories
      paths.push(
        path.join(nsViewPath, boltPath, `${lastPart}.blade.php`),
        path.join(nsViewPath, boltPath, "index.blade.php"),
      );

      // Standard paths
      paths.push(
        path.join(nsViewPath, `${viewPath}.blade.php`),
        path.join(nsViewPath, viewPath, "index.blade.php"),
      );

      // Also check resources/views/{namespace}/livewire/
      paths.push(
        path.join(workspaceRoot, "resources/views", namespace, "livewire", `${boltPath}.blade.php`),
        path.join(workspaceRoot, "resources/views", namespace, "livewire", `${viewPath}.blade.php`),
      );
    }

    // Class-based component paths
    paths.push(
      path.join(workspaceRoot, "app/Livewire", `${className}.php`),
      path.join(workspaceRoot, "app/Http/Livewire", `${className}.php`)
    );

    // Livewire v4 bolt icon single-file components (in default location)
    paths.push(
      path.join(workspaceRoot, "resources/views/livewire", `${boltPath}.blade.php`),
      path.join(workspaceRoot, "resources/views/components", `${boltPath}.blade.php`)
    );

    // Livewire v4 multi-file component directories
    paths.push(
      path.join(workspaceRoot, "resources/views/livewire", boltPath, `${lastPart}.blade.php`),
      path.join(workspaceRoot, "resources/views/livewire", boltPath, "index.blade.php"),
      path.join(workspaceRoot, "resources/views/components", boltPath, `${lastPart}.blade.php`),
      path.join(workspaceRoot, "resources/views/components", boltPath, "index.blade.php")
    );

    // Standard view paths (fallback)
    paths.push(
      path.join(workspaceRoot, "resources/views/livewire", `${viewPath}.blade.php`),
      path.join(workspaceRoot, "resources/views/livewire", viewPath, "index.blade.php")
    );

    // Check configured component locations
    for (const location of config.componentLocations) {
      paths.push(
        path.join(location, `${boltPath}.blade.php`),
        path.join(location, `${viewPath}.blade.php`),
        path.join(location, boltPath, `${lastPart}.blade.php`),
        path.join(location, viewPath, "index.blade.php")
      );
    }

    return paths;
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

  private getLayoutPaths(name: string, workspaceRoot: string): string[] {
    const paths: string[] = [];

    // Check for namespace prefix (e.g., layouts::dashboard)
    let namespace: string | undefined;
    let layoutName = name;
    if (name.includes("::")) {
      const [ns, ln] = name.split("::");
      namespace = ns;
      layoutName = ln;
    }

    const viewPath = layoutName.replace(/\./g, "/");

    // Handle namespaced layouts (e.g., layouts::dashboard -> resources/views/layouts/dashboard.blade.php)
    if (namespace) {
      paths.push(
        path.join(workspaceRoot, "resources/views", namespace, `${viewPath}.blade.php`),
        path.join(workspaceRoot, "resources/views", namespace, viewPath, "index.blade.php"),
        // Also check components/{namespace}/
        path.join(workspaceRoot, "resources/views/components", namespace, `${viewPath}.blade.php`),
        path.join(workspaceRoot, "resources/views/components", namespace, viewPath, "index.blade.php"),
      );
    }

    // Standard layout paths
    paths.push(
      // Check layouts directory first
      path.join(workspaceRoot, "resources/views/layouts", `${viewPath}.blade.php`),
      path.join(workspaceRoot, "resources/views/layouts", viewPath, "index.blade.php"),
      // Check components/layouts
      path.join(workspaceRoot, "resources/views/components/layouts", `${viewPath}.blade.php`),
      path.join(workspaceRoot, "resources/views/components/layouts", viewPath, "index.blade.php"),
      // Fallback to root views directory
      path.join(workspaceRoot, "resources/views", `${viewPath}.blade.php`),
      path.join(workspaceRoot, "resources/views", viewPath, "index.blade.php"),
    );

    return paths;
  }

  private getRouteLivewireClassPaths(
    className: string,
    workspaceRoot: string,
    documentText?: string
  ): string[] {
    const paths: string[] = [];

    // Resolve import if document text is provided
    let fullClassName = className;
    if (documentText) {
      const resolved = ComponentUtils.resolveClassImport(documentText, className);
      if (resolved) {
        fullClassName = resolved;
      }
    }

    // Convert class name to file paths
    const classFilePaths = ComponentUtils.classNameToPath(fullClassName, workspaceRoot);
    paths.push(...classFilePaths);

    // Also check standard Livewire locations with direct class name
    paths.push(
      path.join(workspaceRoot, "app/Livewire", `${className}.php`),
      path.join(workspaceRoot, "app/Http/Livewire", `${className}.php`)
    );

    // Check for Livewire v4 single-file components
    const kebabName = className
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase()
      .substring(1);

    paths.push(
      path.join(workspaceRoot, "resources/views/livewire", `⚡${kebabName}.blade.php`),
      path.join(workspaceRoot, "resources/views/livewire", `${kebabName}.blade.php`),
      path.join(workspaceRoot, "resources/views/components", `⚡${kebabName}.blade.php`),
      path.join(workspaceRoot, "resources/views/components", `${kebabName}.blade.php`)
    );

    return paths;
  }
}
