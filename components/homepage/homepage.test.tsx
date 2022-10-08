import HomePage from '.';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../helpers/testUtils';

const posts = [
  { title: 'Post one', id: 'one' },
  { title: 'Post two', id: 'two' },
  { title: 'Post three', id: 'three' },
];

describe('Homepage', () => {
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

describe('Homepage without posts', () => {
  test('should handle no posts', () => {
    renderWithTheme(HomePage);
    posts.map(({ id }) => {
      expect(screen.queryByRole(`post-${id}`)).not.toBeInTheDocument();
    });
  });
});
