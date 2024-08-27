#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import readlineSync from 'readline-sync';

const todoFile = path.join(process.cwd(), 'todo.json');

function readTodo() {
	if (!fs.existsSync(todoFile)) {
		return [];
	}
	const data = fs.readFileSync(todoFile, 'utf8');
	return JSON.parse(data);
}

function writeTodo(todos) {
	fs.writeFileSync(todoFile, JSON.stringify(todos, null, 2));
}

// Display the available commands
function displayHelp() {
	console.log(chalk.green(figlet.textSync('TodoPro')));
	console.log(chalk.cyan('\nAvailable Commands:'));
	console.log(chalk.yellow('  todopro add <task>     ') + 'Add a new todo');
	console.log(
		chalk.yellow('  todopro rm <task>      ') + 'Delete a todo by task'
	);
	console.log(
		chalk.yellow('  todopro done <task>    ') + 'Mark a todo as done by task'
	);
	console.log(chalk.yellow('  todopro edit <id>      ') + 'Edit a todo by ID');
	console.log(chalk.yellow('  todopro ls             ') + 'List all todos');
	console.log(
		chalk.yellow('  todopro ls p           ') + 'List all pending todos'
	);
	console.log(
		chalk.yellow('  todopro ls d           ') + 'List all done todos'
	);
	console.log(
		chalk.yellow('  todopro reset          ') + 'Reset (clear) all todos'
	);
	console.log(
		chalk.yellow('  todopro h              ') + 'Display this help menu'
	);
}

// List todos based on status (pending or done)
function listTodos(status) {
	const todos = readTodo();
	if (todos.length === 0) {
		console.log(chalk.red('No todos found.'));
		return;
	}

	todos.forEach((todo) => {
		const todoStatus = todo.done ? '[x]' : '[ ]';
		if (status === 'p' && !todo.done) {
			console.log(chalk.blue(`${todoStatus} ${todo.id}: ${todo.task}`));
		} else if (status === 'd' && todo.done) {
			console.log(chalk.green(`${todoStatus} ${todo.id}: ${todo.task}`));
		} else if (!status) {
			console.log(chalk.blue(`${todoStatus} ${todo.id}: ${todo.task}`));
		}
	});
}

// Reset all todos
function resetTodos() {
	if (fs.existsSync(todoFile)) {
		fs.unlinkSync(todoFile);
		console.log(chalk.green('All todos have been cleared.'));
	} else {
		console.log(chalk.red('No todos to reset.'));
	}
}

class TodoPro {
	constructor() {
		this.program = new Command();
		this.initializeCLI();
	}

	initializeCLI() {
		this.program.name('todopro').description('TodoPro CLI').version('2.0.0');

		this.program
			.command('add <task>')
			.description('Add a new todo')
			.action((task) => {
				const todos = readTodo();
				const newTodo = {
					id: String(todos.length + 1),
					task,
					done: false,
				};
				todos.push(newTodo);
				writeTodo(todos);
				console.log(chalk.green(`Added new todo: "${task}"`));
			});

		this.program
			.command('rm <task>')
			.description('Delete a todo by task')
			.action((task) => {
				let todos = readTodo();
				const index = todos.findIndex(
					(todo) => todo.task.toLowerCase().trim() === task.toLowerCase().trim()
				);
				if (index !== -1) {
					todos.splice(index, 1);
					// Update IDs after deletion
					todos = todos.map((todo, idx) => ({ ...todo, id: String(idx + 1) }));
					writeTodo(todos);
					console.log(chalk.red(`Deleted todo: "${task}"`));
				} else {
					console.log(chalk.red(`Todo: "${task}" not found`));
				}
			});

		this.program
			.command('done <task>')
			.description('Mark a todo as done by task')
			.action((task) => {
				const todos = readTodo();
				const todo = todos.find(
					(todo) => todo.task.toLowerCase().trim() === task.toLowerCase().trim()
				);
				if (todo) {
					todo.done = true;
					writeTodo(todos);
					console.log(chalk.yellow(`Marked todo: "${task}" as done`));
				} else {
					console.log(chalk.red(`Todo: "${task}" not found`));
				}
			});

		this.program
			.command('edit <id>')
			.description('Edit a todo by ID')
			.action((id) => {
				const todos = readTodo();
				const todo = todos.find((todo) => todo.id === id);
				if (todo) {
					console.log(chalk.blue(`Current task: ${todo.task}`));
					const newTask = readlineSync.question('Enter new task description: ');
					if (newTask.trim()) {
						todo.task = newTask.trim();
						writeTodo(todos);
						console.log(chalk.green(`Todo ID ${id} has been updated.`));
					} else {
						console.log(chalk.red('No changes made.'));
					}
				} else {
					console.log(chalk.red(`Todo with ID ${id} not found.`));
				}
			});

		this.program
			.command('ls [status]')
			.description('List todos based on status (p: pending, d: done)')
			.action((status) => listTodos(status));

		this.program
			.command('reset')
			.description('Reset (clear) all todos')
			.action(() => resetTodos());

		this.program.command('h').description('Display help').action(displayHelp);

		// Handle invalid commands
		this.program.on('command:*', () => {
			console.error(chalk.red('Invalid command!'));
			displayHelp();
			process.exit(1);
		});

		this.program.parse(process.argv);
	}
}

const todopro = new TodoPro();
export default todopro;
