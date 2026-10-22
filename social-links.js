// Shared rules for form submission and administrative link rendering.
function isRealUrl(value) {
    const raw = String(value ?? '').trim();
    if (!raw || /\s/.test(raw)) return false;
    if (/^[a-z][a-z\d+.-]*:/i.test(raw) && !/^https?:\/\//i.test(raw)) return false;
    try {
        const url = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return false;
        const labels = url.hostname.split('.');
        return labels.length >= 2 && labels.every(label =>
            /^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(label)
        ) && /^(?:[a-z]{2,}|xn--[a-z\d-]+)$/i.test(labels[labels.length - 1]);
    } catch {
        return false;
    }
}

function normalizeUrl(value) {
    const raw = String(value ?? '').trim();
    // Recognize N/A even in submissions previously saved with an HTTPS prefix.
    if (/^(?:https?:\/\/)?n\s*\/\s*a\/?$/i.test(raw)) return 'N/A';
    if (!isRealUrl(raw)) return raw;
    return /^https?:\/\//i.test(raw) ? raw : 'https://' + raw;
}
