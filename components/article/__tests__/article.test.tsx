import Article from '../';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../../helpers/testUtils';

describe('Article', () => {
  const props = {
    title: 'test title',
    date: '2021-04-11',
    contentHtml: 'test content',
  };

  test('should render without error', () => {
    renderWithTheme(Article, props);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      props.title
    );
    expect(screen.getByRole('date-display').textContent).toBe('11 April 2021');
    expect(screen.getByText(props.contentHtml)).toBeInTheDocument();
  });

  test('should render with children', () => {
    const TestChild: React.FC = () => <p>test child</p>;
    const newProps = {
      title: 'test title',
      date: '2021-04-11',
      children: <TestChild />,
    };
    renderWithTheme(Article, newProps);
    expect(screen.getByText('test child')).toBeInTheDocument();
  });
});
