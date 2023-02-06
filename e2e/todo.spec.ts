/*
 Stephen Fang - Technical Assessment Test
 */

import { test, expect, Page } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

test.beforeEach(async ({ page }) => {
  await page.goto('https://todomvc.com/examples/react/#/');
});

const TODO_ITEMS = [
  'item one',
  'item two'
];

test('Create a new todo item', async ({ page }) => {
  // Create 1st todo.
  await page.locator('.new-todo').fill(TODO_ITEMS[0]);
  await page.locator('.new-todo').press('Enter');

  // Verify there is one todo item in the list.
  await expect(page.locator('.view label')).toHaveText([TODO_ITEMS[0]]);

  // Create 2nd todo.
  await page.locator('.new-todo').fill(TODO_ITEMS[1]);
  await page.locator('.new-todo').press('Enter');

  // Verify 2 todo items in the list.
  await expect(page.locator('.view label')).toHaveText(TODO_ITEMS);
  await expect(page.locator('.todo-count')).toHaveText('2 items left');

  await checkNumberOfTodosInLocalStorage(page, 2);

  // Verify the last item in the list is the last one we added.
  await expect(page.locator('.todo-list li')).toHaveCount(2);
  const secondTodo = page.locator('.todo-list li').nth(1);
  await expect(secondTodo.locator('label')).toHaveText(TODO_ITEMS[1]);
});

test('Edit an existing todo item', async ({ page }) => {
  // Initiate 2 items in todo list
  for (const item of TODO_ITEMS) {
    await page.locator('.new-todo').fill(item);
    await page.locator('.new-todo').press('Enter');
  }

  // Edit the 2nd todo item
  const todoItems = page.locator('.todo-list li');
  const secondTodo = todoItems.nth(1);
  await secondTodo.dblclick();
  await expect(secondTodo.locator('.edit')).toHaveValue(TODO_ITEMS[1]);
  await secondTodo.locator('.edit').fill('modified item two');
  await secondTodo.locator('.edit').press('Enter');

  // Verify the list contains 2 todo items and the 2nd todo item has a new value.
  await expect(todoItems).toHaveText([TODO_ITEMS[0], 'modified item two']);
  await expect(page.locator('.view label')).toHaveText([TODO_ITEMS[0], 'modified item two']);
  await expect(page.locator('.todo-count')).toHaveText('2 items left');

  await checkNumberOfTodosInLocalStorage(page, 2);
  await checkTodosInLocalStorage(page, 'modified item two');
});

test('Delete a todo item using the red X', async ({ page }) => {
  // Initiate 2 items in todo list
  for (const item of TODO_ITEMS) {
    await page.locator('.new-todo').fill(item);
    await page.locator('.new-todo').press('Enter');
  }

  // Delete the first todo item using red X
  const todoItems = page.locator('.todo-list li');
  const secondTodo = todoItems.nth(0);
  await secondTodo.locator('.destroy').dispatchEvent('click');

  // Verify the 2nd todo item is the only one remaining in the list
  await expect(page.locator('.todo-count')).toHaveText('1 item left');
  await expect(page.locator('.view label')).toHaveText(TODO_ITEMS[1]);

  await checkNumberOfTodosInLocalStorage(page, 1);
  await checkTodosInLocalStorage(page, TODO_ITEMS[1]);
});

test('Mark a todo item as completed', async ({ page }) => {
  // Create 1st todo.
  await page.locator('.new-todo').fill(TODO_ITEMS[0]);
  await page.locator('.new-todo').press('Enter');

  // Verify there is one todo item in the list.
  await expect(page.locator('.view label')).toHaveText([TODO_ITEMS[0]]);

  // Mark the first todo item as completed and verify
  const firstTodo = page.locator('.todo-list li .toggle').first().check();
  await expect(page.locator('.todo-list li').first()).toHaveClass('completed');
  await checkNumberOfCompletedTodosInLocalStorage(page, 1);
});

test('Display active todo item', async ({ page }) => {
  // Initiate 2 items in todo list
  for (const item of TODO_ITEMS) {
    await page.locator('.new-todo').fill(item);
    await page.locator('.new-todo').press('Enter');
  }

  // Verify todo list contains 2 todo items
  await checkNumberOfTodosInLocalStorage(page, 2);

  // Mark the first todo item as completed and verify
  await page.locator('.todo-list li .toggle').first().check();
  await checkNumberOfCompletedTodosInLocalStorage(page, 1);

  // View active list and verify the active todo item is the 2nd item in the full list
  await page.locator('.filters >> text=Active').click();
  await expect(page.locator('.filters >> text=Active')).toHaveClass('selected');
  await expect(page.locator('.todo-list li')).toHaveCount(1);
  const activeTodo = page.locator('.todo-list li').nth(0);
  await expect(activeTodo.locator('label')).toHaveText(TODO_ITEMS[1]);
  await expect(page.locator('.todo-count')).toHaveText('1 item left');
});

test('Clear completed todo item', async ({ page }) => {
  // Initiate 2 items in todo list
  for (const item of TODO_ITEMS) {
    await page.locator('.new-todo').fill(item);
    await page.locator('.new-todo').press('Enter');
  }

  // Verify todo list contains 2 todo items
  await checkNumberOfTodosInLocalStorage(page, 2);

  // Mark the first todo item as completed and verify
  await page.locator('.todo-list li .toggle').first().check();
  await checkNumberOfCompletedTodosInLocalStorage(page, 1);

  // Click "Clear Completed" and verify the todo list still has one item remained
  await page.locator('.clear-completed').click();
  await expect(page.locator('.clear-completed')).toBeHidden();
  await expect(page.locator('.todo-count')).toHaveText('1 item left');

  // Verify the completed todo item has a todo item
  await checkNumberOfCompletedTodosInLocalStorage(page, 1);
});

async function checkNumberOfTodosInLocalStorage(page: Page, expected: number) {
  await expect.poll(() => {
    return page.evaluate(() => JSON.parse(localStorage['react-todos']).length);
  }).toBe(expected);
}

async function checkTodosInLocalStorage(page: Page, title: string) {
  await expect.poll(() => {
    return page.evaluate(() => JSON.parse(localStorage['react-todos']).map(i => i.title));
  }).toContain(title);
}

async function checkNumberOfCompletedTodosInLocalStorage(page: Page, expected: number) {
  await expect.poll(() => {
    return page.evaluate(() => JSON.parse(localStorage['react-todos']).filter(i => i.completed).length);
  }).toBe(expected);
}
