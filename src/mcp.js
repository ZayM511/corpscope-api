/**
 * CorpScope MCP Server
 * Model Context Protocol interface for AI assistants (Claude Desktop, Cursor, etc.)
 * Run: node src/mcp.js (stdio mode)
 */

const { enrichCompany } = require('./scrapers/company');

const SERVER_INFO = {
  name: 'corpscope',
  version: '1.1.0',
  description: 'Company intelligence — enrich any domain, name, or LinkedIn URL'
};

const TOOLS = [
  {
    name: 'enrich_company',
    description: 'Enrich a company by domain, name, or LinkedIn URL. Returns company info, social links, DNS intelligence (email provider, SPF/DMARC, tech stack).',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Company website domain (e.g. stripe.com)' },
        name: { type: 'string', description: 'Company name (e.g. Stripe)' },
        linkedin: { type: 'string', description: 'LinkedIn company URL' }
      }
    }
  }
];

// JSON-RPC handler
const handleRequest = async (request) => {
  const { method, params, id } = request;

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: SERVER_INFO,
          capabilities: { tools: {} }
        }
      };

    case 'notifications/initialized':
      return null; // No response for notifications

    case 'tools/list':
      return {
        jsonrpc: '2.0', id,
        result: { tools: TOOLS }
      };

    case 'tools/call': {
      const { name, arguments: args } = params;

      if (name === 'enrich_company') {
        try {
          const result = await enrichCompany(args);
          return {
            jsonrpc: '2.0', id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }]
            }
          };
        } catch (error) {
          return {
            jsonrpc: '2.0', id,
            result: {
              content: [{ type: 'text', text: `Error: ${error.message}` }],
              isError: true
            }
          };
        }
      }

      return {
        jsonrpc: '2.0', id,
        error: { code: -32601, message: `Unknown tool: ${name}` }
      };
    }

    default:
      return {
        jsonrpc: '2.0', id,
        error: { code: -32601, message: `Method not found: ${method}` }
      };
  }
};

// stdio transport
let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', async (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const request = JSON.parse(line);
      const response = await handleRequest(request);
      if (response) {
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } catch (e) {
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0', id: null,
        error: { code: -32700, message: 'Parse error' }
      }) + '\n');
    }
  }
});

process.stderr.write(`CorpScope MCP Server v${SERVER_INFO.version} ready (stdio)\n`);
