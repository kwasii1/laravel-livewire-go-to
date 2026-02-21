import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { ComponentUtils, ComponentInfo } from "./componentUtils";

export class ComponentDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Definition> {
    console.log(
      `Definition requested at line ${position.line}, character ${position.character}`
    );
    if (position.line < 0 || position.line >= document.lineCount) {
      return null;
    }

    const line = document.lineAt(position.line).text;
    const componentInfo = ComponentUtils.extractComponentInfo(
      line,
      position.character
    );

    if (!componentInfo) {
      console.log("No component info found for definition");
      return null;
    }

    console.log("Finding definition for component:", componentInfo);
    return this.findComponentFile(componentInfo, document.uri, document);
  }

  private findComponentFile(
    componentInfo: ComponentInfo,
    currentUri: vscode.Uri,
    document?: vscode.TextDocument
  ): vscode.Location | null {
    const workspaceRoot =
      vscode.workspace.getWorkspaceFolder(currentUri)?.uri.fsPath;
    if (!workspaceRoot) {
      console.log("No workspace root found");
      return null;
    }

    let possiblePaths: string[] = [];

    switch (componentInfo.type) {
      case "blade":
        possiblePaths = this.getBladeComponentPaths(
          componentInfo.name,
          workspaceRoot,
          componentInfo.namespace
        );
        break;
      case "flux":
        possiblePaths = this.getFluxComponentPaths(
          componentInfo.name,
          workspaceRoot
        );
        break;
      case "livewire":
      case "livewire-tag":
      case "livewire-class":
        possiblePaths = this.getLivewireComponentPaths(
          componentInfo.name,
          workspaceRoot,
          componentInfo
        );
        break;
      case "include":
        possiblePaths = this.getIncludePaths(componentInfo.name, workspaceRoot);
        break;
      case "extends":
        possiblePaths = this.getExtendsPaths(componentInfo.name, workspaceRoot);
        break;
      case "volt":
        possiblePaths = this.getVoltComponentPaths(
          componentInfo.name,
          workspaceRoot
        );
        break;
      case "layout":
        possiblePaths = this.getLayoutPaths(componentInfo.name, workspaceRoot);
        break;
      case "route-livewire-class":
        possiblePaths = this.getRouteLivewireClassPaths(
          componentInfo.className || componentInfo.name,
          workspaceRoot,
          document?.getText()
        );
        break;
      case "route-livewire-string":
        possiblePaths = this.getLivewireComponentPaths(
          componentInfo.name,
          workspaceRoot,
          componentInfo
        );
        break;
    }

    console.log("Checking paths:", possiblePaths);

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        console.log("Found file:", filePath);
        return new vscode.Location(
          vscode.Uri.file(filePath),
          new vscode.Position(0, 0)
        );
      }
    }

    console.log("No matching file found");
    vscode.window.showWarningMessage(
      `Component file not found for: ${componentInfo.name}`
    );
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
    workspaceRoot: string,
    componentInfo?: ComponentInfo
  ): string[] {
    const paths: string[] = [];
    const config = ComponentUtils.parseLivewireConfig(workspaceRoot);
    const namespace = componentInfo?.namespace;

    if (componentInfo?.type === "livewire-class" && componentInfo.className) {
      const className = componentInfo.className;
      const parts = className.split("\\");

      if (parts.length > 1) {
        const relativePath = parts.slice(1).join("/");
        paths.push(path.join(workspaceRoot, "app", `${relativePath}.php`));
      } else {
        paths.push(
          path.join(workspaceRoot, "app", "Livewire", `${className}.php`),
          path.join(
            workspaceRoot,
            "app",
            "Http",
            "Livewire",
            `${className}.php`
          )
        );
      }

      const viewPath = name.replace(/\./g, "/");
      paths.push(
        path.join(
          workspaceRoot,
          "resources",
          "views",
          "livewire",
          `${viewPath}.blade.php`
        )
      );
    } else {
      const parts = name.split(".");
      const className = parts
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("/");

      const viewPath = parts.join("/");
      const lastPart = parts[parts.length - 1];

      // Handle namespaced components (e.g., pages::post.create)
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
        path.join(workspaceRoot, "app", "Livewire", `${className}.php`),
        path.join(workspaceRoot, "app", "Http", "Livewire", `${className}.php`)
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
    }

    return paths;
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
