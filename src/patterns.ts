import { ComponentType } from "./componentUtils";

export interface PatternDefinition {
  name: string;
  regex: RegExp;
  type: ComponentType;
  processMatch?: (match: RegExpExecArray) => {
    name: string;
    className?: string;
    namespace?: string;
  };
}

/**
 * Centralized pattern definitions for component detection
 * These patterns are used for extracting component information and creating document links
 */
export const COMPONENT_PATTERNS: PatternDefinition[] = [
  // Livewire v4 Layout attribute
  {
    name: "layout-attribute",
    regex: /#\[Layout\s*\(\s*['"]([^'"]+)['"]\s*\)\]/g,
    type: "layout",
  },
  // Route::livewire with class reference
  {
    name: "route-livewire-class",
    regex: /Route::livewire\s*\(\s*['"][^'"]*['"]\s*,\s*([A-Z][a-zA-Z0-9\\]*?)::class/g,
    type: "route-livewire-class",
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
  // Route::livewire with string (potentially namespaced)
  {
    name: "route-livewire-string",
    regex: /Route::livewire\s*\(\s*['"][^'"]*['"]\s*,\s*['"](?:([a-zA-Z0-9_]+)::)?([^'"]+)['"]\s*\)/g,
    type: "route-livewire-string",
    processMatch: (match: RegExpExecArray) => {
      const namespace = match[1] || undefined;
      const componentName = match[2];
      return {
        name: componentName,
        namespace: namespace,
      };
    },
  },
  // Blade components: <x-button>
  {
    name: "blade",
    regex: /<x-([a-zA-Z0-9\-_.]+)(?:\s|>|\/|$)/g,
    type: "blade",
  },
  // Flux components: <flux:button>
  {
    name: "flux",
    regex: /<flux:([a-zA-Z0-9\-_.]+)(?:\s|>|\/|$)/g,
    type: "flux",
  },
  // Livewire directive with string (supports namespaces): @livewire('pages::dashboard')
  {
    name: "livewire-directive-string",
    regex: /@livewire\s*\(\s*['"](?:([a-zA-Z0-9_]+)::)?([a-zA-Z0-9\-_.]+)['"]/g,
    type: "livewire",
    processMatch: (match: RegExpExecArray) => {
      const namespace = match[1] || undefined;
      const componentName = match[2];
      return {
        name: componentName,
        namespace: namespace,
      };
    },
  },
  // Livewire directive with class: @livewire(Dashboard::class)
  {
    name: "livewire-directive-class",
    regex: /@livewire\s*\(\s*([A-Z][a-zA-Z0-9\\]*?)::class/g,
    type: "livewire-class",
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
  // Livewire tag (supports namespaces): <livewire:pages::post.create />
  {
    name: "livewire-tag",
    regex: /<livewire:(?:([a-zA-Z0-9_]+)::)?([a-zA-Z0-9\-_.]+)(?:\s|\/|>|$)/g,
    type: "livewire-tag",
    processMatch: (match: RegExpExecArray) => {
      const namespace = match[1] || undefined;
      const componentName = match[2];
      return {
        name: componentName,
        namespace: namespace,
      };
    },
  },
  // Include directive: @include('partials.header')
  {
    name: "include",
    regex: /@include\s*\(\s*['"]([^'"]+)['"]/g,
    type: "include",
  },
  // Extends directive: @extends('layouts.app')
  {
    name: "extends",
    regex: /@extends\s*\(\s*['"]([^'"]+)['"]/g,
    type: "extends",
  },
  // Volt route: Volt::route('/dash', 'dash.index')
  {
    name: "volt",
    regex: /Volt::route\s*\(\s*['"][^'"]*['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g,
    type: "volt",
  },
];

/**
 * Helper to get a fresh copy of patterns (resets lastIndex for regex)
 */
export function getPatterns(): PatternDefinition[] {
  return COMPONENT_PATTERNS.map((p) => ({
    ...p,
    regex: new RegExp(p.regex.source, p.regex.flags),
  }));
}

/**
 * Legacy exports for backward compatibility
 */
export const LEGACY_PATTERNS = {
  bladeComponent: /<x-([a-zA-Z0-9\-_.]+)(?:\s|>|\/)/g,
  fluxComponent: /<flux:([a-zA-Z0-9\-_.]+)(?:\s|>|\/)/g,
  livewireDirectiveString: /@livewire\s*\(\s*['"]([a-zA-Z0-9\-_.]+)['"]/g,
  livewireDirectiveClass: /@livewire\s*\(\s*([A-Z][a-zA-Z0-9\\]*?)::class/g,
  livewireTag: /<livewire:([a-zA-Z0-9\-_.]+)(?:\s|\/|>)/g,
  livewireTagNamespaced: /<livewire:(?:([a-zA-Z0-9_]+)::)?([a-zA-Z0-9\-_.]+)(?:\s|\/|>|$)/g,
  bladeDirective: /@(include|extends)\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  voltRoute: /Volt::route\s*\(\s*['"][^'"]*['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g,
  layoutAttribute: /#\[Layout\s*\(\s*['"]([^'"]+)['"]\s*\)\]/g,
  routeLivewireClass: /Route::livewire\s*\(\s*['"][^'"]*['"]\s*,\s*([A-Z][a-zA-Z0-9\\]*?)::class/g,
  routeLivewireString: /Route::livewire\s*\(\s*['"][^'"]*['"]\s*,\s*['"](?:([a-zA-Z0-9_]+)::)?([^'"]+)['"]\s*\)/g,
};
