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

## [1.1.0] - 2026-02-21

### Added

- **Livewire v4 Support**:
  - Single-file components with bolt icon prefix (`⚡component.blade.php`)
  - Multi-file component directories (`⚡component/index.blade.php`)
  - `#[Layout('path')]` attribute navigation
  - `->layout('path')` method navigation
  - `Route::livewire()` routing support (both class and string syntax)
- **Namespace Support**:
  - Namespaced Livewire components (`pages::settings.appearance`, `admin::dashboard`)
  - Namespaced blade components (`x-layouts::app.sidebar`, `x-admin::nav`)
  - Namespaced layouts (`layouts::dashboard`)
- **Improved Path Resolution**:
  - Bolt icon paths correctly place ⚡ before final segment (`settings/⚡appearance.blade.php`)
  - Support for `config/livewire.php` namespace configuration
  - PHP `use` statement resolution for class-based references

### Fixed

- Bolt icon path generation now correctly prefixes the last segment
- Blade component namespace resolution

## [0.0.1] - 2025-08-05

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
