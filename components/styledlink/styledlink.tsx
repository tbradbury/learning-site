import { styled, getColorCssFromTheme } from 'newskit';
import Link from 'next/link';

const StyledSpan = styled.span<{ color: string }>`
  ${({ color }) => getColorCssFromTheme('color', color)}
`;

interface linkProps {
  children: React.ReactNode;
  href: string;
  color?: string;
}

const StyledLink: React.FC<linkProps> = ({
  href,
  children,
  color = 'blue050',
}) => (
  <Link href={href}>
      <StyledSpan color={color}>{children}</StyledSpan>
  </Link>
);

export default StyledLink;
