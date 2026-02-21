import * as assert from "assert";
import * as vscode from "vscode";
import { ComponentDocumentLinkProvider } from "../documentLinkProvider";

suite("DocumentLinkProvider Unit Tests", () => {
  let provider: ComponentDocumentLinkProvider;

  setup(() => {
    provider = new ComponentDocumentLinkProvider();
  });

  suite("Link Generation", () => {
    test("Should generate links for blade components", async () => {
      const content = "<x-button>\n<x-modal>\n<x-forms.input>";
      const document = await createMockDocument(content);

      const links = provider.provideDocumentLinks(
        document,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 3);
      assert.strictEqual(links[0].tooltip, "Go to component: button");
      assert.strictEqual(links[1].tooltip, "Go to component: modal");
      assert.strictEqual(links[2].tooltip, "Go to component: forms.input");
    });

    test("Should generate links for flux components", async () => {
      const content = "<flux:button>\n<flux:input.group>";
      const document = await createMockDocument(content);

      const links = provider.provideDocumentLinks(
        document,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 2);
      assert.strictEqual(links[0].tooltip, "Go to component: button");
      assert.strictEqual(links[1].tooltip, "Go to component: input.group");
    });

    test("Should generate links for livewire components", async () => {
      const content = "@livewire('user.profile')\n<livewire:dashboard>";
      const document = await createMockDocument(content);

      const links = provider.provideDocumentLinks(
        document,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 2);
      assert.strictEqual(links[0].tooltip, "Go to component: user.profile");
      assert.strictEqual(links[1].tooltip, "Go to component: dashboard");
    });

    test("Should generate links for include directives", async () => {
      const content =
        "@include('partials.header')\n@include('layouts.sidebar')";
      const document = await createMockDocument(content);

      const links = provider.provideDocumentLinks(
        document,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 2);
      assert.strictEqual(links[0].tooltip, "Go to component: partials.header");
      assert.strictEqual(links[1].tooltip, "Go to component: layouts.sidebar");
    });

    test("Should generate links for volt routes", async () => {
      const content = "Volt::route('/dashboard', 'dashboard.index')";
      const document = await createMockDocument(content);

      const links = provider.provideDocumentLinks(
        document,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 1);
      assert.strictEqual(links[0].tooltip, "Go to component: dashboard.index");
    });
  });

  suite("Range Calculation", () => {
    test("Should calculate correct range for blade components", async () => {
      const content = '<x-button class="primary">';
      const document = await createMockDocument(content);

      const links = provider.provideDocumentLinks(
        document,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 1);
      const range = links[0].range;
      assert.strictEqual(range.start.line, 0);
      assert.strictEqual(range.start.character, 1);
      assert.strictEqual(range.end.character, 9);
    });

    test("Should calculate correct range for flux components", async () => {
      const content = '<flux:button size="lg">';
      const document = await createMockDocument(content);

      const links = provider.provideDocumentLinks(
        document,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 1);
      const range = links[0].range;
      assert.strictEqual(range.start.line, 0);
      assert.strictEqual(range.start.character, 1);
      assert.strictEqual(range.end.character, 12);
    });

    test("Should calculate correct range for livewire directives", async () => {
      const content = "@livewire('user.profile', ['id' => 1])";
      const document = await createMockDocument(content);

      const links = provider.provideDocumentLinks(
        document,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 1);
      const range = links[0].range;
      assert.strictEqual(range.start.line, 0);
      assert.strictEqual(range.start.character, 11);
      assert.strictEqual(range.end.character, 23);
    });

    test("Should calculate correct range for include directives", async () => {
      const content = "@include('partials.header', ['title' => 'Home'])";
      const document = await createMockDocument(content);

      const links = provider.provideDocumentLinks(
        document,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 1);
      const range = links[0].range;
      assert.strictEqual(range.start.line, 0);
      assert.strictEqual(range.start.character, 10);
      assert.strictEqual(range.end.character, 25);
    });
  });

  suite("Multiple Components Handling", () => {
    test("Should handle multiple components on same line", async () => {
      const content = "<x-button><flux:input><livewire:stats>";
      const document = await createMockDocument(content);

      const links = provider.provideDocumentLinks(
        document,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 3);
      assert.strictEqual(links[0].tooltip, "Go to component: button");
      assert.strictEqual(links[1].tooltip, "Go to component: input");
      assert.strictEqual(links[2].tooltip, "Go to component: stats");
    });

    test("Should handle nested components", async () => {
      const content =
        "<x-modal>\n  <x-button>\n    <flux:icon>\n  </x-button>\n</x-modal>";
      const document = await createMockDocument(content);

      const links = provider.provideDocumentLinks(
        document,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 3);
    });

    test("Should handle mixed component types", async () => {
      const content = `
<x-layout>
  @include('partials.header')
  <flux:button>
    @livewire('user.profile')
  </flux:button>
  Volt::route('/test', 'test.component')
</x-layout>`;
      const document = await createMockDocument(content);

      const links = provider.provideDocumentLinks(
        document,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 5);
    });
  });

  suite("Path Resolution Tests", () => {
    test("Should generate correct blade component paths", async () => {
      const content = "<x-forms.input>";
      const mockDocument = await createMockDocument(content);
      const links = provider.provideDocumentLinks(
        mockDocument,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 1);
      assert.strictEqual(links[0].tooltip, "Go to component: forms.input");
    });

    test("Should generate correct flux component paths", async () => {
      const content = "<flux:button>";
      const mockDocument = await createMockDocument(content);
      const links = provider.provideDocumentLinks(
        mockDocument,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 1);
      assert.strictEqual(links[0].tooltip, "Go to component: button");
    });

    test("Should generate correct livewire component paths", async () => {
      const content = "@livewire('user.profile')";
      const mockDocument = await createMockDocument(content);
      const links = provider.provideDocumentLinks(
        mockDocument,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 1);
      assert.strictEqual(links[0].tooltip, "Go to component: user.profile");
    });

    test("Should handle deeply nested component paths", async () => {
      const content = "<x-forms.inputs.text.validation>";
      const mockDocument = await createMockDocument(content);
      const links = provider.provideDocumentLinks(
        mockDocument,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 1);
      assert.strictEqual(
        links[0].tooltip,
        "Go to component: forms.inputs.text.validation"
      );
    });
  });

  suite("Error Handling", () => {
    test("Should handle malformed components gracefully", async () => {
      const content = "<x-\n<flux:\n@livewire(\n@include(";
      const document = await createMockDocument(content);

      const links = provider.provideDocumentLinks(
        document,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 0);
    });

    test("Should handle empty document", async () => {
      const content = "";
      const document = await createMockDocument(content);

      const links = provider.provideDocumentLinks(
        document,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 0);
    });

    test("Should handle document with only whitespace", async () => {
      const content = "\n\n  \t  \n\n";
      const document = await createMockDocument(content);

      const links = provider.provideDocumentLinks(
        document,
        new vscode.CancellationTokenSource().token
      ) as vscode.DocumentLink[];

      assert.strictEqual(links.length, 0);
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
