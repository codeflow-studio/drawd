import { describe, it, expect } from "vitest";
import { renderMarkdown } from "./InstructionsPanel.jsx";

describe("renderMarkdown — XSS hardening", () => {
  it("escapes <script> tags in plain text", () => {
    const html = renderMarkdown('<script>alert("xss")</script>');
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes < and > inside headings", () => {
    const html = renderMarkdown("# Title <b>bold</b>");
    expect(html).not.toContain("<b>");
    expect(html).toContain("&lt;b&gt;");
    expect(html).toContain("<h1");
  });

  it("escapes \" in image alt attributes so it cannot break out of the attribute", () => {
    const html = renderMarkdown('![foo" onerror="alert(1)](https://example.com/img.png)');
    // The " chars must be escaped to &quot; — this prevents the alt attribute from closing early
    // and keeps onerror= contained as literal text within the attribute value, not a standalone attribute
    expect(html).toContain('alt="foo&quot; onerror=&quot;alert(1)"');
  });

  it("blocks javascript: URIs in image src", () => {
    const html = renderMarkdown("![img](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('src="#"');
  });

  it("blocks data: URIs in image src", () => {
    const html = renderMarkdown("![img](data:text/html,<script>alert(1)</script>)");
    expect(html).not.toContain("data:text");
    expect(html).toContain('src="#"');
  });

  it("allows https: image src", () => {
    const html = renderMarkdown("![img](https://example.com/photo.png)");
    expect(html).toContain('src="https://example.com/photo.png"');
  });

  it("renders code fences as <pre><code> with escaped content", () => {
    const html = renderMarkdown("```\n<script>alert(1)</script>\n```");
    expect(html).toContain("<pre");
    expect(html).toContain("<code>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("does not apply inlineFormat inside code fences", () => {
    const html = renderMarkdown("```\n**not bold**\n```");
    expect(html).not.toContain("<strong>");
    expect(html).toContain("**not bold**");
  });

  it("escapes & in plain text", () => {
    const html = renderMarkdown("foo & bar");
    expect(html).toContain("&amp;");
    expect(html).not.toMatch(/[^;]&[^a-z#]/);
  });
});
