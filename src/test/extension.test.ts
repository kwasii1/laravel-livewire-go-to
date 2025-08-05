import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import { ComponentUtils } from "../componentUtils";
import { ComponentDocumentLinkProvider } from "../documentLinkProvider";
import { ComponentDefinitionProvider } from "../definitionProvider";
import { ComponentHoverProvider } from "../hoverProvider";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  suite("ComponentUtils Tests", () => {
    test("Should extract blade component info", () => {
      const line = "<x-modal>";
      const result = ComponentUtils.extractComponentInfo(line, 5);

      assert.strictEqual(result?.name, "modal");
      assert.strictEqual(result?.type, "blade");
      assert.strictEqual(result?.fullMatch, "<x-modal>");
    });

    test("Should extract flux component info", () => {
      const line = "<flux:button>";
      const result = ComponentUtils.extractComponentInfo(line, 8);

      assert.strictEqual(result?.name, "button");
      assert.strictEqual(result?.type, "flux");
      assert.strictEqual(result?.fullMatch, "<flux:button>");
    });

    test("Should extract livewire directive component info", () => {
      const line = "@livewire('user.profile')";
      const result = ComponentUtils.extractComponentInfo(line, 15);

      assert.strictEqual(result?.name, "user.profile");
      assert.strictEqual(result?.type, "livewire");
      assert.strictEqual(result?.fullMatch, "@livewire('user.profile'");
    });

    test("Should extract livewire tag component info", () => {
      const line = "<livewire:user.profile>";
      const result = ComponentUtils.extractComponentInfo(line, 15);

      assert.strictEqual(result?.name, "user.profile");
      assert.strictEqual(result?.type, "livewire-tag");
      assert.strictEqual(result?.fullMatch, "<livewire:user.profile>");
    });

    test("Should extract include directive info", () => {
      const line = "@include('partials.header')";
      const result = ComponentUtils.extractComponentInfo(line, 18);

      assert.strictEqual(result?.name, "partials.header");
      assert.strictEqual(result?.type, "include");
      assert.strictEqual(result?.fullMatch, "@include('partials.header'");
    });

    test("Should extract volt route info", () => {
      const line = "Volt::route('/dashboard', 'dashboard.index')";
      const result = ComponentUtils.extractComponentInfo(line, 35);

      assert.strictEqual(result?.name, "dashboard.index");
      assert.strictEqual(result?.type, "volt");
    });

    test("Should return null when cursor is outside component", () => {
      const line = "<x-modal> some text";
      const result = ComponentUtils.extractComponentInfo(line, 15);

      assert.strictEqual(result, null);
    });

    test("Should handle nested component names", () => {
      const line = "<x-forms.input.text>";
      const result = ComponentUtils.extractComponentInfo(line, 10);

      assert.strictEqual(result?.name, "forms.input.text");
      assert.strictEqual(result?.type, "blade");
    });

    test("Should handle hyphenated component names", () => {
      const line = "<flux:button-group>";
      const result = ComponentUtils.extractComponentInfo(line, 10);

      assert.strictEqual(result?.name, "button-group");
      assert.strictEqual(result?.type, "flux");
    });
  });

  suite("DocumentLinkProvider Tests", () => {
    let provider: ComponentDocumentLinkProvider;
    let mockDocument: vscode.TextDocument;

    setup(() => {
      provider = new ComponentDocumentLinkProvider();
    });

    test("Should provide document links for blade components", async () => {
      const content = "<x-modal>\n<x-button>\n<flux:input>";
      mockDocument = await createMockDocument(content);

      const links = provider.provideDocumentLinks(
        mockDocument,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 3);
      assert.strictEqual(links[0].tooltip, "Go to component: modal");
      assert.strictEqual(links[1].tooltip, "Go to component: button");
      assert.strictEqual(links[2].tooltip, "Go to component: input");
    });

    test("Should provide document links for livewire components", async () => {
      const content = "@livewire('user.profile')\n<livewire:dashboard>";
      mockDocument = await createMockDocument(content);

      const links = provider.provideDocumentLinks(
        mockDocument,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 2);
      assert.strictEqual(links[0].tooltip, "Go to component: user.profile");
      assert.strictEqual(links[1].tooltip, "Go to component: dashboard");
    });

    test("Should handle include directives", async () => {
      const content = "@include('partials.header')";
      mockDocument = await createMockDocument(content);

      const links = provider.provideDocumentLinks(
        mockDocument,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 1);
      assert.strictEqual(links[0].tooltip, "Go to component: partials.header");
    });

    test("Should handle volt routes", async () => {
      const content = "Volt::route('/dashboard', 'dashboard.index')";
      mockDocument = await createMockDocument(content);

      const links = provider.provideDocumentLinks(
        mockDocument,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 1);
      assert.strictEqual(links[0].tooltip, "Go to component: dashboard.index");
    });

    test("Should handle multiple components on same line", async () => {
      const content = "<x-modal><x-button></x-button></x-modal>";
      mockDocument = await createMockDocument(content);

      const links = provider.provideDocumentLinks(
        mockDocument,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 2);
    });
  });

  suite("DefinitionProvider Tests", () => {
    let provider: ComponentDefinitionProvider;
    let mockDocument: vscode.TextDocument;

    setup(() => {
      provider = new ComponentDefinitionProvider();
    });

    test("Should provide definition for blade component", async () => {
      const content = "<x-modal>";
      mockDocument = await createMockDocument(content);
      const position = new vscode.Position(0, 5);

      const definition = provider.provideDefinition(
        mockDocument,
        position,
        new vscode.CancellationTokenSource().token
      );

      assert.notStrictEqual(definition, undefined);
    });

    test("Should return null for invalid position", async () => {
      const content = "<x-modal> some text";
      mockDocument = await createMockDocument(content);
      const position = new vscode.Position(0, 15);

      const definition = provider.provideDefinition(
        mockDocument,
        position,
        new vscode.CancellationTokenSource().token
      );

      assert.strictEqual(definition, null);
    });
  });

  suite("HoverProvider Tests", () => {
    let provider: ComponentHoverProvider;
    let mockDocument: vscode.TextDocument;

    setup(() => {
      provider = new ComponentHoverProvider();
    });

    test("Should provide hover for blade component", async () => {
      const content = "<x-modal>";
      mockDocument = await createMockDocument(content);
      const position = new vscode.Position(0, 5);

      const hoverResult = provider.provideHover(
        mockDocument,
        position,
        new vscode.CancellationTokenSource().token
      );
      const hover = await Promise.resolve(hoverResult);

      assert.notStrictEqual(hover, null);
      if (hover) {
        const markdown = hover.contents[0] as vscode.MarkdownString;
        assert.ok(markdown.value.includes("modal"));
        assert.ok(markdown.value.includes("Blade Component"));
      }
    });

    test("Should provide hover for flux component", async () => {
      const content = "<flux:button>";
      mockDocument = await createMockDocument(content);
      const position = new vscode.Position(0, 8);

      const hoverResult = provider.provideHover(
        mockDocument,
        position,
        new vscode.CancellationTokenSource().token
      );
      const hover = await Promise.resolve(hoverResult);

      assert.notStrictEqual(hover, null);
      if (hover) {
        const markdown = hover.contents[0] as vscode.MarkdownString;
        assert.ok(markdown.value.includes("button"));
        assert.ok(markdown.value.includes("Flux Component"));
      }
    });

    test("Should provide hover for livewire component", async () => {
      const content = "@livewire('user.profile')";
      mockDocument = await createMockDocument(content);
      const position = new vscode.Position(0, 15);

      const hoverResult = provider.provideHover(
        mockDocument,
        position,
        new vscode.CancellationTokenSource().token
      );
      const hover = await Promise.resolve(hoverResult);

      assert.notStrictEqual(hover, null);
      if (hover) {
        const markdown = hover.contents[0] as vscode.MarkdownString;
        assert.ok(markdown.value.includes("user.profile"));
        assert.ok(markdown.value.includes("Livewire Component"));
      }
    });

    test("Should return null for invalid position", async () => {
      const content = "<x-modal> some text";
      mockDocument = await createMockDocument(content);
      const position = new vscode.Position(0, 15);

      const hoverResult = provider.provideHover(
        mockDocument,
        position,
        new vscode.CancellationTokenSource().token
      );
      const hover = await Promise.resolve(hoverResult);

      assert.strictEqual(hover, null);
    });
  });

  suite("Path Resolution Tests", () => {
    test("Should generate correct blade component paths", () => {
      const provider = new ComponentDefinitionProvider();
      const workspaceRoot = "/test/workspace";

      const paths = (provider as any).getBladeComponentPaths(
        "forms.input",
        workspaceRoot
      );

      assert.ok(
        paths.includes(
          path.join(
            workspaceRoot,
            "resources/views/components/forms/input.blade.php"
          )
        )
      );
      assert.ok(
        paths.includes(
          path.join(
            workspaceRoot,
            "resources/views/components/forms/input/index.blade.php"
          )
        )
      );
    });

    test("Should generate correct flux component paths", () => {
      const provider = new ComponentDefinitionProvider();
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
      const provider = new ComponentDefinitionProvider();
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
      const provider = new ComponentDefinitionProvider();
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

    test("Should generate correct volt component paths", () => {
      const provider = new ComponentDefinitionProvider();
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
    });
  });

  suite("Range Calculation Tests", () => {
    test("Should calculate correct range for blade components", () => {
      const provider = new ComponentDocumentLinkProvider();
      const line = '<x-modal class="test">';
      const regex = /<x-([a-zA-Z0-9\-_.]+)/g;
      const match = regex.exec(line);

      assert.notStrictEqual(match, null);
      if (match) {
        const startCol = match.index! + 3;
        const endCol = match.index! + match[0].length;

        assert.strictEqual(startCol, 3);
        assert.strictEqual(endCol, 8);
      }
    });

    test("Should calculate correct range for flux components", () => {
      const line = '<flux:button size="lg">';
      const regex = /<flux:([a-zA-Z0-9\-_.]+)/g;
      const match = regex.exec(line);

      assert.notStrictEqual(match, null);
      if (match) {
        const startCol = match.index! + 6;
        const endCol = match.index! + match[0].length;

        assert.strictEqual(startCol, 6);
        assert.strictEqual(endCol, 12);
      }
    });

    test("Should calculate correct range for livewire directives", () => {
      const line = "@livewire('user.profile', ['id' => 1])";
      const regex = /@livewire\s*\(\s*['"]([a-zA-Z0-9\-_.]+)['"]/g;
      const match = regex.exec(line);

      assert.notStrictEqual(match, null);
      if (match) {
        const fullMatch = match[0];
        const componentName = match[1];
        const quoteStart = fullMatch.indexOf(componentName);
        const startCol = match.index! + quoteStart;
        const endCol = startCol + componentName.length;

        assert.strictEqual(componentName, "user.profile");
        assert.strictEqual(startCol, 11);
        assert.strictEqual(endCol, 23);
      }
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
