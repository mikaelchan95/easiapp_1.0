# MCP Server Setup Guide

## Overview
This project is configured to use Model Context Protocol (MCP) servers for enhanced development workflows with Claude Code.

## Configured MCP Servers

### 1. Stripe MCP Server
**Purpose**: Payment processing, webhook management, analytics
**URL**: `https://mcp.stripe.com`
**Authentication**: API Key (restricted)

**Setup**:
```bash
# Add Stripe MCP server
claude mcp add stripe "https://mcp.stripe.com"
```

**Usage Examples**:
- `/mcp__stripe__create-payment-intent`
- `/mcp__stripe__list-customers`
- `/mcp__stripe__validate-webhook`

### 2. Supabase MCP Server
**Purpose**: Database queries, table management, project configuration
**Command**: `npx supabase-mcp --read-only --project-ref vqxnkxaeriizizfmqvua`
**Authentication**: Personal Access Token
**Repository**: https://github.com/supabase-community/supabase-mcp

**Setup**:
```bash
# Add Supabase MCP server (read-only, scoped to project)
claude mcp add supabase "npx supabase-mcp --read-only --project-ref vqxnkxaeriizizfmqvua"
```

**Available Tool Groups**:
- **Account**: Project management and configuration
- **Database**: Table operations, schema management, queries
- **Development**: Development tools and utilities
- **Edge Functions**: Function management and deployment
- **Storage**: File and bucket management
- **Knowledge Base**: Documentation and help resources

**Usage Examples**:
- `/mcp__supabase__list-tables`
- `/mcp__supabase__describe-table "orders"`
- `/mcp__supabase__query "SELECT * FROM orders LIMIT 10"`
- `/mcp__supabase__get-project-config`
- `@supabase:table://orders`

### 3. GitHub MCP Server
**Purpose**: Issue tracking, PR management, repository operations
**Command**: `npx @github/mcp-server`
**Authentication**: GitHub Token

**Setup**:
```bash
# Add GitHub MCP server
claude mcp add github "npx @github/mcp-server"
```

**Usage Examples**:
- `/mcp__github__create-issue`
- `/mcp__github__list-prs`
- `@github:issue://123`

## Environment Variables Required

Add these to your `.env` file:

```env
# Stripe MCP
STRIPE_SECRET_KEY=sk_test_...

# Supabase MCP
SUPABASE_ACCESS_TOKEN=sbp_0d48328ffcb606af7a9bac760ab7963e57b1deea

# GitHub MCP
GITHUB_TOKEN=ghp_...
```

## Setup Commands

```bash
# List all configured MCP servers
claude mcp list

# Get details about a specific server
claude mcp get stripe

# Test server connectivity
claude mcp test stripe
```

## Security Notes

1. **Use Restricted API Keys**: Always use minimum required permissions
2. **Environment Variables**: Never commit API keys to version control
3. **Read-Only Access**: Prefer read-only access for development servers
4. **Regular Audits**: Review server access permissions regularly

## Troubleshooting

### Common Issues:
1. **Server Not Found**: Ensure server is properly configured in `.mcp.json`
2. **Authentication Error**: Check environment variables and API key permissions
3. **Connection Timeout**: Verify network connectivity and server status

### Debug Commands:
```bash
# Check MCP server status
claude mcp status

# View server logs
claude mcp logs stripe

# Reset server configuration
claude mcp reset stripe
```

## Next Steps

1. Test each MCP server configuration
2. Implement enhanced payment flows using Stripe MCP
3. Set up automated database operations with Supabase MCP
4. Configure GitHub integration for issue tracking

## Benefits

- **Real-time Development**: Direct access to external services
- **Enhanced Debugging**: Immediate error resolution and testing
- **Automated Workflows**: Streamlined development processes
- **Better Testing**: Comprehensive test coverage with live data