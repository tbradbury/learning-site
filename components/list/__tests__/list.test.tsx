import List, { ListType } from '..';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../../helpers/testUtils';

describe('List', () => {
  const listArray: ListType[] = [
    {
      text: 'one',
    },
    {
      text: 'two',
      lineThrough: true,
      href: 'some/where',
    },
    {
      text: 'three',
      href: 'some/where/else',
    },
  ];
  test('should render without error', () => {
    renderWithTheme(List, { list: listArray });
    expect(screen.getByText('one')).toBeInTheDocument();
    expect(screen.getByText('two')).toBeInTheDocument();
    expect(screen.getByText('three')).toBeInTheDocument();
  });
});
