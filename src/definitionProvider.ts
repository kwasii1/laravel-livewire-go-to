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
    return this.findComponentFile(componentInfo, document.uri);
  }

  private findComponentFile(
    componentInfo: ComponentInfo,
    currentUri: vscode.Uri
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
          workspaceRoot
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
    workspaceRoot: string,
    componentInfo?: ComponentInfo
  ): string[] {
    const paths: string[] = [];

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

      paths.push(
        path.join(workspaceRoot, "app", "Livewire", `${className}.php`),
        path.join(workspaceRoot, "app", "Http", "Livewire", `${className}.php`),

        path.join(
          workspaceRoot,
          "resources",
          "views",
          "livewire",
          `${viewPath}.blade.php`
        )
      );
    }

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
