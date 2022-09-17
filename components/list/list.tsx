import { UnorderedList, styled } from 'newskit';
import StyledLink from '../styledlink';

const StyledSpan = styled.span<{ lineThrough?: boolean }>`
  text-decoration: ${({ lineThrough }) =>
    lineThrough ? 'line-through' : 'none'};
`;

export type ListType = {
  text: string;
  lineThrough?: boolean;
  href?: string;
};

interface ListProps {
  list?: ListType[];
}

const List: React.FC<ListProps> = ({ list }) => (
  <UnorderedList>
    {list &&
      list.map(({ text, href, lineThrough }, i) => (
        <>
          {href ? (
            <StyledLink href={href}>
              <StyledSpan key={i} lineThrough={lineThrough}>
                {text}
              </StyledSpan>
            </StyledLink>
          ) : (
            <StyledSpan key={i} lineThrough={lineThrough}>
              {text}
            </StyledSpan>
          )}
        </>
      ))}
  </UnorderedList>
);

export default List;
