#!/usr/bin/env node

const https = require('https')

// Load environment variables from .env file
require('dotenv').config()

// Configuration
const CONFIG = {
  baseUrl: process.env.HABITYZER_API_BASE_URL || 'https://s.habityzer.com/api',
  token: process.env.HABITYZER_API_TOKEN,
  projectId: parseInt(process.env.HABITYZER_PROJECT_ID) || 2
}

// Validate required configuration
if (!CONFIG.token) {
  console.error('❌ HABITYZER_API_TOKEN environment variable is required')
  console.log('Please add your token to .env file:')
  console.log('HABITYZER_API_TOKEN=your_token_here')
  process.exit(1)
}

// Helper function to make API requests
function makeApiRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    // Fix URL construction - don't use leading slash if baseUrl already has /api
    const fullUrl = endpoint.startsWith('/')
      ? `${CONFIG.baseUrl}${endpoint}`
      : `${CONFIG.baseUrl}/${endpoint}`
    const url = new URL(fullUrl)

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${CONFIG.token}`,
        'Content-Type': method === 'PATCH' ? 'application/merge-patch+json' : 'application/json',
        'Accept': 'application/ld+json'
      }
    }

    if (data && (method === 'POST' || method === 'PATCH')) {
      const jsonData = JSON.stringify(data)
      options.headers['Content-Length'] = Buffer.byteLength(jsonData)
    }

    const req = https.request(options, (res) => {
      let responseData = ''

      res.on('data', (chunk) => {
        responseData += chunk
      })

      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const parsed = responseData ? JSON.parse(responseData) : null
            resolve(parsed)
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`))
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`))
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    if (data && (method === 'POST' || method === 'PATCH')) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

// Task Operations
async function getTasks(filters = {}) {
  try {
    let endpoint = '/tasks'
    const queryParams = new URLSearchParams()

    // Add pagination
    queryParams.append('page', '1')

    // Add project filter (default to configured project)
    const projectId = filters.projectId || CONFIG.projectId
    if (projectId) {
      queryParams.append('project[]', `/api/projects/${projectId}`)
    }

    // Default to active statuses only (Todo + In Progress, exclude Idea + Done)
    if (filters.statusIds) {
      // Use specific status IDs if provided
      filters.statusIds.forEach((statusId) => {
        queryParams.append('status[]', `/api/task_statuses/${statusId}`)
      })
    } else if (filters.includeAll !== true) {
      // Default: only Todo (2) and In Progress (3)
      queryParams.append('status[]', '/api/task_statuses/2') // Todo
      queryParams.append('status[]', '/api/task_statuses/3') // In Progress
    }

    endpoint += '?' + queryParams.toString()

    const response = await makeApiRequest(endpoint)
    return response.member || response
  } catch (error) {
    console.error('❌ Failed to fetch tasks:', error.message)
    return []
  }
}

async function getTaskStatuses() {
  try {
    const response = await makeApiRequest('/task_statuses?page=1')
    return response.member || response
  } catch (error) {
    console.error('❌ Failed to fetch task statuses:', error.message)
    return []
  }
}

async function getProjects() {
  try {
    const response = await makeApiRequest('projects?page=1')
    return response.member || response
  } catch (error) {
    console.error('❌ Failed to fetch projects:', error.message)
    return []
  }
}

async function createTask(title, description = '', statusId = null, priority = 2) {
  try {
    const taskData = {
      title,
      description,
      priority,
      status: statusId ? `/api/task_statuses/${statusId}` : `/api/task_statuses/2`, // Default to Todo
      project: `/api/projects/${CONFIG.projectId}`
    }

    const response = await makeApiRequest('/tasks', 'POST', taskData)
    console.log('✅ Task created successfully:', response.title)
    return response
  } catch (error) {
    console.error('❌ Failed to create task:', error.message)
    throw error
  }
}

async function updateTask(taskId, updates) {
  try {
    const response = await makeApiRequest(`/tasks/${taskId}`, 'PATCH', updates)
    console.log('✅ Task updated successfully:', response.title)
    return response
  } catch (error) {
    console.error('❌ Failed to update task:', error.message)
    throw error
  }
}

async function getTask(taskId) {
  try {
    const response = await makeApiRequest(`/tasks/${taskId}`)
    return response
  } catch (error) {
    console.error('❌ Failed to fetch task:', error.message)
    throw error
  }
}

async function deleteTask(taskId) {
  try {
    await makeApiRequest(`/tasks/${taskId}`, 'DELETE')
    console.log('✅ Task deleted successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to delete task:', error.message)
    throw error
  }
}

async function moveTaskToStatus(taskId, statusId) {
  try {
    const updates = {
      status: `/api/task_statuses/${statusId}`
    }

    if (statusId && typeof statusId === 'string' && statusId.toLowerCase().includes('complet')) {
      updates.completedAt = new Date().toISOString()
    }

    return await updateTask(taskId, updates)
  } catch (error) {
    console.error('❌ Failed to move task:', error.message)
    throw error
  }
}

// Display Functions
function displayTasks(tasks, title = 'Tasks') {
  console.log(`\n📋 ${title}`)
  console.log('=' + '='.repeat(title.length + 5))

  if (tasks.length === 0) {
    console.log('   No tasks found.')
    return
  }

  tasks.forEach((task, index) => {
    // Handle both IRI references (collection view) and full objects (detail view)
    const status = task.status?.name || (typeof task.status === 'string' ? 'Status Set' : 'No Status')
    const priority = '★'.repeat(task.priority || 1)
    const dueDate = task.dueDate ? ` (Due: ${new Date(task.dueDate).toLocaleDateString()})` : ''
    const project = task.project?.name || (typeof task.project === 'string' ? 'Project Set' : 'No Project')

    console.log(`\n${index + 1}. [ID: ${task.id}] ${task.title}`)
    console.log(`   Project: ${project} | Status: ${status} | Priority: ${priority}${dueDate}`)
    if (task.description) {
      console.log(`   Description: ${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}`)
    }
  })
  console.log('')
}

function displayTaskStatuses(statuses) {
  console.log('\n📊 Available Task Statuses:')
  console.log('==========================')
  statuses.forEach((status, index) => {
    console.log(`${index + 1}. [ID: ${status.id}] ${status.name}`)
  })
  console.log('')
}

function displayProjects(projects) {
  console.log('\n📁 Available Projects:')
  console.log('=====================')
  projects.forEach((project, index) => {
    const color = project.color ? ` (${project.color})` : ''
    const shortName = project.shortName ? ` [${project.shortName}]` : ''
    console.log(`${index + 1}. [ID: ${project.id}] ${project.name}${shortName}${color}`)
    if (project.description) {
      console.log(`   Description: ${project.description}`)
    }
  })
  console.log('')
}

function displayTaskDetails(task) {
  console.log('\n📋 Task Details')
  console.log('===============')

  const status = task.status?.name || 'No Status'
  const priority = '★'.repeat(task.priority || 1)
  const dueDate = task.dueDate ? ` | Due: ${new Date(task.dueDate).toLocaleDateString()}` : ''
  const project = task.project?.name || 'No Project'
  const completedAt = task.completedAt ? ` | Completed: ${new Date(task.completedAt).toLocaleDateString()}` : ''

  console.log(`\n🆔 ID: ${task.id}`)
  console.log(`📝 Title: ${task.title}`)
  console.log(`📁 Project: ${project}`)
  console.log(`📊 Status: ${status}`)
  console.log(`⭐ Priority: ${priority}${dueDate}${completedAt}`)

  if (task.description) {
    console.log(`\n📄 Description:`)
    console.log(`${task.description}`)
  }

  if (task.createdAt) {
    console.log(`\n📅 Created: ${new Date(task.createdAt).toLocaleDateString()}`)
  }

  console.log('')
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  console.log(`🚀 Habityzer CLI - Project ID: ${CONFIG.projectId}`)

  try {
    switch (command) {
      case 'list':
      case 'tasks': {
        const filter = args[1]
        let tasks
        if (filter === 'done' || filter === 'completed') {
          tasks = await getTasks({ statusIds: [4] }) // Done status
          displayTasks(tasks, 'Completed Tasks')
        } else if (filter === 'todo') {
          tasks = await getTasks({ statusIds: [2] }) // Todo only
          displayTasks(tasks, 'Todo Tasks')
        } else if (filter === 'progress' || filter === 'in-progress') {
          tasks = await getTasks({ statusIds: [3] }) // In Progress only
          displayTasks(tasks, 'In Progress Tasks')
        } else if (filter === 'idea' || filter === 'ideas') {
          tasks = await getTasks({ statusIds: [1] }) // Ideas only
          displayTasks(tasks, 'Ideas')
        } else if (filter === 'all') {
          tasks = await getTasks({ includeAll: true })
          displayTasks(tasks, 'All Tasks (All Statuses)')
        } else {
          // Default: show only active tasks (Todo + In Progress, exclude Ideas + Done)
          tasks = await getTasks()
          displayTasks(tasks, 'Active Tasks (Todo & In-Progress)')
        }
        break
      }

      case 'statuses': {
        const statuses = await getTaskStatuses()
        displayTaskStatuses(statuses)
        break
      }

      case 'projects': {
        const projects = await getProjects()
        displayProjects(projects)
        break
      }

      case 'show': {
        const taskId = args[1]
        if (!taskId) {
          console.log('❌ Please provide a task ID: node habityzer-cli.js show <taskId>')
          return
        }
        const task = await getTask(taskId)
        displayTaskDetails(task)
        break
      }

      case 'create': {
        const title = args[1]
        const description = args[2] || ''
        if (!title) {
          console.log('❌ Please provide a task title: node habityzer-cli.js create "Task title" "Description"')
          return
        }
        await createTask(title, description)
        break
      }

      case 'update': {
        const taskId = args[1]
        const field = args[2]
        const value = args[3]
        if (!taskId || !field || !value) {
          console.log('❌ Usage: node habityzer-cli.js update <taskId> <field> <value>')
          return
        }
        const updates = {}
        updates[field] = value
        await updateTask(taskId, updates)
        break
      }

      case 'move': {
        const moveTaskId = args[1]
        const statusId = args[2]
        if (!moveTaskId || !statusId) {
          console.log('❌ Usage: node habityzer-cli.js move <taskId> <statusId>')
          return
        }
        await moveTaskToStatus(moveTaskId, statusId)
        break
      }

      case 'delete': {
        const deleteTaskId = args[1]
        if (!deleteTaskId) {
          console.log('❌ Usage: node habityzer-cli.js delete <taskId>')
          return
        }
        await deleteTask(deleteTaskId)
        break
      }

      case 'help':
      default:
        console.log(`
📖 Available Commands:
=====================

 📋 Viewing Data:
  list [filter]                 - List tasks (default: active only)
  show <taskId>                 - Show detailed task info with description
  projects                      - Show available projects  
  statuses                      - Show available task statuses
  
✏️ Managing Tasks:
  create "title" "description"  - Create new task
  update <id> <field> <value>   - Update task field
  move <id> <statusId>          - Move task to status
  delete <id>                   - Delete task
  
📚 Examples:
  node habityzer-cli.js list                # Active tasks (todo + in-progress)
  node habityzer-cli.js list todo           # Todo tasks only
  node habityzer-cli.js list progress       # In progress tasks only
  node habityzer-cli.js list done           # Completed tasks
  node habityzer-cli.js list ideas          # Ideas only
  node habityzer-cli.js list all            # All tasks (all statuses)
  node habityzer-cli.js show 123
  node habityzer-cli.js create "Fix bug" "Fix the authentication issue"

🔍 Available Filters:
  • Default: Active tasks only (Todo + In Progress, excludes Ideas + Done)
  • Status filters: 'todo', 'progress', 'done', 'ideas', 'all'
  • Project: Automatically filtered to current project (ID: ${CONFIG.projectId})
`)
        break
    }
  } catch (error) {
    console.error('💥 Error:', error.message)
    process.exit(1)
  }
}

// Run if called directly or from binary
if (require.main === module || require.main.filename.includes('bin/habityzer')) {
  main()
}

module.exports = {
  getTasks,
  getTask,
  getTaskStatuses,
  createTask,
  updateTask,
  deleteTask,
  moveTaskToStatus,
  CONFIG
}
