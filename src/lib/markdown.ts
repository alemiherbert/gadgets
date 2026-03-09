function escapeHtml(input: string): string {
	return input
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function sanitizeUrl(url: string): string {
	const trimmed = url.trim();
	if (/^(https?:|mailto:|tel:|\/)/i.test(trimmed)) {
		return trimmed;
	}
	return '#';
}

function parseInline(markdown: string): string {
	let text = escapeHtml(markdown);

	text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
	text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
	text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
	text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
	text = text.replace(/_([^_]+)_/g, '<em>$1</em>');

	text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string, url: string) => {
		const safe = escapeHtml(sanitizeUrl(url));
		return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${label}</a>`;
	});

	return text;
}

function stripMarkdown(markdown: string): string {
	return markdown
		.replace(/```[\s\S]*?```/g, '')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
		.replace(/(^|\s)#+\s+/gm, '$1')
		.replace(/[*_~>-]/g, '')
		.replace(/\n{2,}/g, '\n')
		.trim();
}

export function markdownExcerpt(markdown: string, maxLength: number): string {
	const plain = stripMarkdown(markdown);
	if (plain.length <= maxLength) return plain;
	return plain.slice(0, maxLength).trimEnd() + '...';
}

export function renderMarkdown(markdown: string): string {
	const src = (markdown || '').replace(/\r\n/g, '\n').trim();
	if (!src) return '';

	const lines = src.split('\n');
	const html: string[] = [];
	let inUl = false;
	let inOl = false;

	const closeLists = () => {
		if (inUl) {
			html.push('</ul>');
			inUl = false;
		}
		if (inOl) {
			html.push('</ol>');
			inOl = false;
		}
	};

	for (const rawLine of lines) {
		const line = rawLine.trim();

		if (!line) {
			closeLists();
			continue;
		}

		const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
		if (headingMatch) {
			closeLists();
			const level = headingMatch[1].length;
			html.push(`<h${level}>${parseInline(headingMatch[2])}</h${level}>`);
			continue;
		}

		const ulMatch = line.match(/^[-*]\s+(.+)$/);
		if (ulMatch) {
			if (inOl) {
				html.push('</ol>');
				inOl = false;
			}
			if (!inUl) {
				html.push('<ul>');
				inUl = true;
			}
			html.push(`<li>${parseInline(ulMatch[1])}</li>`);
			continue;
		}

		const olMatch = line.match(/^\d+\.\s+(.+)$/);
		if (olMatch) {
			if (inUl) {
				html.push('</ul>');
				inUl = false;
			}
			if (!inOl) {
				html.push('<ol>');
				inOl = true;
			}
			html.push(`<li>${parseInline(olMatch[1])}</li>`);
			continue;
		}

		if (line.startsWith('>')) {
			closeLists();
			html.push(`<blockquote>${parseInline(line.replace(/^>\s?/, ''))}</blockquote>`);
			continue;
		}

		closeLists();
		html.push(`<p>${parseInline(line)}</p>`);
	}

	closeLists();
	return html.join('\n');
}
