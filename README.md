# Habityzer CLI

A powerful command-line interface for managing your Habityzer tasks directly from your terminal. Perfect for developers who want to integrate task management into their workflow.

## 🚀 Installation

Install the Habityzer CLI locally in your project:

```bash
npm install habityzer-cli
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in your project root or set these environment variables:

```bash
# Required
HABITYZER_API_TOKEN=your_api_token_here

# Optional (with defaults)
HABITYZER_PROJECT_ID=2                           # Default project ID
HABITYZER_API_BASE_URL=https://s.habityzer.com/api  # API base URL
```

### Getting Your API Token

1. Log into your Habityzer account
2. Navigate to API settings
3. Generate a new API token
4. Copy the token to your `.env` file

## 📖 Usage

### Basic Commands

After installation, you can use the CLI with `npx`:

```bash
# List all active tasks
npx habityzer list

# List all tasks (including completed)
npx habityzer list --all

# Create a new task
npx habityzer create "Fix bug in authentication"

# Create a task with description
npx habityzer create "Implement feature X" --description "Add new functionality for user management"

# Update task status
npx habityzer update 123 --status 3  # Move to "In Progress"

# Show task details
npx habityzer show 123

# Delete a task
npx habityzer delete 123

# List all projects
npx habityzer projects

# List task statuses
npx habityzer statuses
```

### NPM Scripts Integration

Add Habityzer commands to your `package.json` scripts:

```json
{
  "scripts": {
    "tasks": "habityzer list",
    "tasks:all": "habityzer list --all",
    "task:create": "habityzer create",
    "task:show": "habityzer show"
  }
}
```

Then use them with:

```bash
npm run tasks
npm run task:create "New task title"
```

## 🎯 Cursor Integration

### Method 1: Terminal Integration

1. Open Cursor terminal (`Ctrl/Cmd + J`)
2. Run Habityzer commands directly:
   ```bash
   npx habityzer list
   ```

### Method 2: Custom Commands

Add Cursor custom commands by creating `.cursor/commands.json`:

```json
{
  "commands": [
    {
      "name": "List Habityzer Tasks",
      "command": "npx habityzer list",
      "type": "terminal"
    },
    {
      "name": "Create Habityzer Task",
      "command": "npx habityzer create \"${input:taskTitle}\"",
      "type": "terminal"
    }
  ]
}
```

### Method 3: Workspace Tasks

Add to `.vscode/tasks.json` (also works in Cursor):

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "List Tasks",
      "type": "shell",
      "command": "npx",
      "args": ["habityzer", "list"],
      "group": "build"
    },
    {
      "label": "Create Task",
      "type": "shell",
      "command": "npx",
      "args": ["habityzer", "create", "${input:taskTitle}"],
      "group": "build"
    }
  ],
  "inputs": [
    {
      "id": "taskTitle",
      "description": "Task title",
      "default": "New task",
      "type": "promptString"
    }
  ]
}
```

## 📋 Command Reference

### `list [options]`
List tasks with optional filters.

**Options:**
- `--all` - Include completed tasks
- `--project <id>` - Filter by project ID
- `--status <id>` - Filter by status ID

**Examples:**
```bash
npx habityzer list                    # Active tasks only
npx habityzer list --all              # All tasks
npx habityzer list --project 1        # Tasks from project 1
npx habityzer list --status 2         # Tasks with status "Todo"
```

### `create <title> [options]`
Create a new task.

**Arguments:**
- `<title>` - Task title (required)

**Options:**
- `--description <text>` - Task description
- `--status <id>` - Initial status (default: 2 = Todo)
- `--priority <level>` - Priority level 1-5 (default: 2)

**Examples:**
```bash
npx habityzer create "Fix login bug"
npx habityzer create "New feature" --description "Implement user dashboard" --priority 3
```

### `show <taskId>`
Display detailed information about a specific task.

**Examples:**
```bash
npx habityzer show 123
```

### `update <taskId> [options]`
Update an existing task.

**Arguments:**
- `<taskId>` - Task ID to update

**Options:**
- `--title <text>` - New title
- `--description <text>` - New description
- `--status <id>` - New status ID
- `--priority <level>` - New priority level

**Examples:**
```bash
npx habityzer update 123 --status 3              # Move to "In Progress"
npx habityzer update 123 --title "Updated title"
npx habityzer update 123 --priority 4 --status 4 # High priority, completed
```

### `delete <taskId>`
Delete a task permanently.

**Examples:**
```bash
npx habityzer delete 123
```

### `projects`
List all available projects.

### `statuses`
List all available task statuses.

## 🔧 Development Workflow

### Quick Task Creation
```bash
# Start working on a feature
npx habityzer create "Implement user authentication" --status 3

# Check current tasks
npx habityzer list

# Mark as complete when done
npx habityzer update 123 --status 4
```

### Integration with Git Hooks
Add to `.husky/pre-commit`:

```bash
#!/bin/sh
npx habityzer list --status 3  # Show in-progress tasks before commit
```

## 🛠️ Troubleshooting

### Common Issues

**"API token required" error:**
- Ensure `HABITYZER_API_TOKEN` is set in your `.env` file
- Verify the token is valid and hasn't expired

**"Failed to fetch tasks" error:**
- Check your internet connection
- Verify `HABITYZER_API_BASE_URL` is correct
- Ensure your API token has proper permissions

**Command not found:**
- Run `npm install habityzer-cli` to ensure it's installed
- Use `npx habityzer` instead of just `habityzer`

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 🔗 Links

- [GitHub Repository](https://github.com/habityzer/habityzer-cli)
- [NPM Package](https://www.npmjs.com/package/habityzer-cli)
- [Habityzer Platform](https://habityzer.com)
- [Report Issues](https://github.com/habityzer/habityzer-cli/issues)

## 📊 Task Status Reference

Common status IDs:
- `1` - Idea
- `2` - Todo
- `3` - In Progress
- `4` - Done

Use `npx habityzer statuses` to see all available statuses for your workspace. 