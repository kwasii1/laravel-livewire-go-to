import * as assert from "assert";
import * as vscode from "vscode";
import { ComponentHoverProvider } from "../hoverProvider";

suite("HoverProvider Unit Tests", () => {
  let provider: ComponentHoverProvider;

  setup(() => {
    provider = new ComponentHoverProvider();
  });

  suite("Hover Provision", () => {
    test("Should provide hover for blade component", async () => {
      const content = "<x-button>";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 5);

      const hoverResult = provider.provideHover(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );
      const hover = await Promise.resolve(hoverResult);

      assert.notStrictEqual(hover, null);
      if (hover) {
        const markdown = hover.contents[0] as vscode.MarkdownString;
        assert.ok(markdown.value.includes("button"));
        assert.ok(markdown.value.includes("Blade Component"));
      }
    });

    test("Should provide hover for flux component", async () => {
      const content = "<flux:input>";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 8);

      const hoverResult = provider.provideHover(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );
      const hover = await Promise.resolve(hoverResult);

      assert.notStrictEqual(hover, null);
      if (hover) {
        const markdown = hover.contents[0] as vscode.MarkdownString;
        assert.ok(markdown.value.includes("input"));
        assert.ok(markdown.value.includes("Flux Component"));
      }
    });

    test("Should provide hover for livewire directive", async () => {
      const content = "@livewire('user.profile')";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 15);

      const hoverResult = provider.provideHover(
        document,
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

    test("Should provide hover for livewire tag", async () => {
      const content = "<livewire:dashboard>";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 15);

      const hoverResult = provider.provideHover(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );
      const hover = await Promise.resolve(hoverResult);

      assert.notStrictEqual(hover, null);
      if (hover) {
        const markdown = hover.contents[0] as vscode.MarkdownString;
        assert.ok(markdown.value.includes("dashboard"));
        assert.ok(markdown.value.includes("Livewire Component"));
      }
    });

    test("Should provide hover for include directive", async () => {
      const content = "@include('partials.header')";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 18);

      const hoverResult = provider.provideHover(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );
      const hover = await Promise.resolve(hoverResult);

      assert.notStrictEqual(hover, null);
      if (hover) {
        const markdown = hover.contents[0] as vscode.MarkdownString;
        assert.ok(markdown.value.includes("partials.header"));
        assert.ok(markdown.value.includes("Include"));
      }
    });

    test("Should provide hover for volt route", async () => {
      const content = "Volt::route('/dashboard', 'dashboard.index')";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 35);

      const hoverResult = provider.provideHover(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );
      const hover = await Promise.resolve(hoverResult);

      assert.notStrictEqual(hover, null);
      if (hover) {
        const markdown = hover.contents[0] as vscode.MarkdownString;
        assert.ok(markdown.value.includes("dashboard.index"));
        assert.ok(markdown.value.includes("Volt"));
      }
    });

    test("Should return null for invalid position", async () => {
      const content = "<x-button> some text here";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 20);

      const hoverResult = provider.provideHover(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );
      const hover = await Promise.resolve(hoverResult);

      assert.strictEqual(hover, null);
    });
  });

  suite("Hover Content Validation", () => {
    test("Should include component type in hover", async () => {
      const testCases = [
        { content: "<x-button>", position: 5, expectedType: "Blade Component" },
        {
          content: "<flux:input>",
          position: 8,
          expectedType: "Flux Component",
        },
        {
          content: "@livewire('user.profile')",
          position: 15,
          expectedType: "Livewire Component",
        },
        {
          content: "<livewire:dashboard>",
          position: 15,
          expectedType: "Livewire Component",
        },
        {
          content: "@include('partials.header')",
          position: 18,
          expectedType: "Include",
        },
        {
          content: "Volt::route('/test', 'test.component')",
          position: 25,
          expectedType: "Volt",
        },
      ];

      for (const testCase of testCases) {
        const document = await createMockDocument(testCase.content);
        const position = new vscode.Position(0, testCase.position);

        const hoverResult = provider.provideHover(
          document,
          position,
          new vscode.CancellationTokenSource().token
        );
        const hover = await Promise.resolve(hoverResult);

        assert.notStrictEqual(hover, null, `Failed for: ${testCase.content}`);
        if (hover) {
          const markdown = hover.contents[0] as vscode.MarkdownString;
          assert.ok(
            markdown.value.includes(testCase.expectedType),
            `Expected "${testCase.expectedType}" in hover for: ${testCase.content}`
          );
        }
      }
    });

    test("Should include component name in hover", async () => {
      const testCases = [
        {
          content: "<x-forms.input.text>",
          position: 10,
          expectedName: "forms.input.text",
        },
        {
          content: "<flux:button-group>",
          position: 10,
          expectedName: "button-group",
        },
        {
          content: "@livewire('user.profile.edit')",
          position: 20,
          expectedName: "user.profile.edit",
        },
        {
          content: "@include('layouts.master')",
          position: 18,
          expectedName: "layouts.master",
        },
      ];

      for (const testCase of testCases) {
        const document = await createMockDocument(testCase.content);
        const position = new vscode.Position(0, testCase.position);

        const hoverResult = provider.provideHover(
          document,
          position,
          new vscode.CancellationTokenSource().token
        );
        const hover = await Promise.resolve(hoverResult);

        assert.notStrictEqual(hover, null, `Failed for: ${testCase.content}`);
        if (hover) {
          const markdown = hover.contents[0] as vscode.MarkdownString;
          assert.ok(
            markdown.value.includes(testCase.expectedName),
            `Expected "${testCase.expectedName}" in hover for: ${testCase.content}`
          );
        }
      }
    });

    test("Should format hover content as markdown", async () => {
      const content = "<x-button>";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 5);

      const hoverResult = provider.provideHover(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );
      const hover = await Promise.resolve(hoverResult);

      assert.notStrictEqual(hover, null);
      if (hover) {
        assert.ok(hover.contents.length > 0);
        assert.ok(hover.contents[0] instanceof vscode.MarkdownString);
      }
    });
  });

  suite("Position Handling", () => {
    test("Should handle cursor at component boundaries", async () => {
      const content = "<x-button>";
      const document = await createMockDocument(content);

      const hoverStart = await Promise.resolve(
        provider.provideHover(
          document,
          new vscode.Position(0, 0),
          new vscode.CancellationTokenSource().token
        )
      );
      assert.notStrictEqual(hoverStart, null);

      const hoverEnd = await Promise.resolve(
        provider.provideHover(
          document,
          new vscode.Position(0, 9),
          new vscode.CancellationTokenSource().token
        )
      );
      assert.notStrictEqual(hoverEnd, null);
    });

    test("Should handle components with attributes", async () => {
      const content = '<x-button class="primary" id="submit">';
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 5);

      const hoverResult = provider.provideHover(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );
      const hover = await Promise.resolve(hoverResult);

      assert.notStrictEqual(hover, null);
      if (hover) {
        const markdown = hover.contents[0] as vscode.MarkdownString;
        assert.ok(markdown.value.includes("button"));
      }
    });

    test("Should handle multiline components", async () => {
      const content = ["<x-modal", '  title="Test"', '  size="lg">'].join("\n");

      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 0);

      const hoverResult = provider.provideHover(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );
      const hover = await Promise.resolve(hoverResult);

      assert.notStrictEqual(hover, null);

      if (hover) {
        const markdown = hover.contents[0] as vscode.MarkdownString;
        assert.ok(markdown.value.includes("modal"));
      }
    });
  });

  suite("Edge Cases", () => {
    test("Should handle empty line", async () => {
      const content = "";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 0);

      const hoverResult = provider.provideHover(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );
      const hover = await Promise.resolve(hoverResult);

      assert.strictEqual(hover, null);
    });

    test("Should handle line with only whitespace", async () => {
      const content = "   \t   ";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 3);

      const hoverResult = provider.provideHover(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );
      const hover = await Promise.resolve(hoverResult);

      assert.strictEqual(hover, null);
    });

    test("Should handle malformed components", async () => {
      const content = "<x-";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 2);

      const hoverResult = provider.provideHover(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );
      const hover = await Promise.resolve(hoverResult);

      assert.strictEqual(hover, null);
    });

    test("Should handle cursor outside component bounds", async () => {
      const content = "<x-button> normal text here";
      const document = await createMockDocument(content);
      const position = new vscode.Position(0, 20);

      const hoverResult = provider.provideHover(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );
      const hover = await Promise.resolve(hoverResult);

      assert.strictEqual(hover, null);
    });

    test("Should handle nested components correctly", async () => {
      const content = "<x-modal><x-button></x-button></x-modal>";
      const document = await createMockDocument(content);

      const hoverModal = await Promise.resolve(
        provider.provideHover(
          document,
          new vscode.Position(0, 5),
          new vscode.CancellationTokenSource().token
        )
      );
      assert.notStrictEqual(hoverModal, null);
      if (hoverModal) {
        const markdown = hoverModal.contents[0] as vscode.MarkdownString;
        assert.ok(markdown.value.includes("modal"));
      }

      const hoverButton = await Promise.resolve(
        provider.provideHover(
          document,
          new vscode.Position(0, 15),
          new vscode.CancellationTokenSource().token
        )
      );
      assert.notStrictEqual(hoverButton, null);
      if (hoverButton) {
        const markdown = hoverButton.contents[0] as vscode.MarkdownString;
        assert.ok(markdown.value.includes("button"));
      }
    });
  });

  suite("Component Type Detection", () => {
    test("Should correctly identify all component types", async () => {
      const testCases = [
        { content: "<x-button>", position: 5, expectedText: "Blade Component" },
        {
          content: "<x-forms.input>",
          position: 8,
          expectedText: "Blade Component",
        },
        {
          content: "<flux:button>",
          position: 8,
          expectedText: "Flux Component",
        },
        {
          content: "<flux:input.group>",
          position: 10,
          expectedText: "Flux Component",
        },
        {
          content: "@livewire('user.profile')",
          position: 15,
          expectedText: "Livewire Component",
        },
        {
          content: "<livewire:dashboard>",
          position: 15,
          expectedText: "Livewire Component",
        },
        {
          content: "@include('partials.header')",
          position: 18,
          expectedText: "Include",
        },
        {
          content: "Volt::route('/test', 'test.component')",
          position: 25,
          expectedText: "Volt",
        },
      ];

      for (const testCase of testCases) {
        const document = await createMockDocument(testCase.content);
        const position = new vscode.Position(0, testCase.position);

        const hoverResult = provider.provideHover(
          document,
          position,
          new vscode.CancellationTokenSource().token
        );
        const hover = await Promise.resolve(hoverResult);

        assert.notStrictEqual(hover, null, `No hover for: ${testCase.content}`);
        if (hover) {
          const markdown = hover.contents[0] as vscode.MarkdownString;
          assert.ok(
            markdown.value.includes(testCase.expectedText),
            `Expected "${testCase.expectedText}" in hover for: ${testCase.content}, got: ${markdown.value}`
          );
        }
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
