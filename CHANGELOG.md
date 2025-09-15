# Changelog

All notable changes to the "laravel-livewire-go-to" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Configuration options for custom component paths
- Support for additional Laravel UI libraries  
- Performance optimizations for large projects
- Multi-workspace support improvements
- Breadcrumb navigation for deeply nested components
- Component usage analytics and insights

### In Progress
- Documentation improvements and usage examples
- Enhanced error handling and user feedback
- Code refactoring for better maintainability

## [0.0.1] - 2025-08-07

### Added

- **Go to Definition** support for Blade components (`<x-component>`, `<x-namespace.component>`)
- **Go to Definition** support for Livewire components with multiple syntaxes:
  - String-based: `@livewire('component-name')`
  - Class-based: `@livewire(ComponentClass::class)`
  - Tag syntax: `<livewire:component-name>`
- **Go to Definition** support for Flux UI components (`<flux:component>`)
- **Go to Definition** support for Blade directives:
  - `@include('template.path')`
  - `@extends('layout.path')`
- **Go to Definition** support for Laravel Volt routes (`Volt::route()`)
- **Hover Information** providing component details and file paths
- **Document Links** for clickable navigation throughout code
- **Smart Path Resolution** following Laravel directory conventions:
  - Blade components: `resources/views/components/`
  - Livewire components: `app/Livewire/`, `app/Http/Livewire/`
  - Blade templates: `resources/views/`
  - Volt pages: `resources/views/pages/`, `resources/views/livewire/`
- Support for nested component structures using dot notation
- Automatic activation for `.blade.php` and `.php` files
- Cross-platform compatibility (Windows, macOS, Linux)

### Technical Details

- Built with TypeScript for type safety and maintainability
- Implements VS Code's Language Server Protocol features:
  - `DefinitionProvider` for Go to Definition functionality
  - `HoverProvider` for component information display
  - `DocumentLinkProvider` for clickable links
- Comprehensive test suite covering all component types
- Optimized pattern matching for reliable component detection
