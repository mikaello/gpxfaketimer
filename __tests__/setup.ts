import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

// Polyfill browser DOM APIs for Node.js test environment
(globalThis as unknown as Record<string, unknown>).DOMParser = DOMParser;
(globalThis as unknown as Record<string, unknown>).XMLSerializer = XMLSerializer;
