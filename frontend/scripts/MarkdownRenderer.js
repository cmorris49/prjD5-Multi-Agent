// Small, dependency-free Markdown renderer for agent answers.
// All text is HTML-escaped before any formatting is applied, so model
// output can never inject markup. Supports the subset models actually use:
// headings, paragraphs, bullet/numbered lists, blockquotes, code blocks,
// horizontal rules, **bold**, *italic*, `code` and http(s) links.
export class MarkdownRenderer {
    render(markdown) {
        const lines = String(markdown ?? "").replace(/\r\n?/g, "\n").split("\n");
        const html = [];
        let index = 0;

        while (index < lines.length) {
            const line = lines[index];

            if (/^\s*```/.test(line)) {
                const code = [];
                index++;

                while (index < lines.length && !/^\s*```/.test(lines[index])) {
                    code.push(lines[index]);
                    index++;
                }

                index++;
                html.push(`<pre><code>${this.#escape(code.join("\n"))}</code></pre>`);
                continue;
            }

            if (!line.trim()) {
                index++;
                continue;
            }

            const heading = line.match(/^\s*(#{1,6})\s+(.*)$/);

            if (heading) {
                // Answers sit under an h3 card title, so start at h4.
                const level = Math.min(heading[1].length + 3, 6);
                html.push(`<h${level}>${this.#inline(heading[2])}</h${level}>`);
                index++;
                continue;
            }

            if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
                html.push("<hr>");
                index++;
                continue;
            }

            if (/^\s*>/.test(line)) {
                const quote = [];

                while (index < lines.length && /^\s*>/.test(lines[index])) {
                    quote.push(lines[index].replace(/^\s*>\s?/, ""));
                    index++;
                }

                html.push(`<blockquote>${this.render(quote.join("\n"))}</blockquote>`);
                continue;
            }

            const listType = this.#listType(line);

            if (listType) {
                const items = [];

                while (index < lines.length && this.#listType(lines[index]) === listType) {
                    let item = lines[index].replace(/^\s*(?:[-*+]|\d+[.)])\s+/, "");
                    index++;

                    // Indented continuation lines belong to the same item.
                    while (index < lines.length &&
                        /^\s{2,}\S/.test(lines[index]) &&
                        !this.#listType(lines[index])) {
                        item += ` ${lines[index].trim()}`;
                        index++;
                    }

                    items.push(`<li>${this.#inline(item)}</li>`);
                }

                const tag = listType === "ol" ? "ol" : "ul";
                html.push(`<${tag}>${items.join("")}</${tag}>`);
                continue;
            }

            const paragraph = [];

            while (index < lines.length &&
                lines[index].trim() &&
                !this.#startsBlock(lines[index])) {
                paragraph.push(this.#inline(lines[index].trim()));
                index++;
            }

            html.push(`<p>${paragraph.join("<br>")}</p>`);
        }

        return html.join("");
    }

    #listType(line) {
        if (/^\s*[-*+]\s+/.test(line)) {
            return "ul";
        }

        if (/^\s*\d+[.)]\s+/.test(line)) {
            return "ol";
        }

        return null;
    }

    #startsBlock(line) {
        return /^\s*(```|#{1,6}\s|>)/.test(line) ||
            /^\s*([-*_])(\s*\1){2,}\s*$/.test(line) ||
            this.#listType(line) !== null;
    }

    #inline(text) {
        // Split on inline code first so its contents are left untouched.
        return text.split(/(`[^`]+`)/).map(part => {
            if (/^`[^`]+`$/.test(part)) {
                return `<code>${this.#escape(part.slice(1, -1))}</code>`;
            }

            return this.#escape(part)
                .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                .replace(/__(.+?)__/g, "<strong>$1</strong>")
                .replace(/(^|[^*\w])\*(?!\s)(.+?)(?<!\s)\*(?!\w)/g, "$1<em>$2</em>")
                .replace(/(^|[^\w])_(?!\s)(.+?)(?<!\s)_(?!\w)/g, "$1<em>$2</em>")
                .replace(
                    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
                    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
                );
        }).join("");
    }

    #escape(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
}
