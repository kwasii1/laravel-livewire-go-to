import * as fs from "fs";
import * as path from "path";

export type ComponentType =
  | "blade"
  | "flux"
  | "livewire"
  | "livewire-tag"
  | "livewire-class"
  | "include"
  | "extends"
  | "volt"
  | "layout"
  | "route-livewire-class"
  | "route-livewire-string";

export interface LivewireConfig {
  componentLocations: string[];
  namespaces: Map<string, { viewPath: string; classNamespace?: string }>;
}

export interface ComponentInfo {
  name: string;
  type: ComponentType;
  fullMatch: string;
  startIndex: number;
  endIndex: number;
  className?: string;
  namespace?: string;
}

// Cache for livewire config per workspace
const configCache = new Map<string, { config: LivewireConfig; timestamp: number }>();
const CONFIG_CACHE_TTL = 30000; // 30 seconds

export class ComponentUtils {
  /**
   * Parse config/livewire.php to extract component locations and namespaces
   */
  static parseLivewireConfig(workspaceRoot: string): LivewireConfig {
    const cached = configCache.get(workspaceRoot);
    if (cached && Date.now() - cached.timestamp < CONFIG_CACHE_TTL) {
      return cached.config;
    }

    const defaultConfig: LivewireConfig = {
      componentLocations: [
        path.join(workspaceRoot, "resources/views/livewire"),
        path.join(workspaceRoot, "resources/views/components"),
      ],
      namespaces: new Map([
        ["pages", { viewPath: path.join(workspaceRoot, "resources/views/pages") }],
      ]),
    };

    const configPath = path.join(workspaceRoot, "config/livewire.php");
    if (!fs.existsSync(configPath)) {
      configCache.set(workspaceRoot, { config: defaultConfig, timestamp: Date.now() });
      return defaultConfig;
    }

    try {
      const configContent = fs.readFileSync(configPath, "utf-8");
      const config = { ...defaultConfig };

      // Parse component_locations array
      const locationsMatch = configContent.match(
        /['"]component_locations['"]\s*=>\s*\[([\s\S]*?)\]/
      );
      if (locationsMatch) {
        const locationsStr = locationsMatch[1];
        const pathMatches = locationsStr.matchAll(
          /resource_path\s*\(\s*['"]([^'"]+)['"]\s*\)|['"]([^'"]+)['"]/g
        );
        const locations: string[] = [];
        for (const match of pathMatches) {
          const relativePath = match[1] || match[2];
          if (relativePath) {
            if (relativePath.startsWith("views/")) {
              locations.push(path.join(workspaceRoot, "resources", relativePath));
            } else {
              locations.push(path.join(workspaceRoot, "resources/views", relativePath));
            }
          }
        }
        if (locations.length > 0) {
          config.componentLocations = locations;
        }
      }

      // Parse addNamespace calls
      const namespaceMatches = configContent.matchAll(
        /Livewire::addNamespace\s*\(\s*(?:namespace:\s*)?['"]([^'"]+)['"]\s*,\s*(?:viewPath:\s*)?(?:resource_path\s*\(\s*)?['"]([^'"]+)['"]/g
      );
      for (const match of namespaceMatches) {
        const namespace = match[1];
        const viewPath = match[2];
        config.namespaces.set(namespace, {
          viewPath: viewPath.startsWith("views/")
            ? path.join(workspaceRoot, "resources", viewPath)
            : path.join(workspaceRoot, "resources/views", viewPath),
        });
      }

      configCache.set(workspaceRoot, { config, timestamp: Date.now() });
      return config;
    } catch (error) {
      console.error("Error parsing livewire.php config:", error);
      configCache.set(workspaceRoot, { config: defaultConfig, timestamp: Date.now() });
      return defaultConfig;
    }
  }

  /**
   * Resolve a class reference (e.g., Dashboard::class) to its full namespace by parsing use statements
   */
  static resolveClassImport(documentText: string, className: string): string | null {
    // If className already has namespace, return as is
    if (className.includes("\\")) {
      return className;
    }

    // Check for aliased imports: use App\Livewire\Dashboard as DashComponent;
    const aliasRegex = new RegExp(
      `use\\s+([A-Za-z0-9\\\\]+)\\s+as\\s+${className}\\s*;`,
      "m"
    );
    const aliasMatch = documentText.match(aliasRegex);
    if (aliasMatch) {
      return aliasMatch[1];
    }

    // Check for direct imports: use App\Livewire\Dashboard;
    const directRegex = new RegExp(
      `use\\s+([A-Za-z0-9\\\\]*\\\\${className})\\s*;`,
      "m"
    );
    const directMatch = documentText.match(directRegex);
    if (directMatch) {
      return directMatch[1];
    }

    // Check for group imports: use App\Livewire\{Dashboard, Other};
    const groupRegex = /use\s+([A-Za-z0-9\\]+)\s*\{([^}]+)\}\s*;/g;
    let groupMatch;
    while ((groupMatch = groupRegex.exec(documentText)) !== null) {
      const baseNamespace = groupMatch[1];
      const imports = groupMatch[2].split(",").map((s) => s.trim());
      for (const imp of imports) {
        // Handle aliased group imports: Dashboard as Dash
        const aliasGroupMatch = imp.match(/(\w+)\s+as\s+(\w+)/);
        if (aliasGroupMatch && aliasGroupMatch[2] === className) {
          return baseNamespace + aliasGroupMatch[1];
        }
        if (imp === className) {
          return baseNamespace + className;
        }
      }
    }

    // No import found, assume App\Livewire namespace as default
    return `App\\Livewire\\${className}`;
  }

  /**
   * Generate a bolt icon path from a view path
   * e.g., "settings/appearance" -> "settings/⚡appearance"
   */
  static toBoltPath(viewPath: string): string {
    const parts = viewPath.split("/");
    if (parts.length === 0) {
      return `⚡${viewPath}`;
    }
    parts[parts.length - 1] = `⚡${parts[parts.length - 1]}`;
    return parts.join("/");
  }

  /**
   * Convert a fully qualified class name to a file path
   */
  static classNameToPath(fullClassName: string, workspaceRoot: string): string[] {
    const paths: string[] = [];
    const parts = fullClassName.split("\\");

    if (parts[0] === "App" && parts.length > 1) {
      // Standard Laravel structure: App\Livewire\Dashboard -> app/Livewire/Dashboard.php
      const relativePath = parts.slice(1).join("/");
      paths.push(path.join(workspaceRoot, "app", `${relativePath}.php`));
    }

    // Also try with the full path directly
    const fullPath = parts.join("/");
    paths.push(path.join(workspaceRoot, `${fullPath}.php`));

    return paths;
  }

  static extractComponentInfo(
    line: string,
    character: number
  ): ComponentInfo | null {
    console.log(`Checking line: "${line}" at character: ${character}`);

    const patterns = [
      {
        name: "layout-attribute",
        regex: /#\[Layout\s*\(\s*['"]([^'"]+)['"]\s*\)\]/g,
        type: "layout" as const,
      },
      {
        name: "route-livewire-class",
        regex: /Route::livewire\s*\(\s*['"][^'"]*['"]\s*,\s*([A-Z][a-zA-Z0-9\\]*?)::class/g,
        type: "route-livewire-class" as const,
        processMatch: (match: RegExpExecArray) => {
          const className = match[1];
          const parts = className.split("\\");
          const componentName = parts[parts.length - 1];
          const kebabCase = componentName
            .replace(/([A-Z])/g, "-$1")
            .toLowerCase()
            .substring(1);

          return {
            name: kebabCase,
            className: className,
          };
        },
      },
      {
        name: "route-livewire-string",
        regex: /Route::livewire\s*\(\s*['"][^'"]*['"]\s*,\s*['"](?:([a-zA-Z0-9_]+)::)?([^'"]+)['"]\s*\)/g,
        type: "route-livewire-string" as const,
        processMatch: (match: RegExpExecArray) => {
          const namespace = match[1] || undefined;
          const componentName = match[2];
          return {
            name: componentName,
            namespace: namespace,
          };
        },
      },
      {
        name: "blade",
        regex: /<x-(?:([a-zA-Z0-9_]+)::)?([a-zA-Z0-9\-_.]+)(?:\s|>|\/|$)/g,
        type: "blade" as const,
        processMatch: (match: RegExpExecArray) => {
          const namespace = match[1] || undefined;
          const componentName = match[2];
          return {
            name: componentName,
            namespace: namespace,
          };
        },
      },
      {
        name: "flux",
        regex: /<flux:([a-zA-Z0-9\-_.]+)(?:\s|>|\/|$)/g,
        type: "flux" as const,
      },
      {
        name: "livewire-directive-string",
        regex: /@livewire\s*\(\s*['"](?:([a-zA-Z0-9_]+)::)?([a-zA-Z0-9\-_.]+)['"]/g,
        type: "livewire" as const,
        processMatch: (match: RegExpExecArray) => {
          const namespace = match[1] || undefined;
          const componentName = match[2];
          return {
            name: componentName,
            namespace: namespace,
          };
        },
      },
      {
        name: "livewire-directive-class",
        regex: /@livewire\s*\(\s*([A-Z][a-zA-Z0-9\\]*?)::class/g,
        type: "livewire-class" as const,
        processMatch: (match: RegExpExecArray) => {
          const className = match[1];
          const parts = className.split("\\");
          const componentName = parts[parts.length - 1];
          const kebabCase = componentName
            .replace(/([A-Z])/g, "-$1")
            .toLowerCase()
            .substring(1);

          return {
            name: kebabCase,
            className: className,
          };
        },
      },
      {
        name: "livewire-tag",
        regex: /<livewire:(?:([a-zA-Z0-9_]+)::)?([a-zA-Z0-9\-_.]+)(?:\s|\/|>|$)/g,
        type: "livewire-tag" as const,
        processMatch: (match: RegExpExecArray) => {
          const namespace = match[1] || undefined;
          const componentName = match[2];
          return {
            name: componentName,
            namespace: namespace,
          };
        },
      },
      {
        name: "include",
        regex: /@include\s*\(\s*['"]([^'"]+)['"]/g,
        type: "include" as const,
      },
      {
        name: "extends",
        regex: /@extends\s*\(\s*['"]([^'"]+)['"]/g,
        type: "extends" as const,
      },
      {
        name: "volt",
        regex: /Volt::route\s*\(\s*['"][^'"]*['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g,
        type: "volt" as const,
      },
    ];

    for (const pattern of patterns) {
      pattern.regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.regex.exec(line)) !== null) {
        const startIndex = match.index!;
        const endIndex = startIndex + match[0].length;

        console.log(
          `Found ${pattern.name} match: "${match[0]}" at ${startIndex}-${endIndex}, cursor at ${character}`
        );

        if (character >= startIndex && character <= endIndex) {
          let name = match[1];
          let className: string | undefined;
          let namespace: string | undefined;

          if (pattern.processMatch) {
            const processed = pattern.processMatch(match);
            name = processed.name;
            className = "className" in processed ? processed.className : undefined;
            namespace = "namespace" in processed ? processed.namespace : undefined;
          }

          const result: ComponentInfo = {
            name,
            type: pattern.type,
            fullMatch: match[0],
            startIndex,
            endIndex,
            className,
            namespace,
          };

          console.log(`Returning component info:`, result);
          return result;
        }
      }
    }

    console.log("No component found at cursor position");
    return null;
  }
}
