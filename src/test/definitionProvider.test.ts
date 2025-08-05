import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import { ComponentDefinitionProvider } from "../definitionProvider";

suite("DefinitionProvider Unit Tests", () => {
  let provider: ComponentDefinitionProvider;

  setup(() => {
    provider = new ComponentDefinitionProvider();
  });

  suite("Definition Provision", () => {
    test("Should provide definition for blade component", async () => {
      const content = "<x-button>";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 5);

      const definition = provider.provideDefinition(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );

      assert.notStrictEqual(definition, undefined);
    });

    test("Should provide definition for flux component", async () => {
      const content = "<flux:input>";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 8);

      const definition = provider.provideDefinition(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );

      assert.notStrictEqual(definition, undefined);
    });

    test("Should provide definition for livewire component", async () => {
      const content = "@livewire('user.profile')";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 15);

      const definition = provider.provideDefinition(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );

      assert.notStrictEqual(definition, undefined);
    });

    test("Should return null for invalid position", async () => {
      const content = "<x-button> some text here";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 20);

      const definition = provider.provideDefinition(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );

      assert.strictEqual(definition, null);
    });

    test("Should return null for empty line", async () => {
      const content = "";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 0);

      const definition = provider.provideDefinition(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );

      assert.strictEqual(definition, null);
    });
  });

  suite("Path Resolution Logic", () => {
    test("Should generate correct blade component paths", () => {
      const workspaceRoot = "/test/workspace";
      const paths = (provider as any).getBladeComponentPaths(
        "modal",
        workspaceRoot
      );

      assert.ok(
        paths.includes(
          path.join(workspaceRoot, "resources/views/components/modal.blade.php")
        )
      );
      assert.ok(
        paths.includes(
          path.join(
            workspaceRoot,
            "resources/views/components/modal/index.blade.php"
          )
        )
      );
    });

    test("Should generate correct flux component paths", () => {
      const workspaceRoot = "/test/workspace";
      const paths = (provider as any).getFluxComponentPaths(
        "button",
        workspaceRoot
      );

      const normalizedPaths = paths.map((p: string) => p.replace(/\\/g, "/"));

      assert.ok(
        normalizedPaths.some((p: string) =>
          p.includes("button/index.blade.php")
        )
      );
      assert.ok(
        normalizedPaths.some((p: string) => p.includes("button.blade.php"))
      );
      assert.ok(
        normalizedPaths.some((p: string) => p.includes("vendor/livewire/flux"))
      );
    });

    test("Should generate correct livewire component paths", () => {
      const workspaceRoot = "/test/workspace";
      const paths = (provider as any).getLivewireComponentPaths(
        "user.profile",
        workspaceRoot
      );

      const normalizedPaths = paths.map((p: string) => p.replace(/\\/g, "/"));

      assert.ok(
        normalizedPaths.some((p: string) =>
          p.includes("app/Livewire/User/Profile.php")
        )
      );
      assert.ok(
        normalizedPaths.some((p: string) =>
          p.includes("app/Http/Livewire/User/Profile.php")
        )
      );
      assert.ok(
        normalizedPaths.some((p: string) =>
          p.includes("resources/views/livewire/user/profile.blade.php")
        )
      );
    });

    test("Should generate correct include paths", () => {
      const workspaceRoot = "/test/workspace";
      const paths = (provider as any).getIncludePaths(
        "partials.header",
        workspaceRoot
      );

      assert.ok(
        paths.includes(
          path.join(workspaceRoot, "resources/views/partials/header.blade.php")
        )
      );
      assert.ok(
        paths.includes(
          path.join(
            workspaceRoot,
            "resources/views/partials/header/index.blade.php"
          )
        )
      );
    });

    test("Should generate correct extends paths", () => {
      const workspaceRoot = "/test/workspace";
      const paths = (provider as any).getExtendsPaths(
        "layouts.app",
        workspaceRoot
      );

      assert.ok(
        paths.includes(
          path.join(
            workspaceRoot,
            "resources/views/layouts/layouts/app.blade.php"
          )
        )
      );
      assert.ok(
        paths.includes(
          path.join(
            workspaceRoot,
            "resources/views/layouts/layouts/app/index.blade.php"
          )
        )
      );
      assert.ok(
        paths.includes(
          path.join(workspaceRoot, "resources/views/layouts/app.blade.php")
        )
      );
      assert.ok(
        paths.includes(
          path.join(
            workspaceRoot,
            "resources/views/layouts/app/index.blade.php"
          )
        )
      );
    });

    test("Should generate correct volt component paths", () => {
      const workspaceRoot = "/test/workspace";
      const paths = (provider as any).getVoltComponentPaths(
        "dashboard.index",
        workspaceRoot
      );

      const normalizedPaths = paths.map((p: string) => p.replace(/\\/g, "/"));

      assert.ok(
        normalizedPaths.some((p: string) =>
          p.includes("resources/views/pages/dashboard/index.blade.php")
        )
      );
      assert.ok(
        normalizedPaths.some((p: string) =>
          p.includes("resources/views/livewire/dashboard/index.blade.php")
        )
      );
      assert.ok(
        normalizedPaths.some((p: string) =>
          p.includes("resources/views/dashboard/index.blade.php")
        )
      );
    });

    test("Should handle nested component names correctly", () => {
      const workspaceRoot = "/test/workspace";
      const paths = (provider as any).getBladeComponentPaths(
        "forms.inputs.text",
        workspaceRoot
      );

      const normalizedPaths = paths.map((p: string) => p.replace(/\\/g, "/"));

      assert.ok(
        normalizedPaths.some((p: string) =>
          p.includes("forms/inputs/text.blade.php")
        )
      );
      assert.ok(
        normalizedPaths.some((p: string) =>
          p.includes("forms/inputs/text/index.blade.php")
        )
      );
    });
  });

  suite("Component Type Handling", () => {
    test("Should handle blade components correctly", async () => {
      const content = "<x-forms.input.text>";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 10);

      const definition = provider.provideDefinition(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );

      assert.notStrictEqual(definition, undefined);
    });

    test("Should handle flux components correctly", async () => {
      const content = "<flux:input.group>";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 10);

      const definition = provider.provideDefinition(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );

      assert.notStrictEqual(definition, undefined);
    });

    test("Should handle livewire directive correctly", async () => {
      const content = "@livewire('dashboard.stats')";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 18);

      const definition = provider.provideDefinition(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );

      assert.notStrictEqual(definition, undefined);
    });

    test("Should handle livewire tag correctly", async () => {
      const content = "<livewire:user.dashboard>";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 15);

      const definition = provider.provideDefinition(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );

      assert.notStrictEqual(definition, undefined);
    });

    test("Should handle include directive correctly", async () => {
      const content = "@include('layouts.master')";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 18);

      const definition = provider.provideDefinition(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );

      assert.notStrictEqual(definition, undefined);
    });

    test("Should handle volt route correctly", async () => {
      const content = "Volt::route('/users', 'user.index')";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 25);

      const definition = provider.provideDefinition(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );

      assert.notStrictEqual(definition, undefined);
    });
  });

  suite("Edge Cases", () => {
    test("Should handle cursor at component boundary", async () => {
      const content = "<x-button>";
      const document = await createMockDocument(content);

      const definitionStart = provider.provideDefinition(
        document,
        new vscode.Position(0, 3),
        new vscode.CancellationTokenSource().token
      );
      assert.notStrictEqual(definitionStart, undefined);

      const definitionEnd = provider.provideDefinition(
        document,
        new vscode.Position(0, 8),
        new vscode.CancellationTokenSource().token
      );
      assert.notStrictEqual(definitionEnd, undefined);
    });

    test("Should handle components with attributes", async () => {
      const content = '<x-button class="primary" id="submit-btn">';
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 5);

      const definition = provider.provideDefinition(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );

      assert.notStrictEqual(definition, undefined);
    });

    test("Should handle self-closing components", async () => {
      const content = "<x-input />";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 5);

      const definition = provider.provideDefinition(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );

      assert.notStrictEqual(definition, undefined);
    });

    test("Should handle components across multiple lines", async () => {
      const content = `<x-modal
    title="Edit User"
    size="lg">`;
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 5);

      const definition = provider.provideDefinition(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );

      assert.notStrictEqual(definition, undefined);
    });
  });

  suite("Error Handling", () => {
    test("Should handle malformed components gracefully", async () => {
      const content = "<x-";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 2);

      const definition = provider.provideDefinition(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );

      assert.strictEqual(definition, null);
    });

    test("Should handle invalid cursor positions gracefully", async () => {
      const content = "<x-button>";
      const document = await createMockDocument(content);
      const invalidLine = document.lineCount;
      const position = new vscode.Position(invalidLine, 0);

      const definition = await provider.provideDefinition(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );

      assert.strictEqual(definition, null);
    });

    test("Should handle documents without workspace", async () => {
      const content = "<x-button>";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 5);

      const definition = provider.provideDefinition(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );

      assert.notStrictEqual(definition, undefined);
    });
  });

  async function createMockDocument(
    content: string
  ): Promise<vscode.TextDocument> {
    const doc = await vscode.workspace.openTextDocument({
      content: content,
      language: "blade",
    });
    return doc;
  }
});
