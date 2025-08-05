import * as assert from "assert";
import { ComponentUtils } from "../componentUtils";

suite("ComponentUtils Unit Tests", () => {
  suite("Blade Component Extraction", () => {
    test("Should extract simple blade component", () => {
      const result = ComponentUtils.extractComponentInfo("<x-button>", 5);
      assert.strictEqual(result?.name, "button");
      assert.strictEqual(result?.type, "blade");
    });

    test("Should extract nested blade component", () => {
      const result = ComponentUtils.extractComponentInfo(
        "<x-forms.input.text>",
        10
      );
      assert.strictEqual(result?.name, "forms.input.text");
      assert.strictEqual(result?.type, "blade");
    });

    test("Should extract hyphenated blade component", () => {
      const result = ComponentUtils.extractComponentInfo("<x-button-group>", 8);
      assert.strictEqual(result?.name, "button-group");
      assert.strictEqual(result?.type, "blade");
    });
  });

  suite("Flux Component Extraction", () => {
    test("Should extract simple flux component", () => {
      const result = ComponentUtils.extractComponentInfo("<flux:button>", 8);
      assert.strictEqual(result?.name, "button");
      assert.strictEqual(result?.type, "flux");
    });

    test("Should extract nested flux component", () => {
      const result = ComponentUtils.extractComponentInfo(
        "<flux:input.group>",
        12
      );
      assert.strictEqual(result?.name, "input.group");
      assert.strictEqual(result?.type, "flux");
    });
  });

  suite("Livewire Component Extraction", () => {
    test("Should extract livewire directive with single quotes", () => {
      const result = ComponentUtils.extractComponentInfo(
        "@livewire('user.profile')",
        15
      );
      assert.strictEqual(result?.name, "user.profile");
      assert.strictEqual(result?.type, "livewire");
    });

    test("Should extract livewire directive with double quotes", () => {
      const result = ComponentUtils.extractComponentInfo(
        '@livewire("dashboard.stats")',
        18
      );
      assert.strictEqual(result?.name, "dashboard.stats");
      assert.strictEqual(result?.type, "livewire");
    });

    test("Should extract livewire tag component", () => {
      const result = ComponentUtils.extractComponentInfo(
        "<livewire:user.profile>",
        15
      );
      assert.strictEqual(result?.name, "user.profile");
      assert.strictEqual(result?.type, "livewire-tag");
    });

    test("Should handle livewire directive with parameters", () => {
      const result = ComponentUtils.extractComponentInfo(
        "@livewire('user.profile', ['id' => 1])",
        15
      );
      assert.strictEqual(result?.name, "user.profile");
      assert.strictEqual(result?.type, "livewire");
    });
  });

  suite("Include Directive Extraction", () => {
    test("Should extract include with single quotes", () => {
      const result = ComponentUtils.extractComponentInfo(
        "@include('partials.header')",
        18
      );
      assert.strictEqual(result?.name, "partials.header");
      assert.strictEqual(result?.type, "include");
    });

    test("Should extract include with double quotes", () => {
      const result = ComponentUtils.extractComponentInfo(
        '@include("layouts.app")',
        15
      );
      assert.strictEqual(result?.name, "layouts.app");
      assert.strictEqual(result?.type, "include");
    });

    test("Should handle include with parameters", () => {
      const result = ComponentUtils.extractComponentInfo(
        "@include('partials.header', ['title' => 'Home'])",
        18
      );
      assert.strictEqual(result?.name, "partials.header");
      assert.strictEqual(result?.type, "include");
    });
  });

  suite("Extends Directive Extraction", () => {
    test("Should extract extends with single quotes", () => {
      const result = ComponentUtils.extractComponentInfo(
        "@extends('layouts.app')",
        18
      );
      assert.strictEqual(result?.name, "layouts.app");
      assert.strictEqual(result?.type, "extends");
    });

    test("Should extract extends with double quotes", () => {
      const result = ComponentUtils.extractComponentInfo(
        '@extends("layouts.master")',
        15
      );
      assert.strictEqual(result?.name, "layouts.master");
      assert.strictEqual(result?.type, "extends");
    });

    test("Should handle nested layout names", () => {
      const result = ComponentUtils.extractComponentInfo(
        "@extends('admin.layouts.dashboard')",
        25
      );
      assert.strictEqual(result?.name, "admin.layouts.dashboard");
      assert.strictEqual(result?.type, "extends");
    });

    test("Should handle cursor position correctly for extends", () => {
      const result = ComponentUtils.extractComponentInfo(
        "@extends('layouts.app')",
        12
      );
      assert.strictEqual(result?.name, "layouts.app");
      assert.strictEqual(result?.type, "extends");
    });
  });

  suite("Volt Route Extraction", () => {
    test("Should extract volt route with single quotes", () => {
      const result = ComponentUtils.extractComponentInfo(
        "Volt::route('/dashboard', 'dashboard.index')",
        35
      );
      assert.strictEqual(result?.name, "dashboard.index");
      assert.strictEqual(result?.type, "volt");
    });

    test("Should extract volt route with double quotes", () => {
      const result = ComponentUtils.extractComponentInfo(
        'Volt::route("/users", "user.index")',
        25
      );
      assert.strictEqual(result?.name, "user.index");
      assert.strictEqual(result?.type, "volt");
    });
  });

  suite("Edge Cases and Error Handling", () => {
    test("Should return null for invalid cursor position", () => {
      const result = ComponentUtils.extractComponentInfo(
        "<x-button> some text",
        15
      );
      assert.strictEqual(result, null);
    });

    test("Should return null for empty line", () => {
      const result = ComponentUtils.extractComponentInfo("", 0);
      assert.strictEqual(result, null);
    });

    test("Should return null for non-component text", () => {
      const result = ComponentUtils.extractComponentInfo(
        "This is just regular text",
        10
      );
      assert.strictEqual(result, null);
    });

    test("Should handle cursor at start of component", () => {
      const result = ComponentUtils.extractComponentInfo("<x-button>", 0);
      assert.strictEqual(result?.name, "button");
      assert.strictEqual(result?.type, "blade");
    });

    test("Should handle cursor at end of component", () => {
      const result = ComponentUtils.extractComponentInfo("<x-button>", 9);
      assert.strictEqual(result?.name, "button");
      assert.strictEqual(result?.type, "blade");
    });

    test("Should handle multiple components on same line", () => {
      const line = "<x-button><flux:input>";
      const result1 = ComponentUtils.extractComponentInfo(line, 5);
      const result2 = ComponentUtils.extractComponentInfo(line, 18);

      assert.strictEqual(result1?.name, "button");
      assert.strictEqual(result1?.type, "blade");
      assert.strictEqual(result2?.name, "input");
      assert.strictEqual(result2?.type, "flux");
    });

    test("Should handle components with attributes", () => {
      const result = ComponentUtils.extractComponentInfo(
        '<x-button class="btn-primary" id="submit">',
        8
      );
      assert.strictEqual(result?.name, "button");
      assert.strictEqual(result?.type, "blade");
    });

    test("Should handle self-closing components", () => {
      const result = ComponentUtils.extractComponentInfo("<x-button />", 5);
      assert.strictEqual(result?.name, "button");
      assert.strictEqual(result?.type, "blade");
    });
  });

  suite("Component Name Patterns", () => {
    test("Should handle numeric characters in component names", () => {
      const result = ComponentUtils.extractComponentInfo("<x-button2>", 8);
      assert.strictEqual(result?.name, "button2");
      assert.strictEqual(result?.type, "blade");
    });

    test("Should handle underscores in component names", () => {
      const result = ComponentUtils.extractComponentInfo(
        "<x-user_profile>",
        10
      );
      assert.strictEqual(result?.name, "user_profile");
      assert.strictEqual(result?.type, "blade");
    });

    test("Should handle deep nesting in component names", () => {
      const result = ComponentUtils.extractComponentInfo(
        "<x-forms.inputs.text.validation>",
        20
      );
      assert.strictEqual(result?.name, "forms.inputs.text.validation");
      assert.strictEqual(result?.type, "blade");
    });
  });

  suite("Whitespace Handling", () => {
    test("Should handle whitespace in livewire directive", () => {
      const result = ComponentUtils.extractComponentInfo(
        "@livewire( 'user.profile' )",
        18
      );
      assert.strictEqual(result?.name, "user.profile");
      assert.strictEqual(result?.type, "livewire");
    });

    test("Should handle whitespace in include directive", () => {
      const result = ComponentUtils.extractComponentInfo(
        "@include( 'partials.header' )",
        20
      );
      assert.strictEqual(result?.name, "partials.header");
      assert.strictEqual(result?.type, "include");
    });

    test("Should handle tabs and multiple spaces", () => {
      const result = ComponentUtils.extractComponentInfo(
        "@livewire(\t'user.profile'\t)",
        18
      );
      assert.strictEqual(result?.name, "user.profile");
      assert.strictEqual(result?.type, "livewire");
    });
  });
});
