import HomePage from '.';
import { screen, within } from '@testing-library/react';
import { renderWithTheme } from '../../helpers/testUtils';

describe('Homepage', () => {
  const posts = [
    { title: 'Post one', id: 'one' },
    { title: 'Post two', id: 'two' },
    { title: 'Post three', id: 'three' },
  ];
  beforeEach(() => {
    renderWithTheme(HomePage, { posts });
  });

  test('Should have a title', () => {
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Welcome to Learning by Building Tutorial Site'
    );
  });

  test('Should have intention link', () => {
    expect(screen.getByRole('intention')).toBeInTheDocument();
    expect(screen.getByRole('intention-title').textContent).toBe('Intention →');
    expect(screen.getByRole('intention-description').textContent).toBe(
      'Use this site to learn tech and put blog tutorials on it.'
    );
  });

  test('Should have to do link', () => {
    expect(screen.getByRole('todo')).toBeInTheDocument();
    expect(screen.getByRole('todo-title').textContent).toBe('To Do →');
    expect(screen.getByRole('todo-description').textContent).toBe(
      'List on objective to learn by building!'
    );
  });

  test('Should have a Posts sub title', () => {
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Posts');
  });

  test('Should display Posts', () => {
    posts.map(({ title, id }) => {
      expect(screen.getByRole(`post-${id}`)).toBeInTheDocument();
      expect(screen.getByRole(`post-${id}-title`).textContent).toBe(title);
    });
  });
});
