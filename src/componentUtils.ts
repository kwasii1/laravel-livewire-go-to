export interface ComponentInfo {
  name: string;
  type:
    | "blade"
    | "flux"
    | "livewire"
    | "livewire-tag"
    | "livewire-class"
    | "include"
    | "extends"
    | "volt";
  fullMatch: string;
  startIndex: number;
  endIndex: number;
  className?: string;
}

export class ComponentUtils {
  static extractComponentInfo(
    line: string,
    character: number
  ): ComponentInfo | null {
    console.log(`Checking line: "${line}" at character: ${character}`);

    const patterns = [
      {
        name: "blade",

        regex: /<x-([a-zA-Z0-9\-_.]+)(?:\s|>|\/|$)/g,
        type: "blade" as const,
      },
      {
        name: "flux",
        regex: /<flux:([a-zA-Z0-9\-_.]+)(?:\s|>|\/|$)/g,
        type: "flux" as const,
      },
      {
        name: "livewire-directive-string",
        regex: /@livewire\s*\(\s*['"]([a-zA-Z0-9\-_.]+)['"]/g,
        type: "livewire" as const,
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

        regex: /<livewire:([a-zA-Z0-9\-_.]+)(?:\s|\/|>|$)/g,
        type: "livewire-tag" as const,
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

          if (pattern.type === "livewire-class" && pattern.processMatch) {
            const processed = pattern.processMatch(match);
            name = processed.name;
            className = processed.className;
          }

          const result: ComponentInfo = {
            name,
            type: pattern.type,
            fullMatch: match[0],
            startIndex,
            endIndex,
            className,
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
