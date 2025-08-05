# Laravel Livewire Go To

A VS Code extension that provides seamless navigation between Laravel components, Livewire components, Blade templates, and Volt pages. Navigate to component definitions with Ctrl+Click (Go to Definition), view component information on hover, and get clickable links throughout your Laravel project.

## Features

### 🎯 Go to Definition (Ctrl+Click)

Navigate instantly to component files by Ctrl+clicking on:

- **Blade Components**: `<x-button>`, `<x-forms.input>`
- **Flux Components**: `<flux:button>`, `<flux:input>`
- **Livewire Components**: `@livewire('user-profile')`, `<livewire:user-profile>`
- **Livewire Classes**: `@livewire(UserProfile::class)`
- **Blade Directives**: `@include('partials.header')`, `@extends('layouts.app')`
- **Volt Routes**: `Volt::route('/profile', 'pages.profile')`

### 💡 Hover Information

Get helpful information when hovering over components:

- Component type
- Quick preview of component details

### 🔗 Document Links

Clickable links throughout your code that take you directly to:

- Component definitions
- Blade template files
- Livewire component classes
- Volt page files
- Flux components and files

### 📁 Smart Path Resolution

Automatically resolves components following Laravel conventions:

- **Blade Components**: `resources/views/components/`
- **Livewire Components**: `app/Livewire/`, `app/Http/Livewire/`
- **Blade Templates**: `resources/views/`
- **Volt Pages**: `resources/views/pages/`, `resources/views/livewire/`
- **Flux Components**: `resources/views/flux`, `vendor\livewire\flux\stubs\resources\views\flux`

## Requirements

- Visual Studio Code 1.102.0 or higher
- A Laravel project with one or more of the following:
  - Blade templates
  - Livewire components
  - Laravel Volt (optional)
  - Flux UI (optional)

## Supported File Types

This extension automatically activates for:

- `.blade.php` files
- `.php` files (including routes)
- Any PHP file in Laravel projects

## Extension Settings

This extension works out of the box with no configuration required. It follows Laravel's standard directory conventions and will automatically detect your component structure.

## Usage Examples

### Blade Components

```blade
<!-- Navigate to resources/views/components/button.blade.php -->
<x-button>Click me</x-button>

<!-- Navigate to resources/views/components/forms/input.blade.php -->
<x-forms.input name="email" />
```

### Livewire Components

```blade
<!-- Navigate to app/Livewire/UserProfile.php -->
@livewire('user-profile')

<!-- Navigate using class reference -->
@livewire(App\Livewire\UserProfile::class)

<!-- Navigate with livewire tag syntax -->
<livewire:user-profile />
```

### Flux Components

```blade
<!-- Navigate to Flux component definitions -->
<flux:button>Submit</flux:button>
<flux:input wire:model="name" />
```

### Blade Templates

```blade
<!-- Navigate to resources/views/layouts/app.blade.php -->
@extends('layouts.app')

<!-- Navigate to resources/views/partials/header.blade.php -->
@include('partials.header')
```

### Volt Routes

```php
// Navigate to resources/views/pages/profile.blade.php
Volt::route('/profile', 'pages.profile');
```

## How It Works

1. **Hover** over any supported component to see its information
2. **Ctrl+Click** (or Cmd+Click on macOS) to jump to the component definition
3. **Click** on document links that appear as underlined text
4. Works across your entire Laravel project, following standard conventions

## Troubleshooting

### Component Not Found

- Ensure your components follow Laravel naming conventions
- Check that component files exist in the expected directories
- Verify file permissions and accessibility

### Extension Not Activating

- Make sure you're working in a file with `.blade.php` or `.php` extension
- Check that the file is part of a workspace in VS Code
- Try reloading the VS Code window

## Known Issues

- Custom component namespaces may require manual path configuration
- Some complex nested component structures might not be resolved automatically
- Performance may vary with very large Laravel projects

## Release Notes

### 0.0.1 - Initial Release

- ✅ **Go to Definition** support for Blade components (`<x-component>`)
- ✅ **Go to Definition** support for Livewire components (`@livewire()`, `<livewire:>`)
- ✅ **Go to Definition** support for Flux components (`<flux:component>`)
- ✅ **Go to Definition** support for Blade directives (`@include`, `@extends`)
- ✅ **Go to Definition** support for Volt routes
- ✅ **Hover Information** for all supported component types
- ✅ **Document Links** for quick navigation
- ✅ **Smart Path Resolution** following Laravel conventions
- ✅ Support for nested component structures (dot notation)
- ✅ Support for both string and class-based Livewire component references

---

## Contributing

Found a bug or want to contribute? Please visit our [GitHub repository](https://github.com/kwasii1/laravel-livewire-go-to) to:

- Report issues
- Submit feature requests
- Contribute code improvements

## Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Search existing issues on GitHub
3. Create a new issue with detailed information about your problem

---

## Keywords

`PHP` `Laravel` `Livewire` `Volt` `Blade` `Flux` `Navigation` `Go to Definition` `Components`

## License

This extension is released under the [MIT License](LICENSE).

**Enjoy productive Laravel development! 🚀**
